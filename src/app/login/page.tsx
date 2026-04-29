"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf, User, Shield } from "lucide-react";

type UserRole = "viewer" | "admin";

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

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!selectedRole) {
      setError("Please select a login type");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (!data.user) {
        setError("Login failed: user data was not returned");
        return;
      }

      const userRole = data.user.role;

      if (selectedRole === "admin" && userRole !== "admin") {
        setError("This account does not have administration access");
        return;
      }

      if (selectedRole === "viewer" && userRole === "admin") {
        setError("Please use Administration login for this account");
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("username", data.user.name || data.user.email);

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("[LOGIN_ERROR]", error);
      setError("Unable to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl text-gray-900 mb-2">YOLO Farm</h1>
          <p className="text-gray-600">Smart Plant Monitoring System</p>
        </div>

        {!selectedRole ? (
          /* Role Selection */
          <Card className="p-8">
            <h2 className="text-xl text-gray-900 mb-2 text-center">
              Select Login Type
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Choose your account type to continue
            </p>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleRoleSelect("viewer")}
                className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg text-gray-900 font-medium">User</h3>
                    <p className="text-sm text-gray-600">
                      View dashboard and monitor plants
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("admin")}
                className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg text-gray-900 font-medium">
                      Administration
                    </h3>
                    <p className="text-sm text-gray-600">
                      Full system access and control
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </Card>
        ) : (
          /* Login Form */
          <Card className="p-8">
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to role selection
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedRole === "viewer" ? "bg-blue-100" : "bg-purple-100"
                }`}
              >
                {selectedRole === "viewer" ? (
                  <User className="w-6 h-6 text-blue-600" />
                ) : (
                  <Shield className="w-6 h-6 text-purple-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl text-gray-900">
                  {selectedRole === "viewer" ? "User" : "Administration"} Login
                </h2>
                <p className="text-sm text-gray-600">
                  Enter your credentials to continue
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
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
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}