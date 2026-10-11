import { z } from "zod";
import { OrderStatusSchema } from "./enums";

export const ProductStatusSchema = z.enum(["draft", "published", "archived"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const VariantInputSchema = z.object({
  label: z.string().min(1, "Size or label is required"),
  memberPricePaise: z.number().int().nonnegative(),
  publicPricePaise: z.number().int().nonnegative(),
  stockTotal: z.number().int().nonnegative(),
});

export const CreateProductRequestSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(200),
  description: z.string().max(2000).default(""),
  imageUrl: z.string().url().nullable().optional(),
  status: ProductStatusSchema.default("published"),
  variants: z.array(VariantInputSchema).min(1, "At least one variant required"),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateVariantStockSchema = z.object({
  stockTotal: z.number().int().nonnegative("Total stock cannot be negative"),
});

export type UpdateVariantStock = z.infer<typeof UpdateVariantStockSchema>;

export const VariantResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  label: z.string(),
  memberPricePaise: z.number().int(),
  publicPricePaise: z.number().int(),
  stockTotal: z.number().int(),
  stockReserved: z.number().int(),
  stockSold: z.number().int(),
  stockAvailable: z.number().int(),
});

export type VariantResponse = z.infer<typeof VariantResponseSchema>;

export const ProductResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  status: ProductStatusSchema,
  variants: z.array(VariantResponseSchema),
  createdAt: z.string(),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;

export const OrderItemInputSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const CreateOrderRequestSchema = z.object({
  items: z.array(OrderItemInputSchema).min(1, "At least one order item is required"),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const OrderItemResponseSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  variant: z.object({
    id: z.string(),
    label: z.string(),
    product: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
  quantity: z.number().int(),
  unitPricePaise: z.number().int(),
  linePaise: z.number().int(),
});

export type OrderItemResponse = z.infer<typeof OrderItemResponseSchema>;

export const OrderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  status: OrderStatusSchema,
  totalPaise: z.number().int(),
  items: z.array(OrderItemResponseSchema),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  fulfilledAt: z.string().nullable(),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;
