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

  async searchStudents(search: string, departmentId?: string, limit?: number) {
    return cashierRepository.searchStudentsGlobally(search, departmentId, limit);
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

  async revertFee(studentId: string, approverUserId: string, ipAddress?: string, userAgent?: string) {
    return approvalEngine.revertFeeVerification({
      studentId,
      role: Role.CASHIER,
      approverUserId,
      ipAddress,
      userAgent,
    });
  },

  async approveBulkFees(studentIds: string[], approverUserId: string, ipAddress?: string, userAgent?: string) {
    let approvedCount = 0;
    for (const studentId of studentIds) {
      try {
        await approvalEngine.approveFeeVerification({
          studentId,
          role: Role.CASHIER,
          approverUserId,
          ipAddress,
          userAgent,
        });
        approvedCount++;
      } catch {
        // continue approving others
      }
    }
    return { approvedCount, requestedCount: studentIds.length };
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

  async revertAllFees(approverUserId: string, ipAddress?: string, userAgent?: string) {
    return approvalEngine.revertAllFees({
      approverUserId,
      ipAddress,
      userAgent,
    });
  },
};
