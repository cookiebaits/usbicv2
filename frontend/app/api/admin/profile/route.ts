import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    const admin = Admin.findById(decoded.adminId);
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ id: admin.id, username: admin.username, email: admin.email });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    await dbConnect();
    const admin = Admin.findById(decoded.adminId);
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const { username, email, currentPassword, newPassword } = await request.json();

    if (currentPassword) {
      const isValid = await Admin.comparePassword(admin, currentPassword);
      if (!isValid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (newPassword) {
      const salt = await bcrypt.genSalt(12);
      admin.password = await bcrypt.hash(newPassword, salt);
    }

    Admin.save(admin);
    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 });
  }
}
