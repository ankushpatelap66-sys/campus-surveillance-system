const express = require("express");
const EntryExit = require("../EntryExit");

const router = express.Router();

// =====================================
// TEST ROUTE
// =====================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Entry/Exit routes are working",
  });
});

// =====================================
// GET TODAY'S ENTRY / EXIT RECORDS
// =====================================

router.get("/", async (req, res) => {
  try {
    // Aaj ke din ka start
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Kal ke din ka start
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const records = await EntryExit.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error("GET TODAY ENTRY/EXIT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch today's entry/exit records",
      error: error.message,
    });
  }
});

// =====================================
// CREATE ENTRY RECORD
// =====================================

router.post("/", async (req, res) => {
  try {
    const { vehicleNumber, ownerName } = req.body;

    if (!vehicleNumber || !ownerName) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number and owner name are required.",
      });
    }

    const record = await EntryExit.create({
      vehicleNumber,
      ownerName,
      entryTime: new Date(),
      status: "Inside Campus",
    });

    res.status(201).json({
      success: true,
      message: "Vehicle entry recorded successfully.",
      record,
    });
  } catch (error) {
    console.error("CREATE ENTRY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record vehicle entry.",
      error: error.message,
    });
  }
});

// =====================================
// MARK VEHICLE AS EXITED
// =====================================

router.put("/:id/exit", async (req, res) => {
  try {
    const record = await EntryExit.findByIdAndUpdate(
      req.params.id,
      {
        exitTime: new Date(),
        status: "Exited",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Entry record not found.",
      });
    }

    res.json({
      success: true,
      message: "Vehicle exit recorded successfully.",
      record,
    });
  } catch (error) {
    console.error("EXIT VEHICLE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record vehicle exit.",
      error: error.message,
    });
  }
});

// =====================================
// DELETE ENTRY / EXIT RECORD
// =====================================

router.delete("/:id", async (req, res) => {
  try {
    const record = await EntryExit.findByIdAndDelete(
      req.params.id
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Entry record not found.",
      });
    }

    res.json({
      success: true,
      message: "Entry/exit record deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ENTRY/EXIT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete entry/exit record.",
      error: error.message,
    });
  }
});

module.exports = router;