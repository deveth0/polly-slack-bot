module.exports = {
  // Basic configs for js files
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  env: {
    browser: true,
    es6: true,
    node: true,
  },

  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  rules: {
    "linebreak-style": "off",
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "import/no-extraneous-dependencies": "off",
    "no-underscore-dangle": "off",
  },

  overrides: [
    // Typescript specific settings
    {
      files: ["**/*.{ts,tsx}"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:prettier/recommended",
        "plugin:import/recommended",
        "prettier",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["tsconfig.json"],
        // Allows for the parsing of modern ECMAScript features if you're using modern node.js or frontend bundling
        // this will be inferred from tsconfig if left commented
        // ecmaVersion: 2020,
        sourceType: "module", // Allows for the use of imports
        // Allows for the parsing of JSX if you are linting React
        // ecmaFeatures: {
        //  jsx: true
        // }
      },
    },
  ],
};
