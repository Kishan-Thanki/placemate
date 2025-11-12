import React from "react";
import { MapPin } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export function DriveCard({ drive, canApply = false }) {
  const { isDark } = useTheme();

  return (
    <div
      className={`p-5 rounded-xl shadow-sm border transition hover:shadow-md ${
        isDark
          ? "bg-gray-800 border-gray-700 hover:border-gray-600"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3
            className={`text-base font-semibold ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {drive.company}
          </h3>
          <p
            className={`text-sm flex items-center ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <MapPin className="w-4 h-4 mr-1" /> {drive.location}
          </p>
        </div>
      </div>

      {/* Role */}
      <p
        className={`font-medium mt-2 ${
          isDark ? "text-gray-200" : "text-gray-900"
        }`}
      >
        {drive.role}
      </p>

      {/* Type Badge */}
      <span
        className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full ${
          drive.type === "Internship"
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {drive.type}
      </span>

      {/* Description */}
      <p
        className={`mt-3 text-sm line-clamp-3 ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        {drive.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <p
          className={`text-sm font-semibold ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
        >
          {drive.stipend}
        </p>
        <div className="flex items-center gap-3">
          <button
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              isDark
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            View
          </button>

          {canApply ? (
            <button className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
              Apply
            </button>
          ) : (
            <button disabled className={`px-3 py-1.5 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`} title="Not eligible for this drive">
              Not eligible
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
