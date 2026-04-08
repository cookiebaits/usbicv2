export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", {
      headers: { "x-cg-demo-api-key": process.env.CRYPTO_KEY || "" },
      next: { revalidate: 30 },
    });
    const data = await response.json();
    return NextResponse.json({ price: data.bitcoin?.usd || 0 });
  } catch (error) {
    return NextResponse.json({ price: 0, error: "Failed to fetch price" }, { status: 500 });
  }
}
