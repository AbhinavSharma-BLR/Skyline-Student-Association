import { prisma } from "@/lib/prisma";
import { SkylineError } from "@/lib/api/errors";
import {
  CreateProductRequest,
  ProductResponse,
  VariantResponse,
} from "@/lib/schemas/merchandise";

export class MerchandiseService {
  /**
   * Lists active products with available variant stock.
   */
  async listProducts(): Promise<ProductResponse[]> {
    const products = await (prisma as any).product.findMany({
      where: { active: true },
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p: any) => this.mapProductResponse(p));
  }

  /**
   * Retrieves single product with variants by ID.
   */
  async getProduct(id: string): Promise<ProductResponse> {
    const product = await (prisma as any).product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product || !product.active) {
      throw new SkylineError("NOT_FOUND", "Product not found", 404);
    }

    return this.mapProductResponse(product);
  }

  /**
   * Creates a product with initial variants. Restricted to club officers.
   */
  async createProduct(
    officerId: string,
    input: CreateProductRequest
  ): Promise<ProductResponse> {
    const firstVariant = input.variants[0];

    const created = await (prisma as any).$transaction(async (tx: any) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          description: input.description,
          imagePath: input.imageUrl ?? null,
          active: input.status !== "archived",
          regularPricePaise: BigInt(firstVariant.publicPricePaise),
          memberPricePaise: BigInt(firstVariant.memberPricePaise),
          createdById: officerId,
        },
      });

      const variants = await Promise.all(
        input.variants.map((v) =>
          tx.variant.create({
            data: {
              productId: product.id,
              size: v.label,
              stockTotal: v.stockTotal,
              stockReserved: 0,
              stockSold: 0,
            },
          })
        )
      );

      return {
        ...product,
        variants,
      };
    });

    return this.mapProductResponse(created);
  }

  /**
   * Updates total stock for a specific merchandise variant.
   */
  async updateVariantStock(
    _officerId: string,
    variantId: string,
    newStockTotal: number
  ): Promise<VariantResponse> {
    const variant = await (prisma as any).variant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new SkylineError("NOT_FOUND", "Variant not found", 404);
    }

    if (newStockTotal < variant.stockReserved + variant.stockSold) {
      throw new SkylineError(
        "CONFLICT",
        `Stock total cannot be lower than existing reserved (${variant.stockReserved}) and sold (${variant.stockSold}) units`,
        409
      );
    }

    const updated = await (prisma as any).variant.update({
      where: { id: variantId },
      data: { stockTotal: newStockTotal },
    });

    return this.mapVariantResponse(updated);
  }

  private mapProductResponse(p: any): ProductResponse {
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      imageUrl: p.imagePath ?? null,
      status: p.active ? "published" : "archived",
      variants: (p.variants || []).map((v: any) => this.mapVariantResponse(v, p)),
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private mapVariantResponse(v: any, product?: any): VariantResponse {
    const total = v.stockTotal ?? 0;
    const reserved = v.stockReserved ?? 0;
    const sold = v.stockSold ?? 0;
    const available = Math.max(0, total - reserved - sold);

    return {
      id: v.id,
      productId: v.productId,
      label: v.size,
      memberPricePaise: Number(product?.memberPricePaise ?? 0),
      publicPricePaise: Number(product?.regularPricePaise ?? 0),
      stockTotal: total,
      stockReserved: reserved,
      stockSold: sold,
      stockAvailable: available,
    };
  }
}

export const merchandiseService = new MerchandiseService();
