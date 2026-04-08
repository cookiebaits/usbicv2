import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import PendingUser from "@/models/pendingUser";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { sendApprovalEmail } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { pendingUserId } = await request.json();
    if (!pendingUserId) return NextResponse.json({ error: "Missing pendingUserId" }, { status: 400 });

    const pendingUser = PendingUser.findById(pendingUserId);
    if (!pendingUser) return NextResponse.json({ error: "Pending user not found" }, { status: 404 });

    if (!pendingUser.username || !pendingUser.password)
      return NextResponse.json({ error: "User hasn't completed registration yet" }, { status: 400 });

    const existingUser = User.findOne({ $or: [{ email: pendingUser.email }, { username: pendingUser.username }] });
    if (existingUser) {
      PendingUser.deleteOne({ _id: pendingUserId });
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const accountNumber = "****" + Math.floor(1000 + Math.random() * 9000);
    const savingsNumber = "****" + Math.floor(1000 + Math.random() * 9000);
    const cryptoNumber = "****" + Math.floor(1000 + Math.random() * 9000);

    User.create({
      fullName: pendingUser.fullName, email: pendingUser.email, phone: pendingUser.phone,
      ssn: pendingUser.ssn, streetAddress: pendingUser.streetAddress, city: pendingUser.city,
      state: pendingUser.state, zipCode: pendingUser.zipCode, username: pendingUser.username,
      password: pendingUser.password, accountNumber, savingsNumber, cryptoNumber,
      isVerified: true, isApproved: true, twoFactorEnabled: pendingUser.twoFactorEnabled !== false,
    });

    PendingUser.deleteOne({ _id: pendingUserId });

    try { await sendApprovalEmail(pendingUser.email, pendingUser.fullName); } catch (e) { console.error("Email error:", e); }

    return NextResponse.json({ message: "User approved successfully" });
  } catch (error) {
    console.error("Approve user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
