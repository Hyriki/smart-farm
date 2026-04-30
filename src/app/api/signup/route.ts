import { NextResponse } from "next/server";
import { createUserController, verifyEmail } from "@/db/controllers/userController";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    // Basic server-side validation
    if (!fullName || !/^[a-zA-Z\s]+$/.test(fullName)) {
      return NextResponse.json({ message: "Valid full name is required (letters only)" }, { status: 400 });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ message: "Valid email is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    try {
      // 1. Create the user in the database (this hashes the password and sets isVerified to false)
      const user = await createUserController({
        name: fullName,
        email: email,
        password: password,
        role: "viewer"
      });

      // 2. Send the verification email using the existing email service
      // The userController verifyEmail function handles this.
      await verifyEmail(user.email as string);

      // 3. Return success
      return NextResponse.json(
        { 
          message: "Check your email to verify your account", 
          user: { name: user.name, email: user.email } 
        }, 
        { status: 201 }
      );
    } catch (dbError: any) {
      // Handle known errors
      if (dbError.message === "Email already exists") {
        return NextResponse.json({ message: "Email is already in use" }, { status: 400 });
      }
      
      console.error("[Signup] DB or Email Error:", dbError);
      return NextResponse.json({ message: "Server error during signup process" }, { status: 500 });
    }
  } catch (error) {
    console.error("[Signup] General error:", error);
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }
}
