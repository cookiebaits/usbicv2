export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Admin from "@/models/Admin";
import RecoveryCode from "@/models/RecoveryCode";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const admin = Admin.findOne({ email });
    if (!admin) return NextResponse.json({ message: "If an account exists, a recovery code has been sent" });

    RecoveryCode.deleteMany({ adminId: admin.id });

    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    RecoveryCode.create({
      adminId: admin.id,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    const { sendVerificationEmail } = await import("@/lib/email"); await sendVerificationEmail(email, code);
    return NextResponse.json({ message: "If an account exists, a recovery code has been sent" });
  } catch (error) {
    console.error("Admin forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
