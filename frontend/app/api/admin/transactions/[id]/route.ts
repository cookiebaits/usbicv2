import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
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
    const transaction = Transaction.findByIdPopulated(id);
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
    const transaction = Transaction.findById(id);
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    if (data.description !== undefined) transaction.description = data.description;
    if (data.amount !== undefined) transaction.amount = Number(data.amount);
    if (data.date !== undefined) transaction.date = data.date;
    if (data.type !== undefined) transaction.type = data.type;
    if (data.category !== undefined) transaction.category = data.category;
    if (data.accountType !== undefined) transaction.accountType = data.accountType;
    if (data.status !== undefined) transaction.status = data.status;

    Transaction.save(transaction);
    return NextResponse.json({ message: "Transaction updated", transaction });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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
    Transaction.deleteOne({ _id: id });
    return NextResponse.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
