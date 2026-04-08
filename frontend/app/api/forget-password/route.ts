export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, step, verificationCode, newPassword } = await req.json();

    if (step === "sendCode") {
      const user = User.findOne({ email });
      if (!user) return NextResponse.json({ message: "If an account exists, a code has been sent" });

      const code = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = code;
      user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      User.save(user);

      const { sendVerificationEmail } = await import("@/lib/email"); await sendVerificationEmail(email, code);
      return NextResponse.json({ message: "If an account exists, a code has been sent" });
    } else if (step === "verifyAndReset") {
      const user = User.findOne({ email });
      if (!user) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

      if (!user.twoFactorCode || user.twoFactorCode !== verificationCode) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      user.twoFactorCode = null;
      user.twoFactorCodeExpires = null;
      User.save(user);

      return NextResponse.json({ message: "Password reset successfully" });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
