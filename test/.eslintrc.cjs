module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['../.eslintrc.cjs'],
  globals: {
    afterAll: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    describe: 'readonly',
    expect: 'readonly',
    it: 'readonly',
    test: 'readonly'
  }
}
