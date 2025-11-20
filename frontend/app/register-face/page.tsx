"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function RegisterFacePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Initializing camera...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadModels() {
      try {
        await faceapi.nets.tinyFaceDetector.load("/models");
        await faceapi.nets.faceLandmark68Net.load("/models");
        await faceapi.nets.faceRecognitionNet.load("/models");

        startCamera();
      } catch (err) {
        setStatus("Failed to load face models.");
      }
    }
    loadModels();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

    const captureFace = async () => {
    setLoading(true);
    setStatus("Detecting face...");

    const video = videoRef.current;
    if (!video) return;

    const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        setStatus("No face detected. Try again.");
        setLoading(false);
        return;
    }

    const descriptor = Array.from(detection.descriptor);

    const token = localStorage.getItem("attendance_token");

    const res = await fetch("http://localhost:5000/api/face/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ descriptor }),
    });

    const data = await res.json();

    if (res.ok) {
        setStatus("Face registered successfully!");
    } else {
        setStatus(data.message || "Registration failed.");
    }

    setLoading(false);
    };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Register Your Face</h1>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="420"
        height="320"
        className="rounded-lg shadow-lg"
      />

      <p className="mt-4 text-gray-700">{status}</p>

      <button
        onClick={captureFace}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
      >
        {loading ? "Processing..." : "Save My Face"}
      </button>

      <a href="/" className="mt-4 text-blue-600 underline">
        Back to Home
      </a>
    </div>
  );
}
