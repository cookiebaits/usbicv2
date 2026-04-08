import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")
      ?.split("; ")
      .find((row) => row.startsWith("adminToken="))
      ?.split("=")[1];

    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    jwt.verify(token, JWT_SECRET);

    await dbConnect();
    const data = await request.json();
    const { fullName, email, phone, ssn, streetAddress, city, state, zipCode, username, password, balance, savingsBalance, cryptoBalance, transactions, twoFactorEnabled } = data;

    if (!fullName || !email || !username || !password)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const existingUser = User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return NextResponse.json({ error: "User already exists" }, { status: 400 });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const accountNumber = String(Math.floor(100000000000 + Math.random() * 900000000000));
    const savingsNumber = String(Math.floor(100000000000 + Math.random() * 900000000000));
    const cryptoNumber = String(Math.floor(100000000000 + Math.random() * 900000000000));

    const user = User.create({
      fullName, email, phone: phone || "", ssn: ssn || "", streetAddress: streetAddress || "",
      city: city || "", state: state || "", zipCode: zipCode || "", username,
      password: hashedPassword, balance: balance || 0, savingsBalance: savingsBalance || 0,
      cryptoBalance: cryptoBalance || 0, accountNumber, savingsNumber, cryptoNumber,
      isVerified: true, isApproved: true, twoFactorEnabled: twoFactorEnabled,
    });

    if (transactions?.length) {
      for (const tx of transactions) {
        Transaction.create({
          userId: user.id,
          description: tx.description || "Transaction",
          amount: Number(tx.amount) || 0,
          date: tx.date || new Date().toISOString(),
          type: tx.type || "transfer",
          category: tx.category || "General",
          accountType: tx.accountType || "checking",
          status: tx.status || "completed",
        });
      }
    }

    return NextResponse.json({ message: "User created successfully", userId: user.id, accountNumber }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
