export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Transaction from "@/models/Transaction";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export async function GET(req: NextRequest) {
  await dbConnect();
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { searchParams } = new URL(req.url);
    const accountType = searchParams.get("accountType");

    if (!accountType || !["checking", "savings", "crypto"].includes(accountType)) {
      return NextResponse.json({ error: "Invalid or missing accountType parameter" }, { status: 400 });
    }

    const transactions = Transaction.findSorted(
      { userId: decoded.userId, accountType },
      { date: -1 },
      10
    );

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
