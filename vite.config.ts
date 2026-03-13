import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When VITE_MOBILE=true (used by the Android build script), assets are loaded
// from the device's local file system so relative paths are required.
const isMobile = process.env.VITE_MOBILE === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isMobile ? './' : '/Coinbound/',
});
