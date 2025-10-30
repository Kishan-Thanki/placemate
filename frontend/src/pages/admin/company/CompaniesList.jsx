import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../../components/layout";
import { Button } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import { Building2, MapPin, Globe, Users, Search, Plus } from "lucide-react";
import { companyService } from "../../../services/companyService";

export default function CompaniesList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, [filterIndustry]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterIndustry) params.industry = filterIndustry;

      const response = await companyService.getAllCompanies(params);

      // Handle different response structures from the API
      const companiesData = response.data || response.results || response;
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError(err.message || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchCompanies();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await companyService.searchCompanies(searchTerm);
      const companiesData = response.data || response.results || response;
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await companyService.deleteCompany(id);
      setCompanies(companies.filter((c) => c.id !== id));
      alert("Company deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete company. Please try again.");
    }
  };

  return (
    <DashboardLayout title="Registered Companies">
      <PageContainer>
        <Section
          title="Registered Companies"
          description="Browse and manage all registered companies in the placement portal."
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
                  placeholder="Search companies by name, industry..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">All Industries</option>
                <option value="IT">IT & Software</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Consulting">Consulting</option>
              </select>
              <Button type="submit">Search</Button>
              {(searchTerm || filterIndustry) && (
                <Button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterIndustry("");
                    fetchCompanies();
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div
                className={`text-lg ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Loading companies...
              </div>
            </div>
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
                {searchTerm || filterIndustry
                  ? "Try adjusting your search or filters"
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
                      onClick={() => navigate(`/companies/${c.id}`)}
                      className={`cursor-pointer transition-colors ${
                        isDark
                          ? "hover:bg-gray-700 border-gray-700"
                          : "hover:bg-gray-50 border-gray-200"
                      } border-b`}
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        {c.logo ? (
                          <img
                            src={c.logo}
                            alt={c.name}
                            className="w-9 h-9 rounded-md object-cover border"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 flex items-center justify-center rounded-md border ${
                              isDark
                                ? "bg-gray-700 border-gray-600"
                                : "bg-gray-100 border-gray-200"
                            }`}
                          >
                            <Building2 className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-blue-500 hover:underline">
                        <a
                          href={c.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {c.website_url?.replace(/^https?:\/\//, "") || "N/A"}
                        </a>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        {c.headquarters_city_name || "—"}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1 text-gray-500">
                        <Users className="w-4 h-4" />
                        {c.company_size_display || c.company_size || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {c.year_founded > 0 ? c.year_founded : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/companies/${c.id}/edit`);
                            }}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              isDark
                                ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(c.id, c.name, e)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              isDark
                                ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
