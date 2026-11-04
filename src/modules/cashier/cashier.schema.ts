import { z } from "zod";

export const getCashierClassroomsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  departmentId: z.string().uuid().optional(),
});

export const getCashierStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  status: z.enum(["ALL", "PENDING", "VERIFIED"]).default("ALL"),
});

export type GetCashierClassroomsQuery = z.infer<typeof getCashierClassroomsQuerySchema>;
export type GetCashierStudentsQuery = z.infer<typeof getCashierStudentsQuerySchema>;

