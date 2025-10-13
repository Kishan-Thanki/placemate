import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout, PageContainer, Section } from "../../../components/layout";
import { Button } from "../../../components/ui";
import { useTheme } from "../../../contexts/ThemeContext";
import { Building2, MapPin, Globe, Users } from "lucide-react";

export default function CompaniesList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://placemate-zzgd.onrender.com/api/v1/companies/', { credentials: 'include' });

      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Registered Companies">
      <PageContainer>
        <Section
          title="Registered Companies"
          description="Browse and manage all registered companies in the placement portal."
          action={<Button onClick={fetchCompanies}>Refresh</Button>}
        >
          {loading ? (
            <div className="flex justify-center py-10">
              {/* <Spinner /> */}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-6">
              ❌ Failed to load companies.
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No companies found.</div>
          ) : (
            <div
              className={`overflow-x-auto rounded-xl border ${
                isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
              }`}
            >
              <table className="min-w-full text-sm">
                <thead
                  className={`${
                    isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Company</th>
                    <th className="px-4 py-3 text-left font-medium">Website</th>
                    <th className="px-4 py-3 text-left font-medium">Location</th>
                    <th className="px-4 py-3 text-left font-medium">Size</th>
                    <th className="px-4 py-3 text-left font-medium">Founded</th>
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
