import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fullCalendarCss from 'vite-plugin-fullcalendar-css';

export default defineConfig({
  plugins: [react(), fullCalendarCss()],
  server: {
    port: 5173
  }
});
