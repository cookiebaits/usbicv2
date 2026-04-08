import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No token provided" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const sender = User.findById(decoded.userId);
    if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });

    const { verificationCode } = await req.json();
    if (!sender.pendingZelleTransfer)
      return NextResponse.json({ error: "No pending Zelle transfer found" }, { status: 400 });

    const createdAt = new Date(sender.pendingZelleTransfer.createdAt).getTime();
    if ((Date.now() - createdAt) > 15 * 60 * 1000) {
      sender.pendingZelleTransfer = undefined;
      User.save(sender);
      return NextResponse.json({ error: "Verification code expired" }, { status: 401 });
    }

    if (sender.pendingZelleTransfer.verificationCode !== verificationCode) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    const { recipientName, recipientType, recipientValue, amount, memo } = sender.pendingZelleTransfer;
    sender.balance -= amount;

    Transaction.create({
      userId: sender.id,
      description: memo || `Zelle transfer to ${recipientName} (${recipientValue})`,
      amount: -amount,
      type: "zelle",
      category: "Zelle External",
      accountType: "checking",
      status: "completed",
      zellePersonInfo: { recipientName, recipientType, recipientValue }
    });

    sender.pendingZelleTransfer = undefined;
    User.save(sender);
    return NextResponse.json({ message: "Zelle transfer completed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Zelle transfer verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
