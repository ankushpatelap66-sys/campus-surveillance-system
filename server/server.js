const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({
  path: __dirname + "/.env",
});

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const entryExitRoutes = require("./routes/entryExitRoutes");
const parkingRoutes = require("./routes/parkingRoutes");

// ✅ NEW: Automatic Surveillance Route
const automationRoutes = require("./automationRoutes");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// REQUEST LOGGER
// ==========================================

app.use((req, res, next) => {
  console.log(
    `[${req.method}] ${req.originalUrl}`
  );

  next();
});


// ==========================================
// EXISTING ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/protected",
  protectedRoutes
);

app.use(
  "/api/vehicles",
  vehicleRoutes
);

app.use(
  "/api/entry-exit",
  entryExitRoutes
);

app.use(
  "/api/parking",
  parkingRoutes
);


// ==========================================
// ✅ AUTOMATIC SURVEILLANCE ROUTES
// ==========================================

app.use(
  "/api/automation",
  automationRoutes
);


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "TEST ROUTE WORKING",
  });
});


// ==========================================
// ROOT ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Campus Surveillance System Backend is Running!",
  });
});


// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


// ==========================================
// MONGODB CONNECTION
// ==========================================

const connectDatabase = async () => {
  try {
    console.log(
      "Connecting to MongoDB Atlas..."
    );

    await mongoose.connect(
      process.env.MONGO_URI,
      {
        family: 4,
        tls: true,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      }
    );

    console.log(
      "================================="
    );

    console.log(
      "MongoDB connected successfully"
    );

    console.log(
      "================================="
    );

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "MongoDB connection failed"
    );

    console.error(
      "================================="
    );

    console.error(
      error.message
    );
  }
};


// ==========================================
// SERVER
// ==========================================

const PORT =
  process.env.PORT || 10000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on 0.0.0.0:${PORT}`
    );
  }
);

// ==========================================
// START DATABASE
// ==========================================

connectDatabase();