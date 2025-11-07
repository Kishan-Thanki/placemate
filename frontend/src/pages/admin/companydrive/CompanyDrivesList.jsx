import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, CardSkeleton } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
} from "lucide-react";
import { companyDriveService } from "../../../services";

export default function CompanyDrivesList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 20,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage };
      
      // Add filters
      if (filterType !== "All") {
        params.drive_type = filterType;
      }
      if (filterStatus !== "All") {
        params.status = filterStatus;
      }

      const response = await companyDriveService.getAllDrives(params);
      
      if (response.success && response.data) {
        setDrives(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        const drivesData = response.data || response.results || response;
        setDrives(Array.isArray(drivesData) ? drivesData : []);
      }
    } catch (err) {
      console.error("Error fetching company drives:", err);
      setError(err.message || "Failed to load company drives");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, filterStatus]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { search: activeSearchTerm, page: currentPage };
      
      if (filterType !== "All") {
        params.drive_type = filterType;
      }
      if (filterStatus !== "All") {
        params.status = filterStatus;
      }

      const response = await companyDriveService.getAllDrives(params);
      let list = response?.data || response?.results || response || [];
      if (!Array.isArray(list)) list = [];
      
      setDrives(list);
      setPagination((prev) => ({
        ...prev,
        count: list.length,
        current_page: 1,
        total_pages: 1,
      }));
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeSearchTerm, currentPage, filterType, filterStatus]);

  useEffect(() => {
    if (activeSearchTerm) {
      performSearch();
    } else {
      fetchDrives();
    }
  }, [activeSearchTerm, currentPage, filterType, filterStatus, fetchDrives, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
  };

  const handleDelete = async (id, companyName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the drive for "${companyName}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await companyDriveService.deleteDrive(id);
      setDrives(drives.filter((d) => d.id !== id));

      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Company drive deleted successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete company drive. Please try again.");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    if (status === "Open") {
      return `${baseClasses} ${
        isDark
          ? "bg-green-900/30 text-green-400"
          : "bg-green-100 text-green-800"
      }`;
    }
    return `${baseClasses} ${
      isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
    }`;
  };

  const getTypeBadge = (type) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    const colors = {
      FullTime: isDark
        ? "bg-blue-900/30 text-blue-400"
        : "bg-blue-100 text-blue-800",
      Internship: isDark
        ? "bg-purple-900/30 text-purple-400"
        : "bg-purple-100 text-purple-800",
      Contract: isDark
        ? "bg-yellow-900/30 text-yellow-400"
        : "bg-yellow-100 text-yellow-800",
    };
    return `${baseClasses} ${colors[type] || ""}`;
  };

  return (
    <DashboardLayout title="Company Drives">
      <PageContainer>
        <Section>
          {/* Action Buttons */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <Button onClick={fetchDrives}>Refresh</Button>
            <Button onClick={() => navigate("/admin/drives/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company Drive
            </Button>
          </div>

          {/* Search and Filters */}
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by company name..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <Button type="submit">Search</Button>
                {activeSearchTerm && (
                  <Button type="button" variant="secondary" onClick={handleClearSearch}>
                    Clear
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Drive Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="All">All Types</option>
                    <option value="FullTime">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-2 rounded-lg border ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="All">All Status</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

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

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && drives.length === 0 && (
            <div
              className={`text-center py-12 rounded-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <Building2
                className={`w-12 h-12 mx-auto mb-4 ${
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <h3
                className={`text-lg font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-900"
                }`}
              >
                No company drives found
              </h3>
              <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                {activeSearchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first company drive"}
              </p>
              {!activeSearchTerm && (
                <Button
                  onClick={() => navigate("/admin/drives/new")}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company Drive
                </Button>
              )}
            </div>
          )}

          {/* Drives List */}
          {!loading && drives.length > 0 && (
            <div className="space-y-4">
              {drives.map((drive) => (
                <div
                  key={drive.id}
                  className={`p-6 rounded-lg border transition-all hover:shadow-lg ${
                    isDark
                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Drive Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-semibold mb-1 ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {drive.company?.name || "Unknown Company"}
                          </h3>
                          <p
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {drive.placement_drive?.title || "No Placement Drive"}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={getTypeBadge(drive.drive_type)}>
                          {drive.drive_type}
                        </span>
                        <span className={getStatusBadge(drive.status)}>
                          {drive.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isDark
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Briefcase className="w-3 h-3 inline mr-1" />
                          {drive.job_mode}
                        </span>
                      </div>

                      {/* Details */}
                      <div
                        className={`grid grid-cols-1 md:grid-cols-2 gap-2 text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Deadline: {formatDate(drive.application_deadline)}
                          </span>
                        </div>
                        {drive.locations && drive.locations.length > 0 && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{drive.locations.length} Location(s)</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{drive.jobs_count || 0} Job(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/drives/${drive.id}`)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/drives/${drive.id}/edit`)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          handleDelete(drive.id, drive.company?.name)
                        }
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && drives.length > 0 && pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Showing page {pagination.current_page} of{" "}
                {pagination.total_pages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.previous}
                >
                  Previous
                </Button>
                {[...Array(pagination.total_pages)].map((_, i) => {
                  const page = i + 1;
                  const isCurrentPage = page === currentPage;
                  const showPage =
                    page === 1 ||
                    page === pagination.total_pages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className={isDark ? "text-gray-500" : "text-gray-400"}
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        isCurrentPage
                          ? "bg-blue-600 text-white"
                          : isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.next}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
