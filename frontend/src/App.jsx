import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StudentRegistration } from "./pages/admin/StudentRegistration";
import { RegisteredStudents } from "./pages/admin/RegisteredStudents";
import StudentDetails from "./pages/admin/StudentDetails";
import JobDriveForm from "./pages/admin/JobDriveForm";
import RegisterCellMember from "./components/RegisterCellMember";
import AddDrive from "./components/AddDrive";
import { DashboardLayout, PageContainer } from "./components/layout";
import CompanyRegistration from "./pages/admin/CompanyRegistration";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import {StudentDashboard} from "./pages/student/StudentDashboard";
import { StudentDrives } from "./pages/student/StudentDrives";
import CompaniesList from "./pages/admin/company/CompaniesList";
import { CompanyDrives } from "./pages/admin/drive/DrivesList";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="min-h-screen">
          <Routes>
            {/* Auth */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset" element={<ResetPasswordPage />} /> 
            {/* Landing */}
            <Route path="/" element={<Home />} />
            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Admin students */}
            <Route path="/admin/students/register" element={<StudentRegistration />} />
            <Route path="/admin/students" element={<RegisteredStudents />} />
            <Route path="/admin/students/details" element={<StudentDetails />} />

            {/* Admin drives */}
            <Route
              path="/admin/drives"
              element={
                <CompanyDrives/>
              }
            />
            <Route
              path="/admin/drives/new"
              element={
                <DashboardLayout title="Add Drive">
                  <PageContainer>
                    <AddDrive />
                  </PageContainer>
                </DashboardLayout>
              }
            />

            <Route path="/admin/drives/new/jobs" element={<JobDriveForm />} />
            

            {/* Admin companies */}
            <Route path="/admin/companies" element={<CompaniesList/>} />
            <Route path="/admin/companies/register" element={<CompanyRegistration />} />

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
            {/* Student routes */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/drives" element={<StudentDrives />} />
            <Route path="/student/applications" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentDashboard />} />
            {/* Fallback to Home for any unknown route */}
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}
