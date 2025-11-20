const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/set-authorized-location", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude & Longitude required" });
    }

    await Attendance.findOneAndUpdate(
      { user: userId },
      { authorizedLat: latitude, authorizedLng: longitude },
      { upsert: true }
    );

    res.json({ success: true, message: "Authorized location updated!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get authorized location
router.get("/authorized-location", async (req, res) => {
  try {
    const location = await AuthorizedLocation.findOne();

    if (!location)
      return res.status(200).json({ latitude: null, longitude: null });

    res.json({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;