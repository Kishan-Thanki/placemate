import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StudentRegistration } from "./pages/admin/StudentRegistration";
import { RegisteredStudents } from "./pages/admin/RegisteredStudents";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen">
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Home />} />
            {/* Committed Admin Dashboard routes (kept as-is) */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* New admin pages wired into our layout */}
            <Route path="/admin/students/register" element={<StudentRegistration />} />
            <Route path="/admin/students" element={<RegisteredStudents />} />
            {/* Placeholders from friend work aligned to theme; can be replaced later */}
            <Route path="/admin/companies" element={<div className="p-6">Companies Page</div>} />
            <Route path="/admin/drives/basic-details" element={<div className="p-6">Add Drive - Basic Details Page</div>} />
            <Route path="/admin/drives/job-details" element={<div className="p-6">Add Drive - Job Details Page</div>} />
            <Route path="/admin/applications" element={<div className="p-6">Applications Status Page</div>} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}
