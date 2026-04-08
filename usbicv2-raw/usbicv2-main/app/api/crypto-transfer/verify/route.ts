import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
    await dbConnect();

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { verificationCode } = await req.json();
        if (!user.pendingCryptoTransfer) {
            return NextResponse.json({ error: "No pending crypto transfer found" }, { status: 400 });
        }

        const timeElapsed = new Date().getTime() - user.pendingCryptoTransfer.createdAt.getTime();
        if (timeElapsed > 15 * 60 * 1000) {
            user.pendingCryptoTransfer = undefined;
            await user.save();
            return NextResponse.json({ error: "Verification code expired" }, { status: 401 });
        }

        if (user.pendingCryptoTransfer.verificationCode !== verificationCode) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
        }

        const { amount, recipientWallet, memo, btcPrice } = user.pendingCryptoTransfer;

        if ((user.cryptoBalance || 0) < amount) {
            return NextResponse.json({ error: "Insufficient Bitcoin balance" }, { status: 400 });
        }

        user.cryptoBalance -= amount;

        const transaction = await Transaction.create({
            userId: user._id,
            description: `Bitcoin Sent to ${recipientWallet}`,
            amount: 0,
            type: "bitcoin_transfer",
            category: "Crypto Transfer",
            accountType: "crypto",
            status: "completed",
            cryptoAmount: -amount,
            cryptoPrice: btcPrice,
            recipientWallet,
            memo: memo || "",
        });

        user.pendingCryptoTransfer = undefined;
        await user.save();

        return NextResponse.json({
            message: `Successfully sent ${amount.toFixed(8)} BTC to ${recipientWallet}`,
            newCryptoBalance: user.cryptoBalance,
            transactionId: transaction._id.toString(),
            amount,
            recipientWallet,
            memo,
        });
    } catch (error) {
        console.error("Crypto transfer verify error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}