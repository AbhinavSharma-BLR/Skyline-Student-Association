import { z } from "zod";

export const CashbookDirectionSchema = z.enum(["INFLOW", "OUTFLOW"]);
export type CashbookDirection = z.infer<typeof CashbookDirectionSchema>;

export const CashbookCategorySchema = z.enum([
  "MEMBERSHIP",
  "TICKET",
  "MERCHANDISE",
  "FUNDRAISER",
  "CLAIM_PAYOUT",
  "OTHER",
]);
export type CashbookCategory = z.infer<typeof CashbookCategorySchema>;

export const CashbookReferenceTypeSchema = z.enum([
  "purchase",
  "claim",
  "fundraiser_receipt",
]);
export type CashbookReferenceType = z.infer<typeof CashbookReferenceTypeSchema>;

export const FinanceSummaryResponseSchema = z.object({
  totalInflowPaise: z.number().int(),
  totalOutflowPaise: z.number().int(),
  netBalancePaise: z.number().int(),
  pendingObligationsPaise: z.number().int(),
  trueAvailablePaise: z.number().int(),
  membershipRevenuePaise: z.number().int(),
  ticketRevenuePaise: z.number().int(),
  merchandiseRevenuePaise: z.number().int(),
  fundraiserRevenuePaise: z.number().int(),
  totalExpenditurePaise: z.number().int(),
  asOf: z.string(),
});

export type FinanceSummaryResponse = z.infer<typeof FinanceSummaryResponseSchema>;

export const CashbookEntryResponseSchema = z.object({
  id: z.string(),
  direction: CashbookDirectionSchema,
  amountPaise: z.number().int(),
  category: CashbookCategorySchema,
  description: z.string(),
  activityId: z.string().nullable(),
  referenceType: CashbookReferenceTypeSchema,
  referenceId: z.string(),
  recordedAt: z.string(),
  recordedById: z.string(),
});

export type CashbookEntryResponse = z.infer<typeof CashbookEntryResponseSchema>;

export const RecordFundraiserReceiptRequestSchema = z.object({
  activityId: z.string().min(1, "Activity ID is required"),
  amountPaise: z
    .number()
    .int("Amount in paise must be integer")
    .positive("Amount must be greater than zero"),
  reference: z.string().min(2, "Reference identifier required").max(100),
});

export type RecordFundraiserReceiptRequest = z.infer<
  typeof RecordFundraiserReceiptRequestSchema
>;

export const SnapshotResponseSchema = z.object({
  id: z.string(),
  generatedById: z.string(),
  generatedAt: z.string(),
  schemaVersion: z.number().int(),
  snapshotJson: z.record(z.any()),
  notes: z.string().nullable(),
});

export type SnapshotResponse = z.infer<typeof SnapshotResponseSchema>;
