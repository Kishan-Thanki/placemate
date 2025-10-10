import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar";
import StudentRegistration from "./StudentRegistration";
import RegisteredStudents from "./RegisteredStudent";

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<StudentRegistration />} />
            <Route path="/student-registration" element={<StudentRegistration />} />
            <Route path="/companies" element={<div>Companies Page</div>} />
            <Route path="/add-drive/basic-details" element={<div>Add Drive - Basic Details Page</div>} />
            <Route path="/add-drive/job-details" element={<div>Add Drive - Job Details Page</div>} />
            <Route path="/registered-students" element={<RegisteredStudents />} />
            <Route path="/applications-status" element={<div>Applications Status Page</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
