import { z } from "zod";
import { MembershipStatusSchema } from "@/lib/schemas/enums";

/**
 * Membership Period Schema
 * Represents academic year/term membership windows.
 */
export const MembershipPeriodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  duesPaise: z.number().int().nonnegative(),
});

export type MembershipPeriodResponse = z.infer<typeof MembershipPeriodResponseSchema>;

/**
 * Membership Response Schema
 * Conforms to docs/INTEGRATION_CONTRACT.md §3.
 * Dues amounts in integer paise, timestamps in UTC ISO 8601.
 */
export const MembershipResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  periodId: z.string(),
  period: MembershipPeriodResponseSchema,
  status: MembershipStatusSchema,
  activatedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  isMember: z.boolean(),
  createdAt: z.string(),
});

export type MembershipResponse = z.infer<typeof MembershipResponseSchema>;

/**
 * Request schema for initiating membership or renewal
 */
export const CreateMembershipSchema = z.object({
  periodId: z.string().min(1, "periodId is required"),
});

export type CreateMembershipInput = z.infer<typeof CreateMembershipSchema>;
