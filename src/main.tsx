import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "next-themes"
import App from './App.tsx'
import './index.css'

// Load saved theme on startup
const savedTheme = localStorage.getItem('selected-theme');
if (savedTheme && savedTheme !== 'default') {
  document.documentElement.classList.add(`theme-${savedTheme}`);
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <App />
  </ThemeProvider>
);
