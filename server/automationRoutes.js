const express = require("express");
const mongoose = require("mongoose");

const Vehicle = require("./Vehicle");
const EntryExit = require("./EntryExit");
const Parking = require("./Parking");

const router = express.Router();
const authMiddleware = require("./middleware/authMiddleware");

/* =====================================================
   SECURITY ALERT MODEL
===================================================== */

const securityAlertSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
      },

      vehicleNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
      },

      location: {
        type: String,
        default: "Main Gate",
      },

      message: {
        type: String,
        required: true,
      },

      severity: {
        type: String,
        enum: [
          "Low",
          "Medium",
          "High",
        ],
        default: "High",
      },

      status: {
        type: String,
        enum: [
          "Active",
          "Resolved",
        ],
        default: "Active",
      },

      detectedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

const SecurityAlert =
  mongoose.models.SecurityAlert ||
  mongoose.model(
    "SecurityAlert",
    securityAlertSchema
  );

/* =====================================================
   NORMALIZE VEHICLE NUMBER
===================================================== */

const normalizeVehicleNumber =
  (value) => {
    return String(value || "")
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ""
      );
  };

/* =====================================================
   CREATE ENTRY DOCUMENT
===================================================== */

const createEntryDocument =
  (
    vehicleNumber,
    vehicle
  ) => {
    const schema =
      EntryExit.schema;

    const document = {};

    if (
      schema.path(
        "vehicleNumber"
      )
    ) {
      document.vehicleNumber =
        vehicleNumber;
    }

    if (
      schema.path("entryTime")
    ) {
      document.entryTime =
        new Date();
    }

    if (
      schema.path("exitTime")
    ) {
      document.exitTime =
        null;
    }

    if (
      schema.path("status")
    ) {
      document.status =
        "Inside Campus";
    }

    if (
      schema.path("ownerName") &&
      vehicle?.ownerName
    ) {
      document.ownerName =
        vehicle.ownerName;
    }

    if (
      schema.path("vehicleType") &&
      vehicle?.vehicleType
    ) {
      document.vehicleType =
        vehicle.vehicleType;
    }

    return document;
  };

/* =====================================================
   FIND ACTIVE ENTRY
===================================================== */

const findActiveEntry =
  async (vehicleNumber) => {
    const schema =
      EntryExit.schema;

    /* ==========================================
       PRIMARY CHECK:
       status = Inside Campus
    ========================================== */

    if (
      schema.path("status")
    ) {
      const insideEntry =
        await EntryExit.findOne({
          vehicleNumber,
          status:
            "Inside Campus",
        }).sort({
          entryTime: -1,
        });

      if (insideEntry) {
        return insideEntry;
      }
    }

    /* ==========================================
       SECONDARY CHECK:
       exitTime is null
    ========================================== */

    if (
      schema.path("exitTime")
    ) {
      return EntryExit.findOne({
        vehicleNumber,
        $or: [
          {
            exitTime: null,
          },
          {
            exitTime: {
              $exists: false,
            },
          },
        ],
      }).sort({
        entryTime: -1,
      });
    }

    return null;
  };

/* =====================================================
   ASSIGN PARKING SLOT
===================================================== */

const assignParkingSlot =
  async (
    vehicleNumber,
    ownerName
  ) => {
    /* ==========================================
       CHECK ALREADY OCCUPIED
    ========================================== */

    const existingParking =
      await Parking.findOne({
        vehicleNumber,
        status: "Occupied",
      });

    if (existingParking) {
      return existingParking;
    }

    /* ==========================================
       GET ALL PARKING RECORDS
    ========================================== */

    const parkingRecords =
      await Parking.find();

    const occupiedSlots =
      new Set(
        parkingRecords
          .filter(
            (item) =>
              item.status ===
              "Occupied"
          )
          .map(
            (item) =>
              item.slotNumber
          )
      );

    /* ==========================================
       FIND FIRST AVAILABLE SLOT
       P-01 to P-120
    ========================================== */

    let availableSlot =
      null;

    for (
      let number = 1;
      number <= 120;
      number++
    ) {
      const slot =
        `P-${String(
          number
        ).padStart(2, "0")}`;

      if (
        !occupiedSlots.has(
          slot
        )
      ) {
        availableSlot =
          slot;

        break;
      }
    }

    if (!availableSlot) {
      return null;
    }

    /* ==========================================
       CHECK WHETHER SLOT RECORD EXISTS
    ========================================== */

    const existingSlot =
      await Parking.findOne({
        slotNumber:
          availableSlot,
      });

    /* ==========================================
       REUSE AVAILABLE RECORD
    ========================================== */

    if (existingSlot) {
      existingSlot.vehicleNumber =
        vehicleNumber;

      existingSlot.ownerName =
        ownerName ||
        "Unknown";

      existingSlot.parkingTime =
        new Date();

      existingSlot.exitTime =
        null;

      existingSlot.status =
        "Occupied";

      await existingSlot.save();

      return existingSlot;
    }

    /* ==========================================
       CREATE NEW PARKING RECORD
    ========================================== */

    return Parking.create({
      slotNumber:
        availableSlot,

      vehicleNumber:
        vehicleNumber,

      ownerName:
        ownerName ||
        "Unknown",

      parkingTime:
        new Date(),

      exitTime:
        null,

      status:
        "Occupied",
    });
  };

