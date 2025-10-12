import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, Edit, Trash2, Search } from 'lucide-react';

export function RegisteredStudents() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [students] = useState([
    { id: 1, enroll: '2021001', name: 'John Doe', batch: '2020-2026', course: 'M.Sc IT', email: 'john.doe@example.com', status: 'Placed' },
    { id: 2, enroll: '2021002', name: 'Jane Smith', batch: '2020-2022', course: 'B.Sc IT', email: 'jane.smith@example.com', status: 'Internship' },
    { id: 3, enroll: '2021003', name: 'Michael Brown', batch: '2019-2021', course: 'Diploma in Information Technology', email: 'michael.brown@example.com', status: 'Not Placed' },
    { id: 4, enroll: '2021004', name: 'Aarav Patel', batch: '2020-2022', course: 'M.E Electrical Engineering', email: 'student1@example.com', status: 'Placed' },
    { id: 5, enroll: '2021005', name: 'Sanya Verma', batch: '2019-2021', course: 'B.E Electronics and Communication', email: 'student2@example.com', status: 'Not Placed' },
    { id: 6, enroll: '2021006', name: 'Dev Singh', batch: '2021-2023', course: 'M.Sc Data Science', email: 'student3@example.com', status: 'Internship' },
    { id: 7, enroll: '2021007', name: 'Rhea Shah', batch: '2020-2022', course: 'Diploma in Information Technology', email: 'student4@example.com', status: 'Job Offer Received' },
    { id: 8, enroll: '2021008', name: 'Kabir Khan', batch: '2018-2020', course: 'B.Tech Computer Science', email: 'student5@example.com', status: 'Placed' },
    { id: 9, enroll: '2021009', name: 'Meera Gupta', batch: '2010-2016', course: 'M.E Mechanical Engineering', email: 'student6@example.com', status: 'Not Placed' },
    { id: 10, enroll: '2021010', name: 'Arjun Reddy', batch: '2019-2021', course: 'B.E Electrical Engineering', email: 'student7@example.com', status: 'Placed' },
    { id: 11, enroll: '2021011', name: 'Priya Sharma', batch: '2020-2026', course: 'M.Sc IT', email: 'priya.sharma@example.com', status: 'Internship' },
    { id: 12, enroll: '2021012', name: 'Rajesh Kumar', batch: '2020-2022', course: 'B.Sc IT', email: 'rajesh.kumar@example.com', status: 'Placed' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const courses = useMemo(() => [...new Set(students.map(s => s.course))], [students]);
  const batches = useMemo(() => [...new Set(students.map(s => s.batch))], [students]);
  const statuses = useMemo(() => [...new Set(students.map(s => s.status))], [students]);

  const filteredStudents = useMemo(() => students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enroll.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !selectedCourse || student.course === selectedCourse;
    const matchesBatch = !selectedBatch || student.batch === selectedBatch;
    const matchesStatus = !selectedStatus || student.status === selectedStatus;
    return matchesSearch && matchesCourse && matchesBatch && matchesStatus;
  }), [students, searchTerm, selectedCourse, selectedBatch, selectedStatus]);

  const getStatusPill = (status) => {
    const map = {
      'Placed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Internship': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Not Placed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Job Offer Received': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return map[status] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
  };

  return (
    <DashboardLayout title="Registered Students">
      <PageContainer>
        <Section>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Search by name or enrollment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="flex gap-3">
                <select className={`flex-1 px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCourse(''); setSelectedBatch(''); setSelectedStatus(''); }}>Reset</Button>
              </div>
            </div>
          </Card>
        </Section>

        <Section>
          <div className={`overflow-x-auto rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className={`min-w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <tr>
                  {['S.No', 'Enrollment No', 'Full Name', 'Batch', 'Course', 'Email', 'Placement Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s.id} className={`${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-mono">{s.enroll}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.batch}</td>
                    <td className="px-4 py-3">{s.course}</td>
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusPill(s.status)}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} title="View" onClick={() => navigate('/admin/students/details')}><Eye size={16} /></button>
                        <button className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} title="Edit"><Edit size={16} /></button>
                        <button className={`${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </PageContainer>
    </DashboardLayout>
  );
}
