import { z } from "zod";
import {
  handleRouteError,
  successResponse,
} from "@/lib/errors";
import { getOptionalSession } from "@/lib/auth/session";
import { getPixCheckoutStatus } from "@/lib/payments/pix";
import { parseSearchParams } from "@/lib/validators";

export const runtime = "nodejs";

const pixStatusQuerySchema = z.object({
  payment: z.string().trim().min(1, "Pagamento nao informado."),
});

export async function GET(request: Request) {
  try {
    const { payment } = parseSearchParams(
      new URL(request.url).searchParams,
      pixStatusQuerySchema,
    );
    const session = await getOptionalSession();

    const status = await getPixCheckoutStatus({
      checkoutPaymentId: payment,
      userId: session?.user?.id ?? null,
    });

    return successResponse(status);
  } catch (error) {
    return handleRouteError(error, {
      source: "pix payment status route",
    });
  }
}
