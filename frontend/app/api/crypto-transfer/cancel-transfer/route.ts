import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret") as { userId: string };
    await dbConnect();

    const { transactionId } = await request.json();
    if (!transactionId) return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });

    const transaction = Transaction.findById(transactionId);
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    if (transaction.userId.toString() !== decoded.userId || transaction.type !== "bitcoin_transfer")
      return NextResponse.json({ error: "Unauthorized or invalid transaction" }, { status: 403 });

    const user = User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cryptoAmount = Math.abs(transaction.cryptoAmount || 0);
    user.cryptoBalance = (user.cryptoBalance || 0) + cryptoAmount;
    User.save(user);

    Transaction.deleteOne({ _id: transactionId });

    return NextResponse.json({ message: `Successfully cancelled transfer of ${cryptoAmount.toFixed(8)} BTC`, newCryptoBalance: user.cryptoBalance });
  } catch (error) {
    console.error("Cancel transfer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
