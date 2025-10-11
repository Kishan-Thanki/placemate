import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StudentRegistration } from "./pages/admin/StudentRegistration";
import { RegisteredStudents } from "./pages/admin/RegisteredStudents";
import RegisterCellMember from "./components/RegisterCellMember";
import AddDrive from "./pages/admin/AddDrive";
import JobDriveForm from "./pages/admin/JobDriveForm";
import StudentDetails from "./pages/admin/StudentDetails";
import { DashboardLayout, PageContainer } from "./components/layout";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen">
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Home />} />
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Admin students */}
            <Route path="/admin/students/register" element={<StudentRegistration />} />
            <Route path="/admin/students" element={<RegisteredStudents />} />

            {/* Admin drives */}
            <Route
              path="/admin/new"
              element={
                <DashboardLayout title="Add Drive">
                  <PageContainer>
                    <AddDrive />
                  </PageContainer>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/jobdrive"
              element={
                <DashboardLayout title="Job Drive">
                  <PageContainer>
                    <JobDriveForm />
                  </PageContainer>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/studentdetails"
              element={
                <DashboardLayout title="Student Detail">
                  <PageContainer>
                    <StudentDetails />
                  </PageContainer>
                </DashboardLayout>
              }
            />
            

            {/* Admin companies */}
            <Route path="/admin/companies" element={<div className="p-6">Companies Page</div>} />

            {/* Admin applications */}
            <Route path="/admin/applications" element={<div className="p-6">Applications Page</div>} />

            {/* Admin SPC - Register Cell Member */}
            <Route
              path="/admin/spc"
              element={
                <DashboardLayout title="Register Cell Member">
                  <PageContainer>
                    <RegisterCellMember />
                  </PageContainer>
                </DashboardLayout>
              }
            />
            {/* Fallback to Home for any unknown route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}
