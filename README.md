Vite + React + Tailwind starter for **moodscreen** (status card generator app).

## Prerequisites

- **Node.js 20+** (see `engines` in `package.json`). The repo includes an **`.nvmrc`** for [nvm](https://github.com/nvm-sh/nvm): `nvm install` then `nvm use`.
- **Windows:** install Node from [nodejs.org](https://nodejs.org/) (LTS) or: `winget install OpenJS.NodeJS.LTS`
- Then install dependencies from the project folder:

```bash
npm install
```

## Getting Started

From the **moodscreen** project folder:

```bash
npm install
npm run dev
```

The dev server opens in your browser (or go to **http://localhost:5173**).

### Windows (PowerShell)

After installing Node, **close and reopen** your terminal (or restart Cursor) so `node` and `npm` are on your `PATH`.

Older PowerShell does not support `&&`. Run commands **one per line**, or chain with `;`:

```powershell
cd C:\Users\user\Desktop\WEBDEV\moodscreen
npm install
npm run dev
```

If `npm run build` exits with no output, try:

```powershell
npx vite build
```

## Scripts

```bash
npm run dev    # or: npm start
npm run build
npm run preview
```

## Authentication (optional)

- **Guest-first:** the app works with no login; card data is stored in `localStorage` (`moodscreen_guest_v1`).
- **Sign in:** Google or X (Twitter) via Supabase Auth — see `.env.example` and run `supabase/schema.sql` in the Supabase SQL editor.
- **After login:** guest `localStorage` is uploaded once to the `moodscreens` table, then cleared; further edits sync to Supabase (debounced).
- UI and contexts only use `authService.js` and `moodscreenDataService.js` — not `@supabase` directly.

## Folder structure

```txt
src/
  components/
  context/
  lib/
  pages/
  services/
  styles/
  App.jsx
  main.jsx
supabase/
  schema.sql
```
