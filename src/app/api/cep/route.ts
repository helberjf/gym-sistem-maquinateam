import { BadRequestError, NotFoundError, handleRouteError, successResponse } from "@/lib/errors";
import {
  attachRateLimitHeaders,
  enforceRateLimit,
  mutationLimiter,
} from "@/lib/rate-limit";
import { onlyDigits } from "@/lib/utils/formatters";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  let rateLimitHeaders: Headers | undefined;

  try {
    const { searchParams } = new URL(request.url);
    const cep = onlyDigits(searchParams.get("cep"));

    if (cep.length !== 8) {
      throw new BadRequestError("CEP invalido.");
    }

    const rateLimit = await enforceRateLimit({
      request,
      limiter: mutationLimiter,
      keyParts: ["cep-lookup", cep],
    });
    rateLimitHeaders = rateLimit.headers;

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new BadRequestError("Erro ao consultar CEP.");
    }

    const data = (await response.json()) as ViaCepResponse;

    if (data.erro) {
      throw new NotFoundError("CEP nao encontrado.");
    }

    return attachRateLimitHeaders(
      successResponse({
        zipCode: onlyDigits(data.cep ?? cep),
        street: data.logradouro ?? "",
        district: data.bairro ?? "",
        city: data.localidade ?? "",
        state: (data.uf ?? "").toUpperCase(),
        complement: data.complemento ?? "",
      }),
      rateLimitHeaders,
    );
  } catch (error) {
    return handleRouteError(error, {
      source: "cep lookup route",
      headers: rateLimitHeaders,
    });
  }
}