/* =====================================================
   RELEASE PARKING SLOT
===================================================== */

const releaseParkingSlot =
  async (
    vehicleNumber
  ) => {
    const parkingRecords =
      await Parking.find({
        vehicleNumber,
        status: "Occupied",
      });

    for (
      const parking of
        parkingRecords
    ) {
      parking.status =
        "Available";

      parking.exitTime =
        new Date();

      await parking.save();

      console.log(
        "PARKING RELEASED:",
        parking.slotNumber,
        parking.vehicleNumber
      );

      console.log(
        "PARKING EXIT TIME:",
        parking.exitTime
      );
    }

    return parkingRecords;
  };

/* =====================================================
   DASHBOARD SUMMARY
===================================================== */

router.get(
  "/dashboard-summary",
  authMiddleware,
  async (req, res) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(
        startOfYesterday.getDate() - 1
      );

      const [
        totalVehicles,
        insideCampus,
        occupiedParking,
        activeAlerts,
        recentEntries,
        recentParking,
        recentAlerts,
        todayEntries,
        yesterdayEntries,
        todayAlerts,
        yesterdayAlerts,
      ] = await Promise.all([
        Vehicle.countDocuments(),
        EntryExit.countDocuments({
          status: "Inside Campus",
        }),
        Parking.countDocuments({
          status: "Occupied",
        }),
        SecurityAlert.countDocuments({
          status: "Active",
        }),
        EntryExit.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Parking.find()
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(10)
          .lean(),
        SecurityAlert.find()
          .sort({ detectedAt: -1, createdAt: -1 })
          .limit(10)
          .lean(),
        EntryExit.countDocuments({
          entryTime: { $gte: startOfToday },
          status: { $in: ["Inside Campus", "Exited"] },
        }),
        EntryExit.countDocuments({
          entryTime: {
            $gte: startOfYesterday,
            $lt: startOfToday,
          },
        }),
        SecurityAlert.countDocuments({
          createdAt: { $gte: startOfToday },
        }),
        SecurityAlert.countDocuments({
          createdAt: {
            $gte: startOfYesterday,
            $lt: startOfToday,
          },
        }),
      ]);

      const formatActivity = (item) => {
        const isEntryExit = Boolean(item.entryTime);
        const isParking = Boolean(item.parkingTime);
        const isAlert = Boolean(item.detectedAt);

        if (isAlert) {
          return {
            id: `alert-${item._id}`,
            time: item.detectedAt || item.createdAt,
            vehicleNumber: item.vehicleNumber || "Unknown",
            event: item.type || "Security Alert",
            location: item.location || "Main Gate",
            status: "ALERT",
            tone: "danger",
            icon: "alert",
          };
        }

        if (isParking) {
          return {
            id: `parking-${item._id}`,
            time: item.parkingTime || item.updatedAt || item.createdAt,
            vehicleNumber: item.vehicleNumber || "-",
            event:
              item.status === "Available"
                ? "Parking Released"
                : "Parking Assigned",
            location: item.slotNumber || "Parking Area",
            status: item.status === "Available" ? "FREE" : "PARKED",
            tone: "purple",
            icon: "parking",
          };
        }

        if (isEntryExit) {
          const isExit = item.status === "Exited";
          return {
            id: `entry-${item._id}`,
            time: isExit
              ? item.exitTime || item.updatedAt || item.createdAt
              : item.entryTime || item.createdAt,
            vehicleNumber: item.vehicleNumber || "-",
            event: isExit ? "Exit Recorded" : "Entry Recorded",
            location: "Main Gate",
            status: isExit ? "OUT" : "IN",
            tone: isExit ? "info" : "success",
            icon: isExit ? "logout" : "entry",
          };
        }

        return null;
      };

      const activity = [
        ...recentEntries,
        ...recentParking,
        ...recentAlerts,
      ]
        .map(formatActivity)
        .filter(Boolean)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);

      const alerts = recentAlerts.slice(0, 3).map((alert) => ({
        id: alert._id,
        priority: `${alert.severity || "Medium"} Priority`,
        type: alert.type || "Security Alert",
        vehicleNumber: alert.vehicleNumber || "Unknown Vehicle",
        location: alert.location || "Main Gate",
        time: alert.detectedAt || alert.createdAt,
        severity: String(alert.severity || "Medium").toLowerCase(),
        status: alert.status || "Active",
      }));

      const percentageChange = (current, previous) => {
        if (!previous) {
          return current > 0 ? 100 : 0;
        }
        return Math.round(((current - previous) / previous) * 100);
      };

      res.json({
        success: true,
        summary: {
          totalVehicles,
          insideCampus,
          parkingOccupied: occupiedParking,
          parkingCapacity: 120,
          activeAlerts,
          changes: {
            entriesToday: percentageChange(
              todayEntries,
              yesterdayEntries
            ),
            alertsToday: percentageChange(
              todayAlerts,
              yesterdayAlerts
            ),
          },
        },
        activity,
        alerts,
        lastDetection: activity.find(
          (item) => item.vehicleNumber && item.vehicleNumber !== "-"
        ) || null,
        camera: {
          status: "Online",
          ocrStatus: "Ready",
          name: "Main Gate",
        },
      });
    } catch (error) {
      console.error("DASHBOARD SUMMARY ERROR:", error);
      res.status(500).json({
        success: false,
        message: "Failed to load dashboard data.",
        error: error.message,
      });
    }
  }
);

