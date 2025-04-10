import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for rate limiting
// In production, this should use Redis or another distributed store
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const API_REQUESTS = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only apply rate limiting to the generate endpoint
  if (request.nextUrl.pathname.startsWith("/api/generate")) {
    // Get IP from various headers or use a default
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "anonymous";

    // Clean up expired rate limits
    const now = Date.now();
    for (const [key, value] of API_REQUESTS.entries()) {
      if (value.resetTime < now) {
        API_REQUESTS.delete(key);
      }
    }

    // Get or create rate limit record
    let rateLimit = API_REQUESTS.get(ip);
    if (!rateLimit) {
      rateLimit = { count: 0, resetTime: now + RATE_LIMIT_DURATION };
      API_REQUESTS.set(ip, rateLimit);
    }

    // Check if rate limit is exceeded
    const isRateLimited = rateLimit.count >= 5; // Max 5 requests per minute

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", "5");
    response.headers.set(
      "X-RateLimit-Remaining",
      isRateLimited ? "0" : String(5 - rateLimit.count),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil((rateLimit.resetTime - now) / 1000)),
    );

    if (isRateLimited) {
      // Return rate limit response
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(
              Math.ceil((rateLimit.resetTime - now) / 1000),
            ),
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - now) / 1000),
            ),
          },
        },
      );
    }

    // Increment request count
    rateLimit.count++;
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
