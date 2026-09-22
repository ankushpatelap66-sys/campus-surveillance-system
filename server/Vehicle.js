const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    vehicleType: {
      type: String,
      required: true,
      enum: ["Car", "Bike", "Scooter", "Other"],
    },

    personType: {
      type: String,
      required: true,
      enum: ["Student", "Staff", "Faculty", "Visitor"],
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);