const express = require("express");
const Vehicle = require("../Vehicle");

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// VEHICLE MANAGEMENT
// ADMIN ONLY
// =====================================================

// ========================================
// GET ALL VEHICLES
// ========================================
router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const vehicles = await Vehicle.find().sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        vehicles,
      });
    } catch (error) {
      console.error(
        "GET VEHICLES ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch vehicles",
        error: error.message,
      });
    }
  }
);

// ========================================
// ADD VEHICLE
// ADMIN ONLY
// ========================================
router.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        ownerName,
        vehicleNumber,
        vehicleType,
        personType,
        contact,
      } = req.body;

      if (
        !ownerName ||
        !vehicleNumber ||
        !vehicleType ||
        !personType ||
        !contact
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All vehicle fields are required.",
        });
      }

      const vehicle =
        await Vehicle.create({
          ownerName,
          vehicleNumber,
          vehicleType,
          personType,
          contact,
        });

      res.status(201).json({
        success: true,
        message:
          "Vehicle registered successfully",
        vehicle,
      });
    } catch (error) {
      console.error(
        "POST VEHICLE ERROR:",
        error
      );

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message:
            "This vehicle number is already registered.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to register vehicle",
        error: error.message,
      });
    }
  }
);

// ========================================
// UPDATE VEHICLE
// ADMIN ONLY
// ========================================
router.put(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    console.log(
      "PUT /api/vehicles/:id HIT"
    );

    console.log(
      "Vehicle ID:",
      req.params.id
    );

    try {
      const {
        ownerName,
        vehicleNumber,
        vehicleType,
        personType,
        contact,
      } = req.body;

      const vehicle =
        await Vehicle.findByIdAndUpdate(
          req.params.id,
          {
            ownerName,
            vehicleNumber,
            vehicleType,
            personType,
            contact,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message:
            "Vehicle not found",
        });
      }

      res.json({
        success: true,
        message:
          "Vehicle updated successfully",
        vehicle,
      });
    } catch (error) {
      console.error(
        "UPDATE VEHICLE ERROR:",
        error
      );

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message:
            "This vehicle number is already registered.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to update vehicle",
        error: error.message,
      });
    }
  }
);

// ========================================
// DELETE VEHICLE
// ADMIN ONLY
// ========================================
router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    console.log(
      "DELETE /api/vehicles/:id HIT"
    );

    try {
      const vehicle =
        await Vehicle.findByIdAndDelete(
          req.params.id
        );

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message:
            "Vehicle not found",
        });
      }

      res.json({
        success: true,
        message:
          "Vehicle deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE VEHICLE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete vehicle",
        error: error.message,
      });
    }
  }
);

// ========================================
// TEST ROUTE
// ADMIN ONLY
// ========================================
router.get(
  "/test",
  authMiddleware,
  requireRole("admin"),
  (req, res) => {
    res.json({
      success: true,
      message:
        "Vehicle routes are working",
      user: req.user,
    });
  }
);

// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;