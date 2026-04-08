import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
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
    const { userIds } = await request.json();
    if (!userIds?.length) return NextResponse.json({ error: "No users provided" }, { status: 400 });

    User.updateMany({ _id: { $in: userIds } }, { isApproved: true, status: 'active' });
    return NextResponse.json({ message: `${userIds.length} users approved` });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
