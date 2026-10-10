import { z } from "zod";
import { TaskStatusSchema } from "./enums";

export const CreateTaskRequestSchema = z.object({
  activityId: z.string().min(1, "Activity ID is required"),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().max(2000).nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export const UpdateTaskRequestSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: TaskStatusSchema.optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export const AssignTaskRequestSchema = z.object({
  assigneeId: z.string().nullable(),
});

export type AssignTaskRequest = z.infer<typeof AssignTaskRequestSchema>;

export const TaskResponseSchema = z.object({
  id: z.string(),
  activityId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  assigneeId: z.string().nullable(),
  assignee: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
