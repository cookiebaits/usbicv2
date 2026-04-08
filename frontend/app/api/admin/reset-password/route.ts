export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Admin from "@/models/Admin";
import RecoveryCode from "@/models/RecoveryCode";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    const admin = Admin.findOne({ email });
    if (!admin) return NextResponse.json({ error: "Invalid recovery attempt" }, { status: 400 });

    const recoveryCode = RecoveryCode.findOne({ adminId: admin.id, code });
    if (!recoveryCode) return NextResponse.json({ error: "Invalid or expired recovery code" }, { status: 400 });

    if (new Date(recoveryCode.expiresAt) < new Date()) {
      RecoveryCode.deleteOne({ _id: recoveryCode.id });
      return NextResponse.json({ error: "Recovery code has expired" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(12);
    admin.password = await bcrypt.hash(newPassword, salt);
    Admin.save(admin);

    RecoveryCode.deleteMany({ adminId: admin.id });
    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
