import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthErrorProvider } from "./contexts/AuthErrorContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { StudentRegistration } from "./pages/admin/student/StudentRegistration";
import { RegisteredStudents } from "./pages/admin/student/RegisteredStudents";
import StudentDetails from "./pages/admin//student/StudentDetails";
import { DashboardLayout, PageContainer } from "./components/layout";
import CompanyRegistration from "./pages/admin/company/CompanyRegistration";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentDrives } from "./pages/student/StudentDrives";
import StudentCompanyDriveDetails from "./pages/student/StudentCompanyDriveDetails";
import StudentProfile from "./pages/student/StudentProfile";
import StudentApplications from "./pages/student/StudentApplications";
import CompaniesList from "./pages/admin/company/CompaniesList";
import CompanyDetails from "./pages/admin/company/CompanyDetails";
import CompanyDrivesList from "./pages/admin/companydrive/CompanyDrivesList";
import CompanyDriveForm from "./pages/admin/companydrive/CompanyDriveForm";
import CompanyDriveJobForm from "./pages/admin/companydrive/CompanyDriveJobForm";
import JobEditForm from "./pages/admin/companydrive/JobEditForm";
import CompanyDriveDetails from "./pages/admin/companydrive/CompanyDriveDetails";
import PlacementDrivesList from "./pages/admin/placement/PlacementDrivesList";
import PlacementDriveForm from "./pages/admin/placement/PlacementDriveForm";
import PlacementDriveDetails from "./pages/admin/placement/PlacementDriveDetails";
import SPCManagement from "./pages/admin/SPCManagement";
import ApplicationsManagement from "./pages/admin/applications/ApplicationsManagement";

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AuthErrorProvider>
            <div className="min-h-screen">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
                <Route
                  path="/auth/reset/:token"
                  element={<ResetPasswordPage />}
                />

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
                  path="/admin/students/details/:userId"
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
                      <CompanyDrivesList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drives/new"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <CompanyDriveForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drives/new/jobs"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <CompanyDriveJobForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drives/:id/jobs/add"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <CompanyDriveJobForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drives/:driveId/jobs/:jobId/edit"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <JobEditForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drives/:id/edit"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <CompanyDriveForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drives/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <CompanyDriveDetails />
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
                  path="/admin/placement-drives"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <PlacementDrivesList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/placement-drives/new"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <PlacementDriveForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/placement-drives/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <PlacementDriveDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/placement-drives/:id/edit"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <PlacementDriveForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/spc"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <SPCManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/applications"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "student placement cell"]}
                    >
                      <ApplicationsManagement />
                    </ProtectedRoute>
                  }
                />

               
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
                  path="/student/company-drives/:id"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentCompanyDriveDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/applications"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentApplications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/profile"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Home />} />
              </Routes>
            </div>
          </AuthErrorProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
