export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/database";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    const settings = Settings.findOne();
    return NextResponse.json({ primaryColor: settings?.primaryColor || "#5f6cd3", secondaryColor: settings?.secondaryColor || "#9c65d2" });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
