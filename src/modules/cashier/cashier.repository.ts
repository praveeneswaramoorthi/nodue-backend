import { prisma } from "../../plugins/database";
import { Prisma } from "@prisma/client";
import { GetCashierClassroomsQuery, GetCashierStudentsQuery } from "./cashier.schema";

export const cashierRepository = {
  async getDashboardStats() {
    const [totalClassrooms, totalDepartments, totalStudents, verifiedFees, pendingFees] =
      await Promise.all([
        prisma.classroom.count(),
        prisma.department.count(),
        prisma.student.count({ where: { user: { isActive: true } } }),
        prisma.student.count({
          where: {
            user: { isActive: true },
            feeVerification: {
              OR: [
                { advisorApproved: true },
                { hodApproved: true },
                { cashierApproved: true },
              ],
            },
          },
        }),
        prisma.student.count({
          where: {
            user: { isActive: true },
            OR: [
              { feeVerification: null },
              {
                feeVerification: {
                  advisorApproved: false,
                  hodApproved: false,
                  cashierApproved: false,
                },
              },
            ],
          },
        }),
      ]);

    return {
      totalClassrooms,
      totalDepartments,
      totalStudents,
      verifiedFees,
      pendingFees,
    };
  },

  async getClassrooms(query: GetCashierClassroomsQuery) {
    const { page, limit, search, departmentId } = query;

    const where: Prisma.ClassroomWhereInput = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { batch: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
        { department: { code: { contains: search, mode: "insensitive" } } },
        { students: { some: { registerNumber: { contains: search, mode: "insensitive" } } } },
        { students: { some: { rollNumber: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [classrooms, total] = await Promise.all([
      prisma.classroom.findMany({
        where,
        select: {
          id: true,
          name: true,
          batch: true,
          semester: true,
          section: true,
          department: {
            select: { id: true, code: true, name: true },
          },
          students: {
            select: {
              id: true,
              feeVerification: {
                select: {
                  advisorApproved: true,
                  hodApproved: true,
                  cashierApproved: true,
                },
              },
            },
          },
          _count: {
            select: { students: true },
          },
        },
        orderBy: [{ department: { code: "asc" } }, { semester: "asc" }, { section: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.classroom.count({ where }),
    ]);

    const formatted = classrooms.map((c) => {
      let verifiedCount = 0;
      for (const st of c.students) {
        if (
          st.feeVerification?.advisorApproved ||
          st.feeVerification?.hodApproved ||
          st.feeVerification?.cashierApproved
        ) {
          verifiedCount++;
        }
      }

      return {
        id: c.id,
        name: c.name,
        batch: c.batch,
        semester: c.semester,
        section: c.section,
        department: c.department,
        totalStudents: c._count.students,
        verifiedCount,
        pendingCount: c._count.students - verifiedCount,
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getClassroomById(classroomId: string) {
    return prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        name: true,
        batch: true,
        semester: true,
        section: true,
        department: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { students: true },
        },
      },
    });
  },

  async getClassroomStudents(classroomId: string, query: GetCashierStudentsQuery) {
    const { page, limit, search, status } = query;

    const where: Prisma.StudentWhereInput = {
      classroomId,
      user: { isActive: true },
    };

    if (search) {
      where.OR = [
        { registerNumber: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          registerNumber: true,
          rollNumber: true,
          admissionYear: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
            },
          },
          feeVerification: {
            select: {
              advisorApproved: true,
              hodApproved: true,
              cashierApproved: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { registerNumber: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    let data = students.map((s) => {
      const adv = s.feeVerification?.advisorApproved ?? false;
      const hod = s.feeVerification?.hodApproved ?? false;
      const cas = s.feeVerification?.cashierApproved ?? false;
      const verified = adv || hod || cas;

      return {
        id: s.id,
        registerNumber: s.registerNumber,
        rollNumber: s.rollNumber,
        admissionYear: s.admissionYear,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        studentName: `${s.user.firstName} ${s.user.lastName}`.trim(),
        email: s.user.email,
        advisorApproved: adv,
        hodApproved: hod,
        cashierApproved: cas,
        verified,
        verifiedAt: s.feeVerification?.updatedAt ?? null,
      };
    });

    if (status === "PENDING") {
      data = data.filter((d) => !d.verified);
    } else if (status === "VERIFIED") {
      data = data.filter((d) => d.verified);
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getPendingStudentIdsInClassroom(classroomId: string): Promise<string[]> {
    const students = await prisma.student.findMany({
      where: {
        classroomId,
        user: { isActive: true },
        OR: [
          { feeVerification: null },
          {
            feeVerification: {
              advisorApproved: false,
              hodApproved: false,
              cashierApproved: false,
            },
          },
        ],
      },
      select: { id: true },
    });
    return students.map((s) => s.id);
  },
};

