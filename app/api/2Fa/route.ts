// app/api/2Fa/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function PUT(req: NextRequest) {
  await dbConnect();

  try {
    const { userId, enabled, step, verificationCode } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- Disabling 2FA: Step 1 - Request code ---
    if (enabled === false && step === "requestCode") {
      const code = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = code;
      await user.save();

      await sendVerificationEmail(user.email, code);

      return NextResponse.json({ message: "Verification code sent to your email" }, { status: 200 });
    }

    // --- Disabling 2FA: Step 2 - Verify code ---
    if (enabled === false && step === "verifyCode") {
      if (!verificationCode) {
        return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
      }
      if (user.twoFactorCode !== verificationCode) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }

      user.twoFactorEnabled = false;
      user.twoFactorCode = undefined;
      await user.save();

      return NextResponse.json({ message: "2FA disabled successfully" }, { status: 200 });
    }

    // --- Enabling 2FA (no verification needed) ---
    if (enabled === true) {
      user.twoFactorEnabled = true;
      await user.save();

      return NextResponse.json({ message: "2FA enabled successfully" }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  } catch (error) {
    console.error("Error updating 2FA setting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}