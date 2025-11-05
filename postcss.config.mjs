const config = {
  output: 'export',
   experimental: {
    // This is the correct root of the project
    outputFileTracingRoot: __dirname,
  },
  // This is the correct root of the project
  turbopack: { root: __dirname },
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
