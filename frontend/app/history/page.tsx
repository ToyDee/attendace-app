"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function HistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("attendance_token");
    if (!token) return;

    async function loadHistory() {
      try {
        const res = await fetch(`${API_BASE}/api/attendance/my-attendance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setRecords(data);
        } else {
          alert(data.message || "Failed to fetch history");
        }
      } catch (err) {
        console.error(err);
        alert("Network error");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading history…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Attendance History
      </h1>

      {records.length === 0 ? (
        <p className="text-center text-gray-500">No records found</p>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec._id}
              className="bg-white p-4 rounded-xl shadow border border-gray-100"
            >
              <p className="font-semibold text-gray-900">
                Session: {rec.session}
              </p>
              <p className="text-sm text-gray-600">
                Clock In:{" "}
                {rec.clockIn
                  ? new Date(rec.clockIn).toLocaleString()
                  : "Not recorded"}
              </p>
              <p className="text-sm text-gray-600">
                Clock Out:{" "}
                {rec.clockOut
                  ? new Date(rec.clockOut).toLocaleString()
                  : "Not yet"}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-6">
        <a href="/" className="text-blue-600 underline">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
