import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      phone: user.phone,
      accountNumber: user.accountNumber,
      balance: user.balance,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 });
  }
}
