import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { id } = await params;
    const transaction = Transaction.findById(id);
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const userId = typeof transaction.userId === 'object' ? (transaction.userId as any)._id : transaction.userId;
    const user = User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const refundAmount = Math.abs(transaction.amount);
    if (transaction.accountType === "checking") user.balance += refundAmount;
    else if (transaction.accountType === "savings") user.savingsBalance += refundAmount;
    else if (transaction.accountType === "crypto" && transaction.cryptoAmount) {
      user.cryptoBalance += Math.abs(transaction.cryptoAmount);
    }

    User.save(user);
    Transaction.deleteOne({ _id: id });

    return NextResponse.json({ message: "Transaction refunded successfully" });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
