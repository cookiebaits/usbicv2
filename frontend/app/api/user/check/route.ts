import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    return NextResponse.json({ exists: true, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch {
    return NextResponse.json({ exists: false }, { status: 401 });
  }
}
