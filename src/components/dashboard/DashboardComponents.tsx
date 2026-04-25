"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  loading?: boolean;
}

export function SensorCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color, 
  description,
  loading 
}: CardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl bg-white/10 p-6 backdrop-blur-md border border-white/20 shadow-2xl"
    >
      <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-3xl", color)} />
      
      <div className="flex items-center justify-between">
        <div className={cn("p-3 rounded-2xl bg-white/10", color.replace('bg-', 'text-'))}>
          <Icon size={24} />
        </div>
        {loading && (
          <div className="h-2 w-2 animate-ping rounded-full bg-green-400" />
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-white/60 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <h3 className="text-4xl font-bold text-white">
            {value !== null ? value : '--'}
          </h3>
          {unit && <span className="text-lg text-white/40">{unit}</span>}
        </div>
        {description && (
          <p className="mt-2 text-xs text-white/40">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

interface ControlProps {
  title: string;
  status: string;
  icon: LucideIcon;
  onToggle: () => void;
  isLoading?: boolean;
  color: string;
}

export function ActuatorControl({ 
  title, 
  status, 
  icon: Icon, 
  onToggle, 
  isLoading,
  color 
}: ControlProps) {
  const isActive = status.includes('ON') || status.includes('AUTO');
  
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white/5 p-4 border border-white/10">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-2xl transition-colors duration-500",
          isActive ? color : "bg-white/5 text-white/40"
        )}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-white/40">{status}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={isLoading}
        className={cn(
          "relative h-8 w-14 rounded-full p-1 transition-colors duration-300",
          isActive ? "bg-green-500/50" : "bg-white/10",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <motion.div
          animate={{ x: isActive ? 24 : 0 }}
          className="h-6 w-6 rounded-full bg-white shadow-lg flex items-center justify-center"
        >
          {isLoading && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          )}
        </motion.div>
      </button>
    </div>
  );
}
