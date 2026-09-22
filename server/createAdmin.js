require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("./models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
};

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing in server/.env"
      );
    }

    console.log(
      "Connecting to MongoDB Atlas..."
    );

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected successfully"
    );

    const email = "admin@campus.com";

    const password =
      await question(
        "Enter NEW admin password: "
      );

    if (!password || password.length < 6) {
      throw new Error(
        "Admin password must contain at least 6 characters."
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    let user =
      await User.findOne({
        email,
      });

    if (user) {
      user.role = "admin";
      user.status = "approved";
      user.password =
        hashedPassword;

      await user.save();

      console.log(
        "Existing admin account updated successfully."
      );
    } else {
      user =
        await User.create({
          name: "System Admin",
          email,
          password:
            hashedPassword,
          role: "admin",
          status: "approved",
        });

      console.log(
        "New admin account created successfully."
      );
    }

    console.log(
      "Admin Email:",
      email
    );

    console.log(
      "Admin Status:",
      user.status
    );

    console.log(
      "Admin Role:",
      user.role
    );

    await mongoose.disconnect();

    rl.close();

    console.log(
      "Done. You can now login as admin."
    );
  } catch (error) {
    console.error(
      "CREATE ADMIN ERROR:",
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch {}

    rl.close();

    process.exit(1);
  }
};

run();