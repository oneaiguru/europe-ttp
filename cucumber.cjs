module.exports = {
  spec: [
    'specs/features/**/*.feature',
  ],
  import: [
    'test/typescript/steps/**/*.ts',
  ],
  format: [
    'json:test/reports/typescript_bdd.json',
    'summary',
  ],
  formatOptions: {
    snippetInterface: 'async-await',
  },
};
