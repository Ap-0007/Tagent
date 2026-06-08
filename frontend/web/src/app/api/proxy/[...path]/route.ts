/**
 * API Proxy Route
 * Frontend calls /api/proxy/... which proxies to the API Gateway internally.
 * Supports GET, POST, PUT, DELETE methods.
 */

import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY = process.env.API_GATEWAY_URL || "http://tagent-api-gateway:8080";

function buildUrl(request: NextRequest): string {
    const path = request.nextUrl.pathname.replace("/api/proxy/", "");
    const search = request.nextUrl.search || "";
    return `${API_GATEWAY}/api/v1/${path}${search}`;
}

export async function GET(request: NextRequest) {
    const url = buildUrl(request);

    try {
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ error: "API Gateway unreachable", url }, { status: 502 });
    }
}

export async function POST(request: NextRequest) {
    const url = buildUrl(request);
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

export async function PUT(request: NextRequest) {
    const url = buildUrl(request);
    const body = await request.text();

    try {
        const res = await fetch(url, {
            method: "PUT",
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

export async function DELETE(request: NextRequest) {
    const url = buildUrl(request);

    try {
        const res = await fetch(url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ error: "API Gateway unreachable", url }, { status: 502 });
    }
}
