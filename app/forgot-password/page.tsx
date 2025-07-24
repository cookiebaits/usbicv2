"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLogo } from "@/app/logoContext"
import { fetchColors } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const { logoUrl } = useLogo()
  const [username, setUsername] = useState("")
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResetSubmitting, setIsResetSubmitting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("request")

  useEffect(() => {
    fetchColors()
  }, [])

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsRequestSubmitting(true)

    if (!username) {
      setError("Please enter your username")
      setIsRequestSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, step: "requestCode" }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(data.message || "Verification code sent to your registered email")
        setRequestSuccess(true)
        setActiveTab("reset")
      } else {
        setError(data.error || "An error occurred. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsRequestSubmitting(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsResetSubmitting(true)

    if (!verificationCode) {
      setError("Please enter the verification code")
      setIsResetSubmitting(false)
      return
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password")
      setIsResetSubmitting(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsResetSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          step: "verifyCode",
          verificationCode,
          newPassword,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setResetSuccess(true)
        setMessage(data.message || "Password reset successfully")
      } else {
        setError(data.error || "An error occurred. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsResetSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur opacity-25"></div>
              {logoUrl ? (
                <img src={logoUrl} alt="Site Logo" className="relative h-12 w-auto" />
              ) : (
                <div className="h-12"></div>
              )}
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-primary-600">
            Enter your username to receive a password reset code
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl blur-sm opacity-30"></div>
          <div className="relative bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="request" disabled={resetSuccess}>
                  Request Reset
                </TabsTrigger>
                <TabsTrigger value="reset" disabled={!requestSuccess || resetSuccess}>
                  Reset Password
                </TabsTrigger>
              </TabsList>

              <TabsContent value="request">
                <form onSubmit={handleRequestSubmit}>
                  <div className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {message && activeTab === "request" && (
                      <Alert>
                        <Check className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-primary-700">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          className="pl-10 bg-white border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={isRequestSubmitting || requestSuccess}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col space-y-2">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                      disabled={isRequestSubmitting || requestSuccess}
                    >
                      {isRequestSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : requestSuccess ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Code Sent
                        </>
                      ) : (
                        "Send Reset Code"
                      )}
                    </Button>

                    <Button variant="ghost" className="w-full text-primary-600 hover:text-primary-500">
                      <Link href="/login" className="flex items-center justify-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Link>
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="reset">
                <form onSubmit={handleResetSubmit}>
                  <div className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {resetSuccess && (
                      <Alert>
                        <Check className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="verificationCode" className="text-primary-700">Verification Code</Label>
                      <Input
                        id="verificationCode"
                        placeholder="Enter verification code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={isResetSubmitting || resetSuccess}
                        className="bg-white border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                      <p className="text-xs text-primary-600">Check your registered email for the code sent for {username}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-primary-700">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isResetSubmitting || resetSuccess}
                        className="bg-white border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-primary-700">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isResetSubmitting || resetSuccess}
                        className="bg-white border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col space-y-2">
                    {resetSuccess ? (
                      <Button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium shadow-md hover:shadow-lg transition-all">
                        <Link href="/login">Return to Login</Link>
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                          disabled={isResetSubmitting}
                        >
                          {isResetSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            "Reset Password"
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-primary-300 text-primary-600 hover:bg-primary-50"
                          onClick={() => setActiveTab("request")}
                          disabled={isResetSubmitting}
                        >
                          Back to Request
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-primary-600">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}