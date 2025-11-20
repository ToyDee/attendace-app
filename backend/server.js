const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const setLocationRoutes = require("./routes/setLocation");
const faceRoutes = require("./routes/face");
const faceVerifyRoutes = require("./routes/faceVerify");

dotenv.config();  // load .env
connectDB();      // connect to MongoDB

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use("/api/history", require("./routes/historyRoutes"));
app.use("/api/attendance", setLocationRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/face", faceVerifyRoutes);

app.get("/", (req, res) => {
  res.send("Attendance backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});