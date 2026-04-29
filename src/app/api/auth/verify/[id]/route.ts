import { verifyUserEmail } from "@/db/models/userModel";
import { ResponseUser } from "@/types";

export async function PUT(
    request: any,
    { params }: { params: Promise<{ id: string }> | { id: string } }
):  Promise<Response> {
    
    const resolvedParams = params instanceof Promise ? await params : params
    const { id: idString } = resolvedParams
    const id = parseInt(idString, 10)
    
    if (!id) {
        return Response.json(
            { error: "Missing user ID" },
            { status: 400 }
        );
    }
    try {
        const user = await verifyUserEmail(id);
        return Response.json(
            {
                success: true,
                user
            },
            { status: 200 }
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        if (message.includes("User not found")) {
            return Response.json(
                { error: message },
                { status: 404 }
            );
        }
        return Response.json(
            { error: message },
            { status: 500 }
        );
    }

}