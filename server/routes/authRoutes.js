const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const {
  sendStudentWelcomeEmail,
  sendPendingApprovalEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendEmailVerificationCode,
  verifyEmailTransport,
} = require("../services/emailService");

const router = express.Router();

/* =========================================================
   CONFIG
========================================================= */

const PRIVILEGED_ROLES = [
  "admin",
  "security",
  "staff",
];

const ALLOWED_ROLES = [
  "admin",
  "security",
  "staff",
  "student",
];

const OTP_EXPIRY_MINUTES = 10;

const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_WINDOW_MS =
  24 * 60 * 60 * 1000;

const MAX_RESENDS_PER_DAY = 5;

/* =========================================================
   HELPERS
========================================================= */

const generateVerificationCode = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

const getOtpExpiry = () => {
  return new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES * 60 * 1000
  );
};

const cleanupExpiredUnverifiedUsers =
  async () => {
    try {
      await User.deleteMany({
        emailVerified: false,
        emailVerificationExpires: {
          $lt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        "Expired unverified user cleanup failed:",
        error.message
      );
    }
  };

/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

const authenticate = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization || "";

    if (
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User account no longer exists.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token.",
    });
  }
};

/* =========================================================
   ADMIN MIDDLEWARE
========================================================= */

const requireAdmin = async (
  req,
  res,
  next
) => {
  try {
    await authenticate(
      req,
      res,
      async () => {
        if (
          req.user.role !==
          "admin"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Admin access required.",
          });
        }

        if (
          req.user.emailVerified !==
          true
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Admin email is not verified.",
          });
        }

        if (
          req.user.status !==
          "approved"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Admin account is not approved.",
          });
        }

        next();
      }
    );
  } catch (error) {
    console.error(
      "Admin authorization error:",
      error.message
    );

    return res.status(403).json({
      success: false,
      message:
        "Admin authorization failed.",
    });
  }
};

/* =========================================================
   REGISTER
========================================================= */

router.post(
  "/register",
  async (req, res) => {
    try {
      await cleanupExpiredUnverifiedUsers();

      const {
        name,
        email,
        password,
        role = "student",
      } = req.body;

      const cleanName = String(
        name || ""
      ).trim();

      const cleanEmail = String(
        email || ""
      )
        .trim()
        .toLowerCase();

      const cleanRole = String(
        role || "student"
      )
        .trim()
        .toLowerCase();

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

      if (
        !cleanName ||
        !cleanEmail ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      if (
        !ALLOWED_ROLES.includes(
          cleanRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role selected.",
        });
      }

      /* -----------------------------------------------------
         CHECK EXISTING USER
      ----------------------------------------------------- */

      const existingUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        if (
          existingUser.emailVerified ===
          true
        ) {
          return res.status(409).json({
            success: false,
            message:
              "An account with this email already exists. Please login.",
          });
        }

        return res.status(409).json({
          success: false,
          requiresEmailVerification: true,
          message:
            "This email is already registered but not verified. Please verify your email.",
        });
      }

      /* -----------------------------------------------------
         PASSWORD HASH
      ----------------------------------------------------- */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* -----------------------------------------------------
         GENERATE OTP
      ----------------------------------------------------- */

      const verificationCode =
        generateVerificationCode();

      const verificationExpires =
        getOtpExpiry();

      /* -----------------------------------------------------
         CREATE USER
         
         PUBLIC REGISTRATION:
         
         Student:
           OTP verify -> approved

         Privileged:
           OTP verify -> pending
           Admin approval -> approved
      ----------------------------------------------------- */

      const user = new User({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: cleanRole,

        status: "pending",

        emailVerified: false,

        emailVerificationCode:
          verificationCode,

        emailVerificationExpires:
          verificationExpires,

        emailVerificationLastSentAt:
          new Date(),

        emailVerificationSendCount:
          1,

        emailVerificationSendWindowStartedAt:
          new Date(),
      });

      await user.save();

      /* -----------------------------------------------------
         SEND VERIFICATION EMAIL
         
         IMPORTANT:
         emailService.js expects:
         
         sendEmailVerificationCode(
           user,
           verificationCode
         )
      ----------------------------------------------------- */

      try {
        const emailResult =
          await sendEmailVerificationCode(
            user,
            verificationCode
          );

        if (
          !emailResult ||
          emailResult.success !== true
        ) {
          await User.findByIdAndDelete(
            user._id
          );

          throw new Error(
            emailResult?.error ||
              emailResult?.message ||
              "Verification email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "Verification email failed:",
          emailError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Registration failed because verification email could not be sent.",
        });
      }

      return res.status(201).json({
        success: true,
        requiresEmailVerification: true,
        message:
          "Registration successful. Please verify your email.",
        expiresInMinutes:
          OTP_EXPIRY_MINUTES,
      });
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Registration failed.",
      });
    }
  }
);

