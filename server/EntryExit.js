const mongoose = require("mongoose");

const entryExitSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    entryTime: {
      type: Date,
      required: true,
      default: Date.now,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Inside Campus", "Exited"],
      default: "Inside Campus",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "EntryExit",
  entryExitSchema
);