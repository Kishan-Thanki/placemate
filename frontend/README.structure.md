Frontend structure (summary)

- src/
  - App.jsx: routes and providers
  - index.css: Tailwind + global tokens only
  - main.jsx: app bootstrap
  - theme.js: theme tokens / CSS variables
  - assets/: images, static assets
  - contexts/ThemeContext.jsx: theme provider
  - components/
    - layout/: Navbar, Sidebar, DashboardLayout, wrappers
    - ui/: Button, Card, StatCard, etc.
  - pages/
    - Home.jsx
    - admin/
      - AdminDashboard.jsx
      - RegisteredStudents.jsx
      - StudentRegistration.jsx

Notes
- Avoid creating pages/components in src root. Place new pages under pages/ and shared UI in components/.
- Keep CSS minimal in index.css; prefer Tailwind utilities inside components/pages.