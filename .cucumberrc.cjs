module.exports = {
  format: 'test/reports/typescript_bdd.json',
  formatOptions: {
    snippetInterface: 'async-await'
  },
  requireModule: ['ts-node/register'],
  require: ['test/typescript/steps/**/*.ts']
};
