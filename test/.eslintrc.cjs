module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['../.eslintrc.cjs'], // Inherit from root config
  plugins: ['jest']
}
