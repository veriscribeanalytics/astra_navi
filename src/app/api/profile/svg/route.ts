import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = new URL(request.url);
        const style = url.searchParams.get("style") || "north";
        const theme = url.searchParams.get("theme") || "light";

        const backendRes = await backendFetch(`/api/profile/svg?style=${style}&theme=${theme}`, {
            method: "GET",
            userEmail: session.user.email,
        });

        if (!backendRes.ok) {
            return new NextResponse(await backendRes.text(), { status: backendRes.status });
        }

        const svgData = await backendRes.text();

        return new NextResponse(svgData, {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
            },
        });
    } catch (error) {
        console.error("[GET /api/profile/svg] Error fetching SVG:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
