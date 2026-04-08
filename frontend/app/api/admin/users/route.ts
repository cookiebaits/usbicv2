import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const users = User.find();
    
    const usersWithAccount = users.map((user) => ({
      id: user.id,
      name: user.fullName,
      username: user.username,
      email: user.email,
      accountNumber: user.accountNumber || "N/A",
      balance: user.balance || 0,
      status: user.status || "active",
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin || "N/A",
    }));

    return NextResponse.json({ users: usersWithAccount }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}
