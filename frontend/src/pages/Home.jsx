import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Building2,
  GraduationCap,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Bell,
  FileText,
  Shield,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import logoUrl from "../assets/placemate_logo.png";

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Show alert if redirected with error message (but not from logout)
  useEffect(() => {
    console.log("🏠 Home - location.state:", location.state);
    console.log("🏠 Home - isAuthenticated:", isAuthenticated);

    // Don't show error if this navigation came from logout
    if (location.state?.fromLogout) {
      console.log("✅ Logout detected, hiding alert");
      setShowAlert(false); // Immediately hide any existing alert
      setAlertMessage(""); // Clear any existing message
      // Clear the logout flag from state
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Show error message if present and not empty
    if (location.state?.error && location.state.error.trim() !== "") {
      console.log("⚠️ Showing error:", location.state.error);
      setAlertMessage(location.state.error);
      setShowAlert(true);

      // Clear the error from location state using React Router
      navigate(location.pathname, { replace: true, state: {} });

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state, location.pathname, navigate, isAuthenticated]);

  const features = [
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Company Management",
      description:
        "Register and manage participating companies, track their requirements and placement history.",
      color: "blue",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Drive Scheduling",
      description:
        "Organize placement drives, schedule interviews, and manage the entire recruitment process efficiently.",
      color: "purple",
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Student Portal",
      description:
        "Students can view opportunities, apply for positions, and track their application status in real-time.",
      color: "green",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Application Tracking",
      description:
        "Monitor all applications, shortlists, and placements from a centralized dashboard.",
      color: "red",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics & Reports",
      description:
        "Generate comprehensive reports and gain insights with powerful analytics tools.",
      color: "yellow",
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Notifications",
      description:
        "Stay updated with real-time notifications for drives, deadlines, and important updates.",
      color: "indigo",
    },
  ];

  const stats = [
    {
      label: "Companies",
      value: "150+",
      icon: <Building2 className="w-5 h-5" />,
    },
    { label: "Students", value: "2000+", icon: <Users className="w-5 h-5" /> },
    {
      label: "Placements",
      value: "85%",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Success Rate",
      value: "95%",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  const benefits = [
    "Streamlined recruitment process",
    "Real-time application tracking",
    "Automated notifications and reminders",
    "Comprehensive analytics dashboard",
    "Role-based access control",
    "Mobile-responsive design",
  ];

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      }`}
    >
      {/* Alert Banner */}
      {showAlert && (
        <div
          className={`
          fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50 p-4 rounded-lg shadow-lg border
          ${
            isDark
              ? "bg-red-900/90 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-800"
          }
          animate-slide-in-top
        `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{alertMessage}</p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-current hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header/Navbar */}
      <nav
        className={`
        sticky top-0 z-40 border-b backdrop-blur-sm
        ${
          isDark
            ? "bg-gray-900/80 border-gray-800"
            : "bg-white/80 border-gray-200"
        }
      `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img
                  src={logoUrl}
                  alt="Placemate Logo"
                  className="h-14 w-14 sm:h-16 sm:w-16 object-contain transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-300 group-hover:tracking-wide ${
                    isDark
                      ? "text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400"
                      : "text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600"
                  }`}
                >
                  Placemate
                </span>
                <span
                  className={`text-xs font-medium tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  CAMPUS RECRUITMENT
                </span>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`
                  p-2 rounded-lg transition-all duration-300 transform hover:scale-110 hover:rotate-12
                  ${
                    isDark
                      ? "text-gray-300 hover:text-yellow-400 hover:bg-gray-800"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                  }
                `}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 transition-transform" />
                ) : (
                  <Moon className="w-5 h-5 transition-transform" />
                )}
              </button>

              {isAuthenticated ? (
                <Link
                  to={user.activeRole === "admin" ? "/admin" : "/student"}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/auth/login"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse ${
              isDark ? "bg-blue-500" : "bg-blue-300"
            }`}
          ></div>
          <div
            className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse delay-1000 ${
              isDark ? "bg-purple-500" : "bg-purple-300"
            }`}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-8">
            {/* Main Heading with stagger animation */}
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Campus Placement
                </span>
                <br />
                <span
                  className={`inline-block mt-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Made Simple
                </span>
              </h1>
              <p
                className={`
                text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed animate-fade-in-delay
                ${isDark ? "text-gray-300" : "text-gray-600"}
              `}
              >
                Streamline your campus recruitment process with our
                comprehensive platform. Manage companies, drives, students, and
                applications all in one place.
              </p>
            </div>

            {/* CTA Buttons */}
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay">
                <Link
                  to="/auth/login"
                  className="
                    px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform
                    bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white
                    hover:shadow-2xl hover:scale-105 hover:-translate-y-1
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
                    flex items-center space-x-2 group
                  "
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#features"
                  className={`
                    px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform border-2
                    ${
                      isDark
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    }
                    hover:shadow-xl hover:scale-105 hover:-translate-y-1
                    focus:outline-none focus:ring-4 focus:ring-gray-500 focus:ring-opacity-50
                  `}
                >
                  Learn More
                </a>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`
                    p-6 rounded-xl border transform transition-all duration-300 animate-fade-in
                    ${
                      isDark
                        ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }
                    hover:shadow-2xl hover:scale-105 hover:-translate-y-2
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="text-blue-600 transform transition-transform group-hover:scale-110">
                      {stat.icon}
                    </div>
                    <div
                      className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? "bg-gray-800/50" : "bg-gray-50/50"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2
              className={`text-3xl sm:text-4xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Powerful Features
            </h2>
            <p
              className={`text-lg ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Everything you need to manage campus placements effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`
                  p-6 rounded-xl border transition-all duration-500 transform group
                  ${
                    isDark
                      ? "bg-gray-800 border-gray-700 hover:border-blue-500/50"
                      : "bg-white border-gray-200 hover:border-blue-400/50"
                  }
                  hover:shadow-2xl hover:scale-105 hover:-translate-y-2
                `}
              >
                <div
                  className={`
                  inline-flex p-3 rounded-lg mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                  ${
                    feature.color === "blue" &&
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  }
                  ${
                    feature.color === "purple" &&
                    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  }
                  ${
                    feature.color === "green" &&
                    "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  }
                  ${
                    feature.color === "red" &&
                    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }
                  ${
                    feature.color === "yellow" &&
                    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }
                  ${
                    feature.color === "indigo" &&
                    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                  }
                `}
                >
                  {feature.icon}
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Image/Illustration placeholder */}
            <div
              className={`
              rounded-2xl p-12 flex items-center justify-center
              ${
                isDark
                  ? "bg-gray-800"
                  : "bg-gradient-to-br from-blue-100 to-purple-100"
              }
            `}
            >
              <div className="text-center space-y-4">
                <Zap
                  className={`w-32 h-32 mx-auto ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <p
                  className={`text-lg font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Lightning Fast & Reliable
                </p>
              </div>
            </div>

            {/* Right - Benefits List */}
            <div className="space-y-6">
              <h2
                className={`text-3xl sm:text-4xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Why Choose Placemate?
              </h2>
              <p
                className={`text-lg ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Built specifically for educational institutions to manage their
                placement activities efficiently.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span
                      className={isDark ? "text-gray-300" : "text-gray-700"}
                    >
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section
          className={`
          py-20 px-4 sm:px-6 lg:px-8
          ${
            isDark
              ? "bg-gray-800/50"
              : "bg-gradient-to-r from-blue-600 to-purple-600"
          }
        `}
        >
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-blue-100">
              Join hundreds of institutions already using Placemate for their
              campus recruitment
            </p>
            <Link
              to="/auth/login"
              className="
                inline-flex items-center space-x-2
                px-8 py-4 rounded-lg font-semibold text-lg
                bg-white text-blue-600 hover:bg-gray-100
                transition-all duration-200
                hover:shadow-xl hover:scale-105
              "
            >
              <span>Login to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className={`
        py-8 px-4 sm:px-6 lg:px-8 border-t
        ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
      `}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            © 2025 Placemate. Campus Recruitment Management System.
          </p>
        </div>
      </footer>
    </div>
  );
}
