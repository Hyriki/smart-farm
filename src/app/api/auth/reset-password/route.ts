import { resetPasswordController } from "@/db/controllers/userController";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json({ message: "Token and password are required" }, { status: 400 });
        }

        await resetPasswordController(token, password);

        return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
    } catch (error: any) {
        console.error("[Reset Password Error]:", error);
        if (error.message === "Invalid or expired token") {
            return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
