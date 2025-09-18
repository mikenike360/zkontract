module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead'
      ],
      // Ignore the color-adjust deprecation warning
      ignoreUnknownVersions: true
    },
  },
};
