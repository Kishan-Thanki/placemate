import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDetails = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchAllStudentsData();
  }, []);

  const fetchAllStudentsData = async () => {
    try {
      setLoading(true);
      const mockStudents = [
        {
          id: 1,
          full_name: "John Doe",
          enrollment_number: "2021001",
          date_of_birth: "2000-01-15",
          gender: "Male",
          joining_year: "2021",
          course: "B.Tech Computer Science",
          current_cgpa: "8.5",
          graduation_status: "Ongoing",
          placement_status: "Placed",
          phone: "+91 9876543210",
          address: "123 Main Street, City, State",
          email: "john.doe@example.com",
          company_placed: "Google",
          job_role: "Software Engineer",
          package: "15 LPA",
          percentage_data: {
            tenth: "85%",
            twelfth: "78%",
            diploma: "N/A",
            ug_cgpa: "8.5"
          }
        },
        {
          id: 2,
          full_name: "Jane Smith",
          enrollment_number: "2021002",
          date_of_birth: "1999-05-20",
          gender: "Female",
          joining_year: "2021",
          course: "B.Sc Information Technology",
          current_cgpa: "7.8",
          graduation_status: "Ongoing",
          placement_status: "Internship",
          phone: "+91 9876543211",
          address: "456 Oak Avenue, City, State",
          email: "jane.smith@example.com",
          company_placed: "Microsoft",
          job_role: "Software Development Intern",
          package: "8 LPA",
          percentage_data: {
            tenth: "82%",
            twelfth: "75%",
            diploma: "N/A",
            ug_cgpa: "7.8"
          }
        },
        {
          id: 3,
          full_name: "Michael Brown",
          enrollment_number: "2021003",
          date_of_birth: "1998-12-10",
          gender: "Male",
          joining_year: "2020",
          course: "Diploma in Information Technology",
          current_cgpa: "8.2",
          graduation_status: "Graduated",
          placement_status: "Not Placed",
          phone: "+91 9876543212",
          address: "789 Pine Street, City, State",
          email: "michael.brown@example.com",
          company_placed: "N/A",
          job_role: "N/A",
          package: "N/A",
          percentage_data: {
            tenth: "78%",
            twelfth: "72%",
            diploma: "85%",
            ug_cgpa: "8.2"
          }
        },
        {
          id: 4,
          full_name: "Aarav Patel",
          enrollment_number: "2021004",
          date_of_birth: "2001-03-25",
          gender: "Male",
          joining_year: "2021",
          course: "M.E Electrical Engineering",
          current_cgpa: "9.1",
          graduation_status: "Ongoing",
          placement_status: "Placed",
          phone: "+91 9876543213",
          address: "321 Elm Drive, City, State",
          email: "aarav.patel@example.com",
          company_placed: "TCS",
          job_role: "Electrical Engineer",
          package: "12 LPA",
          percentage_data: {
            tenth: "90%",
            twelfth: "85%",
            diploma: "N/A",
            ug_cgpa: "9.1"
          }
        },
        {
          id: 5,
          full_name: "Sanya Verma",
          enrollment_number: "2021005",
          date_of_birth: "2000-08-14",
          gender: "Female",
          joining_year: "2020",
          course: "B.E Electronics and Communication",
          current_cgpa: "7.5",
          graduation_status: "Graduated",
          placement_status: "Not Placed",
          phone: "+91 9876543214",
          address: "654 Maple Lane, City, State",
          email: "sanya.verma@example.com",
          company_placed: "N/A",
          job_role: "N/A",
          package: "N/A",
          percentage_data: {
            tenth: "80%",
            twelfth: "76%",
            diploma: "N/A",
            ug_cgpa: "7.5"
          }
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStudents(mockStudents);
    } catch (err) {
      setError('Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/registered-students');
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

  const courses = [...new Set(students.map(s => s.course))];
  const statuses = [...new Set(students.map(s => s.placement_status))];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !selectedCourse || student.course === selectedCourse;
    const matchesStatus = !selectedStatus || student.placement_status === selectedStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  if (loading) {
    return <div className="loading">Loading students data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="student-details-page">
      <div className="page-header">
        <h1>All Student Details</h1>
        <p className="subtitle">Comprehensive details of all registered students</p>
        
        <button className="back-btn" onClick={handleBack}>
          ← Back to Students List
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-bar">
          <div className="search-box">
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
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="students-grid">
        {filteredStudents.map((student) => (
          <div key={student.id} className="student-card">
            <div className="student-header">
              <h3>{student.full_name}</h3>
              <span className={`status-badge ${getStatusClass(student.placement_status)}`}>
                {student.placement_status}
              </span>
            </div>

            <div className="student-info">
              <div className="info-section">
                <h4>Personal Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Enrollment:</span>
                    <span className="value">{student.enrollment_number}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">DOB:</span>
                    <span className="value">{student.date_of_birth}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Gender:</span>
                    <span className="value">{student.gender}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Phone:</span>
                    <span className="value">{student.phone}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Academic Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Course:</span>
                    <span className="value">{student.course}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Joining Year:</span>
                    <span className="value">{student.joining_year}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">CGPA:</span>
                    <span className="value">{student.current_cgpa}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Graduation:</span>
                    <span className="value">{student.graduation_status}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Placement Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Company:</span>
                    <span className="value">{student.company_placed}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Role:</span>
                    <span className="value">{student.job_role}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Package:</span>
                    <span className="value">{student.package}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{student.email}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Academic Performance</h4>
                <div className="percentage-grid">
                  <div className="percentage-item">
                    <span className="label">10th %:</span>
                    <span className="value">{student.percentage_data.tenth}</span>
                  </div>
                  <div className="percentage-item">
                    <span className="label">12th %:</span>
                    <span className="value">{student.percentage_data.twelfth}</span>
                  </div>
                  <div className="percentage-item">
                    <span className="label">Diploma %:</span>
                    <span className="value">{student.percentage_data.diploma}</span>
                  </div>
                  <div className="percentage-item">
                    <span className="label">UG CGPA:</span>
                    <span className="value">{student.percentage_data.ug_cgpa}</span>
                  </div>
                </div>
              </div>

              <div className="address-section">
                <h4>Address</h4>
                <p className="address-text">{student.address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="no-results">
          <p>No students found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;