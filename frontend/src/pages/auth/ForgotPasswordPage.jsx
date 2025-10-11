import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logoUrl from '../../assets/placemate.png';

export default function ForgotPasswordPage() {
  const { toggleTheme, isDark } = useTheme();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const email = data.get('email');
    // TODO: call API to send reset email
    console.log('send reset to', email);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="w-full lg:w-full flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <header className="flex items-center justify-between mb-6">

            <div className="flex items-center gap-2">
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
              <Link to="/auth/login" className="px-3 py-1 rounded-md bg-transparent border border-[var(--border-color)] text-[var(--text-secondary)]">
                Back to Login
              </Link>
            </div>
          </header>

          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-8 shadow-md">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="rounded-full p-0.5 flex items-center justify-center">
                <img src={logoUrl} alt="Placemate Logo" className="h-16 w-16 rounded-xl object-cover shadow-lg" />
              </div>
              <h2 className="text-2xl font-semibold">Forgot your password?</h2>
              <p className="text-sm text-[var(--text-secondary)]">Enter your registered email and we'll send reset instructions.</p>
            </div>

            {!sent ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your Registered Email"
                    className="w-full border rounded-md px-3 py-2 bg-transparent text-[var(--text-primary)] border-[var(--border-color)]"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white rounded-md py-2 font-medium transition-colors"
                  >
                    Send Reset Email
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] text-center">
                <p className="font-medium">Check your inbox</p>
                <p className="text-sm text-[var(--text-secondary)]">We've sent password reset instructions to your email.</p>
              </div>
            )}
          </div>

          <footer className="mt-6 text-xs text-[var(--text-secondary)] text-center">© {new Date().getFullYear()} Placemate</footer>
        </div>
      </div>
    </div>
  );
}
