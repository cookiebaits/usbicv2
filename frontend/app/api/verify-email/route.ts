export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import PendingUser from "@/models/pendingUser";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, verificationCode } = await req.json();

    if (!email || !verificationCode)
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });

    const pendingUser = PendingUser.findOne({ email });
    if (!pendingUser) return NextResponse.json({ error: "No pending registration found" }, { status: 404 });

    if (pendingUser.verificationCode !== verificationCode)
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });

    pendingUser.isVerified = true;
    PendingUser.save(pendingUser);

    return NextResponse.json({ message: "Email verified successfully", pendingUserId: pendingUser.id });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
