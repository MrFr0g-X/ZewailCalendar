import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for the Ramadan API.
 *
 * The upstream API at ramadan.munafio.com does not include CORS headers,
 * so browser-side fetch() calls are blocked. This route proxies the
 * request from the server where CORS doesn't apply.
 *
 * Usage: GET /api/ramadan?date=DD-MM-YYYY
 */
export async function GET(request: NextRequest) {
    const date = request.nextUrl.searchParams.get("date");

    if (!date) {
        return NextResponse.json(
            { error: "Missing 'date' query parameter (format: DD-MM-YYYY)" },
            { status: 400 }
        );
    }

    try {
        const upstream = await fetch(
            `https://ramadan.munafio.com/api/check?date=${encodeURIComponent(date)}`,
            { next: { revalidate: 86400 } } // cache for 24 hours
        );

        if (!upstream.ok) {
            return NextResponse.json(
                { error: `Upstream API returned ${upstream.status}` },
                { status: upstream.status }
            );
        }

        const data = await upstream.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Upstream request failed" },
            { status: 502 }
        );
    }
}
