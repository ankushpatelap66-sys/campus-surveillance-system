const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    /* =====================================================
       BASIC USER INFORMATION
    ===================================================== */

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

    /* =====================================================
       USER ROLE
    ===================================================== */

    role: {
      type: String,
      enum: ["admin", "security", "staff", "student"],
      default: "student",
    },

    /* =====================================================
       ACCOUNT STATUS
       
       pending  = waiting for approval
       approved = can login
       rejected = rejected by Admin
    ===================================================== */

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    /* =====================================================
       EMAIL VERIFICATION
    ===================================================== */

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    /* =====================================================
       OTP RESEND CONTROL
       
       These fields are used for:
       - 60 second resend cooldown
       - maximum 5 resends per 24 hours
       - tracking the current resend window
    ===================================================== */

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