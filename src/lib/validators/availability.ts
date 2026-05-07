import { z } from "zod";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const breakSchema = z
  .object({
    startTime: z.string().regex(HHMM, "Hora invalida (HH:MM)."),
    endTime: z.string().regex(HHMM, "Hora invalida (HH:MM)."),
  })
  .superRefine((value, ctx) => {
    if (value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Inicio do intervalo deve ser antes do fim.",
        path: ["endTime"],
      });
    }
  });

export const teacherAvailabilitySlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(HHMM, "Hora invalida (HH:MM)."),
    endTime: z.string().regex(HHMM, "Hora invalida (HH:MM)."),
    breaks: z.array(breakSchema).max(8).optional(),
    isActive: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.startTime >= value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Inicio deve ser antes do fim.",
        path: ["endTime"],
      });
    }
    for (const slotBreak of value.breaks ?? []) {
      if (
        slotBreak.startTime < value.startTime ||
        slotBreak.endTime > value.endTime
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intervalo deve ficar dentro da janela.",
          path: ["breaks"],
        });
        break;
      }
    }
  });

export const replaceTeacherAvailabilitySchema = z.object({
  teacherProfileId: z.string().cuid().optional(),
  slots: z.array(teacherAvailabilitySlotSchema).max(50),
});

export const teacherTimeOffSchema = z
  .object({
    teacherProfileId: z.string().cuid().optional(),
    startsAt: z.string().datetime("Data/hora invalida."),
    endsAt: z.string().datetime("Data/hora invalida."),
    reason: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0
          ? undefined
          : value,
      z.string().trim().max(500).optional(),
    ),
  })
  .superRefine((value, ctx) => {
    if (new Date(value.startsAt) >= new Date(value.endsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Inicio deve ser antes do fim.",
        path: ["endsAt"],
      });
    }
  });

export type TeacherAvailabilitySlotInput = z.infer<
  typeof teacherAvailabilitySlotSchema
>;
export type ReplaceTeacherAvailabilityInput = z.infer<
  typeof replaceTeacherAvailabilitySchema
>;
export type TeacherTimeOffInput = z.infer<typeof teacherTimeOffSchema>;
