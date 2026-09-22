const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "security", "staff", "student"],
      default: "student",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: {
      type: String,
      default: null,
    },

    /*
     * OTP automatically expires after this date.
     * MongoDB TTL index will automatically remove
     * unverified accounts after expiry.
     */
    emailVerificationExpires: {
      type: Date,
      default: null,
      index: {
        expireAfterSeconds: 0,
      },
    },

    /*
     * Resend protection
     */
    emailVerificationLastSentAt: {
      type: Date,
      default: null,
    },

    emailVerificationSendCount: {
      type: Number,
      default: 0,
    },

    emailVerificationSendWindowStartedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);