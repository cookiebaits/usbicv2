export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { step, currentPassword, newPassword, verificationCode } = await req.json();

    if (step === "sendCode") {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

      if (user.twoFactorEnabled) {
        const code = crypto.randomBytes(3).toString("hex").toUpperCase();
        user.twoFactorCode = code;
        user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        User.save(user);
        await sendVerificationEmail(user.email, code);
        return NextResponse.json({ requiresVerification: true, message: "Verification code sent" });
      } else {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        User.save(user);
        return NextResponse.json({ requiresVerification: false, message: "Password changed successfully" });
      }
    } else if (step === "verifyAndChange") {
      if (!user.twoFactorCode || user.twoFactorCode !== verificationCode) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
      user.twoFactorCode = null;
      user.twoFactorCodeExpires = null;
      User.save(user);
      return NextResponse.json({ message: "Password changed successfully" });
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
