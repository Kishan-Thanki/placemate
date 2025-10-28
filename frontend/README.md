# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Environment variables (API URL)

This frontend reads the backend base URL from Vite env variables. A `.env.example` file is provided at the project root.

- Copy `.env.example` to `.env` or create a `.env.local` in development and set `VITE_API_URL` to your backend URL.
- Example `.env.local`:

```
VITE_API_URL=http://localhost:3000
# Optionally override the dev server port
# VITE_PORT=5173
```

Vite exposes env variables that begin with `VITE_` using `import.meta.env`. The codebase uses `import.meta.env.VITE_API_URL` with a fallback to the current production render URL.

Make sure `.env`/`.env.*` are ignored by git (they are in `.gitignore` already).
