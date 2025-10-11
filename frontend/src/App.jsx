import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import StudentRegistration from "./components/StudentRegistration";
import RegisteredStudent from "./components/RegisteredStudent";
import RegisterCellMember from "./components/RegisterCellMember";
import AddDrive from "./components/AddDrive";

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<StudentRegistration />} />
            <Route path="/student-registration" element={<StudentRegistration />} />
            <Route path="/spc" element={<RegisterCellMember />} />
            <Route path="/add-drive/basic-details" element={<AddDrive />} />
            <Route path="/add-drive/job-details" element={<div>Job Details Page</div>} />
            <Route path="/registered-students" element={<RegisteredStudent />} />
            <Route path="/applications-status" element={<div>Applications Status Page</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