/* =========================================================
   VERIFY EMAIL
========================================================= */

router.post(
  "/verify-email",
  async (req, res) => {
    try {
      const cleanEmail = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      const code = String(
        req.body.code || ""
      ).trim();

      if (
        !cleanEmail ||
        !code
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and verification code are required.",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      if (
        user.emailVerified === true
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email is already verified.",
        });
      }

      /* -----------------------------------------------------
         OTP EXPIRY
      ----------------------------------------------------- */

      if (
        !user.emailVerificationExpires ||
        user.emailVerificationExpires.getTime() <
          Date.now()
      ) {
        await User.findByIdAndDelete(
          user._id
        );

        return res.status(400).json({
          success: false,
          message:
            "Verification code has expired. Please register again.",
        });
      }

      /* -----------------------------------------------------
         OTP CHECK
      ----------------------------------------------------- */

      if (
        !user.emailVerificationCode ||
        user.emailVerificationCode !==
          code
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification code.",
        });
      }

      /* -----------------------------------------------------
         MARK EMAIL VERIFIED
      ----------------------------------------------------- */

      user.emailVerified = true;

      user.emailVerificationCode =
        null;

      user.emailVerificationExpires =
        null;

      user.emailVerificationLastSentAt =
        null;

      user.emailVerificationSendCount =
        0;

      user.emailVerificationSendWindowStartedAt =
        null;

      /* -----------------------------------------------------
         STATUS AFTER EMAIL VERIFICATION
         
         STUDENT:
           approved immediately

         ADMIN / SECURITY / STAFF:
           pending Admin approval
      ----------------------------------------------------- */

      if (
        user.role === "student"
      ) {
        user.status = "approved";
      } else if (
        PRIVILEGED_ROLES.includes(
          user.role
        )
      ) {
        user.status = "pending";
      } else {
        user.status = "pending";
      }

      await user.save();

      /* -----------------------------------------------------
         OPTIONAL EMAIL
      ----------------------------------------------------- */

      try {
        if (
          user.role === "student"
        ) {
          await sendStudentWelcomeEmail(
            user
          );
        } else if (
          PRIVILEGED_ROLES.includes(
            user.role
          )
        ) {
          await sendPendingApprovalEmail(
            user
          );
        }
      } catch (emailError) {
        console.error(
          "Post-verification email failed:",
          emailError.message
        );
      }

      return res.json({
        success: true,
        emailVerified: true,
        status: user.status,

        requiresAdminApproval:
          PRIVILEGED_ROLES.includes(
            user.role
          ),

        message:
          user.role === "student"
            ? "Email verified successfully. Your account is active."
            : "Email verified successfully. Your account is now pending Admin approval.",
      });
    } catch (error) {
      console.error(
        "Verify email error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Email verification failed.",
      });
    }
  }
);

/* =========================================================
   RESEND VERIFICATION
========================================================= */

