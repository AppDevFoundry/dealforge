import type { Config } from 'tailwindcss';
import baseConfig from '../../packages/config/tailwind/tailwind.config';

const config: Config = {
  ...baseConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    // Include shared UI package
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
