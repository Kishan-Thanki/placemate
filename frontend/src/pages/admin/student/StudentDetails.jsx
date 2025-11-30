import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Card, Button } from "../../../components/ui";
import { LoadingOverlay } from "../../../components/ui/Spinner";
import { ToastContainer } from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Award,
  Edit,
  Save,
  X,
  Trash2,
  Camera,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { studentService } from "../../../services/studentService";

const StudentDetails = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(
    searchParams.get("edit") === "true"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [updatingVerification, setUpdatingVerification] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentDetails();
  }, [userId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentService.getStudentProfileByUser(userId);
      console.log("📋 Student Details Response:", response);
      console.log("👤 User data:", response?.data?.user);
      console.log("📧 Email:", response?.data?.user?.email);
      // Set only the data property, not the entire response
      setStudent(response.data);
      // Initialize form data with current student data (exclude city as it's a ForeignKey)
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
      console.error("Error fetching student details:", err);
      setError(err.message || "Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset form data (exclude city as it's a ForeignKey)
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
      // Reset profile picture
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
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("Image size should be less than 5MB");
        return;
      }

      setProfilePicture(file);
      // Create preview URL
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

      // Always use FormData for consistency with backend expectations
      const formDataToSend = new FormData();

      // Add profile picture if selected
      if (profilePicture) {
        formDataToSend.append("profile_picture", profilePicture);
      }

      // Format date_of_birth to YYYY-MM-DD if present
      if (formData.date_of_birth) {
        const date = new Date(formData.date_of_birth);
        if (!isNaN(date.getTime())) {
          formDataToSend.append(
            "date_of_birth",
            date.toISOString().split("T")[0]
          );
        }
      }

      // Add all other non-empty fields
      Object.keys(formData).forEach((key) => {
        if (key === "date_of_birth") return; // Already handled above

        const value = formData[key];
        // Only append non-empty values
        if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(key, value);
        }
      });

      await studentService.updateStudentProfile(userId, formDataToSend);

      // Refresh student data
      await fetchStudentDetails();
      setIsEditMode(false);
      setProfilePicture(null);
      setProfilePicturePreview(null);
      success("Student details updated successfully!");
    } catch (err) {
      console.error("Error updating student details:", err);
      showError(err.message || "Failed to update student details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await studentService.deleteStudentProfile(userId);
      success("Student profile deleted successfully!");
      setTimeout(() => {
        navigate("/admin/students");
      }, 1500);
    } catch (err) {
      console.error("Error deleting student profile:", err);
      showError(err.message || "Failed to delete student profile");
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/students");
  };

  const canBeVerified = () => {
    return (
      student.tenth_percentage != null &&
      student.twelfth_percentage != null &&
      student.current_cgpa != null
    );
  };

  const getMissingFields = () => {
    const missing = [];
    if (student.tenth_percentage == null) missing.push('10th Percentage');
    if (student.twelfth_percentage == null) missing.push('12th Percentage');
    if (student.current_cgpa == null) missing.push('Current CGPA');
    return missing;
  };

  const handleVerificationStatusChange = async (isVerified) => {
    if (isVerified && !canBeVerified()) {
      const missingFields = getMissingFields();
      showError(`Cannot verify student. Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setUpdatingVerification(true);
    try {
      await studentService.markAsVerified(userId, isVerified);
      setStudent((prev) => ({
        ...prev,
        is_verified: isVerified,
      }));
      success(`Student ${isVerified ? 'verified' : 'unverified'} successfully!`);
    } catch (err) {
      console.error("Error updating verification status:", err);
      showError(err.message || "Failed to update verification status");
    } finally {
      setUpdatingVerification(false);
    }
  };

  const getFullName = (studentData) => {
    if (!studentData || !studentData.user) return "N/A";
    const parts = [
      studentData.user.first_name,
      studentData.user.middle_name,
      studentData.user.last_name,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "N/A";
  };

  const getInitials = (studentData) => {
    if (!studentData || !studentData.user) return "N";
    const firstName = studentData.user.first_name || "";
    const lastName = studentData.user.last_name || "";
    const initials = `${firstName.charAt(0)}${lastName.charAt(
      0
    )}`.toUpperCase();
    return initials || (firstName.charAt(0) || "N").toUpperCase();
  };

  const getPlacementStatusColor = (studentData) => {
    if (!studentData || studentData.is_placed === null)
      return isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700";
    return studentData.is_placed
      ? isDark
        ? "bg-green-900/30 text-green-400"
        : "bg-green-100 text-green-700"
      : isDark
      ? "bg-orange-900/30 text-orange-400"
      : "bg-orange-100 text-orange-700";
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Details">
        <LoadingOverlay message="Loading student details..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Student Details">
        <PageContainer>
          <Section>
            <Card className="p-6">
              <div
                className={`text-center ${
                  isDark ? "text-red-300" : "text-red-700"
                }`}
              >
                <p className="mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft size={16} className="mr-2" />
                    Back to List
                  </Button>
                  <Button onClick={fetchStudentDetails}>Retry</Button>
                </div>
              </div>
            </Card>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Details">
        <PageContainer>
          <Section>
            <Card className="p-6">
              <div
                className={`text-center ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <p className="mb-4">Student not found</p>
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to List
                </Button>
              </div>
            </Card>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Details">
      <PageContainer>
        {/* Header with Back Button and Profile Picture */}
        <Section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Profile Picture with Edit Option */}
              <div className="relative">
                {isEditMode ? (
                  <>
                    <div
                      className={`rounded-full flex items-center justify-center font-bold border-2 w-20 h-20 text-2xl overflow-hidden ${
                        isDark
                          ? "bg-blue-900/30 border-blue-700 text-blue-400"
                          : "bg-blue-100 border-blue-300 text-blue-700"
                      }`}
                    >
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : student.profile_picture ? (
                        <img
                          src={student.profile_picture}
                          alt={getFullName(student)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(student)
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 ${
                        isDark
                          ? "bg-blue-600 hover:bg-blue-700 border-gray-800 text-white"
                          : "bg-blue-500 hover:bg-blue-600 border-white text-white"
                      } transition-colors`}
                      title="Change profile picture"
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    {(profilePicture || profilePicturePreview) && (
                      <button
                        onClick={handleRemoveProfilePicture}
                        className={`absolute -top-1 -right-1 p-1 rounded-full ${
                          isDark
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        } transition-colors`}
                        title="Remove picture"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </>
                ) : (
                  <div
                    className={`rounded-full flex items-center justify-center font-bold border-2 w-24 h-24 text-3xl overflow-hidden ${
                      isDark
                        ? "bg-blue-900/30 border-blue-700 text-blue-400"
                        : "bg-blue-100 border-blue-300 text-blue-700"
                    }`}
                  >
                    {student.profile_picture ? (
                      <img
                        src={student.profile_picture}
                        alt={getFullName(student)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(student)
                    )}
                  </div>
                )}
              </div>
              <h2
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {getFullName(student)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Verification Status Component */}
              {!isEditMode && (
                <div className="relative group">
                  <div className={`inline-flex rounded-lg shadow-sm border ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <button
                      onClick={() => handleVerificationStatusChange(true)}
                      disabled={updatingVerification}
                      className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l-lg transition-all duration-200 focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        student.is_verified
                          ? isDark
                            ? 'bg-green-600 text-white border-r border-green-700 hover:bg-green-700 focus:ring-green-500'
                            : 'bg-green-500 text-white border-r border-green-600 hover:bg-green-600 focus:ring-green-500'
                          : isDark
                          ? 'bg-gray-800 text-gray-400 border-r border-gray-700 hover:bg-gray-700 hover:text-gray-300 focus:ring-gray-600'
                          : 'bg-white text-gray-600 border-r border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400'
                      } ${
                        updatingVerification ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${!canBeVerified() && !student.is_verified ? 'cursor-not-allowed' : ''}`}
                      title={!canBeVerified() && !student.is_verified ? `Missing: ${getMissingFields().join(', ')}` : ''}
                    >
                      <ShieldCheck size={16} />
                      Verified
                    </button>
                    <button
                      onClick={() => handleVerificationStatusChange(false)}
                      disabled={updatingVerification}
                      className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-r-lg transition-all duration-200 focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        !student.is_verified
                          ? isDark
                            ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500'
                            : 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500'
                          : isDark
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300 focus:ring-gray-600'
                          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-400'
                      } ${
                        updatingVerification ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <AlertCircle size={16} />
                      Not Verified
                    </button>
                  </div>
                  
                  {/* Validation Tooltip */}
                  {!canBeVerified() && !student.is_verified && (
                    <div className={`absolute left-0 top-full mt-2 w-64 p-3 rounded-lg shadow-lg border z-50 hidden group-hover:block ${
                      isDark 
                        ? 'bg-gray-800 border-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold mb-1">Cannot verify student</p>
                          <p className="text-xs">Missing required fields:</p>
                          <ul className="text-xs mt-1 space-y-0.5">
                            {getMissingFields().map((field) => (
                              <li key={field} className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                                {field}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft size={16} className="mr-2" />
                Back to List
              </Button>
              {isEditMode ? (
                <>
                  <Button
                    variant="primary"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={handleEditToggle}>
                    <X size={16} className="mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={handleEditToggle}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Details
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </Section>

        {/* Personal Information Card */}
        <Section>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-3 rounded-full ${
                  isDark ? "bg-blue-900/30" : "bg-blue-100"
                }`}
              >
                <User
                  size={24}
                  className={isDark ? "text-blue-400" : "text-blue-600"}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Personal Information
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Basic details about the student
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem
                icon={<User size={16} />}
                label="Full Name"
                value={getFullName(student)}
              />
              <InfoItem
                icon={<Mail size={16} />}
                label="Email"
                value={student.user?.email || "N/A"}
              />
              <InfoItem
                icon={<Phone size={16} />}
                label="Phone Number"
                value={student.user?.phone_number || "N/A"}
              />
              {isEditMode ? (
                <>
                  <EditableInfoItem
                    icon={<Calendar size={16} />}
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<User size={16} />}
                    label="Gender"
                    name="gender"
                    type="select"
                    value={formData.gender}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<MapPin size={16} />}
                    label="Address Line 1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<MapPin size={16} />}
                    label="Address Line 2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                  />
                  <InfoItem
                    icon={<MapPin size={16} />}
                    label="City"
                    value={student.city || "N/A"}
                  />
                  <EditableInfoItem
                    icon={<MapPin size={16} />}
                    label="Postal Code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                  />
                </>
              ) : (
                <>
                  <InfoItem
                    icon={<Calendar size={16} />}
                    label="Date of Birth"
                    value={
                      student.date_of_birth
                        ? new Date(student.date_of_birth).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"
                    }
                  />
                  <InfoItem
                    icon={<User size={16} />}
                    label="Gender"
                    value={
                      student.gender
                        ? student.gender.charAt(0).toUpperCase() +
                          student.gender.slice(1).toLowerCase()
                        : "N/A"
                    }
                  />
                  <InfoItem
                    icon={<MapPin size={16} />}
                    label="Address"
                    value={
                      [
                        student.address_line1,
                        student.address_line2,
                        student.city,
                        student.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ") || "N/A"
                    }
                  />
                </>
              )}
            </div>
          </Card>
        </Section>

        {/* Academic Information Card */}
        <Section>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-3 rounded-full ${
                  isDark ? "bg-purple-900/30" : "bg-purple-100"
                }`}
              >
                <GraduationCap
                  size={24}
                  className={isDark ? "text-purple-400" : "text-purple-600"}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Academic Information
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Educational background and performance
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem
                icon={<GraduationCap size={16} />}
                label="Enrollment Number"
                value={student.enrollment_number || "N/A"}
              />
              <InfoItem
                icon={<GraduationCap size={16} />}
                label="Program"
                value={student.program || "N/A"}
              />
              <InfoItem
                icon={<Calendar size={16} />}
                label="Joining Year"
                value={student.joining_year || "N/A"}
              />
              {isEditMode ? (
                <>
                  <EditableInfoItem
                    icon={<Award size={16} />}
                    label="Current CGPA"
                    name="current_cgpa"
                    type="number"
                    value={formData.current_cgpa}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<Award size={16} />}
                    label="Graduation CGPA"
                    name="graduation_cgpa"
                    type="number"
                    value={formData.graduation_cgpa}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<Award size={16} />}
                    label="Active Backlogs"
                    name="active_backlogs"
                    type="number"
                    value={formData.active_backlogs}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<Award size={16} />}
                    label="10th Percentage"
                    name="tenth_percentage"
                    type="number"
                    value={formData.tenth_percentage}
                    onChange={handleInputChange}
                  />
                  <EditableInfoItem
                    icon={<Award size={16} />}
                    label="12th Percentage"
                    name="twelfth_percentage"
                    type="number"
                    value={formData.twelfth_percentage}
                    onChange={handleInputChange}
                  />
                </>
              ) : (
                <>
                  <InfoItem
                    icon={<Award size={16} />}
                    label="Current CGPA"
                    value={student.current_cgpa || "N/A"}
                  />
                  <InfoItem
                    icon={<Award size={16} />}
                    label="Graduation CGPA"
                    value={student.graduation_cgpa || "N/A"}
                  />
                  <InfoItem
                    icon={<Award size={16} />}
                    label="Active Backlogs"
                    value={
                      student.active_backlogs !== null &&
                      student.active_backlogs !== undefined
                        ? student.active_backlogs
                        : "N/A"
                    }
                  />
                  <InfoItem
                    icon={<Award size={16} />}
                    label="10th Percentage"
                    value={student.tenth_percentage || "N/A"}
                  />
                  <InfoItem
                    icon={<Award size={16} />}
                    label="12th Percentage"
                    value={student.twelfth_percentage || "N/A"}
                  />
                </>
              )}
            </div>

            {/* Program Details if available */}
            {student.program_details && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4
                  className={`text-sm font-semibold mb-4 ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  Program Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem
                    label="Program Name"
                    value={student.program_details.name || "N/A"}
                  />
                  <InfoItem
                    label="Abbreviation"
                    value={student.program_details.abbreviation || "N/A"}
                  />
                  <InfoItem
                    label="Degree Name"
                    value={student.program_details.degree?.name || "N/A"}
                  />
                  <InfoItem
                    label="Degree Abbreviation"
                    value={
                      student.program_details.degree?.abbreviation || "N/A"
                    }
                  />
                  <InfoItem
                    label="Degree Level"
                    value={student.program_details.degree_level || "N/A"}
                  />
                </div>
              </div>
            )}
          </Card>
        </Section>

        {/* Placement Information Card */}
        <Section>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`p-3 rounded-full ${
                  isDark ? "bg-green-900/30" : "bg-green-100"
                }`}
              >
                <Briefcase
                  size={24}
                  className={isDark ? "text-green-400" : "text-green-600"}
                />
              </div>
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Placement Status
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Current placement information
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getPlacementStatusColor(
                  student
                )}`}
              >
                {student.is_placed === null
                  ? "Unknown"
                  : student.is_placed
                  ? "Placed"
                  : "Not Placed"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem
                icon={<Briefcase size={16} />}
                label="Placement Status"
                value={
                  student.is_placed === null
                    ? "Unknown"
                    : student.is_placed
                    ? "Placed"
                    : "Not Placed"
                }
              />
              {/* <InfoItem
                label="Resume"
                value={
                  student.resume ? (
                    <a
                      href={student.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm ${
                        isDark
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      } underline`}
                    >
                      View Resume
                    </a>
                  ) : (
                    "N/A"
                  )
                }
              /> */}
            </div>
          </Card>
        </Section>

        {/* User Account Information */}
        {student.user &&
          student.user.roles &&
          student.user.roles.length > 0 && (
            <Section>
              <Card className="p-6">
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoItem label="User ID" value={student.user.id || "N/A"} />
                  <InfoItem
                    label="Roles"
                    value={
                      student.user.roles.map((role) => role.name).join(", ") ||
                      "N/A"
                    }
                  />
                </div>
              </Card>
            </Section>
          )}

        {/* Additional Information */}
        <Section>
          <Card className="p-6">
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem
                label="Profile Created"
                value={
                  student.created_at
                    ? new Date(student.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"
                }
              />
              <InfoItem
                label="Last Updated"
                value={
                  student.updated_at
                    ? new Date(student.updated_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"
                }
              />
            </div>
          </Card>
        </Section>
      </PageContainer>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div
            className={`rounded-lg shadow-xl p-6 max-w-md w-full mx-4 ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Confirm Delete
            </h3>
            <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Are you sure you want to delete the profile for{" "}
              <span className="font-semibold">{getFullName(student)}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={16} className="mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

function InfoItem({ icon, label, value }) {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={isDark ? "text-gray-400" : "text-gray-500"}>
            {icon}
          </span>
        )}
        <span
          className={`text-xs font-medium ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {label}
        </span>
      </div>
      <span className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`}>
        {typeof value === "object" ? value : value || "N/A"}
      </span>
    </div>
  );
}

function EditableInfoItem({
  icon,
  label,
  name,
  value,
  type = "text",
  onChange,
  disabled = false,
}) {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={isDark ? "text-gray-400" : "text-gray-500"}>
            {icon}
          </span>
        )}
        <label
          htmlFor={name}
          className={`text-xs font-medium ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {label}
        </label>
      </div>
      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`text-sm px-3 py-2 rounded-md border ${
            isDark
              ? "bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500"
              : "bg-white border-gray-300 text-gray-800 focus:border-blue-500"
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          <option value="">Select {label}</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      ) : type === "select-placement" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value === "true";
            onChange({ target: { name, value: newValue } });
          }}
          disabled={disabled}
          className={`text-sm px-3 py-2 rounded-md border ${
            isDark
              ? "bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500"
              : "bg-white border-gray-300 text-gray-800 focus:border-blue-500"
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          <option value="false">Not Placed</option>
          <option value="true">Placed</option>
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`text-sm px-3 py-2 rounded-md border ${
            isDark
              ? "bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500"
              : "bg-white border-gray-300 text-gray-800 focus:border-blue-500"
          } focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
      )}
    </div>
  );
}

export default StudentDetails;
