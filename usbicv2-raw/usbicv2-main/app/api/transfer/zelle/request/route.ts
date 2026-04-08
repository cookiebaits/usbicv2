import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const sender = await User.findById(decoded.userId);
    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    const { recipient, amount, memo } = await req.json();
    console.log(recipient);
    if (!recipient || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { recipientName, recipientType, recipientValue } = recipient;
    if (recipientType !== "email" && recipientType !== "phone") {
      return NextResponse.json({ error: "Invalid recipient type" }, { status: 400 });
    }

    if (sender.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if (sender.twoFactorEnabled) {
      const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      sender.pendingZelleTransfer = {
        recipientName,
        recipientType,
        recipientValue,
        amount,
        memo,
        verificationCode,
        createdAt: new Date(),
      };
      await sender.save();
      await sendVerificationEmail(sender.email, verificationCode);
      return NextResponse.json(
        { message: "Verification code sent to your email", requiresVerification: true },
        { status: 200 }
      );
    } else {
      // External transfer: recipient does not exist
      sender.balance -= amount;

      await Transaction.create({
        userId: sender._id,
        description: memo || `Zelle transfer to ${recipientName} (${recipientValue})`,
        amount: -amount,
        type: "zelle",
        category: "Zelle External",
        accountType: "checking",
        status: "completed",
        zellePersonInfo: {
          recipientName,
          recipientType,
          recipientValue
        }
      });

      await sender.save();
    }
    return NextResponse.json(
      { message: "Zelle transfer completed successfully", requiresVerification: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Zelle transfer request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}