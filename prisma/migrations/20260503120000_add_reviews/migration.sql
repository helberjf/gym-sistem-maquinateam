-- Polymorphic reviews (teacher / modality / class schedule / facility) with moderation --

CREATE TYPE "ReviewTargetType" AS ENUM (
    'TEACHER',
    'MODALITY',
    'CLASS_SCHEDULE',
    'FACILITY'
);

CREATE TYPE "ReviewStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TABLE "reviews" (
    "id"             TEXT NOT NULL,
    "authorId"       TEXT NOT NULL,
    "targetType"     "ReviewTargetType" NOT NULL,
    "targetId"       TEXT NOT NULL,
    "rating"         INTEGER NOT NULL,
    "comment"        TEXT,
    "status"         "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNote" TEXT,
    "moderatedById"  TEXT,
    "moderatedAt"    TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reviews_authorId_targetType_targetId_key"
    ON "reviews"("authorId", "targetType", "targetId");

CREATE INDEX "reviews_targetType_targetId_status_idx"
    ON "reviews"("targetType", "targetId", "status");

CREATE INDEX "reviews_status_createdAt_idx"
    ON "reviews"("status", "createdAt");

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_moderatedById_fkey"
    FOREIGN KEY ("moderatedById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
