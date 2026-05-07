-- CRM: Lead pipeline, interactions and tasks --

CREATE TYPE "LeadStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'WON',
    'LOST'
);

CREATE TYPE "LeadSource" AS ENUM (
    'WEBSITE',
    'INSTAGRAM',
    'WHATSAPP',
    'REFERRAL',
    'WALK_IN',
    'PHONE',
    'SOCIAL_MEDIA',
    'OTHER'
);

CREATE TYPE "LeadInteractionType" AS ENUM (
    'NOTE',
    'CALL',
    'EMAIL',
    'WHATSAPP',
    'MEETING',
    'INSTAGRAM_DM'
);

CREATE TYPE "LeadTaskStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'DONE',
    'CANCELLED'
);

CREATE TYPE "LeadTaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);

CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "instagramHandle" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "valueCents" INTEGER,
    "lostReason" TEXT,
    "convertedAt" TIMESTAMP(3),
    "notes" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_source_idx" ON "leads"("source");
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");
CREATE INDEX "leads_createdById_idx" ON "leads"("createdById");
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");
CREATE INDEX "leads_status_assignedToId_idx" ON "leads"("status", "assignedToId");

ALTER TABLE "leads"
    ADD CONSTRAINT "leads_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
    ADD CONSTRAINT "leads_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lead_interactions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "LeadInteractionType" NOT NULL DEFAULT 'NOTE',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_interactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_interactions_leadId_createdAt_idx"
    ON "lead_interactions"("leadId", "createdAt");
CREATE INDEX "lead_interactions_userId_idx"
    ON "lead_interactions"("userId");

ALTER TABLE "lead_interactions"
    ADD CONSTRAINT "lead_interactions_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_interactions"
    ADD CONSTRAINT "lead_interactions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lead_tasks" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LeadTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LeadTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_tasks_leadId_idx" ON "lead_tasks"("leadId");
CREATE INDEX "lead_tasks_assignedToId_status_idx"
    ON "lead_tasks"("assignedToId", "status");
CREATE INDEX "lead_tasks_status_idx" ON "lead_tasks"("status");
CREATE INDEX "lead_tasks_priority_idx" ON "lead_tasks"("priority");
CREATE INDEX "lead_tasks_dueDate_idx" ON "lead_tasks"("dueDate");

ALTER TABLE "lead_tasks"
    ADD CONSTRAINT "lead_tasks_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "leads"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_tasks"
    ADD CONSTRAINT "lead_tasks_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lead_tasks"
    ADD CONSTRAINT "lead_tasks_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
