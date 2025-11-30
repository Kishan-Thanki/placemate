import React, { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { Search, Building2, Calendar, MapPin, Briefcase } from "lucide-react";
import { CardSkeleton } from "../../components/ui";
import { companyDriveService } from "../../services/companyDriveService";

export function StudentDrives() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(true);

  // Load drives from API — list view only. Jobs/eligibility are resolved on the drive detail page.
  useEffect(() => {
    let mounted = true;
    let hasFetched = false;

    const loadAll = async () => {
      if (hasFetched) return; // Prevent duplicate calls in StrictMode
      hasFetched = true;
      
      setLoadingDrives(true);
      try {
        const drivesResp = await companyDriveService.getAllDrives({ status: "Open" });
        const allDrives = Array.isArray(drivesResp)
          ? drivesResp
          : drivesResp.results || drivesResp.data || [];

        if (mounted) setDrives(allDrives);
      } catch (err) {
        console.error("Failed to load drives", err);
      } finally {
        if (mounted) setLoadingDrives(false);
      }
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredDrives = drives.filter((drive) => {
    // Only show Open drives for students
    if (drive.status && drive.status !== "Open") return false;
    const matchesFilter = filter === "All" || drive.drive_type === filter || drive.type === filter;

    const toText = (v) => {
      if (!v && v !== 0) return "";
      if (typeof v === "string") return v;
      if (typeof v === "number") return String(v);
      if (typeof v === "object") return String(v.title || v.name || v.company || "");
      return String(v);
    };

    const searchable = (
      toText(drive.company).toLowerCase() +
      " " +
      toText(drive.placement_drive || drive.placement_drive?.title).toLowerCase() +
      " " +
      toText(drive.jobs_count)
    );

    const matchesSearch = searchable.includes((searchTerm || "").toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <StudentLayout title="Placement Drives">
      <PageContainer>
        <Section>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-1/2">
              <Search
                className={`absolute left-3 top-2.5 w-5 h-5 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search by Company or Drive Name"
                className={`w-full rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 text-gray-200 border border-gray-700 placeholder-gray-400"
                    : "bg-white border border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-white border border-gray-300 text-gray-900"
                }`}
              >
                <option value="All">All</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("All");
                }}
                className={`text-sm px-3 py-2 rounded-lg ${
                  isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Drives List (compact rows like admin) */}
          <div className="space-y-4">
            {loadingDrives ? (
              <div className="space-y-4">
                {[1, 2, 3,4,5,6,7,8].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filteredDrives.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-lg font-medium mb-2">No drives available</div>
                <div className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>There are currently no open company drives.</div>
              </div>
            ) : (
              filteredDrives.map((drive) => (
                <div
                  key={drive.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`p-0 rounded-lg overflow-hidden bg-transparent`}> 
                          {drive.company?.logo ? (
                            <img src={drive.company.logo} alt={drive.company?.name || "company logo"} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className={`p-2 rounded-lg ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      <div className="flex-1">
                        <h3 className={`text-md font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                          {drive.company?.name || drive.company || "Unknown Company"}
                        </h3>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {drive.placement_drive?.title || drive.placement_drive || ""}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            <Briefcase className="w-3 h-3" />
                            <span>{drive.drive_type || drive.type || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            <Briefcase className="w-3 h-3" />
                            <span>{drive.jobs_count ?? drive.jobs?.length ?? 0} jobs</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                            <Calendar className="w-3 h-3 text-red-700" />
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-semibold text-red-800">Application deadline:</span>
                              <span className="text-[11px] text-red-800">{drive.application_deadline ? new Date(drive.application_deadline).toLocaleDateString() : "Open until filled"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => window.location.assign(`/student/company-drives/${drive.id}`)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

       
      </PageContainer>
    </StudentLayout>
  );
}
