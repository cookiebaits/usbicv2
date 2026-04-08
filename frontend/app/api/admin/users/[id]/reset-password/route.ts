import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const user = User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    User.save(user);

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Admin password reset error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
