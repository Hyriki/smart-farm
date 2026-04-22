import { NextResponse, NextRequest} from "next/server";
import { verifyToken } from "./lib/utils";
import { JwtPayload } from "jsonwebtoken";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const token = request.cookies.get("token")?.value;
    console.log("Token from cookie:", token);

    // If no token, redirect to login for protected routes
    if (!token) {
        if (pathname.startsWith("/protected") || pathname.startsWith("/dashboard")) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
    }

    try {
        const payload = verifyToken(token) as JwtPayload;
        
        // Check if token is valid (not null)
        if (!payload) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        console.log("Decoded token payload:", payload);
        
        // Check role-based access
        if (pathname.startsWith("/protected") && payload.role == "viewer") {
            return NextResponse.redirect(new URL("/win", request.url));
        }

        // Valid token, allow access
        return NextResponse.next();
    } catch (err) {
        // Invalid token, redirect to login
        return NextResponse.redirect(new URL("/", request.url));
    }
}

export const config = {
    matcher: ['/protected/:path*', '/dashboard/:path*']
}