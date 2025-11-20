"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const FaceTestPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        setModelsLoaded(true);
      } catch (err) {
        console.error(err);
        setError("Failed to load face models");
      }
    };

    loadModels();
  }, []);

  // 2) Start camera once models loaded
  useEffect(() => {
    if (!modelsLoaded) return;

    const startVideo = async () => {
      try {
        setLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Cannot access camera. Please allow permission.");
        setLoading(false);
      }
    };

    startVideo();
  }, [modelsLoaded]);

  // 3) Run detection in a loop
  useEffect(() => {
    let intervalId: number;

    const runDetection = async () => {
      if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

      const video = videoRef.current;

      if (!video.videoWidth || !video.videoHeight) return;

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );

      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const resized = faceapi.resizeResults(detections, displaySize);
      canvas
        .getContext("2d")
        ?.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);

      setFaceDetected(detections.length > 0);
    };

    if (modelsLoaded) {
      intervalId = window.setInterval(runDetection, 700);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [modelsLoaded]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center pt-8">
      <h1 className="text-2xl font-bold mb-4">Face Test</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {!error && (loading || !modelsLoaded) && (
        <p className="text-gray-500 mb-2">Loading camera & models…</p>
      )}

      <div className="relative w-[320px] h-[240px] bg-black rounded-xl overflow-hidden shadow">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <p className="mt-4 text-lg font-semibold">
        {faceDetected ? "✅ Face detected" : "❌ No face detected"}
      </p>

      <a href="/" className="mt-4 text-blue-600 underline">
        ← Back to Home
      </a>
    </div>
  );
};

export default FaceTestPage;