/* =====================================================
   AUTOMATIC VEHICLE DETECTION
===================================================== */

router.post(
  "/vehicle-detected",
  async (req, res) => {
    try {
      console.log(
        "================================="
      );

      console.log(
        "AUTOMATIC VEHICLE DETECTION"
      );

      console.log(
        "================================="
      );

      /* ==========================================
         VEHICLE NUMBER
      ========================================== */

      const vehicleNumber =
        normalizeVehicleNumber(
          req.body.vehicleNumber
        );

      const camera =
        req.body.camera ||
        "Main Gate";

      console.log(
        "Vehicle:",
        vehicleNumber
      );

      console.log(
        "Camera:",
        camera
      );

      console.log(
        "================================="
      );

      /* ==========================================
         VALIDATE
      ========================================== */

      if (!vehicleNumber) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Vehicle number is required.",
          });
      }

      /* ==========================================
         FIND REGISTERED VEHICLE
      ========================================== */

      const vehicle =
        await Vehicle.findOne({
          vehicleNumber,
        });

      /* ==========================================
         UNREGISTERED VEHICLE
      ========================================== */

      if (!vehicle) {
        console.log(
          "VEHICLE NOT REGISTERED:",
          vehicleNumber
        );

        /* --------------------------------------
           Prevent duplicate alerts for 30 sec
        -------------------------------------- */

        const recentAlert =
          await SecurityAlert.findOne({
            vehicleNumber,
            status: "Active",

            createdAt: {
              $gte: new Date(
                Date.now() -
                  30000
              ),
            },
          });

        if (!recentAlert) {
          await SecurityAlert.create({
            type:
              "Unauthorized Vehicle",

            vehicleNumber:
              vehicleNumber,

            location:
              camera ||
              "Main Gate",

            message:
              "Vehicle is not registered in campus records.",

            severity: "High",

            status: "Active",

            detectedAt:
              new Date(),
          });

          console.log(
            "SECURITY ALERT CREATED:",
            vehicleNumber
          );
        }

        return res.json({
          success: true,

          authorized: false,

          action:
            "ALERT",

          vehicleNumber,

          message:
            "Unauthorized vehicle detected.",
        });
      }

      console.log(
        "REGISTERED VEHICLE:",
        vehicleNumber
      );

      /* ==========================================
         FIND ACTIVE ENTRY
      ========================================== */

      const activeEntry =
        await findActiveEntry(
          vehicleNumber
        );

      /* ==========================================
         EXIT
      ========================================== */

      if (activeEntry) {
        console.log(
          "ACTIVE ENTRY FOUND."
        );

        console.log(
          "AUTOMATIC ACTION: EXIT"
        );

        /* --------------------------------------
           SAVE EXIT TIME
        -------------------------------------- */

        if (
          EntryExit.schema.path(
            "exitTime"
          )
        ) {
          activeEntry.exitTime =
            new Date();
        }

        /* --------------------------------------
           CHANGE STATUS
        -------------------------------------- */

        if (
          EntryExit.schema.path(
            "status"
          )
        ) {
          activeEntry.status =
            "Exited";
        }

        await activeEntry.save();

        console.log(
          "EXIT SAVED:",
          activeEntry._id
        );

        /* --------------------------------------
           RELEASE PARKING
        -------------------------------------- */

        const releasedParking =
          await releaseParkingSlot(
            vehicleNumber
          );

        console.log(
          "PARKING RECORDS RELEASED:",
          releasedParking.length
        );

        return res.json({
          success: true,

          authorized: true,

          action: "EXIT",

          vehicleNumber,

          ownerName:
            vehicle.ownerName,

          entryId:
            activeEntry._id,

          exitTime:
            activeEntry.exitTime,

          parkingReleased:
            releasedParking.length,

          message:
            releasedParking.length >
            0
              ? "Vehicle exit recorded automatically and parking slot released."
              : "Vehicle exit recorded automatically.",
        });
      }

      /* ==========================================
         ENTRY
      ========================================== */

      console.log(
        "NO ACTIVE ENTRY FOUND."
      );

      console.log(
        "AUTOMATIC ACTION: ENTRY"
      );

      /* --------------------------------------
         CREATE ENTRY
      -------------------------------------- */

      const entryDocument =
        createEntryDocument(
          vehicleNumber,
          vehicle
        );

      console.log(
        "ENTRY DOCUMENT:",
        entryDocument
      );

      const newEntry =
        await EntryExit.create(
          entryDocument
        );

      console.log(
        "ENTRY SAVED:",
        newEntry._id
      );

      /* --------------------------------------
         ASSIGN PARKING
      -------------------------------------- */

      const parking =
        await assignParkingSlot(
          vehicleNumber,
          vehicle.ownerName
        );

      if (parking) {
        console.log(
          "PARKING ASSIGNED:",
          parking.slotNumber
        );
      } else {
        console.log(
          "NO PARKING SLOT AVAILABLE."
        );
      }

      /* ==========================================
         RESPONSE
      ========================================== */

      return res.json({
        success: true,

        authorized: true,

        action: "ENTRY",

        vehicleNumber,

        ownerName:
          vehicle.ownerName,

        entryId:
          newEntry._id,

        entryTime:
          newEntry.entryTime,

        parkingSlot:
          parking?.slotNumber ||
          null,

        message: parking
          ? `Entry saved. Parking slot ${parking.slotNumber} assigned.`
          : "Entry saved. No parking slot available.",
      });
    } catch (error) {
      console.error(
        "AUTOMATION ERROR:"
      );

      console.error(error);

      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Automatic vehicle processing failed.",
        });
    }
  }
);

/* =====================================================
   GET SECURITY ALERTS
===================================================== */

router.get(
  "/alerts",
  async (req, res) => {
    try {
      const alerts =
        await SecurityAlert.find()
          .sort({
            createdAt: -1,
          })
          .limit(100);

      return res.json({
        success: true,
        alerts,
      });
    } catch (error) {
      console.error(
        "GET ALERTS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to fetch security alerts.",
        });
    }
  }
);

/* =====================================================
   RESOLVE SECURITY ALERT
===================================================== */

router.put(
  "/alerts/:id/resolve",
  async (req, res) => {
    try {
      const alert =
        await SecurityAlert.findByIdAndUpdate(
          req.params.id,

          {
            status:
              "Resolved",
          },

          {
            new: true,
          }
        );

      if (!alert) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Alert not found.",
          });
      }

      return res.json({
        success: true,
        alert,
      });
    } catch (error) {
      console.error(
        "RESOLVE ALERT ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to resolve alert.",
        });
    }
  }
);

module.exports = router;