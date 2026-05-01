"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type LoginResponse = {
  success?: boolean;
  user?: {
    id: number;
    name?: string;
    email: string;
    role: string;
  };
  error?: string;
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const signup = searchParams.get("signup");
    const reset = searchParams.get("reset");
    const errorParam = searchParams.get("error");

    // Multi-tab synchronization using BroadcastChannel
    const channel = new BroadcastChannel("auth_channel");
    channel.onmessage = (event) => {
      if (event.data.type === "VERIFIED") {
        // Try to close the window (may be blocked by browser)
        window.close();
        // Fallback: Redirect to a success page or just show verified
        setSuccess("Your email has been verified in another tab! This window can be closed.");
        localStorage.removeItem("pendingVerificationEmail");
        // If we were on the signup success state, we can also just redirect to dashboard if we had a session, 
        // but since we need to login, we'll just show success.
      }
    };

    if (verified === "true") {
      setSuccess("Your email has been successfully verified. You can now log in.");
      channel.postMessage({ type: "VERIFIED" });
    } else if (signup === "success") {
      setSuccess("Please check your email to verify your account before logging in. Don't forget to check your spam/junk folder.");
      
      // Start polling for verification status
      const pendingEmail = localStorage.getItem("pendingVerificationEmail");
      if (pendingEmail) {
        const interval = setInterval(async () => {
          try {
            const res = await fetch(`/api/auth/status?email=${encodeURIComponent(pendingEmail)}`);
            const data = await res.json();
            if (data.isVerified) {
              setSuccess("Your email has been successfully verified. You can now log in.");
              localStorage.removeItem("pendingVerificationEmail");
              clearInterval(interval);
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }, 3000); // Poll every 3 seconds

        return () => {
          clearInterval(interval);
          channel.close();
        };
      }
    } else if (reset === "success") {
      setSuccess("Your password has been reset successfully.");
    }

    if (errorParam === "invalid_token") {
      setError("The verification link is invalid or has expired.");
    } else if (errorParam === "missing_token") {
      setError("Verification token is missing.");
    }

    return () => channel.close();
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        if (!data.user) {
          setError("Login failed: user data was not returned");
          return;
        }

        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("username", data.user.name || data.user.email);

        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Server unreachable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Leaf className="w-9 h-9 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">YOLO Farm</h1>
          <p className="text-sm text-slate-500">Smart Plant Monitoring System</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link 
                  href="/forgot-password"
                  className="text-xs text-emerald-600 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div role="alert" className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-600">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
            
            <div className="text-center mt-6">
              <span className="text-sm text-slate-500">Don&apos;t have an account? </span>
              <Link href="/signup" className="text-emerald-600 font-medium hover:underline text-sm">
                Sign up
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
