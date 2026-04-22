import { generateToken } from "@/lib/utils";
import { verifyCredentials } from "@/db/controllers/userController";
import { VerifiedEmail } from "@/types";

export async function POST(request: Request){
    const body = await request.json();
    if (!body.email || !body.password){
        return Response.json(
            {error: "Missing email or password"},
            { status: 400 }
        )
    }

    try {
        const user = await verifyCredentials(body.email, body.password);
        const token = generateToken(user.id as number, user.email as VerifiedEmail, user.role as string);
        
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = [
            `token=${token}`,
            `HttpOnly`,
            `Path=/`,
            `Max-Age=86400`,
            `SameSite=Lax`,
            ...(isProduction ? ['Secure'] : [])
        ].join('; ');
        
        return Response.json(
            {
                success: true,
                user
            },
            {
                headers: {
                    'Set-Cookie': cookieOptions
                },
                status: 200
            }
        )
        
    } catch (error) {
        const message = error instanceof Error ? error.message: "Internal server error";
        if (message.includes("User not found")){
            return Response.json(
                {error: message},
                {status: 404}
            )
        }
        return Response.json(
            {error: message},
            {status: 500}
        )
    }

}