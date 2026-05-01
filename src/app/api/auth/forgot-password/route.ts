import { forgotPasswordController } from "@/db/controllers/userController";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        await forgotPasswordController(email);

        // Always return success to prevent email enumeration
        return NextResponse.json({ message: "If an account exists with that email, a reset link has been sent." }, { status: 200 });
    } catch (error) {
        console.error("[Forgot Password Error]:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
