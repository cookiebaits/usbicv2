import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import PendingUser from "@/models/pendingUser";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const pendingUsers = PendingUser.find({
      isVerified: true,
      username: { $ne: "" },
      password: { $ne: "" },
    });

    return NextResponse.json({ pendingUsers });
  } catch (error) {
    console.error("Pending users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
