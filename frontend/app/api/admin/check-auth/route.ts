import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ isAuthenticated: false }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({ isAuthenticated: true, admin: { id: decoded.adminId, username: decoded.username } });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}
