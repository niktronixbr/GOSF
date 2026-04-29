import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const apiBase = process.env.API_URL ?? "http://localhost:3001";
  const { path } = await ctx.params;
  const targetUrl = `${apiBase}/api/v1/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, init);
    const body = await response.arrayBuffer();
    const resHeaders = new Headers(response.headers);
    resHeaders.delete("transfer-encoding");
    resHeaders.delete("content-encoding");
    return new NextResponse(body, {
      status: response.status,
      headers: resHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Proxy error", detail: String(err) },
      { status: 502 }
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
