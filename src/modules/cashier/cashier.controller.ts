import { FastifyRequest, FastifyReply } from "fastify";
import { cashierService } from "./cashier.service";
import { GetCashierClassroomsQuery, GetCashierStudentsQuery } from "./cashier.schema";

export const cashierController = {
  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const data = await cashierService.getDashboard();
    return reply.send({ success: true, data });
  },

  async getClassrooms(
    request: FastifyRequest<{ Querystring: GetCashierClassroomsQuery }>,
    reply: FastifyReply
  ) {
    const data = await cashierService.getClassrooms(request.query);
    return reply.send({ success: true, ...data });
  },

  async getClassroomById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const data = await cashierService.getClassroomById(request.params.id);
    return reply.send({ success: true, data });
  },

  async getClassroomStudents(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: GetCashierStudentsQuery;
    }>,
    reply: FastifyReply
  ) {
    const data = await cashierService.getClassroomStudents(request.params.id, request.query);
    return reply.send({ success: true, ...data });
  },

  async approveFee(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await cashierService.approveFee(
      request.params.id,
      request.user.userId,
      request.ip,
      request.headers["user-agent"]
    );
    return reply.send({ success: true, data: result });
  },

  async approveClassroomFees(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const result = await cashierService.approveClassroomPendingFees(
      request.params.id,
      request.user.userId,
      request.ip,
      request.headers["user-agent"]
    );
    return reply.send({ success: true, data: result });
  },
};
