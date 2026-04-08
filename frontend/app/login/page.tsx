"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLogo } from "@/app/logoContext";
import { useTwoFALogo } from "@/app/TwoFALogoContext";
import { fetchColors } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { logoUrl } = useLogo();
  const { twofaLogoUrl } = useTwoFALogo();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchColors();
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home");
        if (response.ok) setSettings(await response.json());
      } catch {}
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoginLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, step: "requestCode" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(response.status === 403
          ? `${data.error} If you believe this is an error, please contact support.`
          : data.error || "An error occurred during login.");
        setIsLoginLoading(false);
        return;
      }
      if (data.requiresTwoFactor) {
        setShowTwoFactor(true);
      } else {
        localStorage.setItem("token", data.token);
        window.location.href = data.redirect;
      }
      setIsLoginLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again later.");
      setIsLoginLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsTwoFactorLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, twoFactorCode, step: "verifyCode" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Invalid verification code.");
        setIsTwoFactorLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      window.location.href = data.redirect;
    } catch {
      setError("Invalid verification code or an unexpected error occurred.");
      setIsTwoFactorLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          {showTwoFactor && twofaLogoUrl ? (
            <img src={twofaLogoUrl} alt="2FA Logo" className="mx-auto h-[80px] mb-6" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="Site Logo" className="mx-auto h-10 w-auto mb-6" />
          ) : (
            <div className="h-10 mb-6" />
          )}
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="login-heading">
            {showTwoFactor ? "Verify your identity" : "Welcome back"}
          </h2>
          {!showTwoFactor && (
            <p className="mt-2 text-sm text-slate-500">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)]">
                Sign up
              </Link>
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-800 rounded-xl" data-testid="login-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.includes("contact support") ? (
                <>{error.split(" If")[0]}. <Link href="/contact" className="font-medium underline">Contact Support</Link></>
              ) : error}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          {!showTwoFactor ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="mt-1.5 rounded-xl border-slate-200 focus:border-[var(--primary-400)] focus:ring-[var(--primary-200)]"
                  data-testid="login-username-input"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <Link href="/forgot-password" className="text-xs font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)]">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1.5 rounded-xl border-slate-200 focus:border-[var(--primary-400)] focus:ring-[var(--primary-200)]"
                  data-testid="login-password-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-full h-11 shadow-none"
                disabled={isLoginLoading}
                data-testid="login-submit-btn"
              >
                {isLoginLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                ) : "Sign in"}
              </Button>
              <p className="text-center text-xs text-slate-400">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleTwoFactorSubmit}>
              <div>
                <Label htmlFor="twoFactorCode" className="text-sm font-medium text-slate-700">Verification Code</Label>
                <p className="text-sm text-slate-500 mb-3">We've sent a code to your email. Enter it below.</p>
                <Input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="000000"
                  className="mt-1.5 text-center text-lg tracking-[0.3em] rounded-xl border-slate-200 focus:border-[var(--primary-400)] focus:ring-[var(--primary-200)] font-mono-numbers"
                  maxLength={6}
                  data-testid="2fa-code-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-full h-11 shadow-none"
                disabled={isTwoFactorLoading}
                data-testid="2fa-submit-btn"
              >
                {isTwoFactorLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                ) : "Verify"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-900 rounded-full"
                onClick={() => setShowTwoFactor(false)}
                data-testid="2fa-back-btn"
              >
                Back to login
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
