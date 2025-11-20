"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceVerify({ onVerified }: { onVerified: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // Load face models
  useEffect(() => {
    async function loadModels() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      setModelsLoaded(true);
    }
    loadModels();
  }, []);

  // start webcam
  useEffect(() => {
    if (!modelsLoaded) return;

    navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, [modelsLoaded]);

  // verify face
  const verifyFace = async () => {
    setVerifying(true);

    const detection = await faceapi
      .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setVerifying(false);
      alert("Face not detected.");
      return;
    }

    const descriptorArray = Array.from(detection.descriptor);

    const token = localStorage.getItem("attendance_token");

    const res = await fetch(`${API_BASE}/api/face/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ descriptor: descriptorArray }),
    });

    const data = await res.json();

    setVerifying(false);

    if (res.ok) {
      alert("Face Verified ✔");
      onVerified(); // allow clock-in
    } else {
      alert("Face verification failed ❌");
    }
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-2">Verify Your Face</h2>

      <video ref={videoRef} autoPlay muted width="350" className="rounded-lg shadow" />

      <button
        onClick={verifyFace}
        disabled={verifying}
        className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {verifying ? "Verifying..." : "Verify Face"}
      </button>
    </div>
  );
}
