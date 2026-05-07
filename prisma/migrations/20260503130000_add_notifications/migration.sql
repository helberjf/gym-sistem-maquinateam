-- Persistent in-app notifications inbox --

CREATE TYPE "NotificationTone" AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING',
    'DANGER'
);

CREATE TYPE "NotificationType" AS ENUM (
    'PAYMENT_DUE',
    'PAYMENT_OVERDUE',
    'PAYMENT_RECEIVED',
    'CLASS_REMINDER',
    'CLASS_CANCELLED',
    'TRAINING_ASSIGNED',
    'TRAINING_DUE',
    'ANNOUNCEMENT',
    'REVIEW_PENDING_MODERATION',
    'LEAD_ASSIGNED',
    'STOCK_LOW',
    'WEBHOOK_FAILED',
    'GENERIC'
);

CREATE TABLE "notifications" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "type"       "NotificationType" NOT NULL DEFAULT 'GENERIC',
    "tone"       "NotificationTone" NOT NULL DEFAULT 'INFO',
    "title"      TEXT NOT NULL,
    "message"    TEXT NOT NULL,
    "href"       TEXT,
    "dedupKey"   TEXT,
    "metadata"   JSONB,
    "readAt"     TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_userId_dedupKey_key"
    ON "notifications"("userId", "dedupKey");

CREATE INDEX "notifications_userId_readAt_createdAt_idx"
    ON "notifications"("userId", "readAt", "createdAt");

CREATE INDEX "notifications_userId_archivedAt_idx"
    ON "notifications"("userId", "archivedAt");

ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
