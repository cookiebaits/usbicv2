import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { getIPInfo } from "@/lib/ipInfo";
import IPLog from "@/models/IPLog";

const getClientIp = (req: NextRequest): string => {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const ips = forwardedFor.split(",").map(ip => ip.trim());
        return ips[0];
    }
    const realIp = req.headers.get("x-real-ip");
    return realIp || "Unknown";
};

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const {
            fullName,
            email,
            phone,
            ssn,
            streetAddress,
            city,
            state,
            zipCode,
            step,
        } = await req.json();

        if (!step || !["requestCode", "verifyCode"].includes(step)) {
            return NextResponse.json({ error: "Invalid or missing step parameter" }, { status: 400 });
        }

        if (step === "requestCode") {
            if (!fullName || !email || !phone || !ssn || !streetAddress || !city || !state || !zipCode) {
                return NextResponse.json({ error: "All fields are required" }, { status: 400 });
            }

            const ip = process.env.NODE_ENV === "development" ? "8.8.8.8" : getClientIp(req);
            const userAgent = req.headers.get("user-agent") || "";
            const { country, isVpn } = await getIPInfo(ip);

            let pendingUser = await PendingUser.findOne({ email });

            if (pendingUser) {
                if (pendingUser.isVerified) {
                    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
                }
                const newCode = crypto.randomBytes(3).toString("hex").toUpperCase();
                pendingUser.verificationCode = newCode;
                await pendingUser.save();
                await sendVerificationEmail(email, newCode);
            } else {
                const verificationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
                pendingUser = new PendingUser({
                    fullName,
                    email,
                    phone,
                    ssn,
                    streetAddress,
                    city,
                    state,
                    zipCode,
                    verificationCode,
                    isVerified: false,
                    adminVerified: false,
                    username: "",
                    password: "",
                });
                await pendingUser.save();
                await sendVerificationEmail(email, verificationCode);
            }

            // if (country !== "US" || (country === "US" && isVpn)) {
                const logData = {
                    ip,
                    location: country,
                    date: new Date(),
                    vpnProxy: isVpn,
                    type: 'registration',
                    userId: pendingUser._id,
                    userAgent,
                };
                const log = new IPLog(logData);
                await log.save();
            // }

            return NextResponse.json({
                message: pendingUser.isVerified ? "Verification code resent" : "Verification code sent to your email",
                pendingUserId: pendingUser._id.toString(),
            }, { status: 200 });
        } else if (step === "verifyCode") {
            return NextResponse.json({ error: "Verification step not implemented in this route" }, { status: 501 });
        }
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred during registration" },
            { status: 500 }
        );
    }
}