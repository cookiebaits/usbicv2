import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
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
    const { pendingUserId } = await request.json();
    if (!pendingUserId) return NextResponse.json({ error: "Missing pendingUserId" }, { status: 400 });

    PendingUser.deleteOne({ _id: pendingUserId });
    return NextResponse.json({ message: "User rejected and removed" });
  } catch (error) {
    console.error("Reject user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
