const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Euclidean distance
function euclideanDistance(des1, des2) {
  let sum = 0;
  for (let i = 0; i < des1.length; i++) {
    sum += Math.pow(des1[i] - des2[i], 2);
  }
  return Math.sqrt(sum);
}

// Verify face
router.post("/verify", auth, async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ message: "Invalid descriptor" });
    }

    const user = await User.findById(req.userId);

    if (!user || !user.faceDescriptor.length) {
      return res.status(400).json({ message: "No face registered" });
    }

    const distance = euclideanDistance(descriptor, user.faceDescriptor);

    if (distance < 0.55) {
      return res.json({ success: true, message: "Face verified" });
    } else {
      return res.status(401).json({ success: false, message: "Face mismatch" });
    }

  } catch (error) {
    console.error("FACE VERIFY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
