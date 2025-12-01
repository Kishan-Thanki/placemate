// src/pages/student/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { BookOpen, Calendar, Briefcase, Award, ArrowRight, Building2, MapPin, Clock } from "lucide-react";
import { StatCard, CardSkeleton } from "../../components/ui";
import { companyDriveService } from "../../services/companyDriveService";
import { applicationService } from "../../services/applicationService";
import { fetchJSON } from "../../lib/api";

export function StudentDashboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [stats, setStats] = useState({
    eligibleDrives: 0,
    appliedDrives: 0,
    offersReceived: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch student profile
      try {
        const { ok, data: profileResponse } = await fetchJSON("/api/v1/students/me/", {
          method: "GET",
          credentials: "include",
        });
        if (ok && profileResponse?.data) {
          setStudentProfile(profileResponse.data);
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      }
      
      // Fetch upcoming drives (status: Open)
      const drivesResponse = await companyDriveService.getAllDrives({ status: 'Open' });
      const allDrives = drivesResponse?.results || drivesResponse?.data || [];
      
      // Filter upcoming drives (deadline not passed)
      const now = new Date();
      const upcoming = allDrives.filter(drive => {
        if (!drive.application_deadline) return true;
        return new Date(drive.application_deadline) > now;
      }).slice(0, 5); // Get top 5
      
      setUpcomingDrives(upcoming);
      
      // Fetch student's applications
      if (user?.id) {
        try {
          const appsResponse = await applicationService.getMyApplications();
          const apps = appsResponse?.results || appsResponse?.data || [];
          setMyApplications(apps);
          
          // Calculate stats
          const offersCount = apps.filter(app => app.status === 'Offered' || app.status === 'Accepted').length;
          setStats({
            eligibleDrives: upcoming.length,
            appliedDrives: apps.length,
            offersReceived: offersCount,
          });
        } catch (err) {
          console.error("Error fetching applications:", err);
        }
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = () => {
    if (!user) return "Student";
    const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Student";
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


  return (
    <StudentLayout title="Dashboard">
      <PageContainer>
        {/* Welcome Section */}
        <div
          className={`rounded-lg md:rounded-xl p-4 md:p-6 mb-4 md:mb-6 ${
            isDark ? "bg-gradient-to-r from-blue-900 to-purple-900" : "bg-gradient-to-r from-blue-600 to-purple-600"
          } text-white`}
        >
          <div className="flex flex-row justify-between items-center gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 truncate">
                {getGreeting()}, {getFullName()}!
              </h2>
              <p className="text-xs md:text-sm opacity-90 line-clamp-2">
                {upcomingDrives.length > 0 
                  ? `${upcomingDrives.length} new placement ${upcomingDrives.length === 1 ? 'opportunity' : 'opportunities'} available for you!`
                  : "Stay tuned for upcoming placement opportunities."
                }
              </p>
            </div>
      
          </div>
        </div>

        {/* Stats */}
        <Section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard 
                title="Program" 
                value={studentProfile?.program || "N/A"} 
                icon={<BookOpen />} 
                color="blue" 
                trend={`CGPA: ${studentProfile?.current_cgpa || "N/A"}`} 
              />
              <StatCard 
                title="Open Drives" 
                value={stats.eligibleDrives} 
                icon={<Calendar />} 
                color="purple"
                trend="Available now"
              />
              <StatCard 
                title="My Applications" 
                value={stats.appliedDrives} 
                icon={<Briefcase />} 
                color="red"
                trend="Total applied"
              />
              <StatCard 
                title="Offers Received" 
                value={stats.offersReceived} 
                icon={<Award />} 
                color="green"
                trend={stats.offersReceived > 0 ? "Congratulations! 🎉" : "Keep applying!"}
              />
            </div>
          )}
        </Section>

        {/* Upcoming Drives */}
        <Section 
          title="Upcoming Placement Drives" 
          description="Apply now to secure your dream job!"
          action={
            upcomingDrives.length > 0 && (
              <button
                onClick={() => navigate("/student/drives")}
                className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                  isDark
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                View All
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            )
          }
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : upcomingDrives.length === 0 ? (
            <div className={`text-center py-8 md:py-12 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <Calendar className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
              <h3 className={`text-base md:text-lg font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No Upcoming Drives
              </h3>
              <p className={`text-xs md:text-sm px-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Check back soon for new placement opportunities!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {upcomingDrives.map((drive, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/student/company-drives/${drive.id}`)}
                  className={`
                    p-4 md:p-5 rounded-lg border cursor-pointer transition-all hover:shadow-lg
                    ${isDark 
                      ? "bg-gray-800 border-gray-700 hover:border-blue-600" 
                      : "bg-white border-gray-200 hover:border-blue-400"
                    }
                  `}
                >
                  <div className="flex items-start gap-2 md:gap-3 mb-3">
                    {drive.company?.logo ? (
                      <img 
                        src={drive.company.logo} 
                        alt={drive.company.name} 
                        className="w-10 h-10 md:w-12 md:h-12 object-contain rounded flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                        <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm md:text-base font-semibold mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                        {drive.company?.name || "Company"}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 md:py-1 text-xs rounded ${
                        drive.drive_type === 'FullTime' 
                          ? isDark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"
                          : isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700"
                      }`}>
                        {drive.drive_type || "Job"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    <div className={`flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">{drive.job_mode || "N/A"}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">Apply by: {formatDate(drive.application_deadline)}</span>
                    </div>
                  </div>

                  <button
                    className={`mt-3 md:mt-4 w-full py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                      isDark
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </PageContainer>
    </StudentLayout>
  );
}
