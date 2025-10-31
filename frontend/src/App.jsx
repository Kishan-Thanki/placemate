import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentDrives } from "./pages/student/StudentDrives";
import CompaniesList from "./pages/admin/company/CompaniesList";
import CompanyDetails from "./pages/admin/company/CompanyDetails";
import { CompanyDrives } from "./pages/admin/drive/DrivesList";
import TestAuth from "./pages/admin/TestAuth";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset" element={<ResetPasswordPage />} />

              {/* Admin routes - protected */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students/register"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <StudentRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <RegisteredStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students/details"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <StudentDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/drives"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <CompanyDrives />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/drives/new"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <DashboardLayout title="Add Drive">
                      <PageContainer>
                        <AddDrive />
                      </PageContainer>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/drives/new/jobs"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <JobDriveForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <CompaniesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies/register"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <CompanyRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies/:id/edit"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <CompanyRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/companies/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <CompanyDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/test-auth"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <TestAuth />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <div className="p-6">Applications Page</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/spc"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "student placement cell"]}
                  >
                    <DashboardLayout title="Register Cell Member">
                      <PageContainer>
                        <RegisterCellMember />
                      </PageContainer>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Student routes - protected */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/drives"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDrives />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/applications"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Home />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
