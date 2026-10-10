import { z } from "zod";

export const AnnouncementAudienceSchema = z.enum(["all", "members_only"]);
export type AnnouncementAudience = z.infer<typeof AnnouncementAudienceSchema>;

export const AnnouncementStatusSchema = z.enum(["draft", "published"]);
export type AnnouncementStatus = z.infer<typeof AnnouncementStatusSchema>;

export const CreateAnnouncementRequestSchema = z.object({
  activityId: z.string().nullable().optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  body: z.string().min(5, "Body must be at least 5 characters"),
  targetAudience: AnnouncementAudienceSchema.default("all"),
});

export type CreateAnnouncementRequest = z.infer<typeof CreateAnnouncementRequestSchema>;

export const AnnouncementResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  authorId: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
  }),
  status: AnnouncementStatusSchema,
  publishedAt: z.string().nullable(),
  targetAudience: AnnouncementAudienceSchema,
  createdAt: z.string(),
});

export type AnnouncementResponse = z.infer<typeof AnnouncementResponseSchema>;
