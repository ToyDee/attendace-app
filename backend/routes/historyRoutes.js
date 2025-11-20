const express = require('express');
const Attendance = require('../models/Attendance');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET attendance history for logged in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const history = await Attendance.find({ userId: req.user.id })
      .sort({ timestamp: -1 });

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching history" });
  }
});

module.exports = router;