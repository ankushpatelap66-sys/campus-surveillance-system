const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const {
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

const ALLOWED_ROLES = [
  "admin",
  "security",
  "staff",
  "student",
];

const PRIVILEGED_ROLES = [
  "admin",
  "security",
  "staff",
];

// =====================================================
// HELPER
// =====================================================

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// =====================================================
// PUBLIC REGISTER
// =====================================================
// Student:
//   approved immediately
//
// Admin / Security / Staff:
//   pending until Admin approves
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and role are required",
      });
    }

    if (
      !ALLOWED_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected",
      });
    }

    const cleanName = name.trim();
    const cleanEmail =
      email.trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // =================================================
    // STUDENT = AUTO APPROVED
    // PRIVILEGED = PENDING
    // =================================================

    const accountStatus =
      role === "student"
        ? "approved"
        : "pending";

    const user =
      await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role,
        status: accountStatus,
      });

    // =================================================
    // RESPONSE
    // =================================================

    if (
      PRIVILEGED_ROLES.includes(role)
    ) {
      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message:
          "Registration submitted. Admin approval is required before login.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    return res.status(201).json({
      success: true,
      requiresApproval: false,
      message:
        "Student account created successfully. You can login now.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "REGISTRATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
  console.log("=================================");
  console.log("LOGIN REQUEST RECEIVED");
  console.log("=================================");

  try {
    const {
      email,
      password,
      role,
    } = req.body;

    console.log(
      "Login Email:",
      email
    );

    console.log(
      "Selected Role:",
      role
    );

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: cleanEmail,
      });

    if (!user) {
      console.log(
        "USER NOT FOUND"
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    console.log(
      "USER FOUND:",
      user.email
    );

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    console.log(
      "PASSWORD CHECK:",
      isPasswordCorrect
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // =================================================
    // ROLE MATCH
    // =================================================

    if (
      role &&
      ALLOWED_ROLES.includes(role) &&
      role !== user.role
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Selected role does not match this account",
      });
    }

    // =================================================
    // LEGACY ACCOUNT HANDLING
    // =================================================
    // Existing users created before status field:
    //
    // Existing admin -> approved
    // Existing student -> approved
    // Existing security/staff -> pending
    // =================================================

    if (!user.status) {
      if (
        user.role === "admin" ||
        user.role === "student"
      ) {
        user.status = "approved";

        await user.save();
      } else {
        user.status = "pending";

        await user.save();
      }
    }

    console.log(
      "ACCOUNT STATUS:",
      user.status
    );

    // =================================================
    // APPROVAL CHECK
    // =================================================

    if (
      PRIVILEGED_ROLES.includes(
        user.role
      )
    ) {
      if (user.status === "pending") {
        return res.status(403).json({
          success: false,
          requiresApproval: true,
          message:
            "Your account is waiting for Admin approval.",
        });
      }

      if (
        user.status === "rejected"
      ) {
        return res.status(403).json({
          success: false,
          requiresApproval: false,
          message:
            "Your account request was rejected by Admin.",
        });
      }
    }

    // =================================================
    // STUDENT REJECTION CHECK
    // =================================================

    if (
      user.status === "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been rejected.",
      });
    }

    // =================================================
    // JWT SECRET
    // =================================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET IS MISSING"
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT_SECRET is missing in server .env file",
      });
    }

    const token =
      createToken(user);

    console.log(
      "LOGIN SUCCESS"
    );

    return res.status(200).json({
      success: true,
      message:
        "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// CURRENT USER
// GET /api/auth/me
// =====================================================

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.user.id
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid user token",
        });
      }

      const user =
        await User.findById(
          req.user.id
        ).select(
          "_id name email role status createdAt updatedAt"
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt:
            user.createdAt,
          updatedAt:
            user.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GET CURRENT USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET ALL USERS
// ADMIN ONLY
// =====================================================

router.get(
  "/users",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const users =
        await User.find({})
          .select(
            "_id name email role status createdAt updatedAt"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(
        "GET USERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET PENDING REQUESTS
// ADMIN ONLY
// =====================================================

router.get(
  "/users/pending",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const users =
        await User.find({
          status: "pending",
          role: {
            $in: PRIVILEGED_ROLES,
          },
        })
          .select(
            "_id name email role status createdAt"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(
        "GET PENDING USERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// ADMIN CREATE USER
// ADMIN ONLY
// =====================================================

router.post(
  "/users",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, password and role are required",
        });
      }

      if (
        !ALLOWED_ROLES.includes(
          role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role",
        });
      }

      const cleanName =
        name.trim();

      const cleanEmail =
        email.trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "User already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        await User.create({
          name: cleanName,
          email: cleanEmail,
          password:
            hashedPassword,
          role,
          status: "approved",
        });

      return res.status(201).json({
        success: true,
        message:
          "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "ADMIN CREATE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// APPROVE USER
// ADMIN ONLY
// PUT /api/auth/users/:id/approve
// =====================================================

router.put(
  "/users/:id/approve",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const userId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID",
        });
      }

      if (
        userId === req.user.id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot approve your own account",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      if (
        !PRIVILEGED_ROLES.includes(
          user.role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only admin, security and staff requests require approval",
        });
      }

      user.status = "approved";

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "User approved successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "APPROVE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// REJECT USER
// ADMIN ONLY
// PUT /api/auth/users/:id/reject
// =====================================================

router.put(
  "/users/:id/reject",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const userId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID",
        });
      }

      if (
        userId === req.user.id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot reject your own account",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      user.status = "rejected";

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "User request rejected",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "REJECT USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE USER
// ADMIN ONLY
// =====================================================

router.put(
  "/users/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      const userId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      // =================================================
      // SELF ROLE PROTECTION
      // =================================================

      if (
        user._id.toString() ===
          req.user.id &&
        role &&
        role !== "admin"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove your own admin role",
        });
      }

      // =================================================
      // ROLE VALIDATION
      // =================================================

      if (
        role &&
        !ALLOWED_ROLES.includes(
          role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role",
        });
      }

      // =================================================
      // LAST ADMIN PROTECTION
      // =================================================

      if (
        user.role === "admin" &&
        role &&
        role !== "admin"
      ) {
        const adminCount =
          await User.countDocuments({
            role: "admin",
            status: "approved",
          });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message:
              "At least one approved admin account must remain",
          });
        }
      }

      // =================================================
      // EMAIL
      // =================================================

      if (email) {
        const cleanEmail =
          email.trim().toLowerCase();

        const emailOwner =
          await User.findOne({
            email: cleanEmail,
            _id: {
              $ne: userId,
            },
          });

        if (emailOwner) {
          return res.status(400).json({
            success: false,
            message:
              "Another user already has this email",
          });
        }

        user.email =
          cleanEmail;
      }

      // =================================================
      // NAME
      // =================================================

      if (name) {
        const cleanName =
          name.trim();

        if (
          cleanName.length < 2
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Name must contain at least 2 characters",
          });
        }

        user.name =
          cleanName;
      }

      // =================================================
      // PASSWORD
      // =================================================

      if (password) {
        if (
          password.length < 6
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Password must contain at least 6 characters",
          });
        }

        user.password =
          await bcrypt.hash(
            password,
            10
          );
      }

      // =================================================
      // ROLE
      // =================================================

      if (role) {
        user.role = role;

        // Admin explicitly changed the role,
        // so the account is approved.
        user.status = "approved";
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "User updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      console.error(
        "UPDATE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// =====================================================
// DELETE USER
// ADMIN ONLY
// =====================================================

router.delete(
  "/users/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const userId =
        req.params.id;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID",
        });
      }

      // =================================================
      // SELF DELETE PROTECTION
      // =================================================

      if (
        userId === req.user.id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own account",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      // =================================================
      // LAST ADMIN PROTECTION
      // =================================================

      if (
        user.role === "admin" &&
        user.status === "approved"
      ) {
        const adminCount =
          await User.countDocuments({
            role: "admin",
            status: "approved",
          });

        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message:
              "At least one approved admin account must remain",
          });
        }
      }

      await User.findByIdAndDelete(
        userId
      );

      return res.status(200).json({
        success: true,
        message:
          "User deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;