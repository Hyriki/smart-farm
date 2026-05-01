"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Leaf className="w-9 h-9 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot Password</h1>
          <p className="text-sm text-slate-500">We'll send you a link to reset your password</p>
        </div>

        <Card className="p-8 border border-slate-200 shadow-sm">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-slate-500 font-medium text-sm flex items-center justify-center gap-1 mx-auto" 
                  onClick={() => router.push('/login')} 
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">{success}</p>
              </div>
              <p className="text-xs text-slate-500">
                Wait a few minutes and check your spam folder if you don't see it.
              </p>
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Return to Login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
