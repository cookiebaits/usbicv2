import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "deposit",
      "withdrawal",
      "credit",
      "debit",
      "transfer",
      "zelle",
      "payment",
      "fee",
      "interest",
      "crypto_buy",
      "crypto_sell",
      "bitcoin_transfer",
      "refund",
    ],
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  accountType: {
    type: String,
    enum: ["checking", "savings", "crypto"],
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "pending", "failed", "refunded"],
    default: "completed",
  },
  cryptoAmount: {
    type: Number,
    required: function () {
      return this.type === "crypto_buy" || this.type === "crypto_sell" || this.type === "bitcoin_transfer";
    },
  },
  cryptoPrice: {
    type: Number,
    required: function () {
      return this.type === "crypto_buy" || this.type === "crypto_sell" || this.type === "bitcoin_transfer";
    },
  },
  recipientWallet: {
    type: String,
    required: function () {
      return this.type === "bitcoin_transfer";
    },
  },
  memo: {
    type: String,
    trim: true,
  },
  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
  transferId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
  },
  zellePersonInfo: {
    type: {
      recipientName: String,
      recipientType: String,
      recipientValue: String,
    },
  }
});

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);