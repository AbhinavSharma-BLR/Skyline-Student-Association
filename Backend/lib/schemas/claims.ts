import { z } from "zod";
import { ClaimStatusSchema } from "./enums";

export const CreateClaimRequestSchema = z.object({
  activityId: z.string().nullable().optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().min(5, "Description must be at least 5 characters").max(2000),
  amountPaise: z
    .number()
    .int("Amount in paise must be an integer")
    .positive("Amount must be greater than zero"),
});

export type CreateClaimRequest = z.infer<typeof CreateClaimRequestSchema>;

export const ReviewClaimRequestSchema = z.object({
  reviewNote: z.string().max(1000).optional(),
});

export type ReviewClaimRequest = z.infer<typeof ReviewClaimRequestSchema>;

export const PayoutClaimRequestSchema = z.object({
  payoutRef: z.string().min(2, "Payout reference is required").max(100),
});

export type PayoutClaimRequest = z.infer<typeof PayoutClaimRequestSchema>;

export const ClaimResponseSchema = z.object({
  id: z.string(),
  claimantId: z.string(),
  claimant: z.object({
    id: z.string(),
    name: z.string(),
  }),
  activityId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  amountPaise: z.number().int(),
  status: ClaimStatusSchema,
  reviewerId: z.string().nullable(),
  reviewer: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  reviewNote: z.string().nullable(),
  payoutRef: z.string().nullable(),
  hasReceipt: z.boolean(),
  reviewedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
});

export type ClaimResponse = z.infer<typeof ClaimResponseSchema>;
