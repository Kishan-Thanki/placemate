import React from 'react';
import { Building2, CalendarDays, FileText, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, PageContainer, Section } from '../../components/layout';
import { StatCard, StatsGrid, Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Admin Dashboard component matching the design from the screenshot
 * Features key statistics, charts, and quick actions
 */
export function AdminDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Mock data matching the screenshot
  const stats = [
    { title: 'Companies Visited', value: 15, icon: <Building2 className="w-6 h-6" />, color: 'blue', trend: '+2 this month', trendDirection: 'up' },
    { title: 'Drives Conducted', value: 48, icon: <CalendarDays className="w-6 h-6" />, color: 'purple', trend: '+8 this month', trendDirection: 'up' },
    { title: 'Total Applications', value: 250, icon: <FileText className="w-6 h-6" />, color: 'red', trend: '+45 this week', trendDirection: 'up' },
    { title: 'Students Placed', value: 120, icon: <GraduationCap className="w-6 h-6" />, color: 'green', trend: '+12 this month', trendDirection: 'up' },
  ];

  // Quick action buttons as shown in the screenshot
  const quickActions = [
    { id: 'add-drive', label: 'Add New Drive', icon: <CalendarDays className="w-5 h-5" />, variant: 'primary', to: '/admin/drives/new' },
    { id: 'view-drives', label: 'View All Drives', icon: <FileText className="w-5 h-5" />, variant: 'primary', to: '/admin/drives' },
    { id: 'register-company', label: 'Register Company', icon: <Building2 className="w-5 h-5" />, variant: 'warning', to: '/admin/companies' },
    { id: 'register-student', label: 'Register Student', icon: <GraduationCap className="w-5 h-5" />, variant: 'success', to: '/admin/students/register' },
  ];

  const handleQuickAction = (action) => {
    if (action.to) navigate(action.to);
  };

  // Mock chart data for placement trends (we'll create a simple visual representation)
  const PlacementTrendChart = () => (
    <div className={`
      h-64 rounded-lg flex items-end justify-between p-4 space-x-2
      ${isDark ? 'bg-gray-800' : 'bg-gray-50'}
    `}>
      {/* Simple bar chart representation */}
      {[40, 55, 35, 70, 45, 80, 60, 90, 75, 85, 95, 100].map((height, index) => (
        <div
          key={index}
          className="bg-blue-500 rounded-t flex-1 transition-all duration-300 hover:bg-blue-600"
          style={{ height: `${height}%` }}
          title={`Month ${index + 1}: ${height}%`}
        />
      ))}
    </div>
  );

  // Mock chart data for placement distribution
  const PlacementDistributionChart = () => {
    const segments = [
      { label: 'IT & Software', percentage: 60, color: 'bg-blue-500' },
      { label: 'Core Engineering', percentage: 25, color: 'bg-green-500' },
      { label: 'Consulting', percentage: 10, color: 'bg-yellow-500' },
      { label: 'Finance', percentage: 5, color: 'bg-purple-500' },
    ];

    return (
      <div className="space-y-4">
        {/* Simple donut chart representation */}
        <div className="relative w-48 h-48 mx-auto">
          <div className={`
            w-full h-full rounded-full border-8
            ${isDark ? 'border-gray-700' : 'border-gray-200'}
          `}>
            {/* This would be replaced with an actual chart library */}
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-yellow-500 to-purple-500 opacity-80"></div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {segment.label}
                </span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {segment.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Placement Dashboard">
      <PageContainer>
        {/* Key Statistics */}
        <Section>
          <StatsGrid>
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                trend={stat.trend}
                trendDirection={stat.trendDirection}
              />
            ))}
          </StatsGrid>
        </Section>

        {/* Quick Actions */}
        <Section 
          title="Quick Actions"
          description="Frequently used operations for managing placement drives"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                className="flex-col h-20 space-y-1"
                leftIcon={action.icon}
                onClick={() => handleQuickAction(action)}
              >
                <span className="text-xs text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </Section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Placement Trend Chart */}
          <Section title="Placement Trend" description="Monthly placement statistics">
            <div className={`
              p-6 rounded-lg border
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <PlacementTrendChart />
              <div className="mt-4 flex justify-between text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Jan</span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Dec</span>
              </div>
            </div>
          </Section>

          {/* Placement Distribution Chart */}
          <Section title="Placement Distribution" description="By industry sectors">
            <div className={`
              p-6 rounded-lg border
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <PlacementDistributionChart />
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className={`mt-10 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6 text-center`}>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            © {new Date().getFullYear()} Placemate. All rights reserved.
          </p>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}