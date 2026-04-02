import { CreateUserInput } from "@/types";
import { createUserController } from "@/db/controllers/userController";
export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name || !body.email || !body.password) {
            return Response.json(
                {error: "Missing required fields"},
                { status: 400 }
            );
        }
        const user = await createUserController(body);

        return Response.json(
            {
                message: "User created successfully",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                    // createdAt: user.createdAt,
                    // updatedAt: user.updatedAt,
                }
            },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        
        if (message === "Email already exists") {
            return Response.json(
                { error: message },
                { status: 409 }
            );
        }

        return Response.json(
            { error: message },
            { status: 500 }
        );
    }
}
