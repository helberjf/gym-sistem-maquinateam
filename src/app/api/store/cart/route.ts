import { getCartSnapshot } from "@/lib/store/cart";
import { handleRouteError, successResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cart = await getCartSnapshot();

    return successResponse({
      cart,
    });
  } catch (error) {
    return handleRouteError(error, {
      source: "store cart get route",
    });
  }
}
