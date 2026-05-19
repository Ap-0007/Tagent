/**
 * API Proxy Route
 * Frontend calls /api/proxy/... which proxies to the API Gateway internally.
 */

import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY = process.env.API_GATEWAY_URL || "http://tagent-api-gateway:8080";

export async function GET(request: NextRequest) {
    const path = request.nextUrl.pathname.replace("/api/proxy/", "");
    const url = `${API_GATEWAY}/api/v1/${path}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ error: "API Gateway unreachable", url }, { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    const path = request.nextUrl.pathname.replace("/api/proxy/", "");
    const url = `${API_GATEWAY}/api/v1/${path}`;
    const body = await request.text();

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ error: "API Gateway unreachable", url }, { status: 502 });
    }
}
