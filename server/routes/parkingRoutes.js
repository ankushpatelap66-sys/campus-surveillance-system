const express = require("express");

const Parking = require("../Parking");

const authMiddleware = require("../middleware/authMiddleware");
const {
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

const allowedRoles = [
  "admin",
  "security",
];

// =====================================================
// TEST ROUTE
// =====================================================

router.get(
  "/test",
  authMiddleware,
  requireRole(...allowedRoles),
  (req, res) => {
    res.json({
      success: true,
      message:
        "Parking routes are working",
      user: req.user,
    });
  }
);

// =====================================================
// GET ALL PARKING RECORDS
// ADMIN + SECURITY
// =====================================================

router.get(
  "/",
  authMiddleware,
  requireRole(...allowedRoles),
  async (req, res) => {
    try {
      const parkingRecords =
        await Parking.find().sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        parkingRecords,
      });
    } catch (error) {
      console.error(
        "GET PARKING ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch parking records",
        error: error.message,
      });
    }
  }
);

// =====================================================
// CREATE / PARK VEHICLE
// ADMIN + SECURITY
// =====================================================

router.post(
  "/",
  authMiddleware,
  requireRole(...allowedRoles),
  async (req, res) => {
    try {
      const {
        slotNumber,
        vehicleNumber,
        ownerName,
      } = req.body;

      if (
        !slotNumber ||
        !vehicleNumber ||
        !ownerName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Slot number, vehicle number and owner name are required",
        });
      }

      const cleanSlot =
        slotNumber
          .trim()
          .toUpperCase();

      const cleanVehicle =
        vehicleNumber
          .trim()
          .toUpperCase();

      const cleanOwner =
        ownerName.trim();

      // =================================================
      // CHECK SLOT
      // =================================================

      const existingSlot =
        await Parking.findOne({
          slotNumber: cleanSlot,
          status: "Occupied",
        });

      if (existingSlot) {
        return res.status(400).json({
          success: false,
          message:
            "This parking slot is already occupied.",
        });
      }

      // =================================================
      // CHECK VEHICLE
      // =================================================

      const existingVehicle =
        await Parking.findOne({
          vehicleNumber:
            cleanVehicle,
          status: "Occupied",
        });

      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message:
            "This vehicle is already parked.",
        });
      }

      // =================================================
      // REUSE AVAILABLE SLOT
      // =================================================

      const availableSlot =
        await Parking.findOne({
          slotNumber: cleanSlot,
          status: "Available",
        });

      if (availableSlot) {
        availableSlot.vehicleNumber =
          cleanVehicle;

        availableSlot.ownerName =
          cleanOwner;

        availableSlot.parkingTime =
          new Date();

        availableSlot.exitTime =
          null;

        availableSlot.status =
          "Occupied";

        await availableSlot.save();

        return res.status(201).json({
          success: true,
          message:
            "Vehicle parked successfully.",
          parking: availableSlot,
        });
      }

      // =================================================
      // NEW PARKING RECORD
      // =================================================

      const parking =
        await Parking.create({
          slotNumber: cleanSlot,
          vehicleNumber:
            cleanVehicle,
          ownerName: cleanOwner,
          parkingTime:
            new Date(),
          exitTime: null,
          status: "Occupied",
        });

      return res.status(201).json({
        success: true,
        message:
          "Vehicle parked successfully.",
        parking,
      });
    } catch (error) {
      console.error(
        "CREATE PARKING ERROR:",
        error
      );

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message:
            "This parking slot already exists.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to park vehicle.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// RELEASE PARKING SLOT
// ADMIN + SECURITY
// =====================================================

router.put(
  "/:id/release",
  authMiddleware,
  requireRole(...allowedRoles),
  async (req, res) => {
    try {
      const parking =
        await Parking.findById(
          req.params.id
        );

      if (!parking) {
        return res.status(404).json({
          success: false,
          message:
            "Parking record not found.",
        });
      }

      if (
        parking.status ===
        "Available"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This parking slot is already available.",
        });
      }

      parking.status =
        "Available";

      parking.exitTime =
        new Date();

      await parking.save();

      return res.json({
        success: true,
        message:
          "Parking slot released successfully.",
        parking,
      });
    } catch (error) {
      console.error(
        "RELEASE PARKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to release parking slot.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// DELETE PARKING RECORD
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const parking =
        await Parking.findByIdAndDelete(
          req.params.id
        );

      if (!parking) {
        return res.status(404).json({
          success: false,
          message:
            "Parking record not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Parking record deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE PARKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete parking record.",
        error: error.message,
      });
    }
  }
);

module.exports = router;