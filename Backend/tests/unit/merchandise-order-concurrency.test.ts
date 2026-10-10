import test from "node:test";
import assert from "node:assert/strict";
import { OrderService } from "@/lib/services/OrderService";
import { SkylineError } from "@/lib/api/errors";

test("OrderService - Inventory Reservation Concurrency & Fulfilment", async (t) => {
  const mockVariant = {
    id: "var-hoodie-m",
    productId: "prod-hoodie",
    size: "M",
    stockTotal: 1, // Only 1 unit in inventory!
    stockReserved: 0,
    stockSold: 0,
    product: {
      id: "prod-hoodie",
      name: "Skyline Club Hoodie",
      active: true,
      memberPricePaise: BigInt(80000), // INR 800.00
      regularPricePaise: BigInt(120000), // INR 1,200.00
    },
  };

  const mockOrders: any[] = [];
  const mockOrderItems: any[] = [];
  const mockPurchases: any[] = [];
  const mockCashbook: any[] = [];

  const fakePrisma: any = {
    membership: {
      findFirst: async () => null, // Bob is a regular student (non-member)
    },
    variant: {
      findUnique: async () => mockVariant,
      update: async ({ data }: any) => {
        if (data.stockReserved?.increment) {
          mockVariant.stockReserved += data.stockReserved.increment;
        }
        if (data.stockReserved?.decrement) {
          mockVariant.stockReserved -= data.stockReserved.decrement;
        }
        if (data.stockSold?.increment) {
          mockVariant.stockSold += data.stockSold.increment;
        }
        return mockVariant;
      },
    },
    order: {
      create: async ({ data }: any) => {
        const o = {
          id: `order-${mockOrders.length + 1}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockOrders.push(o);
        return o;
      },
      findUnique: async ({ where }: any) => {
        const o = mockOrders.find((item) => item.id === where.id);
        if (!o) return null;
        return {
          ...o,
          purchase: mockPurchases.find((p) => p.orderId === o.id) || null,
          items: mockOrderItems
            .filter((item) => item.orderId === o.id)
            .map((item) => ({ ...item, variant: mockVariant })),
        };
      },
      update: async ({ where, data }: any) => {
        const o = mockOrders.find((item) => item.id === where.id);
        if (o) Object.assign(o, data, { updatedAt: new Date() });
        return {
          ...o,
          items: mockOrderItems
            .filter((item) => item.orderId === o?.id)
            .map((item) => ({ ...item, variant: mockVariant })),
        };
      },
    },
    orderItem: {
      create: async ({ data }: any) => {
        const item = {
          id: `oi-${mockOrderItems.length + 1}`,
          ...data,
          variant: mockVariant,
        };
        mockOrderItems.push(item);
        return item;
      },
    },
    purchase: {
      create: async ({ data }: any) => {
        const p = { id: `pur-${mockPurchases.length + 1}`, ...data };
        mockPurchases.push(p);
        return p;
      },
      update: async ({ where, data }: any) => {
        const p = mockPurchases.find((item) => item.id === where.id);
        if (p) Object.assign(p, data);
        return p;
      },
      updateMany: async ({ where, data }: any) => {
        const matches = mockPurchases.filter(
          (p) => (!where.id || p.id === where.id) && (!where.state || p.state === where.state)
        );
        matches.forEach((p) => Object.assign(p, data));
        return { count: matches.length };
      },
    },
    paymentAttempt: {
      create: async ({ data }: any) => ({ id: "pa-1", ...data }),
    },
    cashbookEntry: {
      create: async ({ data }: any) => {
        const entry = { id: `ce-${mockCashbook.length + 1}`, ...data };
        mockCashbook.push(entry);
        return entry;
      },
    },
    $transaction: async (fn: any) => fn(fakePrisma),
  };

  const service = new OrderService();
  const originalPrisma = (globalThis as any).prismaGlobal;
  (globalThis as any).prismaGlobal = fakePrisma;

  await t.test("successfully reserves last available merchandise item", async () => {
    const order = await service.createOrder("student-bob", {
      items: [{ variantId: "var-hoodie-m", quantity: 1 }],
    });
    assert.equal(order.status, "pending_payment");
    assert.equal(order.totalPaise, 120000); // 1,200 INR (non-member)
    assert.equal(mockVariant.stockReserved, 1);
  });

  await t.test("rejects subsequent order for the same size with STOCK_EXHAUSTED", async () => {
    await assert.rejects(
      async () => {
        await service.createOrder("student-charlie", {
          items: [{ variantId: "var-hoodie-m", quantity: 1 }],
        });
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "STOCK_EXHAUSTED");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  await t.test("confirming order converts reserved stock to sold stock and logs cashbook INFLOW", async () => {
    const orderId = mockOrders[0].id;
    const confirmed = await service.confirmOrder(orderId, "PAY-REF-HOODIE-1");

    assert.equal(confirmed.status, "confirmed");
    assert.equal(mockVariant.stockReserved, 0);
    assert.equal(mockVariant.stockSold, 1);
    assert.equal(mockCashbook.length, 1);
    assert.equal(mockCashbook[0].direction, "INFLOW");
    assert.equal(mockCashbook[0].category, "merch");
    assert.equal(mockCashbook[0].amountPaise, BigInt(120000));
  });

  await t.test("officer can fulfil confirmed order at club desk", async () => {
    const orderId = mockOrders[0].id;
    const fulfilled = await service.fulfilOrder("officer-1", orderId);
    assert.equal(fulfilled.status, "fulfilled");
    assert(fulfilled.fulfilledAt !== null);
  });

  await t.test("expired order cannot be confirmed or consume inventory released by expiry job", async () => {
    const expiredOrder = {
      id: "order-expired",
      userId: "student-late",
      reservedUntil: new Date(Date.now() - 60000), // 1 min in the past
      createdAt: new Date(Date.now() - 120000),
    };
    const expiredPurchase = {
      id: "pur-order-expired",
      orderId: "order-expired",
      userId: "student-late",
      amountPaise: BigInt(120000),
      state: "expired",
    };
    mockOrders.push(expiredOrder);
    mockPurchases.push(expiredPurchase);

    await assert.rejects(
      async () => {
        await service.confirmOrder("order-expired", "PAY-EXPIRED");
      },
      (err: any) => {
        assert(err instanceof SkylineError);
        assert.equal(err.code, "CONFLICT");
        assert.equal(err.statusCode, 409);
        return true;
      }
    );
  });

  (globalThis as any).prismaGlobal = originalPrisma;
});
