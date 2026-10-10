import { z } from "zod";
import { ActivityStatusSchema, BookingStatusSchema } from "./enums";

export const CreateActivityRequestSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().max(2000).default(""),
  location: z.string().max(200).default("Skyline Club Campus"),
  startsAt: z.string().datetime("Valid ISO 8601 date string required"),
  endsAt: z.string().datetime().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  memberPricePaise: z.number().int().nonnegative().default(0),
  publicPricePaise: z.number().int().nonnegative().default(0),
  coverImageUrl: z.string().url().nullable().optional(),
});

export type CreateActivityRequest = z.infer<typeof CreateActivityRequestSchema>;

export const UpdateActivityRequestSchema = CreateActivityRequestSchema.partial().extend({
  status: ActivityStatusSchema.optional(),
});

export type UpdateActivityRequest = z.infer<typeof UpdateActivityRequestSchema>;

export const ActivityResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  status: ActivityStatusSchema,
  capacity: z.number().int().nullable(),
  seatsRemaining: z.number().int().nullable(),
  memberPricePaise: z.number().int(),
  publicPricePaise: z.number().int(),
  coverImageUrl: z.string().nullable(),
  createdAt: z.string(),
});

export type ActivityResponse = z.infer<typeof ActivityResponseSchema>;

export const CreateBookingRequestSchema = z.object({
  activityId: z.string().min(1, "Activity ID is required"),
});

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;

export const TicketResponseSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  activityId: z.string(),
  activity: z.object({
    id: z.string(),
    title: z.string(),
    startsAt: z.string(),
    location: z.string(),
  }),
  encryptedToken: z.string(),
  checkedInAt: z.string().nullable(),
  isUsed: z.boolean(),
  createdAt: z.string(),
});

export type TicketResponse = z.infer<typeof TicketResponseSchema>;

export const BookingResponseSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  userId: z.string(),
  status: BookingStatusSchema,
  amountPaise: z.number().int(),
  purchaseId: z.string().nullable(),
  ticket: TicketResponseSchema.nullable(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
});

export type BookingResponse = z.infer<typeof BookingResponseSchema>;
