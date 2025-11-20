"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LocationStatus from "./components/LocationStatus";
import { WiSunrise, WiSunset, WiMoonAltWaxingCrescent5 } from "react-icons/wi";
import { FaMugHot, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import FaceVerify from "./components/FaceVerify";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function Home() {
  const router = useRouter();

  const [now, setNow] = useState(new Date());
  const [session, setSession] = useState("");
  const [withinRange, setWithinRange] = useState(false);
  const [userLocation, setUserLocation] = useState({
    lat: null as number | null,
    lng: null as number | null,
  });

  const [token, setToken] = useState<string | null>(null);
  const [authLat, setAuthLat] = useState(13.7563);
  const [authLng, setAuthLng] = useState(100.5018);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFaceVerify, setShowFaceVerify] = useState(false);


  useEffect(() => {
    const saved = localStorage.getItem("attendance_token");

    if (!saved) {
      router.replace("/login");
    } else {
      setToken(saved);
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // LOAD AUTHORIZED LOCATION FROM BACKEND
  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/attendance/my-attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.latitude && data.longitude) {
          setAuthLat(data.latitude);
          setAuthLng(data.longitude);
        }
      } catch (e) {
        console.error("Failed to load authorized location");
      }
    }

    load();
  }, [token]);

  const timeText = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateText = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleClockRequest = async (type: "clock-in" | "clock-out") => {
    if (!session) {
      alert("Please select a session.");
      return;
    }
    if (!withinRange) {
      alert("You are outside the authorized range.");
      return;
    }
    if (!userLocation.lat || !userLocation.lng) {
      alert("Location not ready yet.");
      return;
    }
    if (!token) {
      alert("Session expired. Please login again.");
      router.replace("/login");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE}/api/attendance/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(type === "clock-in" ? "Clock In successful!" : "Clock Out successful!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (token === null) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex justify-center">
      <div className="w-full max-w-md px-4 pb-12">
        
        {/* HEADER */}
        <div className="flex flex-col items-center pt-8">
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow mb-4">
            <img src="/logo.png" className="w-12 h-12" />
          </div>

          <h1 className="text-[32px] font-bold">Attendance Tracker</h1>
          <p className="mt-2 text-3xl font-semibold">{timeText}</p>
          <p className="mt-1 text-base text-gray-500">{dateText}</p>
        </div>

        {/* LOCATION STATUS */}
        <LocationStatus
        authorizedLat={authLat}
        authorizedLng={authLng}
        setAuthorizedLocation={(lat, lng) => {
          console.log("Updated authorized location:", lat, lng);
          setAuthLat(lat);
          setAuthLng(lng);
        }}
        onStatusChange={(payload) => {
          setWithinRange(payload.withinRange);
          setUserLocation({
            lat: payload.latitude,
            lng: payload.longitude,
          });
        }}
          />



        {/* SESSION BUTTONS */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { key: "morning", label: "Morning", icon: <WiSunrise className="text-4xl text-blue-500" /> },
            { key: "lunch", label: "Lunch", icon: <FaMugHot className="text-3xl text-gray-700" /> },
            { key: "afternoon", label: "Afternoon", icon: <WiSunset className="text-4xl text-orange-400" /> },
            { key: "evening", label: "Evening", icon: <WiMoonAltWaxingCrescent5 className="text-4xl text-gray-700" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSession(key)}
              className={`h-28 rounded-[24px] border-2 flex flex-col items-center justify-center shadow-sm ${
                session === key ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
              }`}
            >
              {icon}
              <span className={`text-base font-medium ${session === key ? "text-blue-600" : "text-gray-700"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* CLOCK IN / OUT */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => setShowFaceVerify(true)}
            disabled={!withinRange || isSubmitting}
            className={`flex-1 h-20 rounded-[26px] flex items-center justify-center gap-3 text-xl font-semibold ${
              !withinRange || isSubmitting
                ? "bg-blue-400/60 cursor-not-allowed"
                : "bg-[#1063FF] hover:bg-[#0b4fd1]"
            } text-white`}
          >
            <FaSignInAlt className="text-2xl" /> Clock In
          </button>

          <button
            onClick={() => handleClockRequest("clock-out")}
            disabled={!withinRange || isSubmitting}
            className={`flex-1 h-20 rounded-[26px] flex items-center justify-center gap-3 text-xl font-semibold ${
              !withinRange || isSubmitting
                ? "bg-orange-400/60 cursor-not-allowed"
                : "bg-[#FF6A21] hover:bg-[#e5550e]"
            } text-white`}
          >
            <FaSignOutAlt className="text-2xl" /> Clock Out
          </button>
        </div>

        <div className="mt-4 text-center text-sm">
          <a href="/history" className="text-blue-600 underline">
            View Attendance History
          </a>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("attendance_token");
            router.replace("/login");
          }}
          className="mt-4 text-xs text-gray-400 underline"
        >
          Logout
        </button>

        {showFaceVerify && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <FaceVerify
              onVerified={() => {
                setShowFaceVerify(false);
                handleClockRequest("clock-in"); // ⬅ your existing function
              }}
            />
            <button
              onClick={() => setShowFaceVerify(false)}
              className="mt-4 text-sm text-red-600 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}