router.post(
  "/resend-verification",
  async (req, res) => {
    try {
      const cleanEmail = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      if (
        user.emailVerified === true
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email is already verified.",
        });
      }

      const now = Date.now();

      let windowStartedAt =
        user.emailVerificationSendWindowStartedAt
          ? user.emailVerificationSendWindowStartedAt.getTime()
          : null;

      let sendCount = Number(
        user.emailVerificationSendCount ||
          0
      );

      /* -----------------------------------------------------
         RESET 24 HOUR WINDOW
      ----------------------------------------------------- */

      if (
        !windowStartedAt ||
        now - windowStartedAt >=
          RESEND_WINDOW_MS
      ) {
        user.emailVerificationSendWindowStartedAt =
          new Date();

        user.emailVerificationSendCount =
          0;

        windowStartedAt = now;
        sendCount = 0;
      }

      /* -----------------------------------------------------
         MAX DAILY RESENDS
      ----------------------------------------------------- */

      if (
        sendCount >=
        MAX_RESENDS_PER_DAY
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Maximum verification email resend limit reached. Please try again later.",
        });
      }

      /* -----------------------------------------------------
         60 SECOND COOLDOWN
      ----------------------------------------------------- */

      if (
        user.emailVerificationLastSentAt
      ) {
        const lastSent =
          user.emailVerificationLastSentAt.getTime();

        const elapsed =
          now - lastSent;

        if (
          elapsed <
          RESEND_COOLDOWN_MS
        ) {
          const remainingSeconds =
            Math.ceil(
              (RESEND_COOLDOWN_MS -
                elapsed) /
                1000
            );

          return res.status(429).json({
            success: false,
            message: `Please wait ${remainingSeconds} seconds before requesting another code.`,
            retryAfterSeconds:
              remainingSeconds,
          });
        }
      }

      /* -----------------------------------------------------
         GENERATE NEW OTP
      ----------------------------------------------------- */

      const verificationCode =
        generateVerificationCode();

      const verificationExpires =
        getOtpExpiry();

      user.emailVerificationCode =
        verificationCode;

      user.emailVerificationExpires =
        verificationExpires;

      user.emailVerificationLastSentAt =
        new Date();

      user.emailVerificationSendCount =
        sendCount + 1;

      await user.save();

      /* -----------------------------------------------------
         SEND EMAIL
      ----------------------------------------------------- */

      try {
        const emailResult =
          await sendEmailVerificationCode(
            user,
            verificationCode
          );

        if (
          !emailResult ||
          emailResult.success !== true
        ) {
          throw new Error(
            emailResult?.error ||
              emailResult?.message ||
              "Verification email could not be sent."
          );
        }
      } catch (emailError) {
        console.error(
          "Resend verification email failed:",
          emailError.message
        );

        return res.status(500).json({
          success: false,
          message:
            "Verification email could not be sent.",
        });
      }

      return res.json({
        success: true,
        message:
          "A new verification code has been sent to your email.",
        expiresInMinutes:
          OTP_EXPIRY_MINUTES,
        resendsRemaining:
          MAX_RESENDS_PER_DAY -
          Number(
            user.emailVerificationSendCount ||
              0
          ),
      });
    } catch (error) {
      console.error(
        "Resend verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not resend verification code.",
      });
    }
  }
);

/* =========================================================
   LOGIN
========================================================= */

