import { cashierRepository } from "./cashier.repository";
import { approvalEngine } from "../approval-engine/approval-engine.service";
import { GetCashierClassroomsQuery, GetCashierStudentsQuery } from "./cashier.schema";
import { Role } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";

export const cashierService = {
  async getDashboard() {
    return cashierRepository.getDashboardStats();
  },

  async getClassrooms(query: GetCashierClassroomsQuery) {
    return cashierRepository.getClassrooms(query);
  },

  async getClassroomById(classroomId: string) {
    const classroom = await cashierRepository.getClassroomById(classroomId);
    if (!classroom) {
      throw new NotFoundError("Classroom not found.");
    }
    return classroom;
  },

  async getClassroomStudents(classroomId: string, query: GetCashierStudentsQuery) {
    const classroom = await cashierRepository.getClassroomById(classroomId);
    if (!classroom) {
      throw new NotFoundError("Classroom not found.");
    }
    const studentsData = await cashierRepository.getClassroomStudents(classroomId, query);
    return {
      classroom,
      ...studentsData,
    };
  },

  async approveFee(studentId: string, approverUserId: string, ipAddress?: string, userAgent?: string) {
    return approvalEngine.approveFeeVerification({
      studentId,
      role: Role.CASHIER,
      approverUserId,
      ipAddress,
      userAgent,
    });
  },

  async approveClassroomPendingFees(classroomId: string, approverUserId: string, ipAddress?: string, userAgent?: string) {
    const classroom = await cashierRepository.getClassroomById(classroomId);
    if (!classroom) {
      throw new NotFoundError("Classroom not found.");
    }

    const pendingStudentIds = await cashierRepository.getPendingStudentIdsInClassroom(classroomId);
    const results = await Promise.all(
      pendingStudentIds.map((studentId) =>
        approvalEngine.approveFeeVerification({
          studentId,
          role: Role.CASHIER,
          approverUserId,
          ipAddress,
          userAgent,
        })
      )
    );

    return {
      classroomId,
      approvedCount: results.length,
    };
  },
};
