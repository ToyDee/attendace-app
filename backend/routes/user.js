router.post("/save-face", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.faceDescriptor = req.body.descriptor;
    await user.save();

    res.json({ message: "Face registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error saving face" });
  }
});
