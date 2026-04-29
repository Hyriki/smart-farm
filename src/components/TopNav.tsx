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

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <header className="bg-white border-b border-slate-200 h-16 fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-bold text-slate-900">YOLO Farm</span>
            <p className="text-xs text-slate-400 capitalize">{userRole} dashboard</p>
          </div>
        </div>

        {/* Nav link — desktop only */}
        <nav aria-label="Main navigation" className="hidden md:flex">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Dashboard
          </button>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Clock — hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <div className="text-xs leading-tight">
              <p className="font-semibold text-slate-700 tabular-nums">
                {formatTime(currentTime)}
              </p>
              <p className="text-slate-400">{formatDate(currentTime)}</p>
            </div>
          </div>

          {/* Bell */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
            />
          </button>

          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {username}
            </span>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
