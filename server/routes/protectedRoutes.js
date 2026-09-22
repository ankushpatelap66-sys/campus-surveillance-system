const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protected Route
router.get("/profile", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have access to the protected route!",
    user: req.user,
  });
});

module.exports = router;