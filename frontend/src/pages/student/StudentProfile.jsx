import React, { useState, useEffect, useRef } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { Card, Button } from "../../components/ui";
import { LoadingOverlay } from "../../components/ui/Spinner";
import { ToastContainer } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  Edit,
  Save,
  X,
  Camera,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { fetchJSON } from "../../lib/api";

const StudentProfile = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const { ok, data: response } = await fetchJSON("/api/v1/students/me/", {
        method: "GET",
        credentials: "include",
      });

      if (!ok || !response?.data) {
        throw new Error("Failed to load profile");
      }

      setStudent(response.data);
      // Initialize form data with editable fields only
      setFormData({
        date_of_birth: response.data.date_of_birth || "",
        gender: response.data.gender || "",
        address_line1: response.data.address_line1 || "",
        address_line2: response.data.address_line2 || "",
        postal_code: response.data.postal_code || "",
        current_cgpa: response.data.current_cgpa || "",
        graduation_cgpa: response.data.graduation_cgpa || "",
        active_backlogs: response.data.active_backlogs || 0,
        tenth_percentage: response.data.tenth_percentage || "",
        twelfth_percentage: response.data.twelfth_percentage || "",
      });
    } catch (err) {
      console.error("Error fetching student profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset form data
      setFormData({
        date_of_birth: student.date_of_birth || "",
        gender: student.gender || "",
        address_line1: student.address_line1 || "",
        address_line2: student.address_line2 || "",
        postal_code: student.postal_code || "",
        current_cgpa: student.current_cgpa || "",
        graduation_cgpa: student.graduation_cgpa || "",
        active_backlogs: student.active_backlogs || 0,
        tenth_percentage: student.tenth_percentage || "",
        twelfth_percentage: student.twelfth_percentage || "",
      });
      setProfilePicture(null);
      setProfilePicturePreview(null);
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showError("Please select a valid image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showError("Image size should be less than 5MB");
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Update student profile
      const formDataToSend = new FormData();

      if (profilePicture) {
        formDataToSend.append("profile_picture", profilePicture);
      }

      if (formData.date_of_birth) {
        const date = new Date(formData.date_of_birth);
        if (!isNaN(date.getTime())) {
          formDataToSend.append(
            "date_of_birth",
            date.toISOString().split("T")[0]
          );
        }
      }

      Object.keys(formData).forEach((key) => {
        if (key === "date_of_birth") return;
        const value = formData[key];
        if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(key, value);
        }
      });

      const { ok: profileOk, message: profileMessage } = await fetchJSON(
        "/api/v1/students/me/",
        {
          method: "PATCH",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!profileOk) {
        throw new Error(profileMessage || "Failed to update profile");
      }

      await fetchStudentProfile();
      setIsEditMode(false);
      setProfilePicture(null);
      setProfilePicturePreview(null);
      success("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      showError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout title="My Profile">
        <LoadingOverlay message="Loading profile..." />
      </StudentLayout>
    );
  }

  if (error || !student) {
    return (
      <StudentLayout title="My Profile">
        <PageContainer>
          <Section>
            <div
              className={`p-8 rounded-lg text-center ${
                isDark ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
                {error || "Profile not found"}
              </p>
            </div>
          </Section>
        </PageContainer>
      </StudentLayout>
    );
  }

  const currentProfilePic =
    profilePicturePreview ||
    student.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      student.user?.full_name || "Student"
    )}&size=200&background=3B82F6&color=fff`;

  return (
    <StudentLayout title="My Profile">
      <PageContainer>
        <Section
          action={
            <div className="flex gap-3">
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    <X size={18} className="mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    <Save size={18} className="mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={handleEditToggle}>
                  <Edit size={18} className="mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* Profile Header Card */}
            <Card>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Picture */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img
                      src={currentProfilePic}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                    />
                    {isEditMode && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`absolute bottom-0 right-0 p-2 rounded-full ${
                          isDark
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-blue-500 hover:bg-blue-600"
                        } text-white transition-colors`}
                      >
                        <Camera size={18} />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </div>
                  {profilePicturePreview && isEditMode && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="mt-2 text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2
                        className={`text-2xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {student.user?.full_name || "Student"}
                      </h2>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {student.enrollment_number}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {student.is_verified && (
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            isDark
                              ? "bg-green-900 text-green-300"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          <ShieldCheck size={14} />
                          Verified
                        </div>
                      )}
                      {student.is_placed && (
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            isDark
                              ? "bg-blue-900 text-blue-300"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Award size={14} />
                          Placed
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem
                      icon={Mail}
                      label="Email"
                      value={student.user?.email}
                      isDark={isDark}
                    />
                    <InfoItem
                      icon={Phone}
                      label="Phone"
                      value={student.user?.phone_number}
                      isDark={isDark}
                    />
                    <InfoItem
                      icon={GraduationCap}
                      label="Program"
                      value={student.program}
                      isDark={isDark}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Joining Year"
                      value={student.joining_year}
                      isDark={isDark}
                    />
                  </div>
                </div>
              </div>

              {/* Verification Warning */}
              {!student.is_verified && (
                <div
                  className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                    isDark
                      ? "bg-yellow-900/20 border border-yellow-700"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <AlertCircle
                    size={20}
                    className={isDark ? "text-yellow-400" : "text-yellow-600"}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDark ? "text-yellow-400" : "text-yellow-800"
                      }`}
                    >
                      Profile Not Verified
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDark ? "text-yellow-500" : "text-yellow-700"
                      }`}
                    >
                      Please complete all required fields (10th %, 12th %, and
                      Current CGPA) to get verified and apply for placements.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Personal Details */}
            <Card title="Personal Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                />
                <FormField
                  label="Gender"
                  name="gender"
                  type="select"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  options={[
                    { value: "", label: "Select Gender" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                    { value: "Prefer not to say", label: "Prefer not to say" },
                  ]}
                />
              </div>
            </Card>

            {/* Address */}
            <Card title="Address">
              <div className="space-y-4">
                <FormField
                  label="Address Line 1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="Street address, building name, etc."
                />
                <FormField
                  label="Address Line 2"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="Apartment, suite, unit, etc."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      City
                    </label>
                    <div
                      className={`px-4 py-2 rounded-lg border ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-gray-400"
                          : "bg-gray-50 border-gray-300 text-gray-600"
                      }`}
                    >
                      {student.city || "Not specified"}
                    </div>
                  </div>
                  <FormField
                    label="Postal Code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    disabled={!isEditMode}
                    isDark={isDark}
                    placeholder="e.g., 382421"
                  />
                </div>
              </div>
            </Card>

            {/* Academic Details */}
            <Card title="Academic Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="10th Percentage"
                  name="tenth_percentage"
                  type="number"
                  value={formData.tenth_percentage}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="e.g., 85.50"
                  step="0.01"
                  required
                />
                <FormField
                  label="12th Percentage"
                  name="twelfth_percentage"
                  type="number"
                  value={formData.twelfth_percentage}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="e.g., 90.00"
                  step="0.01"
                  required
                />
                <FormField
                  label="Current CGPA"
                  name="current_cgpa"
                  type="number"
                  value={formData.current_cgpa}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="e.g., 8.50"
                  step="0.01"
                  required
                />
                <FormField
                  label="Graduation CGPA"
                  name="graduation_cgpa"
                  type="number"
                  value={formData.graduation_cgpa}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="e.g., 8.75"
                  step="0.01"
                />
                <FormField
                  label="Active Backlogs"
                  name="active_backlogs"
                  type="number"
                  value={formData.active_backlogs}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  isDark={isDark}
                  placeholder="0"
                  min="0"
                />
              </div>
            </Card>
          </div>
        </Section>
      </PageContainer>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </StudentLayout>
  );
};

// Helper Components
const InfoItem = ({ icon: Icon, label, value, isDark }) => (
  <div className="flex items-start gap-3">
    <Icon
      size={20}
      className={`mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
    />
    <div>
      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        {label}
      </p>
      <p
        className={`text-sm font-medium ${
          isDark ? "text-gray-200" : "text-gray-900"
        }`}
      >
        {value || "Not specified"}
      </p>
    </div>
  </div>
);

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  disabled,
  isDark,
  placeholder,
  options,
  required,
  ...props
}) => (
  <div>
    <label
      className={`block text-sm font-medium mb-2 ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border ${
          disabled
            ? isDark
              ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
            : isDark
            ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-2 rounded-lg border ${
          disabled
            ? isDark
              ? "bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
            : isDark
            ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
        {...props}
      />
    )}
  </div>
);

export default StudentProfile;
