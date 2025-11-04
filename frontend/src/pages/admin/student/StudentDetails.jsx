import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../../components/layout';
import { Card, Button } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { Search } from 'lucide-react';

const StudentDetails = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
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
    navigate('/admin/students');
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

  const courses = useMemo(() => [...new Set(students.map(s => s.course))], [students]);
  const statuses = useMemo(() => [...new Set(students.map(s => s.placement_status))], [students]);

  const filteredStudents = useMemo(() => students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !selectedCourse || student.course === selectedCourse;
    const matchesStatus = !selectedStatus || student.placement_status === selectedStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  }), [students, searchTerm, selectedCourse, selectedStatus]);

  if (loading) {
    return (
      <DashboardLayout title="Student Details">
        <PageContainer>
          <Section>
            <Card className="p-6">
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading students data...</div>
            </Card>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Student Details">
        <PageContainer>
          <Section>
            <Card className="p-6">
              <div className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>Error: {error}</div>
            </Card>
          </Section>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="All Student Details">
      <PageContainer>
        <Section>
          <div className="flex items-center justify-between mb-4">
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Comprehensive details of all registered students</p>
            <Button variant="outline" onClick={handleBack}>← Back to Students List</Button>
          </div>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-1">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Search by Name or Enrollment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <select 
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </Card>
        </Section>

        <Section>
          {filteredStudents.length === 0 ? (
            <Card className="p-6">
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No students found matching your criteria.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{student.full_name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      getStatusClass(student.placement_status) === 'placed' ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') :
                      getStatusClass(student.placement_status) === 'internship' ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700') :
                      getStatusClass(student.placement_status) === 'offer' ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700') :
                      (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                    }`}>{student.placement_status}</span>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Personal Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="Enrollment" value={student.enrollment_number} />
                        <InfoItem label="DOB" value={student.date_of_birth} />
                        <InfoItem label="Gender" value={student.gender} />
                        <InfoItem label="Phone" value={student.phone} />
                      </div>
                    </div>

                    <div>
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Academic Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="Course" value={student.course} />
                        <InfoItem label="Joining Year" value={student.joining_year} />
                        <InfoItem label="CGPA" value={student.current_cgpa} />
                        <InfoItem label="Graduation" value={student.graduation_status} />
                      </div>
                    </div>

                    <div>
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Placement Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="Company" value={student.company_placed} />
                        <InfoItem label="Role" value={student.job_role} />
                        <InfoItem label="Package" value={student.package} />
                        <InfoItem label="Email" value={student.email} />
                      </div>
                    </div>

                    <div>
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Academic Performance</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="10th %" value={student.percentage_data.tenth} />
                        <InfoItem label="12th %" value={student.percentage_data.twelfth} />
                        <InfoItem label="Diploma %" value={student.percentage_data.diploma} />
                        <InfoItem label="UG CGPA" value={student.percentage_data.ug_cgpa} />
                      </div>
                    </div>

                    <div>
                      <h4 className={`font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Address</h4>
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{student.address}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
};

function InfoItem({ label, value }) {
  const { isDark } = useTheme();
  return (
    <div className="flex flex-col">
      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}:</span>
      <span className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

export default StudentDetails;