import React from "react";
import { MapPin } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

function toText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") return String(v.name || v.title || v.company || v.display_name || "");
  return String(v);
}

export function DriveCard({ drive, canApply = false, showApply = false }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // API returns nested objects: company and placement_drive are objects
  const companyName = drive?.company ? toText(drive.company.name || drive.company) : "Unknown Company";
  const placementTitle = drive?.placement_drive ? toText(drive.placement_drive.title || drive.placement_drive) : "";
  const locationLabel = Array.isArray(drive.locations) ? drive.locations.join(", ") : toText(drive.locations) || toText(drive.headquarters_city) || "";
  const roleLabel = toText(drive.role || drive.position || "");
  const typeLabel = toText(drive.drive_type || drive.type || "");
  const descLabel = toText(drive.description || "");
  const stipendLabel = toText(drive.stipend || drive.ug_stipend || "");

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
          <h3 className={`text-base font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            {companyName}
          </h3>
          <p className={`text-sm flex items-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            <MapPin className="w-4 h-4 mr-1" /> {locationLabel}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          {placementTitle}
        </div>
      </div>

      {/* Role */}
      <p className={`font-medium mt-2 ${isDark ? "text-gray-200" : "text-gray-900"}`}>{roleLabel}</p>

      {/* Type Badge */}
      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full ${
        typeLabel.toLowerCase().includes("intern") ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
      }`}>{typeLabel}</span>

      {/* Description */}
      <p className={`mt-3 text-sm line-clamp-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{descLabel}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <p className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>{stipendLabel}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/student/company-drives/${drive.id}`)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              isDark ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            View
          </button>

          {showApply ? (
            canApply ? (
              <button className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}>
                Apply
              </button>
            ) : (
              <button disabled className={`px-3 py-1.5 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`} title="Not eligible for this drive">
                Not eligible
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
