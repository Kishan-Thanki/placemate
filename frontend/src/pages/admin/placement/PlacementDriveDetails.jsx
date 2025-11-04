import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import {
  Button,
  CardSkeleton,
  ShimmerPlaceholder,
} from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  CalendarDays,
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Briefcase,
} from "lucide-react";
import { placementService } from "../../../services/placementService";

export default function PlacementDriveDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDriveDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await placementService.getDriveById(id);

      if (response.success && response.data) {
        setDrive(response.data);
      } else {
        setDrive(response.data || response);
      }
    } catch (err) {
      console.error("Error fetching drive details:", err);
      setError(err.message || "Failed to load drive details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${drive.title}"? This cannot be undone.`))
      return;

    try {
      await placementService.deleteDrive(id);
      navigate("/admin/placement-drives", {
        state: { message: "Placement drive deleted successfully!" },
      });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete placement drive. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Drive Details">
        <PageContainer>
          <Section>
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div
                className={`p-6 rounded-xl border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div
                    className={`w-16 h-16 rounded-xl animate-pulse ${
                      isDark ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  />
                  <div className="flex-1 space-y-3">
                    <div
                      className={`h-8 w-2/3 rounded animate-pulse ${
                        isDark ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    />
                    <ShimmerPlaceholder lines={2} />
                  </div>
                </div>
              </div>

              {/* Content Skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error || !drive) {
    return (
      <DashboardLayout title="Drive Details">
        <PageContainer>
          <div
            className={`text-center py-12 rounded-lg border ${
              isDark
                ? "bg-red-900/20 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <p className="text-lg font-medium mb-4">
              ❌ {error || "Placement drive not found"}
            </p>
            <Button onClick={() => navigate("/admin/placement-drives")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Drives
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={drive.title}>
      <PageContainer>
        <Section
          action={
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/placement-drives")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => navigate(`/admin/placement-drives/${id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Header Card */}
            <div
              className={`p-6 rounded-xl border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-16 h-16 flex items-center justify-center rounded-xl ${
                      isDark
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <CalendarDays className="w-8 h-8" />
                  </div>
                </div>

                {/* Drive Info */}
                <div className="flex-1">
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {drive.title}
                  </h2>
                  <div
                    className={`space-y-2 ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatShortDate(drive.start_date)} -{" "}
                        {formatShortDate(drive.end_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drive Dates Card */}
              <div
                className={`p-6 rounded-xl border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  Drive Schedule
                </h3>
                <div className="space-y-3">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Start Date
                    </p>
                    <p
                      className={`font-medium ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {formatDate(drive.start_date)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      End Date
                    </p>
                    <p
                      className={`font-medium ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {formatDate(drive.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata Card */}
              <div
                className={`p-6 rounded-xl border ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  <CalendarDays className="w-5 h-5" />
                  Drive Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Created
                    </p>
                    <p
                      className={`font-medium ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {formatDate(drive.created_at)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Last Updated
                    </p>
                    <p
                      className={`font-medium ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {formatDate(drive.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Drives Section */}
            <div
              className={`p-6 rounded-xl border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-lg font-semibold flex items-center gap-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  Associated Companies
                </h3>
                <Button
                  onClick={() =>
                    navigate(`/admin/drives/new?placement_drive=${id}`)
                  }
                  size="sm"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Add Company Drive
                </Button>
              </div>
              <div
                className={`text-center py-8 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  No company drives associated with this placement drive yet.
                </p>
                <p className="text-sm mt-1">
                  Add company drives to organize company visits and job
                  postings.
                </p>
              </div>
            </div>
          </div>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
