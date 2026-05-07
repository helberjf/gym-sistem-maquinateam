import { ReviewStatus, ReviewTargetType } from "@prisma/client";
import { z } from "zod";

const trimmedComment = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0
      ? undefined
      : value,
  z.string().trim().min(3).max(2000).optional(),
);

export const createReviewSchema = z.object({
  targetType: z.nativeEnum(ReviewTargetType),
  targetId: z.string().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  comment: trimmedComment,
});

export const updateOwnReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: trimmedComment,
});

export const moderateReviewSchema = z
  .object({
    status: z.enum([ReviewStatus.APPROVED, ReviewStatus.REJECTED]),
    moderationNote: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0
          ? undefined
          : value,
      z.string().trim().max(2000).optional(),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.status === ReviewStatus.REJECTED && !value.moderationNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Justificativa obrigatoria ao rejeitar.",
        path: ["moderationNote"],
      });
    }
  });

export const reviewFiltersSchema = z.object({
  targetType: z.nativeEnum(ReviewTargetType).optional(),
  targetId: z.string().optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateOwnReviewInput = z.infer<typeof updateOwnReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type ReviewFiltersInput = z.infer<typeof reviewFiltersSchema>;
