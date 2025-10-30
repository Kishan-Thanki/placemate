import React, { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Spinner,
  PulsingDots,
  LoadingOverlay,
  TableRowSkeleton,
  CardSkeleton,
  LoadingButton,
  ShimmerPlaceholder,
} from "./Spinner";

/**
 * Demo component to showcase all loading animations
 * This can be used for testing or as a reference
 */
export default function LoadingDemo() {
  const { isDark } = useTheme();
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <div className={`p-8 space-y-12 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1
        className={`text-3xl font-bold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Loading Animations Demo
      </h1>

      {/* Spinners */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Spinners
        </h2>
        <div className="flex items-center gap-8">
          <div className="space-y-2 text-center">
            <Spinner size="sm" />
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Small</p>
          </div>
          <div className="space-y-2 text-center">
            <Spinner size="md" />
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Medium</p>
          </div>
          <div className="space-y-2 text-center">
            <Spinner size="lg" />
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Large</p>
          </div>
          <div className="space-y-2 text-center">
            <Spinner size="xl" />
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Extra Large
            </p>
          </div>
        </div>
      </section>

      {/* Pulsing Dots */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Pulsing Dots
        </h2>
        <PulsingDots />
      </section>

      {/* Loading Button */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Loading Button
        </h2>
        <LoadingButton
          loading={buttonLoading}
          onClick={handleButtonClick}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isDark
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Click Me
        </LoadingButton>
      </section>

      {/* Shimmer Placeholder */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Shimmer Placeholder
        </h2>
        <ShimmerPlaceholder lines={5} />
      </section>

      {/* Card Skeleton */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Card Skeleton
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>

      {/* Table Row Skeleton */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Table Skeleton
        </h2>
        <div
          className={`overflow-x-auto rounded-xl border ${
            isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <table className="min-w-full text-sm">
            <thead
              className={`${
                isDark
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <tr>
                {["Name", "Email", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Loading Overlay */}
      <section className="space-y-4">
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Loading Overlay
        </h2>
        <button
          onClick={() => setShowOverlay(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isDark
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          Show Full-Screen Overlay
        </button>
      </section>

      {showOverlay && (
        <div onClick={() => setShowOverlay(false)}>
          <LoadingOverlay message="Loading data..." />
        </div>
      )}
    </div>
  );
}
