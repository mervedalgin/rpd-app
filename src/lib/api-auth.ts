import { NextRequest, NextResponse } from "next/server";

const API_SECRET = process.env.API_SECRET_KEY;

/**
 * Validates API requests with a simple token-based auth.
 * For internal browser requests, checks the Origin/Referer header.
 * For external requests, checks the Authorization header.
 */
export function validateApiRequest(request: NextRequest): NextResponse | null {
  // Skip auth in development
  if (process.env.NODE_ENV === "development") {
    return null;
  }

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

  // If no app URL is configured, allow all requests (backward compatible)
  if (!appUrl) {
    return null;
  }

  return NextResponse.json(
    { error: "Yetkisiz erişim" },
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
 * Wraps an API handler with error handling and optional auth.
 */
export function withApiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: { requireAuth?: boolean } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      if (options.requireAuth) {
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
