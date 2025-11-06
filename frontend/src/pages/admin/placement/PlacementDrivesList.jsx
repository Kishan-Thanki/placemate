import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button, LoadingOverlay } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  CalendarDays,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import { placementService } from "../../../services/placementService";

export default function PlacementDrivesList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 20,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const filterDrivesLocally = useCallback((items, term) => {
    if (!term || !Array.isArray(items)) return items || [];
    const q = term.toLowerCase();
    const pick = (v) => (v == null ? "" : String(v).toLowerCase());
    return items.filter((d) => {
      return pick(d.title).includes(q);
    });
  }, []);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage };
      const response = await placementService.getAllDrives(params);

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
      console.error("Error fetching placement drives:", err);
      setError(err.message || "Failed to load placement drives");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { search: activeSearchTerm, page: currentPage };
      const response = await placementService.getAllDrives(params);

      let list = response?.data || response?.results || response || [];
      if (!Array.isArray(list)) list = [];

      const filtered = filterDrivesLocally(list, activeSearchTerm);
      setDrives(filtered);

      setPagination((prev) => ({
        ...prev,
        count: filtered.length,
        current_page: 1,
        total_pages: 1,
        next: null,
        previous: null,
      }));
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeSearchTerm, currentPage, filterDrivesLocally]);

  useEffect(() => {
    if (activeSearchTerm) {
      performSearch();
    } else {
      fetchDrives();
    }
  }, [activeSearchTerm, currentPage, performSearch, fetchDrives]);

  const highlightText = (text, search) => {
    if (!search.trim() || !text) return text;

    const parts = text.toString().split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark
          key={index}
          className={
            isDark ? "bg-yellow-600 text-white" : "bg-yellow-200 text-gray-900"
          }
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setActiveSearchTerm("");
      setCurrentPage(1);
      return;
    }

    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await placementService.deleteDrive(id);
      setDrives(drives.filter((d) => d.id !== id));

      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Placement drive deleted successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete placement drive. Please try again.");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (id, e) => {
    e.stopPropagation();
    navigate(`/admin/placement-drives/${id}`);
  };

  const handleEdit = (id, e) => {
    e.stopPropagation();
    navigate(`/admin/placement-drives/${id}/edit`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout title="Placement Drives">
      <PageContainer>
        <Section>
          {/* Action Buttons */}
          <div className="mb-6 flex justify-end gap-2">
            <Button onClick={fetchDrives}>Refresh</Button>
            <Button onClick={() => navigate("/admin/placement-drives/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Placement Drive
            </Button>
          </div>

          {/* Search Bar */}
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-3"
            >
              <div className="flex-1 relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search placement drives by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <Button type="submit">Search</Button>
              {activeSearchTerm && (
                <Button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveSearchTerm("");
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </div>

          {/* Search Results Badge */}
          {activeSearchTerm && !loading && (
            <div
              className={`mb-4 flex items-center gap-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isDark
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {drives.length} result{drives.length !== 1 ? "s" : ""} found for
                "{activeSearchTerm}"
              </span>
            </div>
          )}

          {loading ? (
            <LoadingOverlay message="Loading placement drives..." />
          ) : error ? (
            <div
              className={`p-8 text-center rounded-xl border ${
                isDark
                  ? "bg-red-900/20 border-red-900 text-red-400"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              <p className="font-medium">⚠️ {error}</p>
              <Button onClick={fetchDrives} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : drives.length === 0 ? (
            <div
              className={`p-12 text-center rounded-xl border ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <CalendarDays
                className={`mx-auto h-16 w-16 mb-4 ${
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <p className="text-lg font-medium mb-2">
                {activeSearchTerm
                  ? "No placement drives found"
                  : "No placement drives yet"}
              </p>
              <p className="mb-4">
                {activeSearchTerm
                  ? `No drives match "${activeSearchTerm}"`
                  : "Get started by adding your first placement drive"}
              </p>
              {!activeSearchTerm && (
                <Button onClick={() => navigate("/admin/placement-drives/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Drive
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className={`overflow-x-auto rounded-xl border ${
                  isDark
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-white"
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
                      <th className="px-4 py-3 text-left font-medium">Title</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        End Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`${
                      isDark
                        ? "divide-gray-700 text-gray-300"
                        : "divide-gray-200 text-gray-700"
                    } divide-y`}
                  >
                    {drives.map((drive) => (
                      <tr
                        key={drive.id}
                        className={`${
                          isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        } cursor-pointer transition-colors`}
                        onClick={() =>
                          navigate(`/admin/placement-drives/${drive.id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isDark
                                  ? "bg-blue-900/30 text-blue-400"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              <CalendarDays className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {highlightText(drive.title, activeSearchTerm)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(drive.start_date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(drive.end_date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(drive.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleViewDetails(drive.id, e)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? "hover:bg-blue-900/30 text-blue-400"
                                  : "hover:bg-blue-100 text-blue-600"
                              }`}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleEdit(drive.id, e)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? "hover:bg-yellow-900/30 text-yellow-400"
                                  : "hover:bg-yellow-100 text-yellow-600"
                              }`}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) =>
                                handleDelete(drive.id, drive.title, e)
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? "hover:bg-red-900/30 text-red-400"
                                  : "hover:bg-red-100 text-red-600"
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div
                  className={`flex items-center justify-between mt-4 px-4 py-3 rounded-lg border ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Showing page {pagination.current_page} of{" "}
                    {pagination.total_pages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.previous}
                      className={`p-2 rounded-lg transition-colors ${
                        pagination.previous
                          ? isDark
                            ? "hover:bg-gray-700 text-gray-300"
                            : "hover:bg-gray-100 text-gray-700"
                          : "opacity-50 cursor-not-allowed text-gray-500"
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.next}
                      className={`p-2 rounded-lg transition-colors ${
                        pagination.next
                          ? isDark
                            ? "hover:bg-gray-700 text-gray-300"
                            : "hover:bg-gray-100 text-gray-700"
                          : "opacity-50 cursor-not-allowed text-gray-500"
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
