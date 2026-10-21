import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}; style-src 'self'${dev ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}; style-src-attr 'unsafe-inline'; frame-src 'self' https://www.google.com https://maps.google.com; img-src 'self' data: https://*.google.com https://*.googleapis.com https://*.gstatic.com; font-src 'self'; connect-src 'self'${dev ? " ws:" : ""}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'${request.nextUrl.protocol === "https:" ? "; upgrade-insecure-requests" : ""}`;
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  if (request.nextUrl.protocol === "https:")
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  return response;
}
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|assets|images|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
