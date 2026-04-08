import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import PendingUser from "@/models/pendingUser";
import jwt from "jsonwebtoken";

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
    const { email, username } = await request.json();

    const existingUser = User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return NextResponse.json({ isDuplicate: true, field: existingUser.email === email ? "email" : "username" });

    const pendingUser = PendingUser.findOne({ email });
    if (pendingUser) return NextResponse.json({ isDuplicate: true, field: "email (pending)" });

    return NextResponse.json({ isDuplicate: false });
  } catch (error) {
    console.error("Check duplicate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
