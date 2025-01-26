/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: [
    "./popup.tsx",
    "./tabs/**/*.{js,jsx,ts,tsx}", // Target only files in the src folder
    "./sandboxes/**/*.{js,jsx,ts,tsx}", // Target only files in the src folder
    "./components/**/*.{js,jsx,ts,tsx}", // Add other folders as needed
    "./contents/**/*.{js,jsx,ts,tsx}" // If using Next.js or similar
  ],
  plugins: []
}