router.post(
  "/login",
  async (req, res) => {
    try {
      const cleanEmail = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body.password || ""
      );

      const requestedRole =
        req.body.role
          ? String(req.body.role)
              .trim()
              .toLowerCase()
          : null;

      if (
        !cleanEmail ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const user =
        await User.findOne({
          email: cleanEmail,
        });

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      /* -----------------------------------------------------
         EMAIL VERIFICATION REQUIRED
      ----------------------------------------------------- */

      if (
        user.emailVerified !== true
      ) {
        return res.status(403).json({
          success: false,
          requiresEmailVerification: true,
          message:
            "Please verify your email before logging in.",
        });
      }

      /* -----------------------------------------------------
         PASSWORD
      ----------------------------------------------------- */

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      /* -----------------------------------------------------
         ROLE MATCH
      ----------------------------------------------------- */

      if (
        requestedRole &&
        requestedRole !==
          user.role
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Selected role does not match this account.",
        });
      }

      /* -----------------------------------------------------
         PRIVILEGED APPROVAL
      ----------------------------------------------------- */

      if (
        PRIVILEGED_ROLES.includes(
          user.role
        )
      ) {
        if (
          user.status !==
          "approved"
        ) {
          if (
            user.status ===
            "rejected"
          ) {
            return res.status(403).json({
              success: false,
              message:
                "Your account request has been rejected by Admin.",
            });
          }

          return res.status(403).json({
            success: false,
            requiresAdminApproval:
              true,
            message:
              "Your email is verified, but your account is still waiting for Admin approval.",
          });
        }
      }

      /* -----------------------------------------------------
         STUDENT STATUS
      ----------------------------------------------------- */

      if (
        user.role ===
          "student" &&
        user.status !==
          "approved"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your student account is not active.",
        });
      }

      /* -----------------------------------------------------
         JWT
      ----------------------------------------------------- */

      const token = jwt.sign(
        {
          id: user._id.toString(),
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.json({
        success: true,
        message:
          "Login successful.",
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified:
            user.emailVerified,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Login failed.",
      });
    }
  }
);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  authenticate,
  async (req, res) => {
    try {
      return res.json({
        success: true,

        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          status: req.user.status,
          emailVerified:
            req.user.emailVerified,
        },
      });
    } catch (error) {
      console.error(
        "Me error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Could not load current user.",
      });
    }
  }
);

/* =========================================================
   GET ALL USERS
   ADMIN ONLY

   IMPORTANT:
   ONLY EMAIL-VERIFIED USERS ARE SHOWN.
   
   Unverified registration requests stay
   in database temporarily for OTP verification,
   but they DO NOT appear in User Management.
========================================================= */

router.get(
  "/users",
  requireAdmin,
  async (req, res) => {
    try {
      const users =
        await User.find({
          emailVerified: true,
        })
          .select(
            "-password " +
              "-emailVerificationCode " +
              "-emailVerificationExpires"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(
        "Get users error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch users.",
      });
    }
  }
);

/* =========================================================
   GET PENDING PRIVILEGED USERS
   ADMIN ONLY
========================================================= */

router.get(
  "/users/pending",
  requireAdmin,
  async (req, res) => {
    try {
      const users =
        await User.find({
          status: "pending",
          emailVerified: true,
          role: {
            $in:
              PRIVILEGED_ROLES,
          },
        })
          .select(
            "-password " +
              "-emailVerificationCode " +
              "-emailVerificationExpires"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(
        "Get pending users error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch pending users.",
      });
    }
  }
);

/* =========================================================
   ADMIN CREATE USER
   ADMIN ONLY
========================================================= */

