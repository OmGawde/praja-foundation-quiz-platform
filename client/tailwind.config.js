/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'on-secondary-fixed-variant': '#1e438f',
        'surface-container-high': '#dee9f5',
        'on-surface': '#121d25',
        'error': '#ba1a1a',
        'surface-container-low': '#ebf5ff',
        'error-container': '#ffdad6',
        'tertiary-fixed': '#dce1ff',
        'inverse-primary': '#a6c8ff',
        'primary': '#004481',
        'inverse-on-surface': '#e7f2fe',
        'secondary-fixed': '#dae2ff',
        'on-tertiary-fixed-variant': '#364473',
        'on-error': '#ffffff',
        'surface-bright': '#f6f9ff',
        'secondary': '#3a5ba8',
        'secondary-container': '#8dacff',
        'on-background': '#121d25',
        'on-primary-fixed-variant': '#004787',
        'on-surface-variant': '#414751',
        'on-tertiary-container': '#c7d2ff',
        'inverse-surface': '#27323b',
        'outline': '#727783',
        'on-tertiary-fixed': '#061846',
        'outline-variant': '#c1c6d3',
        'background': '#f6f9ff',
        'primary-container': '#005baa',
        'tertiary-container': '#4b5989',
        'on-primary-fixed': '#001c3b',
        'surface-tint': '#0c5fae',
        'on-secondary': '#ffffff',
        'on-primary': '#ffffff',
        'tertiary': '#334170',
        'on-error-container': '#93000a',
        'on-secondary-container': '#173d89',
        'on-primary-container': '#bbd4ff',
        'on-tertiary': '#ffffff',
        'primary-fixed': '#d5e3ff',
        'on-secondary-fixed': '#001847',
        'surface-variant': '#d9e4f0',
        'surface-dim': '#d0dbe7',
        'surface-container-highest': '#d9e4f0',
        'primary-fixed-dim': '#a6c8ff',
        'tertiary-fixed-dim': '#b6c4fc',
        'surface-container-lowest': '#ffffff',
        'secondary-fixed-dim': '#b2c5ff',
        'surface': '#f6f9ff',
        'surface-container': '#e4effb',
        'accent': '#6371a3'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      fontFamily: {
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
