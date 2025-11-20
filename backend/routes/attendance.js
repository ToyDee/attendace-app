const express = require('express');
const Attendance = require('../models/Attendance');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware: verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Utility: calculate distance in meters
function getDistance(lat1, lng1, lat2, lng2) {
  lat1 = Number(lat1);
  lng1 = Number(lng1);
  lat2 = Number(lat2);
  lng2 = Number(lng2);

  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// CLOCK IN
router.post('/clock-in', auth, async (req, res) => {
  const { session, latitude, longitude } = req.body;

  // Use updated location (trial mode)
  const AUTH_LAT = global.AUTHORIZED_LAT ?? Number(process.env.AUTH_LAT);
  const AUTH_LNG = global.AUTHORIZED_LNG ?? Number(process.env.AUTH_LNG);

  const MAX_RADIUS = Number(process.env.MAX_RADIUS_METERS) || 200;

  const distance = getDistance(latitude, longitude, AUTH_LAT, AUTH_LNG);

  if (distance > MAX_RADIUS) {
    return res.status(400).json({ message: "You are outside authorized area" });
  }

  const record = await Attendance.create({
    user: req.userId,
    session,
    latitude,
    longitude,
    clockIn: new Date(),
  });

  res.json({ message: "Clocked in", record });
});

// CLOCK OUT
router.post('/clock-out', auth, async (req, res) => {
  const { session } = req.body;

  const record = await Attendance.findOne({
    user: req.userId,
    session,
    clockOut: null
  });

  if (!record) {
    return res.status(400).json({ message: "No active record found" });
  }

  record.clockOut = new Date();
  await record.save();

  res.json({ message: "Clocked out", record });
});

// FETCH USER ATTENDANCE
router.get('/my-attendance', auth, async (req, res) => {
  const records = await Attendance.find({ user: req.userId });
  res.json(records);
});

// UPDATE AUTHORIZED LOCATION (Trial)
router.post('/set-authorized-location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Missing coordinates" });
    }

    global.AUTHORIZED_LAT = Number(latitude);
    global.AUTHORIZED_LNG = Number(longitude);

    console.log("🔵 Updated authorized location:");
    console.log("LAT:", global.AUTHORIZED_LAT);
    console.log("LNG:", global.AUTHORIZED_LNG);

    res.json({
      message: "Authorized location updated (trial mode only)",
      authorizedLat: global.AUTHORIZED_LAT,
      authorizedLng: global.AUTHORIZED_LNG
    });
  } catch (err) {
    console.error("Error updating authorized location:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;