import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import {
  Button,
  Card,
  LoadingOverlay,
  ToastContainer,
} from "../../../components/ui";
import { useToast } from "../../../hooks/useToast";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Eye,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";
import { studentService } from "../../../services/studentService";
import { lookupService } from "../../../services";

export function RegisteredStudents() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { toasts, removeToast, success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 10, // Changed from 20 to 10
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updatingPlacement, setUpdatingPlacement] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [programs, setPrograms] = useState([]); // For courses from API
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Fetch students on component mount and when page changes
  useEffect(() => {
    fetchStudents(pagination.current_page);
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const data = await lookupService.getPrograms();
      setPrograms(data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentService.getStudentProfiles(page, 10); // 10 items per page
      setStudents(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementStatusChange = async (userId, isPlaced) => {
    setUpdatingPlacement(userId);
    try {
      // Use dedicated PATCH endpoint for placement status
      await studentService.markAsPlaced(userId, isPlaced);
      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.user?.id === userId
            ? { ...student, is_placed: isPlaced }
            : student
        )
      );
      success("Placement status updated successfully!");
    } catch (err) {
      console.error("Error updating placement status:", err);
      showError(err.message || "Failed to update placement status");
    } finally {
      setUpdatingPlacement(null);
    }
  };

  const handleDeleteClick = (student) => {
    setDeleteConfirm(student);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await studentService.deleteStudentProfile(deleteConfirm.user?.id);
      // Remove from local state
      setStudents((prevStudents) =>
        prevStudents.filter((s) => s.user?.id !== deleteConfirm.user?.id)
      );
      success("Student profile deleted successfully!");
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting student profile:", err);
      showError(err.message || "Failed to delete student profile");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchStudents(newPage);
    }
  };

  // Generate year options for batch filter (2000 to current year + 1)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear + 1; year >= 2000; year--) {
      years.push(year);
    }
    return years;
  }, []);

  const courses = useMemo(
    () => [...new Set(students.map((s) => s.program).filter(Boolean))],
    [students]
  );
  const batches = useMemo(
    () => [...new Set(students.map((s) => s.joining_year).filter(Boolean))],
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const fullName = student.user?.full_name || "";
        const email = student.user?.email || "";
        const matchesSearch =
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (student.enrollment_number &&
            student.enrollment_number
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse =
          !selectedCourse || student.program === selectedCourse;
        const matchesBatch =
          !selectedBatch || student.joining_year?.toString() === selectedBatch;
        const matchesStatus =
          !selectedStatus ||
          (selectedStatus === "Placed"
            ? student.is_placed
            : !student.is_placed);
        return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
      }),
    [students, searchTerm, selectedCourse, selectedBatch, selectedStatus]
  );

  const getStatusPill = (isPlaced) => {
    return isPlaced
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  return (
    <DashboardLayout title="Registered Students">
      <PageContainer>
        <Section>
          {/* Register Student Button */}
          <div className="mb-4 flex justify-end">
            <Button onClick={() => navigate("/admin/students/register")}>
              <Plus className="w-4 h-4 mr-2" />
              Register Student
            </Button>
          </div>

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search
                  size={16}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  className={`w-full pl-9 pr-9 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Search by name or enrollment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <select
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={loadingPrograms}
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.name}>
                    {program.abbreviation || program.name} -{" "}
                    {typeof program.degree === "object"
                      ? program.degree.abbreviation
                      : program.degree_name || ""}
                  </option>
                ))}
              </select>
              <select
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">All Batches</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <select
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Placed">Placed</option>
                  <option value="Not Placed">Not Placed</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCourse("");
                    setSelectedBatch("");
                    setSelectedStatus("");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        <Section>
          {loading ? (
            <LoadingOverlay message="Loading students..." />
          ) : (
            <div
              className={`overflow-x-auto rounded-lg border ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <table
                className={`min-w-full text-sm ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <thead className={`${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
                  <tr>
                    {[
                      "S.No",
                      "Enrollment No",
                      "Full Name",
                      "Batch",
                      "Course",
                      "Email",
                      "Placement Status",
                      "Action",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center">
                        <div
                          className={`text-${isDark ? "red-400" : "red-600"}`}
                        >
                          <p className="font-medium">❌ {error}</p>
                          <Button
                            onClick={() =>
                              fetchStudents(pagination.current_page)
                            }
                            className="mt-4"
                            size="sm"
                          >
                            Try Again
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, i) => (
                      <tr
                        key={s.user?.id || i}
                        className={`${
                          isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          {(pagination.current_page - 1) *
                            pagination.page_size +
                            i +
                            1}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {s.enrollment_number}
                        </td>
                        <td className="px-4 py-3">
                          {s.user?.full_name || "-"}
                        </td>
                        <td className="px-4 py-3">{s.joining_year || "-"}</td>
                        <td className="px-4 py-3">{s.program || "-"}</td>
                        <td className="px-4 py-3">{s.user?.email || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <select
                              value={s.is_placed ? "Placed" : "Not Placed"}
                              onChange={(e) =>
                                handlePlacementStatusChange(
                                  s.user?.id,
                                  e.target.value === "Placed"
                                )
                              }
                              disabled={updatingPlacement === s.user?.id}
                              className={`appearance-none min-w-[130px] pl-3 pr-8 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 border
      ${
        s.is_placed
          ? isDark
            ? "bg-green-900/20 border-green-700/50 text-green-300 hover:bg-green-900/30 focus:ring-green-600 focus:border-green-600"
            : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 focus:ring-green-500 focus:border-green-500"
          : isDark
          ? "bg-orange-900/20 border-orange-700/50 text-orange-300 hover:bg-orange-900/30 focus:ring-orange-600 focus:border-orange-600"
          : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 focus:ring-orange-500 focus:border-orange-500"
      }
      ${updatingPlacement === s.user?.id ? "opacity-50 cursor-not-allowed" : ""}
      [&>option]:bg-white [&>option]:text-gray-900 [&>option]:font-normal [&>option]:pl-3`}
                            >
                              <option value="Placed">Placed</option>
                              <option value="Not Placed">Not Placed</option>
                            </select>

                            {/* Custom dropdown arrow */}
                            <svg
                              className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                                s.is_placed
                                  ? isDark
                                    ? "text-green-300"
                                    : "text-green-700"
                                  : isDark
                                  ? "text-orange-300"
                                  : "text-orange-700"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              className={`${
                                isDark
                                  ? "text-blue-400 hover:text-blue-300"
                                  : "text-blue-600 hover:text-blue-700"
                              }`}
                              title="View"
                              onClick={() =>
                                navigate(
                                  `/admin/students/details/${s.user?.id}`
                                )
                              }
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className={`${
                                isDark
                                  ? "text-yellow-400 hover:text-yellow-300"
                                  : "text-yellow-600 hover:text-yellow-700"
                              }`}
                              title="Edit"
                              onClick={() =>
                                navigate(
                                  `/admin/students/details/${s.user?.id}?edit=true`
                                )
                              }
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={`${
                                isDark
                                  ? "text-red-400 hover:text-red-300"
                                  : "text-red-600 hover:text-red-700"
                              }`}
                              title="Delete"
                              onClick={() => handleDeleteClick(s)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading &&
            !error &&
            filteredStudents.length > 0 &&
            pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Showing{" "}
                  {(pagination.current_page - 1) * pagination.page_size + 1} to{" "}
                  {Math.min(
                    pagination.current_page * pagination.page_size,
                    pagination.count
                  )}{" "}
                  of {pagination.count} students
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      handlePageChange(pagination.current_page - 1)
                    }
                    disabled={!pagination.previous}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <Button
                    onClick={() =>
                      handlePageChange(pagination.current_page + 1)
                    }
                    disabled={!pagination.next}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
        </Section>
      </PageContainer>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
              <span className="font-semibold">
                {deleteConfirm.user?.full_name || "this student"}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteConfirm}
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
}