router.post(
  "/users",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = "student",
      } = req.body;

      const cleanName = String(
        name || ""
      ).trim();

      const cleanEmail = String(
        email || ""
      )
        .trim()
        .toLowerCase();

      const cleanRole = String(
        role || "student"
      )
        .trim()
        .toLowerCase();

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

      if (
        !cleanName ||
        !cleanEmail ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, password and role are required.",
        });
      }

      if (
        !ALLOWED_ROLES.includes(
          cleanRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      /* -----------------------------------------------------
         DUPLICATE EMAIL
      ----------------------------------------------------- */

      const existingUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      /* -----------------------------------------------------
         PASSWORD HASH
      ----------------------------------------------------- */

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      /* -----------------------------------------------------
         PRIVILEGED CHECK
      ----------------------------------------------------- */

      const isPrivileged =
        PRIVILEGED_ROLES.includes(
          cleanRole
        );

      /*
        Admin-created Student:
          emailVerified = true
          status = approved

        Admin-created Privileged:
          emailVerified = true
          status = pending

        Admin must explicitly approve
        privileged account.
      */

      const initialStatus =
        isPrivileged
          ? "pending"
          : "approved";

      /* -----------------------------------------------------
         CREATE USER
      ----------------------------------------------------- */

      const user =
        await User.create({
          name: cleanName,
          email: cleanEmail,
          password:
            hashedPassword,
          role: cleanRole,

          emailVerified: true,

          status:
            initialStatus,

          emailVerificationCode:
            null,

          emailVerificationExpires:
            null,

          emailVerificationLastSentAt:
            null,

          emailVerificationSendCount:
            0,

          emailVerificationSendWindowStartedAt:
            null,
        });

      return res.status(201).json({
        success: true,

        message: isPrivileged
          ? "Privileged user created successfully. Admin approval is required before login."
          : "Student user created successfully.",

        requiresAdminApproval:
          isPrivileged,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified:
            user.emailVerified,
        },
      });
    } catch (error) {
      console.error(
        "Admin create user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create user.",
      });
    }
  }
);

/* =========================================================
   ADMIN UPDATE USER
   ADMIN ONLY
========================================================= */

router.put(
  "/users/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const {
        name,
        email,
        password,
        role,
      } = req.body;

      /* -----------------------------------------------------
         NAME
      ----------------------------------------------------- */

      if (
        name !== undefined
      ) {
        const cleanName =
          String(name).trim();

        if (!cleanName) {
          return res.status(400).json({
            success: false,
            message:
              "Name cannot be empty.",
          });
        }

        user.name =
          cleanName;
      }

      /* -----------------------------------------------------
         EMAIL
      ----------------------------------------------------- */

      if (
        email !== undefined
      ) {
        const cleanEmail =
          String(email)
            .trim()
            .toLowerCase();

        if (!cleanEmail) {
          return res.status(400).json({
            success: false,
            message:
              "Email cannot be empty.",
          });
        }

        const emailOwner =
          await User.findOne({
            email: cleanEmail,
            _id: {
              $ne: user._id,
            },
          });

        if (emailOwner) {
          return res.status(409).json({
            success: false,
            message:
              "Another user already uses this email.",
          });
        }

        /* ---------------------------------------------------
           CHANGING EMAIL REQUIRES OTP AGAIN
        --------------------------------------------------- */

        if (
          cleanEmail !==
          user.email
        ) {
          user.email =
            cleanEmail;

          user.emailVerified =
            false;

          user.emailVerificationCode =
            generateVerificationCode();

          user.emailVerificationExpires =
            getOtpExpiry();

          user.emailVerificationLastSentAt =
            new Date();

          user.emailVerificationSendCount =
            1;

          user.emailVerificationSendWindowStartedAt =
            new Date();

          user.status =
            "pending";

          try {
            const emailResult =
              await sendEmailVerificationCode(
                user,
                user.emailVerificationCode
              );

            if (
              !emailResult ||
              emailResult.success !==
                true
            ) {
              throw new Error(
                emailResult?.error ||
                  emailResult?.message ||
                  "Verification email could not be sent."
              );
            }
          } catch (emailError) {
            console.error(
              "Updated email verification failed:",
              emailError.message
            );

            return res.status(500).json({
              success: false,
              message:
                "User updated but verification email could not be sent.",
            });
          }
        }
      }

      /* -----------------------------------------------------
         PASSWORD
      ----------------------------------------------------- */

      if (
        password !== undefined
      ) {
        const cleanPassword =
          String(password);

        if (
          cleanPassword.length <
          6
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Password must be at least 6 characters.",
          });
        }

        user.password =
          await bcrypt.hash(
            cleanPassword,
            10
          );
      }

      /* -----------------------------------------------------
         ROLE
      ----------------------------------------------------- */

      if (
        role !== undefined
      ) {
        const cleanRole =
          String(role)
            .trim()
            .toLowerCase();

        if (
          !ALLOWED_ROLES.includes(
            cleanRole
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid role.",
          });
        }

        user.role =
          cleanRole;

        /*
          Verified student -> privileged
          requires Admin approval.
        */

        if (
          PRIVILEGED_ROLES.includes(
            cleanRole
          ) &&
          user.emailVerified ===
            true
        ) {
          user.status =
            "pending";
        }

        /*
          Verified user -> student
          becomes approved.
        */

        if (
          cleanRole ===
            "student" &&
          user.emailVerified ===
            true
        ) {
          user.status =
            "approved";
        }
      }

      /*
        IMPORTANT SECURITY RULE:

        req.body.status is NEVER accepted.

        Generic update cannot approve
        a privileged user.

        Only /approve can approve.
      */

      await user.save();

      return res.json({
        success: true,
        message:
          "User updated successfully.",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified:
            user.emailVerified,
        },
      });
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update user.",
      });
    }
  }
);

