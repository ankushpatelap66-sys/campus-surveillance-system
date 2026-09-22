const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config({
  path: __dirname + "/.env",
});

const fixAdmin = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      tls: true,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log("MongoDB connected successfully");

    const admin = await User.findOne({
      email: "admin@campus.com",
    });

    if (!admin) {
      console.log("❌ admin@campus.com nahi mila.");
      return;
    }

    admin.role = "admin";
    admin.status = "approved";
    admin.emailVerified = true;

    await admin.save();

    console.log("");
    console.log("=================================");
    console.log("✅ ADMIN ACCOUNT FIXED");
    console.log("=================================");
    console.log("Email          :", admin.email);
    console.log("Role           :", admin.role);
    console.log("Status         :", admin.status);
    console.log("Email Verified :", admin.emailVerified);
    console.log("=================================");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

fixAdmin();