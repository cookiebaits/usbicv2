export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { id } = await params;
    const user = User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      name: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      ssn: user.ssn,
      fullName: user.fullName,
      streetAddress: user.streetAddress,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      accountNumber: user.accountNumber || "N/A",
      savingsNumber: user.savingsNumber || "Not Set",
      cryptoNumber: user.cryptoNumber || "Not Set",
      balance: user.balance || 0,
      savingsBalance: user.savingsBalance || 0,
      cryptoBalance: user.cryptoBalance || 0,
      status: user.status || "active",
      twoFactorEnabled: user.twoFactorEnabled || false,
      isApproved: user.isApproved,
      lastLogin: user.lastLogin || "N/A",
      createdAt: user.createdAt,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { id } = await params;
    const data = await req.json();
    const user = User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update all provided fields
    if (data.name !== undefined) user.fullName = data.name;
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.username !== undefined) user.username = data.username;
    if (data.email !== undefined) user.email = data.email;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.ssn !== undefined) user.ssn = data.ssn;
    if (data.streetAddress !== undefined) user.streetAddress = data.streetAddress;
    if (data.city !== undefined) user.city = data.city;
    if (data.state !== undefined) user.state = data.state;
    if (data.zipCode !== undefined) user.zipCode = data.zipCode;
    if (data.accountNumber !== undefined) user.accountNumber = data.accountNumber;
    if (data.savingsNumber !== undefined) user.savingsNumber = data.savingsNumber;
    if (data.cryptoNumber !== undefined) user.cryptoNumber = data.cryptoNumber;
    if (data.balance !== undefined) user.balance = data.balance;
    if (data.savingsBalance !== undefined) user.savingsBalance = data.savingsBalance;
    if (data.cryptoBalance !== undefined) user.cryptoBalance = data.cryptoBalance;
    if (data.status !== undefined) user.status = data.status;
    if (data.twoFactorEnabled !== undefined) user.twoFactorEnabled = data.twoFactorEnabled;
    if (data.isApproved !== undefined) user.isApproved = data.isApproved;

    User.save(user);
    return NextResponse.json({ message: "User updated successfully", user }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { id } = await params;
    const user = User.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    User.deleteOne({ _id: id });
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Invalid token or server error" }, { status: 500 });
  }
}
