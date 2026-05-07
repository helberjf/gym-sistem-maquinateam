-- Teacher availability windows + planned time off --

CREATE TABLE "teacher_availabilities" (
    "id"               TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "dayOfWeek"        INTEGER NOT NULL,
    "startTime"        TEXT NOT NULL,
    "endTime"          TEXT NOT NULL,
    "breaks"           JSONB,
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_availabilities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "teacher_availabilities_teacherProfileId_dayOfWeek_idx"
    ON "teacher_availabilities"("teacherProfileId", "dayOfWeek");

ALTER TABLE "teacher_availabilities"
    ADD CONSTRAINT "teacher_availabilities_teacherProfileId_fkey"
    FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "teacher_time_offs" (
    "id"               TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "startsAt"         TIMESTAMP(3) NOT NULL,
    "endsAt"           TIMESTAMP(3) NOT NULL,
    "reason"           TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_time_offs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "teacher_time_offs_teacherProfileId_startsAt_idx"
    ON "teacher_time_offs"("teacherProfileId", "startsAt");

ALTER TABLE "teacher_time_offs"
    ADD CONSTRAINT "teacher_time_offs_teacherProfileId_fkey"
    FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
