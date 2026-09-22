const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    parkingTime: {
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
      enum: ["Occupied", "Available"],
      default: "Occupied",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Parking",
  parkingSchema
);