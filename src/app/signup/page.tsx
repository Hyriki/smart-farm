"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { validateFullName, validateEmail, validatePassword } from '@/lib/validation';
import { apiClient } from '@/lib/apiClient';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import Link from "next/link";

interface FormErrors {
  fullName?: string | null;
  email?: string | null;
  password?: string | null;
  server?: string | null;
}

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedFullName = useDebounce(fullName, 300);
  const debouncedEmail = useDebounce(email, 300);
  const debouncedPassword = useDebounce(password, 300);

  const validate = useCallback(() => {
    const newErrors: FormErrors = {};
    
    if (touched.fullName) newErrors.fullName = validateFullName(debouncedFullName);
    if (touched.email) newErrors.email = validateEmail(debouncedEmail);
    if (touched.password) newErrors.password = validatePassword(debouncedPassword);
    
    setErrors(prev => ({ ...prev, ...newErrors, server: null }));
  }, [debouncedFullName, debouncedEmail, debouncedPassword, touched]);

  useEffect(() => {
    validate();
  }, [validate]);

  const isFormValid = !validateFullName(fullName) && !validateEmail(email) && !validatePassword(password);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true });
    
    if (!isFormValid) return;

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, server: null }));

    try {
      await apiClient('/api/signup', {
        data: { fullName, email, password }
      });
      localStorage.setItem("pendingVerificationEmail", email);
      router.push('/login?signup=success');
    } catch (error: any) {
      setErrors(prev => ({ ...prev, server: error.message }));
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create an Account</h1>
          <p className="text-sm text-slate-500">Join YOLO Farm to monitor your plants</p>
        </div>

        <Card className="p-8 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} noValidate aria-label="Sign Up Form" className="space-y-5">
            
            {errors.server && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
                <p className="text-sm text-red-600">{errors.server}</p>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="e.g. John Doe"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                disabled={isSubmitting}
                className={errors.fullName ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.fullName && <span id="fullName-error" className="block text-xs text-red-600 mt-1" role="alert">{errors.fullName}</span>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="e.g. name@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                disabled={isSubmitting}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.email && <span id="email-error" className="block text-xs text-red-600 mt-1" role="alert">{errors.email}</span>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                disabled={isSubmitting}
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.password && <span id="password-error" className="block text-xs text-red-600 mt-1" role="alert">{errors.password}</span>}
            </div>

            <Button 
              type="submit" 
              disabled={!isFormValid || isSubmitting}
              aria-busy={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing up...' : 'Sign Up'}
            </Button>
            
            <div className="text-center mt-4">
              <span className="text-sm text-slate-500">Already have an account? </span>
              <Link href="/login" className="text-emerald-600 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
