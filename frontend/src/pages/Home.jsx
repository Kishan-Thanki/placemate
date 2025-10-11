import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

export default function Home() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`
      min-h-screen flex flex-col items-center justify-center p-8
      ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}
    `}>
      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className={`
          absolute top-4 right-4 p-3 rounded-lg transition-colors
          ${isDark 
            ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }
        `}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="text-center space-y-8 max-w-4xl mx-auto">
        {/* Logo and Title */}
        <div className="space-y-4">
          <img 
            src="src/assets/placemate.png" 
            alt="Placemate Logo" 
            className="mx-auto h-20 w-20 rounded-xl shadow-lg"
          />
          <h1 className={`
            text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent
          `}>
            Placemate
          </h1>
          <p className={`
            text-xl md:text-2xl font-medium
            ${isDark ? 'text-gray-300' : 'text-gray-700'}
          `}>
            Campus Recruitment Management System
          </p>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className={`
            text-lg max-w-2xl mx-auto leading-relaxed
            ${isDark ? 'text-gray-400' : 'text-gray-600'}
          `}>
            Streamline your campus recruitment process with our comprehensive platform. 
            Manage companies, drives, students, and applications all in one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/admin"
            className={`
              px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200
              bg-blue-600 hover:bg-blue-700 text-white
              hover:shadow-lg hover:-translate-y-0.5
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
            `}
          >
            Admin Dashboard
          </Link>
          
          <button
            className={`
              px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 border
              ${isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }
              hover:shadow-lg hover:-translate-y-0.5
              focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50
            `}
          >
            Student Portal
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
              title: "Company Management",
              description: "Register and manage company profiles, job postings, and recruitment drives."
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              ),
              title: "Student Profiles",
              description: "Track student applications, interviews, and placement status in real-time."
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: "Analytics & Reports",
              description: "Comprehensive insights and reports on placement trends and statistics."
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={`
                p-6 rounded-xl text-center space-y-4 transition-all duration-200
                ${isDark 
                  ? 'bg-gray-800 border border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border border-gray-200 hover:shadow-lg'
                }
                hover:-translate-y-1
              `}
            >
              <div className={`text-blue-600 mx-auto`}>
                {feature.icon}
              </div>
              <h3 className={`
                text-xl font-semibold
                ${isDark ? 'text-white' : 'text-gray-900'}
              `}>
                {feature.title}
              </h3>
              <p className={`
                ${isDark ? 'text-gray-400' : 'text-gray-600'}
              `}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
