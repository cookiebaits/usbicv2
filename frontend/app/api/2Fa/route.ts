export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import jwt from "jsonwebtoken";
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

    const { action, code } = await req.json();

    if (action === "sendCode") {
      const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = verificationCode;
      user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      User.save(user);
      await sendVerificationEmail(user.email, verificationCode);
      return NextResponse.json({ message: "Verification code sent" });
    } else if (action === "verifyAndToggle") {
      if (!user.twoFactorCode || user.twoFactorCode !== code ||
          (user.twoFactorCodeExpires && new Date(user.twoFactorCodeExpires) < new Date())) {
        return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
      }
      user.twoFactorEnabled = !user.twoFactorEnabled;
      user.twoFactorCode = null;
      user.twoFactorCodeExpires = null;
      User.save(user);
      return NextResponse.json({ message: `2FA ${user.twoFactorEnabled ? "enabled" : "disabled"}`, twoFactorEnabled: user.twoFactorEnabled });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("2FA error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
