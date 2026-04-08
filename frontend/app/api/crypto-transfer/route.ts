export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret") as { userId: string };
    await dbConnect();

    const { action, amount, btcPrice, recipientWallet, memo } = await request.json();
    if (!action || !amount || !btcPrice) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const user = User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const btcAmount = parseFloat(amount);

    if (action === "buy") {
      const usdAmount = btcAmount * btcPrice;
      if (user.balance < usdAmount) return NextResponse.json({ error: "Insufficient checking balance" }, { status: 400 });

      user.balance -= usdAmount;
      user.cryptoBalance = (user.cryptoBalance || 0) + btcAmount;

      const transaction = Transaction.create({
        userId: user.id, description: "Bitcoin Purchase", amount: -usdAmount, type: "crypto_buy",
        category: "Crypto", accountType: "crypto", status: "completed", cryptoAmount: btcAmount, cryptoPrice: btcPrice,
      }) as any;

      User.save(user);
      return NextResponse.json({ message: `Successfully bought ${btcAmount.toFixed(8)} BTC`, newCheckingBalance: user.balance, newCryptoBalance: user.cryptoBalance, transactionId: transaction.id });
    } else if (action === "sell") {
      if ((user.cryptoBalance || 0) < btcAmount) return NextResponse.json({ error: "Insufficient Bitcoin balance" }, { status: 400 });

      const usdAmount = btcAmount * btcPrice;
      user.balance += usdAmount;
      user.cryptoBalance -= btcAmount;

      const transaction = Transaction.create({
        userId: user.id, description: "Bitcoin Sale", amount: usdAmount, type: "crypto_sell",
        category: "Crypto", accountType: "crypto", status: "completed", cryptoAmount: -btcAmount, cryptoPrice: btcPrice,
      }) as any;

      User.save(user);
      return NextResponse.json({ message: `Successfully sold ${btcAmount.toFixed(8)} BTC`, newCheckingBalance: user.balance, newCryptoBalance: user.cryptoBalance, transactionId: transaction.id });
    } else if (action === "bitcoin_transfer") {
      if (!recipientWallet) return NextResponse.json({ error: "Recipient wallet address is required" }, { status: 400 });
      if ((user.cryptoBalance || 0) < btcAmount) return NextResponse.json({ error: "Insufficient Bitcoin balance" }, { status: 400 });

      if (user.twoFactorEnabled) {
        const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        user.pendingCryptoTransfer = { amount: btcAmount, recipientWallet, memo, verificationCode, createdAt: new Date().toISOString(), btcPrice };
        User.save(user);
        const { sendVerificationEmail } = await import("@/lib/email"); await sendVerificationEmail(user.email, verificationCode);
        return NextResponse.json({ message: "Verification code sent to your email", requiresVerification: true }, { status: 200 });
      } else {
        user.cryptoBalance -= btcAmount;
        const transaction = Transaction.create({
          userId: user.id, description: `Bitcoin Sent to ${recipientWallet}`, amount: 0, type: "bitcoin_transfer",
          category: "Crypto Transfer", accountType: "crypto", status: "completed", cryptoAmount: -btcAmount,
          cryptoPrice: btcPrice, recipientWallet, memo: memo || "",
        }) as any;
        User.save(user);
        return NextResponse.json({ message: `Successfully sent ${btcAmount.toFixed(8)} BTC to ${recipientWallet}`, newCheckingBalance: user.balance, newCryptoBalance: user.cryptoBalance, transactionId: transaction.id });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Crypto transfer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
