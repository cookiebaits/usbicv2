import mongoose from "mongoose";

const ipLogSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: Date, default: Date.now },
    vpnProxy: { type: Boolean, default: false },
    type: { type: String, enum: ["registration", "visit"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userAgent: { type: String, default: "" },
});

export default mongoose.models.IPLog || mongoose.model("IPLog", ipLogSchema);