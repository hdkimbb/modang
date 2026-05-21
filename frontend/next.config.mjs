/** @type {import('next').NextConfig} */

/** ESM + CSS recipe imports — must be transpiled for Webpack */
const seedPackages = [
  "@seed-design/react",
  "@seed-design/css",
  "@seed-design/dom-utils",
  "@seed-design/react-primitive",
  "@seed-design/react-text-field",
  "@seed-design/react-checkbox",
  "@seed-design/react-field",
  "@seed-design/react-radio-group",
  "@seed-design/react-switch",
  "@seed-design/react-fieldset",
];

const nextConfig = {
  transpilePackages: seedPackages,
};

export default nextConfig;
