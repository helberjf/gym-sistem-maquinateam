import {
  LeadInteractionType,
  LeadSource,
  LeadStatus,
  LeadTaskPriority,
  LeadTaskStatus,
} from "@prisma/client";
import { z } from "zod";

const trimmedRequiredString = (max: number, label: string) =>
  z.string().trim().min(1, `${label} obrigatorio.`).max(max);

const trimmedOptionalString = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().trim().max(max).optional(),
  );

const trimmedOptionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0
      ? undefined
      : value,
  z.string().trim().max(4000).optional(),
);

const optionalNullableInt = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : value;
    }
    return value;
  },
  z.union([z.number().int().nonnegative(), z.null()]).optional(),
);

const optionalUserId = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0
      ? undefined
      : value,
  z.string().cuid().optional(),
);

export const leadFiltersSchema = z.object({
  search: trimmedOptionalString(80),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedToId: optionalUserId,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createLeadSchema = z.object({
  name: trimmedRequiredString(120, "Nome"),
  email: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().trim().email("E-mail invalido.").max(200).optional(),
  ),
  phone: trimmedOptionalString(40),
  instagramHandle: trimmedOptionalString(80),
  source: z.nativeEnum(LeadSource).default(LeadSource.OTHER),
  valueCents: optionalNullableInt,
  notes: trimmedOptionalText,
  assignedToId: optionalUserId,
});

export const updateLeadSchema = z.object({
  name: trimmedRequiredString(120, "Nome").optional(),
  email: z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim().length === 0) return null;
      return value;
    },
    z
      .union([z.string().trim().email("E-mail invalido.").max(200), z.null()])
      .optional(),
  ),
  phone: z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim().length === 0) return null;
      return value;
    },
    z.union([z.string().trim().max(40), z.null()]).optional(),
  ),
  instagramHandle: z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim().length === 0) return null;
      return value;
    },
    z.union([z.string().trim().max(80), z.null()]).optional(),
  ),
  source: z.nativeEnum(LeadSource).optional(),
  valueCents: optionalNullableInt,
  notes: z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim().length === 0) return null;
      return value;
    },
    z.union([z.string().trim().max(4000), z.null()]).optional(),
  ),
  assignedToId: z.preprocess(
    (value) => {
      if (value === null) return null;
      if (typeof value === "string" && value.trim().length === 0) return null;
      return value;
    },
    z.union([z.string().cuid(), z.null()]).optional(),
  ),
  status: z.nativeEnum(LeadStatus).optional(),
  lostReason: trimmedOptionalText,
});

export const qualifyLeadSchema = z
  .object({
    action: z.enum(["advance", "lost", "reopen"]),
    lostReason: trimmedOptionalText,
  })
  .superRefine((value, ctx) => {
    if (value.action === "lost" && !value.lostReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Motivo da perda obrigatorio.",
        path: ["lostReason"],
      });
    }
  });

export const createLeadInteractionSchema = z.object({
  type: z.nativeEnum(LeadInteractionType).default(LeadInteractionType.NOTE),
  content: trimmedRequiredString(4000, "Conteudo"),
});

export const createLeadTaskSchema = z.object({
  title: trimmedRequiredString(160, "Titulo"),
  description: trimmedOptionalText,
  priority: z.nativeEnum(LeadTaskPriority).default(LeadTaskPriority.MEDIUM),
  status: z.nativeEnum(LeadTaskStatus).default(LeadTaskStatus.PENDING),
  dueDate: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, "Data invalida.")
      .optional(),
  ),
  assignedToId: optionalUserId,
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadFiltersInput = z.infer<typeof leadFiltersSchema>;
export type QualifyLeadInput = z.infer<typeof qualifyLeadSchema>;
export type CreateLeadInteractionInput = z.infer<
  typeof createLeadInteractionSchema
>;
export type CreateLeadTaskInput = z.infer<typeof createLeadTaskSchema>;
