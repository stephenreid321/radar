module.exports = {
  env: {
    browser: true,
    es2021: true,
    jquery: true
  },
  globals: {
    BASE_URI: true,
    GUILD_ID: true,
    chroma: true,
    cytoscape: true,
    truncate: true
  },
  extends: 'standard',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    camelcase: 'off',
    eqeqeq: 'off'
  }
}
