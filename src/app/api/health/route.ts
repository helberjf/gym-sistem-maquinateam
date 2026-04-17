import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/errors";
import { getMailConfigurationStatus } from "@/lib/mail";

export const runtime = "nodejs";

export async function GET() {
  let db: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const mail = getMailConfigurationStatus();
  const status = db === "ok" && mail.configured ? "ok" : "degraded";
  const responseStatus = db === "ok" ? 200 : 503;

  return successResponse(
    {
      status,
      project: "Maquina Team Gym System",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      services: {
        db,
        mail: mail.configured ? "ok" : "error",
      },
      integrations: {
        mail,
      },
    },
    { status: responseStatus },
  );
}
