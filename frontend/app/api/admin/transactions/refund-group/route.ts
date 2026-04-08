export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const { transactionIds } = await req.json();
    if (!transactionIds?.length) return NextResponse.json({ error: "No transactions provided" }, { status: 400 });

    const transactions = Transaction.findPopulatedByIds(transactionIds);
    
    for (const transaction of transactions) {
      const userId = typeof transaction.userId === 'object' ? (transaction.userId as any)._id || (transaction.userId as any).id : transaction.userId;
      const user = User.findById(userId);
      if (!user) continue;

      const refundAmount = Math.abs(transaction.amount);
      if (transaction.accountType === "checking") user.balance += refundAmount;
      else if (transaction.accountType === "savings") user.savingsBalance += refundAmount;
      else if (transaction.accountType === "crypto" && transaction.cryptoAmount) {
        user.cryptoBalance += Math.abs(transaction.cryptoAmount);
      }
      User.save(user);
    }

    Transaction.deleteMany({ _id: { $in: transactionIds } });
    return NextResponse.json({ message: "Transactions refunded successfully" });
  } catch (error) {
    console.error("Group refund error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
