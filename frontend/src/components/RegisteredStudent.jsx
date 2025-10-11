import React, { useState } from "react";
import { Eye, Edit, Trash2, Search } from "lucide-react";

export default function RegisteredStudent() {
  const [students] = useState([
    { id: 1, enroll: "2021001", name: "John Doe", batch: "2020-2026", course: "M.Sc IT", email: "john.doe@example.com", status: "Placed" },
    { id: 2, enroll: "2021002", name: "Jane Smith", batch: "2020-2022", course: "B.Sc IT", email: "jane.smith@example.com", status: "Internship" },
    { id: 3, enroll: "2021003", name: "Michael Brown", batch: "2019-2021", course: "Diploma in Information Technology", email: "michael.brown@example.com", status: "Not Placed" },
    { id: 4, enroll: "2021004", name: "Aarav Patel", batch: "2020-2022", course: "M.E Electrical Engineering", email: "student1@example.com", status: "Placed" },
    { id: 5, enroll: "2021005", name: "Sanya Verma", batch: "2019-2021", course: "B.E Electronics and Communication", email: "student2@example.com", status: "Not Placed" },
    { id: 6, enroll: "2021006", name: "Dev Singh", batch: "2021-2023", course: "M.Sc Data Science", email: "student3@example.com", status: "Internship" },
    { id: 7, enroll: "2021007", name: "Rhea Shah", batch: "2020-2022", course: "Diploma in Information Technology", email: "student4@example.com", status: "Job Offer Received" },
    { id: 8, enroll: "2021008", name: "Kabir Khan", batch: "2018-2020", course: "B.Tech Computer Science", email: "student5@example.com", status: "Placed" },
    { id: 9, enroll: "2021009", name: "Meera Gupta", batch: "2010-2016", course: "M.E Mechanical Engineering", email: "student6@example.com", status: "Not Placed" },
    { id: 10, enroll: "2021010", name: "Arjun Reddy", batch: "2019-2021", course: "B.E Electrical Engineering", email: "student7@example.com", status: "Placed" },
    { id: 11, enroll: "2021011", name: "Priya Sharma", batch: "2020-2026", course: "M.Sc IT", email: "priya.sharma@example.com", status: "Internship" },
    { id: 12, enroll: "2021012", name: "Rajesh Kumar", batch: "2020-2022", course: "B.Sc IT", email: "rajesh.kumar@example.com", status: "Placed" },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const courses = [...new Set(students.map(s => s.course))];
  const batches = [...new Set(students.map(s => s.batch))];
  const statuses = [...new Set(students.map(s => s.status))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enroll.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !selectedCourse || student.course === selectedCourse;
    const matchesBatch = !selectedBatch || student.batch === selectedBatch;
    const matchesStatus = !selectedStatus || student.status === selectedStatus;

    return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
  });

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedBatch('');
    setSelectedStatus('');
  };

  const handleView = (student) => {
    // View student details
  };

  const handleEdit = (student) => {
    // Edit student details
  };

  const handleDelete = (student) => {
    // Delete student
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Placed": return "placed";
      case "Internship": return "internship";
      case "Not Placed": return "not-placed";
      case "Job Offer Received": return "offer";
      default: return "";
    }
  };

  return (
    <div className="registered-students-page">
      <h2>Registered Students</h2>
      <p>Manage registered students for placement management.</p>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            placeholder="Search by Name or Enrollment" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select Course</option>
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
        <select 
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="">Select Batch</option>
          {batches.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Select Placement Status</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button className="reset-btn" onClick={handleReset}>Reset</button>
      </div>

      <table className="students-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Enrollment No</th>
            <th>Full Name</th>
            <th>Batch</th>
            <th>Course</th>
            <th>Email</th>
            <th>Placement Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td>{s.enroll}</td>
              <td>{s.name}</td>
              <td>{s.batch}</td>
              <td>{s.course}</td>
              <td>{s.email}</td>
              <td>
                <span className={`status-badge ${getStatusClass(s.status)}`}>{s.status}</span>
              </td>
              <td className="actions">
                <Eye size={16} onClick={() => handleView(s)} style={{ cursor: 'pointer' }} />
                <Edit size={16} onClick={() => handleEdit(s)} style={{ cursor: 'pointer' }} />
                <Trash2 size={16} onClick={() => handleDelete(s)} style={{ cursor: 'pointer' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
