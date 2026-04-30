"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

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
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("[Login Flow] Form submission triggered", { email });
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);

      console.log("[Login Flow] Before API call to /api/auth/login");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log("[Login Flow] After API response received", { status: response.status });

      const data: LoginResponse = await response.json();

      if (response.ok) {
        if (!data.user) {
          console.warn("[Login Flow] Login failed: user data was not returned", data);
          setError("Login failed: user data was not returned");
          return;
        }

        console.log("[Login Flow] Login successful, redirecting to /dashboard");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("username", data.user.name || data.user.email);

        router.push("/dashboard"); // Use push instead of replace to follow standard navigation, though replace is fine too. Using push here.
        router.refresh();
      } else {
        console.warn("[Login Flow] Login failed", data);
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("[Login Flow] Network error", err);
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
          <p className="text-sm text-slate-500 mb-6">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
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
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
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
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-600">{error}</p>
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
              <Button variant="link" className="p-0 h-auto text-emerald-600 font-medium" onClick={() => router.push('/signup')} type="button">
                Sign up
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </div>
  );
}
