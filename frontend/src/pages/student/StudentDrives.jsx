import React, { useState } from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { Search } from "lucide-react";
import { DriveCard } from "../../components//ui/DriveCard"; 

export function StudentDrives() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const drives = [
    {
      id: 1,
      company: "TechSolutions Inc.",
      role: "Software Engineer Intern",
      type: "Internship",
      location: "Bengaluru, India",
      stipend: "₹ 20,000 – 30,000 / month",
      description:
        "TechSolutions Inc. is a leading tech firm specializing in cloud computing solutions. We are looking for bright minds to join our engineering team.",
    },
    {
      id: 2,
      company: "Global Innovations",
      role: "Data Analyst Trainee",
      type: "Full-time",
      location: "Hyderabad, India",
      stipend: "₹ 4.5 – 6.0 LPA",
      description:
        "Join Global Innovations, a pioneer in data science. Develop insights from large datasets to drive business decisions.",
    },
    {
      id: 3,
      company: "FinServe Pro",
      role: "Financial Consultant",
      type: "Full-time",
      location: "Mumbai, India",
      stipend: "₹ 5.0 – 7.5 LPA",
      description:
        "FinServe Pro offers financial advisory services. We seek ambitious graduates passionate about finance and client success.",
    },
    {
      id: 4,
      company: "HealthBridge Co.",
      role: "Healthcare IT Support",
      type: "Full-time",
      location: "Pune, India",
      stipend: "₹ 3.8 – 5.2 LPA",
      description:
        "HealthBridge Co. leads digital healthcare solutions. Support our mission to provide seamless patient care systems.",
    },
    {
      id: 5,
      company: "E-Comm Giants",
      role: "Marketing Specialist",
      type: "Full-time",
      location: "Gurugram, India",
      stipend: "₹ 4.2 – 6.5 LPA",
      description:
        "E-Comm Giants is revolutionizing online retail. Drive marketing campaigns and engage with a vast customer base.",
    },
    {
      id: 6,
      company: "EduTech Future",
      role: "Content Developer",
      type: "Internship",
      location: "Chennai, India",
      stipend: "₹ 15,000 – 25,000 / month",
      description:
        "EduTech Future develops innovative e-learning platforms. Create engaging educational content for global learners.",
    },
  ];

  const filteredDrives = drives.filter(
    (drive) =>
      (filter === "All" || drive.type === filter) &&
      (drive.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drive.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

          {/* Drives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDrives.map((drive) => (
              <DriveCard key={drive.id} drive={drive} />
            ))}
          </div>

          {filteredDrives.length === 0 && (
            <div
              className={`text-center py-10 rounded-lg border mt-6 ${
                isDark
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              No drives found matching your criteria.
            </div>
          )}
        </Section>

        <p
          className={`text-xs text-center mt-8 ${
            isDark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          Drives shown based on student eligibility, filters, and registration status.
        </p>
      </PageContainer>
    </StudentLayout>
  );
}
