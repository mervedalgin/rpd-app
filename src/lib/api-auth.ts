import { NextRequest, NextResponse } from "next/server";

const API_SECRET = process.env.API_SECRET_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Validates API requests with origin + token-based auth.
 * Same-origin browser requests are allowed.
 * External requests require Bearer token.
 * Cron requests require CRON_SECRET header.
 */
export function validateApiRequest(request: NextRequest): NextResponse | null {
  // Allow same-origin requests (browser navigation)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (origin && appUrl && origin.startsWith(appUrl)) {
    return null;
  }
  if (referer && appUrl && referer.startsWith(appUrl)) {
    return null;
  }

  // For server-to-server or external requests, check API key
  if (API_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${API_SECRET}`) {
      return null;
    }
  }

  // Skip auth in development only if no APP_URL is configured
  if (process.env.NODE_ENV === "development" && !appUrl) {
    return null;
  }

  return NextResponse.json(
    { error: "Yetkisiz erişim" },
    { status: 401 }
  );
}

/**
 * Validates cron job requests using Vercel CRON_SECRET or Authorization header.
 */
export function validateCronRequest(request: NextRequest): NextResponse | null {
  // Vercel cron secret header
  const cronHeader = request.headers.get("x-vercel-cron");
  if (CRON_SECRET && cronHeader === CRON_SECRET) {
    return null;
  }

  // Also accept Bearer token
  if (API_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${API_SECRET}`) {
      return null;
    }
  }

  // In development, allow cron requests
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return NextResponse.json(
    { error: "Yetkisiz cron erişimi" },
    { status: 401 }
  );
}

/**
 * Returns a sanitized error response without leaking internal details.
 */
export function apiError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wraps an API handler with error handling and auth (enabled by default).
 */
export function withApiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: { requireAuth?: boolean; isCron?: boolean } = { requireAuth: true }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      if (options.isCron) {
        const cronError = validateCronRequest(request);
        if (cronError) return cronError;
      } else if (options.requireAuth !== false) {
        const authError = validateApiRequest(request);
        if (authError) return authError;
      }

      return await handler(request);
    } catch (error) {
      console.error("API Error:", error);
      return apiError("Sunucu hatası oluştu");
    }
  };
}
