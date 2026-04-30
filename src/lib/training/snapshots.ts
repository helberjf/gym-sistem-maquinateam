import { AttendanceStatus, TrainingAssignmentStatus } from "@prisma/client";
import { startOfDay } from "@/lib/academy/constants";
import {
  getStudentVisibilityWhere,
  getTeacherVisibilityWhere,
  requireStudentViewerContext,
  requireTeacherViewerContext,
  type ViewerContext,
} from "@/lib/academy/access";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { buildNextClassOccurrence } from "@/lib/training/utils";

export async function getStudentTrainingSnapshot(viewer: ViewerContext) {
  const studentProfileId = requireStudentViewerContext(viewer);
  const now = new Date();
  const startOfMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));

  const [
    studentProfile,
    attendances,
    assignments,
    enrollments,
    monthPresentCount,
    monthNoShowCount,
  ] = await prisma.$transaction([
    prisma.studentProfile.findFirst({
      where: {
        AND: [getStudentVisibilityWhere(viewer), { id: studentProfileId }],
      },
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        primaryModality: { select: { id: true, name: true } },
        responsibleTeacher: {
          select: { id: true, user: { select: { name: true } } },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { studentProfileId },
      orderBy: [{ classDate: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        id: true,
        classDate: true,
        status: true,
        classSchedule: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            modality: { select: { name: true } },
            teacherProfile: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.trainingAssignment.findMany({
      where: { studentProfileId },
      orderBy: [{ assignedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        assignedAt: true,
        dueAt: true,
        trainingTemplate: {
          select: {
            id: true,
            name: true,
            level: true,
            modality: { select: { name: true } },
          },
        },
      },
    }),
    prisma.classEnrollment.findMany({
      where: {
        studentProfileId,
        isActive: true,
        classSchedule: { isActive: true },
      },
      select: {
        id: true,
        classSchedule: {
          select: {
            id: true,
            title: true,
            dayOfWeek: true,
            daysOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
            modality: { select: { name: true } },
            teacherProfile: { select: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.attendance.count({
      where: {
        studentProfileId,
        classDate: { gte: startOfMonth },
        status: { in: [AttendanceStatus.CHECKED_IN, AttendanceStatus.CHECKED_OUT] },
      },
    }),
    prisma.attendance.count({
      where: {
        studentProfileId,
        classDate: { gte: startOfMonth },
        status: AttendanceStatus.NO_SHOW,
      },
    }),
  ]);

  if (!studentProfile) {
    throw new NotFoundError("Aluno nao encontrado.");
  }

  const presentAttendances = attendances.filter(
    (attendance) =>
      attendance.status === AttendanceStatus.CHECKED_IN ||
      attendance.status === AttendanceStatus.CHECKED_OUT,
  );
  const distinctPresentDays = Array.from(
    new Set(
      presentAttendances.map((attendance) => attendance.classDate.toISOString().slice(0, 10)),
    ),
  );
  let currentStreak = 0;

  for (let index = 0; index < distinctPresentDays.length; index += 1) {
    const currentDate = new Date(`${distinctPresentDays[index]}T00:00:00.000Z`);

    if (index === 0) {
      currentStreak = 1;
      continue;
    }

    const previousDate = new Date(`${distinctPresentDays[index - 1]}T00:00:00.000Z`);
    const differenceInDays =
      (previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);

    if (differenceInDays === 1) {
      currentStreak += 1;
      continue;
    }

    break;
  }

  const nextClasses = enrollments
    .map((enrollment) => {
      const nextOccurrence = buildNextClassOccurrence(enrollment.classSchedule, now);
      return { ...enrollment.classSchedule, nextOccurrence };
    })
    .filter(
      (schedule): schedule is typeof schedule & { nextOccurrence: Date } =>
        Boolean(schedule.nextOccurrence),
    )
    .sort((left, right) => left.nextOccurrence.getTime() - right.nextOccurrence.getTime())
    .slice(0, 4);

  return {
    studentProfile,
    attendanceSummary: {
      monthPresentCount,
      monthNoShowCount,
      frequencyPercent:
        monthPresentCount + monthNoShowCount > 0
          ? Math.round(
              (monthPresentCount / (monthPresentCount + monthNoShowCount)) * 100,
            )
          : null,
      currentStreak,
    },
    recentAttendance: attendances.slice(0, 8),
    nextClasses,
    activeAssignments: assignments.filter(
      (assignment) =>
        assignment.status === TrainingAssignmentStatus.ASSIGNED ||
        assignment.status === TrainingAssignmentStatus.IN_PROGRESS,
    ),
    historyAssignments: assignments.filter(
      (assignment) =>
        assignment.status === TrainingAssignmentStatus.COMPLETED ||
        assignment.status === TrainingAssignmentStatus.MISSED ||
        assignment.status === TrainingAssignmentStatus.CANCELLED,
    ),
  };
}

export async function getTeacherTrainingSnapshot(viewer: ViewerContext) {
  const teacherProfileId = requireTeacherViewerContext(viewer);
  const now = new Date();
  const todayWeekday = now.getDay();
  const startToday = startOfDay(now);

  const [teacherProfile, todayClasses, recentAttendance, recentAssignments, summary] =
    await Promise.all([
      prisma.teacherProfile.findFirst({
        where: {
          AND: [getTeacherVisibilityWhere(viewer), { id: teacherProfileId }],
        },
        select: {
          id: true,
          registrationNumber: true,
          isActive: true,
          user: { select: { name: true } },
        },
      }),
      prisma.classSchedule.findMany({
        where: {
          teacherProfileId,
          isActive: true,
          OR: [
            { dayOfWeek: todayWeekday },
            { daysOfWeek: { has: todayWeekday } },
          ],
        },
        orderBy: [{ startTime: "asc" }],
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          room: true,
          dayOfWeek: true,
          daysOfWeek: true,
          modality: { select: { name: true } },
          _count: { select: { enrollments: { where: { isActive: true } } } },
        },
      }),
      prisma.attendance.findMany({
        where: { classSchedule: { teacherProfileId } },
        orderBy: [{ classDate: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          classDate: true,
          status: true,
          studentProfile: {
            select: {
              registrationNumber: true,
              user: { select: { name: true } },
            },
          },
          classSchedule: {
            select: {
              title: true,
              modality: { select: { name: true } },
            },
          },
        },
      }),
      prisma.trainingAssignment.findMany({
        where: { teacherProfileId },
        orderBy: [{ assignedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          assignedAt: true,
          dueAt: true,
          studentProfile: {
            select: { id: true, user: { select: { name: true } } },
          },
          trainingTemplate: {
            select: {
              name: true,
              modality: { select: { name: true } },
            },
          },
        },
      }),
      prisma.$transaction([
        prisma.trainingTemplate.count({
          where: { teacherProfileId, isActive: true },
        }),
        prisma.trainingAssignment.count({
          where: {
            teacherProfileId,
            status: {
              in: [
                TrainingAssignmentStatus.ASSIGNED,
                TrainingAssignmentStatus.IN_PROGRESS,
              ],
            },
          },
        }),
        prisma.studentProfile.count({
          where: getStudentVisibilityWhere(viewer),
        }),
        prisma.attendance.count({
          where: {
            classSchedule: { teacherProfileId },
            classDate: { gte: startToday },
            status: {
              in: [AttendanceStatus.CHECKED_IN, AttendanceStatus.CHECKED_OUT],
            },
          },
        }),
      ]),
    ]);

  if (!teacherProfile) {
    throw new NotFoundError("Professor nao encontrado.");
  }

  return {
    teacherProfile,
    todayClasses,
    recentAttendance,
    recentAssignments,
    summary: {
      activeTemplates: summary[0],
      activeAssignments: summary[1],
      linkedStudents: summary[2],
      todaysCheckIns: summary[3],
    },
  };
}

export async function getStudentPerformanceSnapshot(viewer: ViewerContext) {
  return getStudentTrainingSnapshot(viewer);
}

export async function getTeacherOperationalSnapshot(viewer: ViewerContext) {
  return getTeacherTrainingSnapshot(viewer);
}
