import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    const settings = Settings.findOne();
    return NextResponse.json({ termsOfService: settings?.termsOfService || "Terms of service not available." });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
