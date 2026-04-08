export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    const settings = Settings.findOne();
    return NextResponse.json({ privacyPolicy: settings?.privacyPolicy || "Privacy policy not available." });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
