const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../User");
const { sendVerificationEmail } = require("../services/emailService");

const router = express.Router();

const PRIVILEGED_ROLES = ["admin", "security", "staff"];

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_RESENDS_PER_DAY = 5;

/* =========================================================
   HELPERS
   ========================================================= */

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOtpExpiry = () => {
  return new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
};

const cleanupExpiredUnverifiedUsers = async () => {
  try {
    await User.deleteMany({
      emailVerified: false,
      emailVerificationExpires: {
        $ne: null,
        $lte: new Date(),
      },
    });
  } catch (error) {
    console.error(
      "Expired verification cleanup failed:",
      error.message
    );
  }
};

/* =========================================================
   REGISTER
   ========================================================= */

router.post("/register", async (req, res) => {
  try {
    await cleanupExpiredUnverifiedUsers();

    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const requestedRole = role || "student";

    const allowedRoles = [
      "admin",
      "security",
      "staff",
      "student",
    ];

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected.",
      });
    }

    /*
     * IMPORTANT:
     * Public users cannot create a trusted admin account.
     * Admin role requests remain pending.
     */
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      /*
       * Already verified account
       */
      if (existingUser.emailVerified) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists. Please login.",
        });
      }

      /*
       * Existing unverified account.
       * Do NOT create another account.
       */
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered but not verified. Please use Resend Verification Code.",
        requiresEmailVerification: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationCode = generateVerificationCode();

    const verificationExpires = getOtpExpiry();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,

      role: requestedRole,

      /*
       * Student can become approved after email verification.
       * Privileged roles remain pending until admin approval.
       */
      status:
        requestedRole === "student"
          ? "pending"
          : "pending",

      emailVerified: false,

      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,

      emailVerificationLastSentAt: new Date(),
      emailVerificationSendCount: 1,
      emailVerificationSendWindowStartedAt: new Date(),
    });

    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        verificationCode
      );
    } catch (emailError) {
      /*
       * Email could not be sent.
       * Remove the newly created unverified account
       * so user can safely try registration again.
       */
      await User.deleteOne({
        _id: user._id,
      });

      console.error(
        "Verification email failed:",
        emailError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification email. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email using the verification code sent to your email address.",
      requiresEmailVerification: true,
      email: user.email,
      role: user.role,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("Registration error:", error);

    /*
     * MongoDB duplicate-key protection
     */
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

/* =========================================================
   VERIFY EMAIL
   ========================================================= */

router.post("/verify-email", async (req, res) => {
  try {
    const {
      email,
      code,
    } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Verification request not found. Please register again.",
      });
    }

    /*
     * Already verified
     */
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    /*
     * OTP expired
     */
    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires.getTime() <= Date.now()
    ) {
      await User.deleteOne({
        _id: user._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please register again.",
        expired: true,
      });
    }

    /*
     * Wrong OTP
     */
    if (
      String(user.emailVerificationCode) !==
      String(code).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    /*
     * EMAIL VERIFIED
     */

    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    user.emailVerificationLastSentAt = null;
    user.emailVerificationSendCount = 0;
    user.emailVerificationSendWindowStartedAt = null;

    /*
     * Student becomes active immediately after verification.
     *
     * Privileged roles stay pending for Admin approval.
     */
    if (user.role === "student") {
      user.status = "approved";
    } else {
      user.status = "pending";
    }

    await user.save();

    return res.json({
      success: true,
      message:
        user.role === "student"
          ? "Email verified successfully. You can now login."
          : "Email verified successfully. Your account is now pending Admin approval.",
      emailVerified: true,
      status: user.status,
      role: user.role,
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Email verification failed.",
    });
  }
});

/* =========================================================
   RESEND VERIFICATION CODE
   ========================================================= */

router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    /*
     * Do not reveal too much information about accounts.
     */
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Verification request not found. Please register again.",
      });
    }

    /*
     * Already verified
     */
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    const now = Date.now();

    /*
     * Start/reset 24-hour resend window
     */
    if (
      !user.emailVerificationSendWindowStartedAt ||
      now -
        user.emailVerificationSendWindowStartedAt.getTime() >=
        RESEND_WINDOW_MS
    ) {
      user.emailVerificationSendWindowStartedAt =
        new Date();

      user.emailVerificationSendCount = 0;
    }

    /*
     * Daily resend limit
     */
    if (
      user.emailVerificationSendCount >=
      MAX_RESENDS_PER_DAY
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Too many verification code requests. Please try again after 24 hours.",
        retryAfterHours: 24,
      });
    }

    /*
     * 60-second cooldown
     */
    if (user.emailVerificationLastSentAt) {
      const elapsed =
        now -
        user.emailVerificationLastSentAt.getTime();

      if (elapsed < RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (RESEND_COOLDOWN_MS - elapsed) / 1000
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another code.`,
          retryAfterSeconds: remainingSeconds,
        });
      }
    }

    /*
     * Generate new OTP
     */
    const verificationCode =
      generateVerificationCode();

    user.emailVerificationCode =
      verificationCode;

    user.emailVerificationExpires =
      getOtpExpiry();

    user.emailVerificationLastSentAt =
      new Date();

    user.emailVerificationSendCount += 1;

    await user.save();

    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        verificationCode
      );
    } catch (emailError) {
      console.error(
        "Resend email failed:",
        emailError.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification email. Please try again later.",
      });
    }

    return res.json({
      success: true,
      message:
        "A new verification code has been sent to your email.",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      resendAvailableAfterSeconds: 60,
    });
  } catch (error) {
    console.error(
      "Resend verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to resend verification code.",
    });
  }
});

/* =========================================================
   LOGIN
   ========================================================= */

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
      role,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /*
     * Email verification required
     */
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in.",
        requiresEmailVerification: true,
      });
    }

    /*
     * Password check
     */
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    /*
     * Requested role must match actual role
     */
    if (role && role !== user.role) {
      return res.status(403).json({
        success: false,
        message:
          "Selected login role does not match your account role.",
      });
    }

    /*
     * Privileged users must be approved by Admin
     */
    if (
      PRIVILEGED_ROLES.includes(user.role) &&
      user.status !== "approved"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is waiting for Admin approval.",
        pendingApproval: true,
      });
    }

    /*
     * JWT
     */
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

/* =========================================================
   GET CURRENT USER
   ========================================================= */

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select(
      "-password -emailVerificationCode"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
});

/* =========================================================
   GET ALL USERS
   ========================================================= */

router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-password -emailVerificationCode -emailVerificationExpires"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
});

/* =========================================================
   GET PENDING PRIVILEGED USERS
   ========================================================= */

router.get("/users/pending", async (req, res) => {
  try {
    const users = await User.find({
      status: "pending",
      emailVerified: true,
      role: {
        $in: PRIVILEGED_ROLES,
      },
    })
      .select(
        "-password -emailVerificationCode -emailVerificationExpires"
      )
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get pending users error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch pending users.",
    });
  }
});

module.exports = router;