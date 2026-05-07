import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  prisma: {
    teacherProfile: { findUnique: vi.fn() },
    teacherAvailability: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    teacherTimeOff: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(mocks.prisma)),
  },
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: mocks.logAuditEvent }));

import {
  addTeacherTimeOff,
  deleteTeacherTimeOff,
  listTeacherAvailability,
  replaceTeacherAvailability,
} from "@/lib/availability/service";

const TEACHER_VIEWER = {
  userId: "u-prof",
  role: UserRole.PROFESSOR,
  studentProfileId: null,
  teacherProfileId: "tp-1",
};
const ADMIN_VIEWER = {
  userId: "u-admin",
  role: UserRole.ADMIN,
  studentProfileId: null,
  teacherProfileId: null,
};
const ALUNO_VIEWER = {
  userId: "u-aluno",
  role: UserRole.ALUNO,
  studentProfileId: null,
  teacherProfileId: null,
};
const RECEPCAO_VIEWER = {
  userId: "u-rec",
  role: UserRole.RECEPCAO,
  studentProfileId: null,
  teacherProfileId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.teacherAvailability.findMany.mockResolvedValue([]);
  mocks.prisma.teacherTimeOff.findMany.mockResolvedValue([]);
  mocks.prisma.teacherProfile.findUnique.mockResolvedValue({
    id: "tp-other",
    isActive: true,
  });
});

describe("listTeacherAvailability", () => {
  it("ALUNO can read availability", async () => {
    await expect(
      listTeacherAvailability("tp-1", ALUNO_VIEWER),
    ).resolves.toBeTruthy();
  });
});

describe("replaceTeacherAvailability — viewer is the teacher itself", () => {
  it("PROFESSOR can replace own availability without specifying teacherProfileId", async () => {
    mocks.prisma.teacherAvailability.findMany.mockResolvedValue([
      {
        id: "av-1",
        teacherProfileId: "tp-1",
        dayOfWeek: 1,
        startTime: "08:00",
        endTime: "12:00",
      },
    ]);

    await replaceTeacherAvailability(
      {
        slots: [
          {
            dayOfWeek: 1,
            startTime: "08:00",
            endTime: "12:00",
            isActive: true,
          },
        ],
      },
      { viewer: TEACHER_VIEWER },
    );

    expect(mocks.prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
      where: { teacherProfileId: "tp-1" },
    });
    expect(mocks.prisma.teacherAvailability.createMany).toHaveBeenCalled();
    expect(mocks.logAuditEvent).toHaveBeenCalled();
  });

  it("forbids ALUNO", async () => {
    await expect(
      replaceTeacherAvailability(
        { slots: [] },
        { viewer: ALUNO_VIEWER },
      ),
    ).rejects.toThrow();
  });

  it("forbids PROFESSOR managing another teacher's availability", async () => {
    await expect(
      replaceTeacherAvailability(
        {
          teacherProfileId: "tp-other",
          slots: [
            { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", isActive: true },
          ],
        },
        { viewer: TEACHER_VIEWER },
      ),
    ).rejects.toThrow(/permissao/i);
  });
});

describe("replaceTeacherAvailability — admin/recepcao for other teacher", () => {
  it("RECEPCAO can replace another teacher's availability", async () => {
    await replaceTeacherAvailability(
      {
        teacherProfileId: "tp-other",
        slots: [
          { dayOfWeek: 2, startTime: "14:00", endTime: "18:00", isActive: true },
        ],
      },
      { viewer: RECEPCAO_VIEWER },
    );

    expect(mocks.prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
      where: { teacherProfileId: "tp-other" },
    });
  });

  it("ADMIN gets BadRequest when no teacherProfileId is given (no own teacher)", async () => {
    await expect(
      replaceTeacherAvailability(
        { slots: [] },
        { viewer: ADMIN_VIEWER },
      ),
    ).rejects.toThrow(/teacherProfileId/i);
  });

  it("404s when target teacher does not exist", async () => {
    mocks.prisma.teacherProfile.findUnique.mockResolvedValueOnce(null);
    await expect(
      replaceTeacherAvailability(
        { teacherProfileId: "tp-missing", slots: [] },
        { viewer: ADMIN_VIEWER },
      ),
    ).rejects.toThrow(/encontrado/i);
  });

  it("rejects inactive teachers", async () => {
    mocks.prisma.teacherProfile.findUnique.mockResolvedValueOnce({
      id: "tp-other",
      isActive: false,
    });
    await expect(
      replaceTeacherAvailability(
        { teacherProfileId: "tp-other", slots: [] },
        { viewer: ADMIN_VIEWER },
      ),
    ).rejects.toThrow(/inativo/i);
  });

  it("clears all slots when array is empty", async () => {
    await replaceTeacherAvailability(
      { teacherProfileId: "tp-other", slots: [] },
      { viewer: RECEPCAO_VIEWER },
    );
    expect(mocks.prisma.teacherAvailability.deleteMany).toHaveBeenCalled();
    expect(mocks.prisma.teacherAvailability.createMany).not.toHaveBeenCalled();
  });
});

describe("addTeacherTimeOff", () => {
  it("creates time-off for own teacher", async () => {
    mocks.prisma.teacherTimeOff.create.mockResolvedValue({
      id: "to-1",
      teacherProfileId: "tp-1",
    });

    await addTeacherTimeOff(
      {
        startsAt: "2026-06-01T00:00:00.000Z",
        endsAt: "2026-06-05T00:00:00.000Z",
        reason: "ferias",
      },
      { viewer: TEACHER_VIEWER },
    );

    expect(mocks.prisma.teacherTimeOff.create).toHaveBeenCalled();
  });
});

describe("deleteTeacherTimeOff", () => {
  it("removes a time-off owned by the teacher", async () => {
    mocks.prisma.teacherTimeOff.findUnique.mockResolvedValue({
      id: "to-1",
      teacherProfileId: "tp-1",
    });
    mocks.prisma.teacherTimeOff.delete.mockResolvedValue({ id: "to-1" });

    await deleteTeacherTimeOff("to-1", { viewer: TEACHER_VIEWER });

    expect(mocks.prisma.teacherTimeOff.delete).toHaveBeenCalled();
  });

  it("404 when time-off not found", async () => {
    mocks.prisma.teacherTimeOff.findUnique.mockResolvedValue(null);
    await expect(
      deleteTeacherTimeOff("missing", { viewer: TEACHER_VIEWER }),
    ).rejects.toThrow(/encontrada/i);
  });
});
