export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import PendingUser from "@/models/pendingUser";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { pendingUserId, username, password } = await req.json();

    if (!pendingUserId || !username || !password)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const pendingUser = PendingUser.findById(pendingUserId);
    if (!pendingUser) return NextResponse.json({ error: "Pending user not found" }, { status: 404 });
    if (!pendingUser.isVerified) return NextResponse.json({ error: "Email not verified yet" }, { status: 400 });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    pendingUser.username = username;
    pendingUser.password = hashedPassword;
    PendingUser.save(pendingUser);

    return NextResponse.json({ message: "Registration completed. Awaiting admin approval." });
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
