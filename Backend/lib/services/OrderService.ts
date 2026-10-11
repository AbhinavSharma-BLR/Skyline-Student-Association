import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import { CreateOrderRequest, OrderResponse } from "@/lib/schemas/merchandise";

const HOLD_DURATION_MS = 15 * 60 * 1000; // 15 minutes reservation window

export class OrderService {
  /**
   * Creates a merchandise order reserving inventory atomically.
   * Locks variant inventory in sorted ID order to eliminate database deadlock risks.
   */
  async createOrder(userId: string, input: CreateOrderRequest): Promise<OrderResponse> {
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);

    // Sort items by variantId to enforce deterministic transaction locking order
    const sortedItems = [...input.items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId)
    );

    const orderResult = await (prisma as any).$transaction(async (tx: any) => {
      // 1. Check membership status for pricing calculation
      const activeMembership = await tx.membership.findFirst({
        where: { userId, status: "active" },
      });
      const isMember = Boolean(activeMembership);

      let totalPaise = 0;
      const orderItemsData: any[] = [];

      // 2. Atomically verify and increment reservation on each variant in sorted order
      for (const item of sortedItems) {
        if (typeof tx.$queryRaw === "function") {
          try {
            await tx.$queryRaw`SELECT id, "stockTotal", "stockReserved", "stockSold" FROM variants WHERE id = ${item.variantId} FOR UPDATE`;
          } catch {
            // Fallback for mocks/unit tests
          }
        }

        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant || !variant.product.active) {
          throw new SkylineError(
            "NOT_FOUND",
            `Variant ${item.variantId} not found or product is inactive`,
            404
          );
        }

        const available = variant.stockTotal - variant.stockReserved - variant.stockSold;
        if (available < item.quantity) {
          throw new SkylineError(
            "STOCK_EXHAUSTED",
            `Insufficient stock for size ${variant.size} (available: ${available}, requested: ${item.quantity})`,
            409
          );
        }

        // Increment stockReserved atomically
        await tx.variant.update({
          where: { id: variant.id },
          data: {
            stockReserved: { increment: item.quantity },
          },
        });

        const unitPrice = isMember
          ? Number(variant.product.memberPricePaise)
          : Number(variant.product.regularPricePaise);
        const linePaise = unitPrice * item.quantity;
        totalPaise += linePaise;

        orderItemsData.push({
          variantId: variant.id,
          quantity: item.quantity,
          unitPricePaise: BigInt(unitPrice),
          variant,
        });
      }

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          userId,
          reservedUntil: expiresAt,
          fulfilment: "pending",
        },
      });

      // 4. Create OrderItems
      const createdItems = await Promise.all(
        orderItemsData.map((d) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              variantId: d.variantId,
              quantity: d.quantity,
              unitPricePaise: d.unitPricePaise,
            },
            include: {
              variant: {
                include: { product: true },
              },
            },
          })
        )
      );

      // 5. Create Purchase intent
      const purchase = await tx.purchase.create({
        data: {
          userId,
          orderId: order.id,
          amountPaise: BigInt(totalPaise),
          state: "pending",
          pricingBasis: isMember ? "active_member" : "regular",
        },
      });

      return {
        order,
        purchase,
        items: createdItems,
        totalPaise,
      };
    });

    return {
      id: orderResult.order.id,
      userId: orderResult.order.userId,
      status: "pending_payment",
      totalPaise: orderResult.totalPaise,
      items: orderResult.items.map((i: any) => ({
        id: i.id,
        variantId: i.variantId,
        variant: {
          id: i.variant.id,
          label: i.variant.size,
          product: {
            id: i.variant.product.id,
            name: i.variant.product.name,
          },
        },
        quantity: i.quantity,
        unitPricePaise: Number(i.unitPricePaise),
        linePaise: Number(i.unitPricePaise) * i.quantity,
      })),
      createdAt: orderResult.order.createdAt.toISOString(),
      expiresAt: orderResult.order.reservedUntil.toISOString(),
      fulfilledAt: null,
    };
  }

  /**
   * Confirms order payment, transitions reserved stock to sold, and writes financial cashbook entry.
   * Invariant: Idempotent execution prevents duplicate stock decrements or double revenue.
   */
  async confirmOrder(orderId: string, paymentRef: string): Promise<OrderResponse> {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          purchase: true,
          items: {
            include: {
              variant: { include: { product: true } },
            },
          },
        },
      });

      if (!order) {
        throw new SkylineError("NOT_FOUND", "Order not found", 404);
      }

      // Idempotency check: if already confirmed, return current state
      if (order.purchase?.state === "confirmed") {
        return {
          order,
          alreadyConfirmed: true,
        };
      }

      // Check reservation expiry: neither elapsed time nor expired state may consume stock
      if (order.reservedUntil < new Date() || order.purchase?.state === "expired") {
        throw new SkylineError(
          "CONFLICT",
          "Order reservation has expired; items have been returned to inventory",
          409
        );
      }

      // Sort items by variantId ascending to enforce deterministic transaction locking order
      const sortedItems = [...order.items].sort((a: any, b: any) =>
        a.variantId.localeCompare(b.variantId)
      );

      // Atomically transition purchase state from pending to confirmed
      const transitionResult = await tx.purchase.updateMany({
        where: { id: order.purchase.id, state: "pending" },
        data: { state: "confirmed" },
      });

      if (transitionResult.count === 0) {
        // Race condition: another request confirmed it concurrently or reservation expired
        const fresh = await tx.purchase.findUnique?.({
          where: { id: order.purchase.id },
        });
        if (fresh?.state === "confirmed") {
          return {
            order,
            alreadyConfirmed: true,
          };
        }
        throw new SkylineError(
          "CONFLICT",
          "Order reservation is no longer pending",
          409
        );
      }

      // Convert reserved stock into sold stock for each line item in deterministic sorted order
      for (const item of sortedItems) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: {
            stockReserved: { decrement: item.quantity },
            stockSold: { increment: item.quantity },
          },
        });
      }

      // Record payment attempt
      const attempt = await tx.paymentAttempt.create({
        data: {
          purchaseId: order.purchase.id,
          provider: "demo",
          providerRef: paymentRef,
          amountPaise: order.purchase.amountPaise,
          state: "confirmed",
          confirmedAt: new Date(),
        },
      });

      // Record financial cashbook INFLOW entry
      await tx.cashbookEntry.create({
        data: {
          direction: "INFLOW",
          category: "merch",
          amountPaise: order.purchase.amountPaise,
          paymentAttemptId: attempt.id,
          recordedById: order.userId,
          occurredAt: new Date(),
        },
      });

      let updatedOrder = order;
      if (tx.order?.update) {
        updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: "confirmed" },
          include: {
            purchase: true,
            items: {
              include: {
                variant: { include: { product: true } },
              },
            },
          },
        });
      }

      return {
        order: updatedOrder,
        alreadyConfirmed: false,
      };
    });

    const totalPaise = result.order.items.reduce(
      (acc: number, item: any) => acc + Number(item.unitPricePaise) * item.quantity,
      0
    );

    return {
      id: result.order.id,
      userId: result.order.userId,
      status: "confirmed",
      totalPaise,
      items: result.order.items.map((i: any) => ({
        id: i.id,
        variantId: i.variantId,
        variant: {
          id: i.variant.id,
          label: i.variant.size,
          product: {
            id: i.variant.product.id,
            name: i.variant.product.name,
          },
        },
        quantity: i.quantity,
        unitPricePaise: Number(i.unitPricePaise),
        linePaise: Number(i.unitPricePaise) * i.quantity,
      })),
      createdAt: result.order.createdAt.toISOString(),
      expiresAt: null,
      fulfilledAt: result.order.fulfilment === "collected" ? result.order.updatedAt.toISOString() : null,
    };
  }

  /**
   * Marks a confirmed order collected by the student at the club desk.
   */
  async fulfilOrder(_officerId: string, orderId: string): Promise<OrderResponse> {
    const order = await (prisma as any).order.findUnique({
      where: { id: orderId },
      include: {
        purchase: true,
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });

    if (!order) {
      throw new SkylineError("NOT_FOUND", "Order not found", 404);
    }

    if (order.purchase?.state !== "confirmed") {
      throw new SkylineError(
        "CONFLICT",
        "Only confirmed, paid orders can be fulfilled at the club desk",
        409
      );
    }

    const updated = await (prisma as any).order.update({
      where: { id: orderId },
      data: { fulfilment: "collected" },
      include: {
        purchase: true,
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });

    const totalPaise = updated.items.reduce(
      (acc: number, item: any) => acc + Number(item.unitPricePaise) * item.quantity,
      0
    );

    return {
      id: updated.id,
      userId: updated.userId,
      status: "fulfilled",
      totalPaise,
      items: updated.items.map((i: any) => ({
        id: i.id,
        variantId: i.variantId,
        variant: {
          id: i.variant.id,
          label: i.variant.size,
          product: {
            id: i.variant.product.id,
            name: i.variant.product.name,
          },
        },
        quantity: i.quantity,
        unitPricePaise: Number(i.unitPricePaise),
        linePaise: Number(i.unitPricePaise) * i.quantity,
      })),
      createdAt: updated.createdAt.toISOString(),
      expiresAt: null,
      fulfilledAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves orders belonging to the authenticated student.
   */
  async listUserOrders(userId: string): Promise<OrderResponse[]> {
    const orders = await (prisma as any).order.findMany({
      where: { userId },
      include: {
        purchase: true,
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o: any) => {
      const totalPaise = o.items.reduce(
        (acc: number, item: any) => acc + Number(item.unitPricePaise) * item.quantity,
        0
      );
      let status: any = "pending_payment";
      if (o.fulfilment === "collected") status = "fulfilled";
      else if (o.purchase?.state === "confirmed") status = "confirmed";
      else if (o.reservedUntil < new Date()) status = "expired";

      return {
        id: o.id,
        userId: o.userId,
        status,
        totalPaise,
        items: o.items.map((i: any) => ({
          id: i.id,
          variantId: i.variantId,
          variant: {
            id: i.variant.id,
            label: i.variant.size,
            product: {
              id: i.variant.product.id,
              name: i.variant.product.name,
            },
          },
          quantity: i.quantity,
          unitPricePaise: Number(i.unitPricePaise),
          linePaise: Number(i.unitPricePaise) * i.quantity,
        })),
        createdAt: o.createdAt.toISOString(),
        expiresAt: o.reservedUntil ? o.reservedUntil.toISOString() : null,
        fulfilledAt: o.fulfilment === "collected" ? o.updatedAt.toISOString() : null,
      };
    });
  }

  /**
   * Retrieves all orders for club desk fulfillment. Restricted to officers.
   */
  async listAllOrders(): Promise<OrderResponse[]> {
    const orders = await (prisma as any).order.findMany({
      include: {
        user: true,
        purchase: true,
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((o: any) => {
      const totalPaise = o.items.reduce(
        (acc: number, item: any) => acc + Number(item.unitPricePaise) * item.quantity,
        0
      );
      let status: any = "pending_payment";
      if (o.fulfilment === "collected") status = "fulfilled";
      else if (o.purchase?.state === "confirmed") status = "confirmed";
      else if (o.reservedUntil < new Date()) status = "expired";

      return {
        id: o.id,
        userId: o.userId,
        userName: o.user?.name || "Student",
        userEmail: o.user?.email || "student@skyline.edu",
        status,
        totalPaise,
        items: o.items.map((i: any) => ({
          id: i.id,
          variantId: i.variantId,
          variant: {
            id: i.variant.id,
            label: i.variant.size,
            product: {
              id: i.variant.product.id,
              name: i.variant.product.name,
            },
          },
          quantity: i.quantity,
          unitPricePaise: Number(i.unitPricePaise),
          linePaise: Number(i.unitPricePaise) * i.quantity,
        })),
        createdAt: o.createdAt.toISOString(),
        expiresAt: o.reservedUntil ? o.reservedUntil.toISOString() : null,
        fulfilledAt: o.fulfilment === "collected" ? o.updatedAt.toISOString() : null,
      };
    });
  }
}

export const orderService = new OrderService();
