import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  X,
  AlertTriangle,
} from "lucide-react";
import { companyService } from "../../../services/companyService";
import { lookupService } from "../../../services";

export default function CompaniesList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState(""); // New city filter
  const [cities, setCities] = useState([]); // Cities from API
  const [loadingCities, setLoadingCities] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    company: null,
  });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1,
    total_pages: 1,
    page_size: 10, // Changed from 20 to 10
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Client-side filtering similar to RegisteredStudents
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((company) => {
        const name = company.name?.toLowerCase() || "";
        const email = company.email?.toLowerCase() || "";
        const phone = company.phone_number?.toLowerCase() || "";
        const description = company.description?.toLowerCase() || "";
        const address = company.headquarters_address?.toLowerCase() || "";
        const website = company.website_url?.toLowerCase() || "";
        const city = company.headquarters_city_name?.toLowerCase() || "";

        return (
          name.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          description.includes(query) ||
          address.includes(query) ||
          website.includes(query) ||
          city.includes(query)
        );
      });
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(
        (company) => company.headquarters_city_name === selectedCity
      );
    }

    return filtered;
  }, [companies, searchTerm, selectedCity]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, page_size: 10 }; // 10 items per page

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

  const fetchCities = useCallback(async () => {
    try {
      setLoadingCities(true);
      const data = await lookupService.getCities();
      setCities(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchCities();
  }, [currentPage, fetchCompanies]);

  const handleDeleteClick = (company, e) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, company });
  };

  const handleDeleteConfirm = async () => {
    const { company } = deleteModal;
    if (!company) return;

    try {
      await companyService.deleteCompany(company.id);
      setCompanies(companies.filter((c) => c.id !== company.id));

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
      }`;
      successMsg.textContent = "Company deleted successfully!";
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      setDeleteModal({ isOpen: false, company: null });
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete company. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, company: null });
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
        <Section>
          {/* Action Buttons */}
          <div className="mb-6 flex justify-end gap-2">
            <Button onClick={fetchCompanies}>Refresh</Button>
            <Button onClick={() => navigate("/admin/companies/register")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>

          {/* Search Bar and Filters */}
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative md:col-span-2">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search companies by name, email, phone, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* City Filter */}
              <select
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={loadingCities}
              >
                <option value="">All Locations</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {(searchTerm || selectedCity) && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCity("");
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

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
          ) : filteredCompanies.length === 0 ? (
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
                {searchTerm
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
                    <th className="px-4 py-3 text-left font-medium">S.No.</th>
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
                  {filteredCompanies.map((c, index) => (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isDark
                          ? "hover:bg-gray-700 border-gray-700"
                          : "hover:bg-gray-50 border-gray-200"
                      } border-b`}
                    >
                      <td className="px-4 py-3">
                        {(pagination.current_page - 1) * pagination.page_size +
                          index +
                          1}
                      </td>
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
                              {c.name}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {c.email}
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
                            onClick={(e) => handleDeleteClick(c, e)}
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={handleDeleteCancel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className={`w-full max-w-md rounded-xl shadow-2xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } p-6 animate-in fade-in zoom-in duration-200`}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className={`p-4 rounded-full ${
                    isDark ? "bg-red-900/30" : "bg-red-100"
                  }`}
                >
                  <AlertTriangle
                    size={48}
                    className={isDark ? "text-red-400" : "text-red-600"}
                  />
                </div>
              </div>

              {/* Title */}
              <h2
                className={`text-2xl font-bold text-center mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Delete Company
              </h2>

              {/* Message */}
              <p
                className={`text-center mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Are you sure you want to delete
              </p>
              <p
                className={`text-center font-semibold mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                "{deleteModal.company?.name}"?
              </p>
              <p
                className={`text-center text-sm mb-6 ${
                  isDark ? "text-red-400" : "text-red-600"
                }`}
              >
                This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
