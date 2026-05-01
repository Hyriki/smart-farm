import { verifyUserTokenController } from "@/db/controllers/userController";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
    }

    try {
        await verifyUserTokenController(token);
        // Successful verification, redirect to login with success param
        return NextResponse.redirect(new URL("/login?verified=true", request.url));
    } catch (error) {
        console.error("[Verification Error]:", error);
        return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }
}
