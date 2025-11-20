"use client";

import { useEffect, useState } from "react";
import { FiRefreshCcw } from "react-icons/fi";
import { GoLocation } from "react-icons/go";
import { AUTH_TOKEN } from "../config/auth";

type LocationStatusProps = {
  authorizedLat: number;
  authorizedLng: number;
  onStatusChange?: (payload: {
    withinRange: boolean;
    latitude: number | null;
    longitude: number | null;
    distanceMeters: number | null;
  }) => void;
  setAuthorizedLocation?: (lat: number, lng: number) => void;
};

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LocationStatus({
  authorizedLat,
  authorizedLng,
  onStatusChange,
  setAuthorizedLocation,
}: LocationStatusProps) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [withinRange, setWithinRange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const RADIUS_METERS = 200;

  // 📌 Update location state
  const updateLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);

    const distance = haversineDistanceMeters(lat, lng, authorizedLat, authorizedLng);
    setDistanceMeters(distance);

    const inside = distance <= RADIUS_METERS;
    setWithinRange(inside);

    onStatusChange?.({
      withinRange: inside,
      latitude: lat,
      longitude: lng,
      distanceMeters: distance,
    });
  };

  // 📌 Watch user location live
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported.");
      return;
    }

    setIsLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setIsLoading(false);
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setError("Unable to get location.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [authorizedLat, authorizedLng]);

  // 📌 Refresh button
  const handleRefresh = () => {
    if (!("geolocation" in navigator)) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        setIsLoading(false);
      },
      () => setIsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  // 📌 Save current location as authorized
  const handleSetAuthorized = async () => {
    if (!latitude || !longitude) {
      alert("Location not ready yet.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attendance/set-authorized-location`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Authorized location updated successfully!");

      // update parent state
      setAuthorizedLocation?.(latitude, longitude);

    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="bg-white rounded-[28px] px-6 py-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full">
              <GoLocation />
            </span>
            <span className="font-semibold text-lg">Location Status</span>
          </div>

          <button onClick={handleRefresh} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full">
            <FiRefreshCcw />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className={`w-3 h-3 rounded-full ${withinRange ? "bg-green-500" : "bg-red-500"}`} />
          <span className="font-semibold">
            {isLoading
              ? "Checking location..."
              : error
              ? "Location unavailable"
              : withinRange
              ? "You are within range"
              : "You are out of range"}
          </span>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          {distanceMeters !== null
            ? `${Math.round(distanceMeters)}m from authorized location`
            : "Calculating…"}
        </p>

        <button
          onClick={handleSetAuthorized}
          className="text-blue-600 underline text-sm"
        >
          Set Current Location as Authorized (Trial Only)
        </button>
      </div>
    </div>
  );
}