/* =========================================================
   ADMIN APPROVE USER
   ADMIN ONLY
========================================================= */

router.put(
  "/users/:id/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /* -----------------------------------------------------
         ONLY PRIVILEGED ROLES
      ----------------------------------------------------- */

      if (
        !PRIVILEGED_ROLES.includes(
          user.role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This account does not require privileged-role approval.",
        });
      }

      /* -----------------------------------------------------
         EMAIL MUST BE VERIFIED
      ----------------------------------------------------- */

      if (
        user.emailVerified !==
        true
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot approve this account because the email address has not been verified.",
        });
      }

      /* -----------------------------------------------------
         ALREADY APPROVED
      ----------------------------------------------------- */

      if (
        user.status ===
        "approved"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User is already approved.",
        });
      }

      user.status =
        "approved";

      await user.save();

      /* -----------------------------------------------------
         APPROVAL EMAIL
      ----------------------------------------------------- */

      try {
        await sendApprovalEmail(
          user
        );
      } catch (emailError) {
        console.error(
          "Approval email failed:",
          emailError.message
        );
      }

      return res.json({
        success: true,
        message:
          "User approved successfully. They can now login.",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified:
            user.emailVerified,
        },
      });
    } catch (error) {
      console.error(
        "Approve user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to approve user.",
      });
    }
  }
);

/* =========================================================
   ADMIN REJECT USER
   ADMIN ONLY
========================================================= */

router.put(
  "/users/:id/reject",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /* -----------------------------------------------------
         PREVENT SELF REJECTION
      ----------------------------------------------------- */

      if (
        req.user._id.toString() ===
        user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot reject your own Admin account.",
        });
      }

      /* -----------------------------------------------------
         PROTECT ADMIN
      ----------------------------------------------------- */

      if (
        user.role === "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin accounts are protected.",
        });
      }

      user.status =
        "rejected";

      await user.save();

      /* -----------------------------------------------------
         REJECTION EMAIL
      ----------------------------------------------------- */

      try {
        await sendRejectionEmail(
          user
        );
      } catch (emailError) {
        console.error(
          "Rejection email failed:",
          emailError.message
        );
      }

      return res.json({
        success: true,
        message:
          "User rejected successfully.",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified:
            user.emailVerified,
        },
      });
    } catch (error) {
      console.error(
        "Reject user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reject user.",
      });
    }
  }
);

/* =========================================================
   DELETE USER
   ADMIN ONLY
========================================================= */

router.delete(
  "/users/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /* -----------------------------------------------------
         PREVENT SELF DELETE
      ----------------------------------------------------- */

      if (
        req.user._id.toString() ===
        user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own Admin account.",
        });
      }

      /* -----------------------------------------------------
         PROTECT ADMIN
      ----------------------------------------------------- */

      if (
        user.role === "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin accounts are protected.",
        });
      }

      await User.findByIdAndDelete(
        id
      );

      return res.json({
        success: true,
        message:
          "User deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete user.",
      });
    }
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;