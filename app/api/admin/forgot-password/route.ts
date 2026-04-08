// 1. Force Next.js to evaluate this dynamically at runtime so Docker build passes
export const dynamic = 'force-dynamic';

// 2. ONLY ONE IMPORT of NextResponse at the very top
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function POST(req: Request) {
  try {
    // 3. Parse the incoming request safely
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // 4. Connect to your MongoDB database
    await dbConnect();

    // 5. Look up the admin by email
    const admin = await Admin.findOne({ email });

    // 6. SECURITY BEST PRACTICE: Prevent email enumeration
    // We return the exact same success message whether the email exists or not.
    // This stops attackers from using this endpoint to guess admin emails.
    if (!admin) {
      return NextResponse.json(
        { message: "If an account with that email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // ------------------------------------------------------------------
    // 7. YOUR FORGOT PASSWORD LOGIC GOES HERE
    // Usually, this looks something like:
    // 
    // const resetToken = generateSecureToken();
    // admin.resetPasswordToken = resetToken;
    // admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    // await admin.save();
    //
    // await sendEmail(admin.email, resetToken);
    // ------------------------------------------------------------------

    // 8. Return final success response
    return NextResponse.json(
      { message: "If an account with that email exists, a reset link has been sent." },
      { status: 200 }
    );

  } catch (error) {
    // 9. Robust error handling so your server doesn't crash on failure
    console.error("Forgot Password Error:", error);
    
    return NextResponse.json(
      { error: "An internal server error occurred while processing your request." },
      { status: 500 }
    );
  }
}
