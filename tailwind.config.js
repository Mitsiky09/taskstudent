const { palette } = require('./constants/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Les classes réutilisables vivent aussi dans les tokens (`typography`,
  // `surfaceStyles`) : sans ces dossiers, Tailwind les purgerait.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /** Marque : une seule teinte pour toute l'application. */
        primary: { ...palette.primary, DEFAULT: palette.primary[600] },
        /** Tokens sémantiques : à préférer aux nuances brutes dans les écrans. */
        canvas: palette.slate[50],
        surface: { DEFAULT: palette.white, muted: palette.slate[100] },
        line: { DEFAULT: palette.slate[200], soft: palette.slate[100] },
        ink: palette.slate[900],
        soft: palette.slate[600],
        muted: palette.slate[500],
        faint: palette.slate[400],
        success: { ...palette.success, DEFAULT: palette.success[500] },
        warning: { ...palette.warning, DEFAULT: palette.warning[500] },
        danger: { ...palette.danger, DEFAULT: palette.danger[500] },
        info: { ...palette.info, DEFAULT: palette.info[500] },
      },
      borderRadius: {
        control: '14px',
        card: '16px',
        panel: '24px',
        sheet: '28px',
      },
    },
  },
  plugins: [],
};
