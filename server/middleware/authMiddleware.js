const jwt = require("jsonwebtoken");

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Check Bearer token format
    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = parts[1];

    // JWT secret check
    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET IS MISSING"
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT_SECRET is missing in server .env file.",
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store verified user information
    req.user = decoded;

    // Continue
    next();
  } catch (error) {
    console.error(
      "Authentication Error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// =====================================================
// ROLE MIDDLEWARE
// =====================================================
// Example:
// router.get(
//   "/",
//   authMiddleware,
//   requireRole("admin", "security"),
//   handler
// );

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: "User role is missing.",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = authMiddleware;

module.exports.requireRole =
  requireRole;