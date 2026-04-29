"use client";

import { Leaf, Bell, User, Clock, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function TopNav() {
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [username, setUsername] = useState("User");
  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "User";
    const storedUserRole = localStorage.getItem("userRole") || "user";

    setUsername(storedUsername);
    setUserRole(storedUserRole);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("token");

    router.replace("/login");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 h-16 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>

          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              YOLO Farm
            </span>
            <p className="text-xs text-gray-500 capitalize">
              {userRole} Dashboard
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-green-600 font-medium"
          >
            Dashboard
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-white/60 backdrop-blur-md rounded-xl border border-white/20">
            <Clock className="w-4 h-4 text-gray-600" />
            <div className="text-sm">
              <div className="text-gray-900 font-medium">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center space-x-2 px-3 py-2 bg-white/60 backdrop-blur-md rounded-xl border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {username}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}