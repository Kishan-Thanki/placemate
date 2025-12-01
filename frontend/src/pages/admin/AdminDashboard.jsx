import React, { useState, useEffect } from "react";
import { Building2, CalendarDays, FileText, GraduationCap, TrendingUp, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DashboardLayout,
  PageContainer,
  Section,
} from "../../components/layout";
import { StatCard, CardSkeleton } from "../../components/ui";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { companyService } from "../../services/companyService";
import { companyDriveService } from "../../services/companyDriveService";
import { applicationService } from "../../services/applicationService";
import { studentService } from "../../services/studentService";

/**
 * Admin Dashboard component with dynamic data
 * Features key statistics, recent activities, and quick actions
 */
export function AdminDashboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalDrives: 0,
    openDrives: 0,
    totalApplications: 0,
    studentsPlaced: 0,
  });
  const [recentDrives, setRecentDrives] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch companies
      const companiesResponse = await companyService.getAllCompanies();
      console.log("📊 Companies Response:", companiesResponse);
      // Handle different response structures
      let companies = [];
      if (Array.isArray(companiesResponse)) {
        companies = companiesResponse;
      } else if (companiesResponse?.results) {
        companies = companiesResponse.results;
      } else if (companiesResponse?.data) {
        companies = Array.isArray(companiesResponse.data) ? companiesResponse.data : companiesResponse.data.results || [];
      }
      console.log("📊 Companies Count:", companies.length);
      
      // Fetch drives
      const drivesResponse = await companyDriveService.getAllDrives();
      console.log("📊 Drives Response:", drivesResponse);
      let drives = [];
      if (Array.isArray(drivesResponse)) {
        drives = drivesResponse;
      } else if (drivesResponse?.results) {
        drives = drivesResponse.results;
      } else if (drivesResponse?.data) {
        drives = Array.isArray(drivesResponse.data) ? drivesResponse.data : drivesResponse.data.results || [];
      }
      const openDrives = drives.filter(d => d.status === 'Open');
      console.log("📊 Drives Count:", drives.length, "Open:", openDrives.length);
      
      // Fetch applications
      const appsResponse = await applicationService.getMyApplications();
      console.log("📊 Applications Response:", appsResponse);
      let applications = [];
      if (Array.isArray(appsResponse)) {
        applications = appsResponse;
      } else if (appsResponse?.results) {
        applications = appsResponse.results;
      } else if (appsResponse?.data) {
        applications = Array.isArray(appsResponse.data) ? appsResponse.data : appsResponse.data.results || [];
      }
      console.log("📊 Applications Count:", applications.length);
      
      // Fetch students - try profiles endpoint first
      let studentsResponse;
      try {
        studentsResponse = await studentService.getStudentProfiles();
      } catch {
        console.log("⚠️ Profiles endpoint failed, trying students endpoint");
        studentsResponse = await studentService.getAllStudents();
      }
      console.log("📊 Students Response:", studentsResponse);
      let students = [];
      if (Array.isArray(studentsResponse)) {
        students = studentsResponse;
      } else if (studentsResponse?.results) {
        students = studentsResponse.results;
      } else if (studentsResponse?.data) {
        students = Array.isArray(studentsResponse.data) ? studentsResponse.data : studentsResponse.data.results || [];
      }
      console.log("📊 Students Array:", students);
      console.log("📊 First Student Sample:", students[0]);
      const placedStudents = students.filter(s => {
        console.log(`Student ${s.enrollment_number || s.id}: is_placed = ${s.is_placed}`);
        return s.is_placed === true;
      });
      console.log("📊 Students Count:", students.length, "Placed:", placedStudents.length);
      
      setStats({
        totalCompanies: companies.length,
        totalDrives: drives.length,
        openDrives: openDrives.length,
        totalApplications: applications.length,
        studentsPlaced: placedStudents.length,
      });
      
      // Get recent drives (last 5)
      const sortedDrives = [...drives].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 5);
      setRecentDrives(sortedDrives);
      
      // Get recent applications (last 5)
      const sortedApps = [...applications].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 5);
      console.log("📊 Recent Applications Sample:", sortedApps[0]);
      setRecentApplications(sortedApps);
      
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Open': isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700',
      'Closed': isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
      'Applied': isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700',
      'Shortlisted': isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
      'Offered': isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700',
      'Rejected': isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700',
      'Accepted': isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  const quickActions = [
    {
      id: "add-drive",
      label: "Add New Drive",
      icon: <CalendarDays className="w-5 h-5" />,
      to: "/admin/drives/new",
    },
    {
      id: "register-company",
      label: "Register Company",
      icon: <Building2 className="w-5 h-5" />,
      to: "/admin/companies/new",
    },
    {
      id: "register-student",
      label: "Register Student",
      icon: <GraduationCap className="w-5 h-5" />,
      to: "/admin/students/register",
    },
    {
      id: "view-applications",
      label: "View Applications",
      icon: <FileText className="w-5 h-5" />,
      to: "/admin/applications",
    },
  ];

  return (
    <DashboardLayout title="Placement Dashboard">
      <PageContainer>
        {/* Welcome Section */}
        <div
          className={`rounded-lg md:rounded-xl p-4 md:p-6 mb-4 md:mb-6 ${
            isDark ? "bg-gradient-to-r from-indigo-900 to-purple-900" : "bg-gradient-to-r from-indigo-600 to-purple-600"
          } text-white`}
        >
          <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">
            {getGreeting()}, {user?.activeRole === "Student Placement Cell" ? "SPC" : user?.activeRole || "Admin"}!
          </h2>
          <p className="text-xs md:text-sm opacity-90">
            {stats.openDrives > 0 
              ? `${stats.openDrives} active placement ${stats.openDrives === 1 ? 'drive' : 'drives'} • ${stats.totalApplications} total applications received`
              : "Manage placements, companies, and student applications efficiently."
            }
          </p>
        </div>

        {/* Key Statistics */}
        <Section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {[...Array(5)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              <StatCard
                title="Total Companies"
                value={stats.totalCompanies}
                icon={<Building2 className="w-6 h-6" />}
                color="blue"
                trend="Registered"
              />
              <StatCard
                title="Total Drives"
                value={stats.totalDrives}
                icon={<CalendarDays className="w-6 h-6" />}
                color="purple"
                trend={`${stats.openDrives} active`}
              />
              <StatCard
                title="Applications"
                value={stats.totalApplications}
                icon={<FileText className="w-6 h-6" />}
                color="red"
                trend="All time"
              />
              <StatCard
                title="Students Placed"
                value={stats.studentsPlaced}
                icon={<GraduationCap className="w-6 h-6" />}
                color="green"
                trend="Success!"
              />
              <StatCard
                title="Open Drives"
                value={stats.openDrives}
                icon={<TrendingUp className="w-6 h-6" />}
                color="orange"
                trend="Active now"
              />
            </div>
          )}
        </Section>

        {/* Quick Actions - Only for Admin */}
        {user?.activeRole === "admin" && (
          <Section title="Quick Actions" description="Frequently used actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.to)}
                  className={`
                    p-3 md:p-4 rounded-lg border transition-all hover:shadow-lg flex items-center gap-2 md:gap-3
                    ${isDark 
                      ? "bg-gray-800 border-gray-700 hover:border-blue-600" 
                      : "bg-white border-gray-200 hover:border-blue-400"
                    }
                  `}
                >
                  <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
                    {action.icon}
                  </div>
                  <span className={`font-medium text-xs md:text-sm text-left ${isDark ? "text-white" : "text-gray-900"}`}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Drives */}
          <Section 
            title="Recent Placement Drives" 
            description="Latest company drives"
            action={
              <button
                onClick={() => navigate("/admin/drives")}
                className={`text-xs md:text-sm font-medium ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
              >
                View All →
              </button>
            }
          >
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : recentDrives.length === 0 ? (
              <div className={`rounded-lg border p-8 md:p-12 text-center ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                  <CalendarDays className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No drives yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDrives.map((drive, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/admin/drives/${drive.id}`)}
                    className={`
                      group relative p-4 rounded-lg border cursor-pointer transition-all
                      ${isDark 
                        ? "bg-gray-800 border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10" 
                        : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-lg"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {drive.company?.logo ? (
                        <img 
                          src={drive.company.logo} 
                          alt={drive.company.name}
                          className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                          <Building2 className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className={`font-semibold truncate ${isDark ? "text-white group-hover:text-blue-400" : "text-gray-900 group-hover:text-blue-600"} transition-colors`}>
                            {drive.company?.name || "Company"}
                          </h4>
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadge(drive.status)}`}>
                            {drive.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <div className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{drive.drive_type}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{formatDate(drive.application_deadline)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recent Applications */}
          <Section 
            title="Recent Applications" 
            description="Latest student applications"
            action={
              <button
                onClick={() => navigate("/admin/applications")}
                className={`text-xs md:text-sm font-medium ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
              >
                View All →
              </button>
            }
          >
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className={`rounded-lg border p-8 md:p-12 text-center ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                  <FileText className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                </div>
                <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>No applications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app, idx) => {
                  // API returns serialized fields directly
                  const studentName = app.student_name || "Unknown Student";
                  const companyName = app.company_name || "";
                  const driveTitle = app.drive_title || "";
                  
                  // Get first letter for avatar
                  const firstLetter = studentName?.[0] || "S";
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => navigate(`/admin/applications/${app.id}`)}
                      className={`
                        group relative p-4 rounded-lg border cursor-pointer transition-all
                        ${isDark 
                          ? "bg-gray-800 border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10" 
                          : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-lg ${
                          isDark ? "bg-gradient-to-br from-purple-900 to-blue-900 text-purple-300" : "bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700"
                        }`}>
                          {(studentName?.[0] || "S").toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold truncate ${isDark ? "text-white group-hover:text-purple-400" : "text-gray-900 group-hover:text-purple-600"} transition-colors`}>
                                {studentName}
                              </h4>
                              {companyName && (
                                <p className={`text-xs truncate mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                  {companyName}
                                </p>
                              )}
                            </div>
                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <div className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span>{formatDate(app.applied_at || app.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
