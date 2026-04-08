import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { id } = await params;
    const { action } = await req.json();

    const user = User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (action === "enable") {
      user.twoFactorEnabled = true;
      User.save(user);
      return NextResponse.json({ message: "Two-factor authentication enabled" });
    } else if (action === "disable") {
      user.twoFactorEnabled = false;
      User.save(user);
      return NextResponse.json({ message: "Two-factor authentication disabled" });
    } else if (action === "sendCode") {
      const code = crypto.randomBytes(3).toString("hex").toUpperCase();
      user.twoFactorCode = code;
      user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      User.save(user);
      await sendVerificationEmail(user.email, code);
      return NextResponse.json({ message: "2FA code sent" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("2FA admin error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
