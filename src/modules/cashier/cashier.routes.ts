import { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { Role } from "@prisma/client";
import { cashierController } from "./cashier.controller";
import { validateParams, validateQuery } from "../../utils/validate";
import { getCashierClassroomsQuerySchema, getCashierStudentsQuerySchema } from "./cashier.schema";
import { z } from "zod";

const idParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

const cashierGuard = [authenticate, authorize(Role.CASHIER)];

export const cashierRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/dashboard",
    { preHandler: cashierGuard },
    cashierController.getDashboard
  );

  fastify.get<{ Querystring: any }>(
    "/classrooms",
    {
      preHandler: cashierGuard,
      preValidation: [validateQuery(getCashierClassroomsQuerySchema)],
    },
    cashierController.getClassrooms
  );

  fastify.get<{ Querystring: any }>(
    "/students/search",
    {
      preHandler: cashierGuard,
    },
    cashierController.searchStudents
  );

  fastify.get<{ Params: { id: string } }>(
    "/classrooms/:id",
    {
      preHandler: cashierGuard,
      preValidation: [validateParams(idParamSchema)],
    },
    cashierController.getClassroomById
  );

  fastify.get<{ Params: { id: string }; Querystring: any }>(
    "/classrooms/:id/students",
    {
      preHandler: cashierGuard,
      preValidation: [
        validateParams(idParamSchema),
        validateQuery(getCashierStudentsQuerySchema),
      ],
    },
    cashierController.getClassroomStudents
  );

  fastify.post<{ Params: { id: string } }>(
    "/students/:id/fees/approve",
    {
      preHandler: cashierGuard,
      preValidation: [validateParams(idParamSchema)],
    },
    cashierController.approveFee
  );

  fastify.post<{ Params: { id: string } }>(
    "/students/:id/fees/revert",
    {
      preHandler: cashierGuard,
      preValidation: [validateParams(idParamSchema)],
    },
    cashierController.revertFee
  );

  fastify.post<{ Body: { studentIds: string[] } }>(
    "/students/fees/approve-bulk",
    {
      preHandler: cashierGuard,
    },
    cashierController.approveBulkFees
  );

  fastify.post<{ Params: { id: string } }>(
    "/classrooms/:id/fees/approve-all",
    {
      preHandler: cashierGuard,
      preValidation: [validateParams(idParamSchema)],
    },
    cashierController.approveClassroomFees
  );

  fastify.post(
    "/fees/revert-all",
    {
      preHandler: cashierGuard,
    },
    cashierController.revertAllFees
  );
};

