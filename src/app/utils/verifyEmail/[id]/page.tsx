"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`/api/auth/verify/${id}`, {
                    method: "PUT"
                })

                const result = await response.json()

                if (!response.ok) {
                    setError(result.error || "Verification failed")
                    return
                }

                // Verification successful
                setLoading(false)
                setTimeout(() => {
                    router.push("/")
                }, 2000)
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred")
                setLoading(false)
            }
        }

        verifyEmail()
    }, [id, router])

    return (
        <div className="flex justify-center items-center flex-col h-screen">
            {loading && !error && (
                <>
                    <h1 className="text-3xl font-bold mb-4">Verifying your email...</h1>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </>
            )}

            {error && (
                <>
                    <h1 className="text-3xl font-bold mb-4 text-red-600">Verification Failed</h1>
                    <p className="text-red-500">{error}</p>
                </>
            )}

            {!loading && !error && (
                <>
                    <h1 className="text-3xl font-bold mb-4 text-green-600">Email Verified!</h1>
                    <p>Redirecting to dashboard...</p>
                </>
            )}
        </div>
    )
}