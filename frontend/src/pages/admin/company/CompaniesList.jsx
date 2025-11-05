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
  Building2,
  MapPin,
  Globe,
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { companyService } from "../../../services/companyService";

export default function CompaniesList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState(""); // Track active search
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 20,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Client-side safety net in case server search isn't applied (e.g., older backend)
  const filterCompaniesLocally = useCallback((items, term) => {
    if (!term || !Array.isArray(items)) return items || [];
    const q = term.toLowerCase();
    const pick = (v) => (v == null ? "" : String(v).toLowerCase());
    return items.filter((c) => {
      return (
        pick(c.name).includes(q) ||
        pick(c.email).includes(q) ||
        pick(c.phone_number).includes(q) ||
        pick(c.description).includes(q) ||
        pick(c.headquarters_address).includes(q) ||
        pick(c.website_url).includes(q) ||
        pick(c.headquarters_city_name).includes(q)
      );
    });
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage };

      const response = await companyService.getAllCompanies(params);

      // Handle API response structure: { success, data: [...], pagination: {...} }
      if (response.success && response.data) {
        setCompanies(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        // Fallback for different response structures
        const companiesData = response.data || response.results || response;
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(err.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Separate function to perform search
  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { search: activeSearchTerm, page: currentPage };
      const response = await companyService.getAllCompanies(params);

      // Prefer server-side filtering when present
      let list = response?.data || response?.results || response || [];
      if (!Array.isArray(list)) list = [];

      // Safety: also filter locally so UI never shows unrelated rows
      const filtered = filterCompaniesLocally(list, activeSearchTerm);
      setCompanies(filtered);

      // If server returned pagination but didn't filter, counts would be wrong.
      // For active search, reflect the filtered page locally (single page for small lists).
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
  }, [activeSearchTerm, currentPage, filterCompaniesLocally]);

  useEffect(() => {
    if (activeSearchTerm) {
      // If there's an active search, perform search instead of fetch
      performSearch();
    } else {
      fetchCompanies();
    }
  }, [activeSearchTerm, currentPage, performSearch, fetchCompanies]);

  // Helper function to highlight search terms
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

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await companyService.deleteCompany(id);
      setCompanies(companies.filter((c) => c.id !== id));
      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Company deleted successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete company. Please try again.");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (id, e) => {
    e.stopPropagation();
    navigate(`/admin/companies/${id}`);
  };

  const handleEdit = (id, e) => {
    e.stopPropagation();
    navigate(`/admin/companies/${id}/edit`);
  };

  return (
    <DashboardLayout title="Registered Companies">
      <PageContainer>
        <Section
          action={
            <div className="flex gap-2">
              <Button onClick={() => navigate("/admin/companies/register")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
              <Button onClick={fetchCompanies}>Refresh</Button>
            </div>
          }
        >
          {/* Search and Filter Bar */}
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
                  placeholder="Search companies by name, email, phone..."
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
                {companies.length} result{companies.length !== 1 ? "s" : ""}{" "}
                found for "{activeSearchTerm}"
              </span>
            </div>
          )}

          {loading ? (
            <LoadingOverlay message="Loading companies..." />
          ) : error ? (
            <div
              className={`text-center py-6 rounded-lg border ${
                isDark
                  ? "bg-red-900/20 border-red-800 text-red-300"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              ❌ {error}
            </div>
          ) : companies.length === 0 ? (
            <div
              className={`text-center py-12 rounded-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-400"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No companies found</p>
              <p className="text-sm mb-4">
                {activeSearchTerm
                  ? "Try adjusting your search"
                  : "Get started by adding your first company"}
              </p>
              <Button onClick={() => navigate("/admin/companies/register")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </div>
          ) : (
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
                    <th className="px-4 py-3 text-left font-medium">Company</th>
                    <th className="px-4 py-3 text-left font-medium">Website</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Size</th>
                    <th className="px-4 py-3 text-left font-medium">Founded</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        activeSearchTerm
                          ? isDark
                            ? "bg-blue-900/20 hover:bg-blue-900/30 border-blue-800"
                            : "bg-blue-50 hover:bg-blue-100 border-blue-200"
                          : isDark
                          ? "hover:bg-gray-700 border-gray-700"
                          : "hover:bg-gray-50 border-gray-200"
                      } border-b`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.logo ? (
                            <img
                              src={c.logo}
                              alt={c.name}
                              className="w-10 h-10 rounded-lg object-cover border"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 flex items-center justify-center rounded-lg border ${
                                isDark
                                  ? "bg-gray-700 border-gray-600"
                                  : "bg-gray-100 border-gray-300"
                              }`}
                            >
                              <Building2 className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {highlightText(c.name, activeSearchTerm)}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {highlightText(c.email, activeSearchTerm)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.website_url ? (
                          <a
                            href={c.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe className="w-4 h-4" />
                            <span className="hidden md:inline">
                              {
                                c.website_url
                                  .replace(/^https?:\/\/(www\.)?/, "")
                                  .split("/")[0]
                              }
                            </span>
                          </a>
                        ) : (
                          <span
                            className={
                              isDark ? "text-gray-500" : "text-gray-400"
                            }
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`flex items-center gap-1 ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <MapPin className="w-4 h-4" />
                          <span>
                            {c.headquarters_address && c.headquarters_city_name
                              ? `${c.headquarters_address}, ${c.headquarters_city_name}`
                              : c.headquarters_city_name ||
                                c.headquarters_address ||
                                "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`flex items-center gap-1 ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>
                            {c.company_size_display || c.company_size || "—"}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-3 ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {c.year_founded || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => handleViewDetails(c.id, e)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? "text-blue-400 hover:bg-gray-700"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleEdit(c.id, e)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? "text-yellow-400 hover:bg-gray-700"
                                : "text-yellow-600 hover:bg-yellow-50"
                            }`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(c.id, c.name, e)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? "text-red-400 hover:bg-gray-700"
                                : "text-red-600 hover:bg-red-50"
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
          )}

          {/* Pagination */}
          {!loading &&
            !error &&
            companies.length > 0 &&
            pagination.total_pages > 1 && (
              <div
                className={`mt-6 flex items-center justify-between px-4 py-3 rounded-lg border ${
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
                  <span className="ml-2">
                    ({pagination.count} total companies)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.previous}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.previous
                        ? isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(pagination.total_pages)].map((_, i) => {
                      const page = i + 1;
                      const isCurrentPage = page === currentPage;
                      const showPage =
                        page === 1 ||
                        page === pagination.total_pages ||
                        (page >= currentPage - 1 && page <= currentPage + 1);

                      if (!showPage) {
                        if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className={
                                isDark ? "text-gray-500" : "text-gray-400"
                              }
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
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.next}
                    className={`p-2 rounded-lg transition-colors ${
                      pagination.next
                        ? isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
