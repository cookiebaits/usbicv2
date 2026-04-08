"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLogo } from "@/app/logoContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchColors } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { logoUrl } = useLogo();
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", ssn: "", streetAddress: "", city: "", state: "", zipCode: "",
    emailVerificationCode: "", username: "", password: "", confirmPassword: "", verificationMethod: "email",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => { fetchColors(); }, []);

  const usStates = [
    { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateFirstStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) newErrors.phone = "Phone number must be 10 digits";
    if (!formData.ssn.trim()) newErrors.ssn = "SSN is required";
    else { const d = formData.ssn.replace(/\D/g, ""); if (d.length !== 9) newErrors.ssn = "SSN must be 9 digits"; }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    else if (!/^\d{5}$/.test(formData.zipCode.replace(/\D/g, ""))) newErrors.zipCode = "ZIP code must be 5 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecondStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.emailVerificationCode.trim()) newErrors.emailVerificationCode = "Verification code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateThirdStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 4) newErrors.username = "Username must be at least 4 characters";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFirstStep = async () => {
    if (!validateFirstStep()) return;
    setIsLoading(true);
    try {
      const dupRes = await fetch("/api/admin/check-duplicate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, username: "" }),
      });
      if (!dupRes.ok) { setErrors({ email: "This email is already registered." }); setIsLoading(false); return; }
      const response = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName, email: formData.email, phone: formData.phone, ssn: formData.ssn,
          streetAddress: formData.streetAddress, city: formData.city, state: formData.state, zipCode: formData.zipCode,
          step: "requestCode",
        }),
      });
      const data = await response.json();
      if (!response.ok) { setErrors({ form: data.error || "Failed to send verification code" }); setIsLoading(false); return; }
      setPendingUserId(data.pendingUserId);
      setStep(2);
    } catch (error: any) {
      setErrors({ form: `An unexpected error occurred: ${error.message}` });
    } finally { setIsLoading(false); }
  };

  const handleSecondStep = async () => {
    if (!validateSecondStep()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUserId, code: formData.emailVerificationCode }),
      });
      const data = await response.json();
      if (!response.ok) { setErrors({ emailVerificationCode: data.error || "Invalid code" }); setIsLoading(false); return; }
      setStep(3);
    } catch (error: any) {
      setErrors({ form: `Verification failed: ${error.message}` });
    } finally { setIsLoading(false); }
  };

  const handleThirdStep = async () => {
    if (!validateThirdStep()) return;
    setIsLoading(true);
    try {
      const dupRes = await fetch("/api/admin/check-duplicate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", username: formData.username }),
      });
      if (!dupRes.ok) { setErrors({ username: "Username already taken." }); setIsLoading(false); return; }
      const response = await fetch("/api/complete-registration", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUserId, username: formData.username, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) { setErrors({ form: data.error || "Registration failed" }); setIsLoading(false); return; }
      router.push("/registration-success");
    } catch (error: any) {
      setErrors({ form: `An unexpected error occurred: ${error.message}` });
    } finally { setIsLoading(false); }
  };

  const handleNextStep = () => {
    if (step === 1) handleFirstStep();
    else if (step === 2) handleSecondStep();
    else if (step === 3) handleThirdStep();
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName, email: formData.email, phone: formData.phone, ssn: formData.ssn,
          streetAddress: formData.streetAddress, city: formData.city, state: formData.state, zipCode: formData.zipCode,
          step: "requestCode",
        }),
      });
      const data = await response.json();
      if (!response.ok) { setErrors({ form: data.error || "Failed to resend code" }); return; }
      alert("Verification code resent successfully");
      setPendingUserId(data.pendingUserId);
    } catch (error: any) {
      setErrors({ form: `Failed to resend: ${error.message}` });
    } finally { setIsLoading(false); }
  };

  const formatSSN = (value: string) => {
    const d = value.replace(/\D/g, "");
    let f = "";
    if (d.length > 0) f += d.substring(0, Math.min(3, d.length));
    if (d.length > 3) f += "-" + d.substring(3, Math.min(5, d.length));
    if (d.length > 5) f += "-" + d.substring(5, Math.min(9, d.length));
    return f;
  };

  const inputClass = (field: string) =>
    `mt-1.5 rounded-xl border-slate-200 focus:border-[var(--primary-400)] focus:ring-[var(--primary-200)] ${errors[field] ? 'border-rose-400' : ''}`;

  return (
    <div data-testid="register-page" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Site Logo" className="h-10 w-auto mx-auto mb-6" />
          ) : <div className="h-10 mb-6" />}
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="register-heading">Create your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--primary-600)] hover:text-[var(--primary-700)]">Sign in</Link>
          </p>
        </div>

        {errors.form && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 rounded-xl" data-testid="register-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'bg-[var(--primary-600)] text-white' : 'bg-slate-200 text-slate-500'}`} data-testid={`step-indicator-${s}`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[var(--primary-600)]' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4" data-testid="step-1-form">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</Label>
                <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="John Doe" className={inputClass('fullName')} data-testid="register-fullname" />
                {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" className={inputClass('email')} data-testid="register-email" />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</Label>
                <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="3001234567" className={inputClass('phone')} data-testid="register-phone" />
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="ssn" className="text-sm font-medium text-slate-700">SSN</Label>
                <Input id="ssn" name="ssn" required value={formData.ssn} onChange={(e) => { setFormData({ ...formData, ssn: formatSSN(e.target.value) }); if (errors.ssn) setErrors({ ...errors, ssn: "" }); }} placeholder="XXX-XX-XXXX" className={inputClass('ssn')} maxLength={11} data-testid="register-ssn" />
                {errors.ssn && <p className="text-xs text-rose-500 mt-1">{errors.ssn}</p>}
                <p className="text-xs text-slate-400 mt-1">Encrypted and stored securely</p>
              </div>
              <div>
                <Label htmlFor="streetAddress" className="text-sm font-medium text-slate-700">Street Address</Label>
                <Input id="streetAddress" name="streetAddress" required value={formData.streetAddress} onChange={handleChange} placeholder="123 Main St" className={inputClass('streetAddress')} data-testid="register-address" />
                {errors.streetAddress && <p className="text-xs text-rose-500 mt-1">{errors.streetAddress}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-slate-700">City</Label>
                  <Input id="city" name="city" required value={formData.city} onChange={handleChange} placeholder="City" className={inputClass('city')} data-testid="register-city" />
                  {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-medium text-slate-700">State</Label>
                  <Select value={formData.state} onValueChange={(v) => handleSelectChange(v, "state")}>
                    <SelectTrigger id="state" className={inputClass('state')} data-testid="register-state">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {usStates.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="zipCode" className="text-sm font-medium text-slate-700">ZIP Code</Label>
                <Input id="zipCode" name="zipCode" required value={formData.zipCode} onChange={(e) => { setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, "").substring(0, 5) }); if (errors.zipCode) setErrors({ ...errors, zipCode: "" }); }} placeholder="12345" className={inputClass('zipCode')} maxLength={5} data-testid="register-zip" />
                {errors.zipCode && <p className="text-xs text-rose-500 mt-1">{errors.zipCode}</p>}
              </div>
              <Button type="button" className="w-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white font-medium rounded-full h-11 shadow-none" onClick={handleNextStep} disabled={isLoading} data-testid="register-continue-btn">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending Code...</> : "Continue"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4" data-testid="step-2-form">
              <Alert className="bg-[var(--primary-50)] border-[var(--primary-200)] rounded-xl">
                <AlertDescription className="text-sm text-[var(--primary-700)]">A verification code has been sent to your email.</AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="emailVerificationCode" className="text-sm font-medium text-slate-700">Verification Code</Label>
                <Input id="emailVerificationCode" name="emailVerificationCode" required value={formData.emailVerificationCode} onChange={handleChange} placeholder="Enter code" className={`${inputClass('emailVerificationCode')} text-center text-lg tracking-widest font-mono-numbers`} data-testid="register-verify-code" />
                {errors.emailVerificationCode && <p className="text-xs text-rose-500 mt-1">{errors.emailVerificationCode}</p>}
              </div>
              <button type="button" className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] w-full text-center" onClick={handleResendCode} disabled={isLoading} data-testid="resend-code-btn">
                {isLoading ? "Sending..." : "Didn't receive code? Resend"}
              </button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 rounded-full border-slate-300 text-slate-700" onClick={() => setStep(1)} data-testid="register-back-btn">Back</Button>
                <Button type="button" className="flex-1 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-full shadow-none" onClick={handleNextStep} disabled={isLoading} data-testid="register-verify-btn">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4" data-testid="step-3-form">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Username</Label>
                <Input id="username" name="username" required value={formData.username} onChange={handleChange} placeholder="Choose a username" className={inputClass('username')} data-testid="register-username" />
                {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} placeholder="Create a password" className={`${inputClass('password')} pr-10`} data-testid="register-password" />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" className={`${inputClass('confirmPassword')} pr-10`} data-testid="register-confirm-password" />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>}
              </div>
              <div>
                <Label htmlFor="verificationMethod" className="text-sm font-medium text-slate-700">2FA Method</Label>
                <Select value={formData.verificationMethod} onValueChange={(v) => handleSelectChange(v, "verificationMethod")}>
                  <SelectTrigger id="verificationMethod" className={inputClass('')} data-testid="register-2fa-method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 rounded-full border-slate-300 text-slate-700" onClick={() => setStep(2)} data-testid="register-back-btn-3">Back</Button>
                <Button type="button" className="flex-1 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-full shadow-none" onClick={handleNextStep} disabled={isLoading} data-testid="register-create-btn">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Account"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 px-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms-of-services?from=register" className="text-[var(--primary-600)]">Terms</Link> and{" "}
            <Link href="/privacy-policy?from=register" className="text-[var(--primary-600)]">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
