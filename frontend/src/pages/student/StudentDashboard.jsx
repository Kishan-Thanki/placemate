// src/pages/student/StudentDashboard.jsx
import React from "react";
import { StudentLayout } from "../../components/layout/StudentLayout";
import { PageContainer, Section } from "../../components/layout";
import { useTheme } from "../../contexts/ThemeContext";
import { BookOpen, Calendar, Briefcase, Award } from "lucide-react";
import { StatCard } from "../../components/ui";

export function StudentDashboard() {
  const { isDark } = useTheme();

  const student = {
    name: "Smit Thakkar",
    course: "M.Sc IT",
    cgpa: 9.0,
    eligibleDrives: 2,
    appliedDrives: 2,
    offer: "83.0 LPA",
    offerCompany: "Company 37",
  };

  const interviews = [
    { date: "July 15, 2024", time: "10:00 AM", company: "Tech Solutions Inc.", role: "Software Engineer", status: "Scheduled" },
    { date: "July 16, 2024", time: "02:30 PM", company: "Global Innovations", role: "Data Scientist", status: "Scheduled" },
    { date: "July 17, 2024", time: "11:00 AM", company: "FinTech Dynamics", role: "Product Manager", status: "Scheduled" },
  ];


  return (
    <StudentLayout title="Dashboard">
      <PageContainer>
        {/* Welcome Section */}
        <div
          className={`rounded-xl p-5 flex justify-between items-center mb-6 ${
            isDark ? "bg-gray-800 text-white" : "bg-gray-900 text-white"
          }`}
        >
          <div>
            <h2 className="text-lg font-semibold">
              Welcome back, {student.name}! 👋
            </h2>
            <p className="text-sm opacity-90">
              Track your placement journey and stay updated with the latest opportunities.
            </p>
          </div>
          <div className="text-3xl">🚀</div>
        </div>

        {/* Stats */}
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Course" value={`${student.course}`} icon={<BookOpen />} color="blue" trend={`CGPA : ${Number(student.cgpa).toFixed(2)}`} />
            <StatCard title="Eligible Drives" value={student.eligibleDrives} icon={<Calendar />} color="purple" />
            <StatCard title="Applied Drives" value={student.appliedDrives} icon={<Briefcase />} color="red" />
            <StatCard title="Offer" value={student.offer} icon={<Award />} color="green" trend={student.offerCompany} />
          </div>
        </Section>

        {/* Interviews */}
        <Section title="Upcoming Interviews">
          <div className={`overflow-x-auto rounded-lg border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <table className="w-full text-sm">
              <thead className={isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"}>
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Company</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((i, idx) => (
                  <tr key={idx} className={isDark ? "border-gray-700 border-t" : "border-gray-200 border-t"}>
                    <td className="px-4 py-2">{i.date}</td>
                    <td className="px-4 py-2">{i.time}</td>
                    <td className="px-4 py-2">{i.company}</td>
                    <td className="px-4 py-2">{i.role}</td>
                    <td className="px-4 py-2">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </PageContainer>
    </StudentLayout>
  );
}
