import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, LoadingOverlay } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import { CalendarDays, Save, X, ArrowLeft } from "lucide-react";
import { placementService } from "../../../services/placementService";

export default function PlacementDriveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
  });

  const isEditMode = !!id;

  const fetchDriveData = async () => {
    setLoadingData(true);
    try {
      const response = await placementService.getDriveById(id);
      const drive = response.data || response;

      setFormData({
        title: drive.title || "",
        start_date: drive.start_date
          ? new Date(drive.start_date).toISOString().slice(0, 16)
          : "",
        end_date: drive.end_date
          ? new Date(drive.end_date).toISOString().slice(0, 16)
          : "",
      });
    } catch (err) {
      console.error("Error fetching drive data:", err);
      setError("Failed to load drive data");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchDriveData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        setError("End date must be after start date");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (isEditMode) {
        await placementService.updateDrive(id, submitData);

        const successMsg = document.createElement("div");
        successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
        }`;
        successMsg.textContent = "Placement drive updated successfully!";
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);

        navigate(`/admin/placement-drives/${id}`);
      } else {
        const response = await placementService.createDrive(submitData);
        const createdDrive = response.data || response;

        const successMsg = document.createElement("div");
        successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
        }`;
        successMsg.textContent = "Placement drive created successfully!";
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);

        navigate(`/admin/placement-drives/${createdDrive.id}`);
      }
    } catch (err) {
      console.error("Error saving placement drive:", err);
      setError(
        err.message || "Failed to save placement drive. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/admin/placement-drives/${id}`);
    } else {
      navigate("/admin/placement-drives");
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout
        title={isEditMode ? "Edit Placement Drive" : "Add New Placement Drive"}
      >
        <PageContainer>
          <LoadingOverlay message="Loading placement drive data..." />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isEditMode ? "Edit Placement Drive" : "Add New Placement Drive"}
    >
      <PageContainer>
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/placement-drives")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Placement Drives
          </Button>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <LoadingOverlay
            message={
              isEditMode
                ? "Updating placement drive..."
                : "Creating placement drive..."
            }
          />
        )}

        <Section>
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            {/* Error Message */}
            {error && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  isDark
                    ? "bg-red-900/20 border-red-900 text-red-400"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                <p className="font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Form Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-3 rounded-lg ${
                    isDark
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isEditMode ? "Edit Placement Drive" : "Create New Drive"}
                  </h2>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {isEditMode
                      ? "Update the placement drive details"
                      : "Add a new placement drive to organize company visits"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div
              className={`space-y-6 p-6 rounded-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Drive Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Campus Drive 2025"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="start_date"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p
                  className={`mt-1 text-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Optional: When the placement drive begins
                </p>
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor="end_date"
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p
                  className={`mt-1 text-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Optional: When the placement drive ends
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? "Update Drive" : "Create Drive"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                variant="secondary"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
