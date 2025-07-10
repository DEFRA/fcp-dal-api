module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  env: {
    node: true,
    es2021: true
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }
    ]
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['*.gql'],
      parser: '@graphql-eslint/eslint-plugin',
      plugins: ['@graphql-eslint'],
      rules: {
        '@graphql-eslint/naming-convention': [
          'error',
          {
            types: 'PascalCase',
            FieldDefinition: 'camelCase',
            InputValueDefinition: 'camelCase',
            Argument: 'camelCase',
            DirectiveDefinition: 'camelCase',
            EnumValueDefinition: 'UPPER_CASE',
            'FieldDefinition[parent.name.value=Query]': {
              forbiddenPrefixes: ['query', 'get'],
              forbiddenSuffixes: ['Query']
            },
            'FieldDefinition[parent.name.value=Mutation]': {
              forbiddenPrefixes: ['mutation'],
              requiredPrefixes: ['create', 'update', 'delete'],
              forbiddenSuffixes: ['Mutation', 'Create', 'Update', 'Delete']
            },
            'FieldDefinition[parent.name.value=Subscription]': {
              forbiddenPrefixes: ['subscription'],
              forbiddenSuffixes: ['Subscription']
            },
            'EnumTypeDefinition,EnumTypeExtension': {
              forbiddenPrefixes: ['Enum'],
              forbiddenSuffixes: ['Enum']
            },
            'InterfaceTypeDefinition,InterfaceTypeExtension': {
              forbiddenPrefixes: ['Interface'],
              forbiddenSuffixes: ['Interface']
            },
            'UnionTypeDefinition,UnionTypeExtension': {
              forbiddenPrefixes: ['Union'],
              forbiddenSuffixes: ['Union']
            },
            'ObjectTypeDefinition,ObjectTypeExtension': {
              forbiddenPrefixes: ['Type'],
              forbiddenSuffixes: ['Type']
            }
          }
        ],
        '@graphql-eslint/input-name': [
          'error',
          { checkInputType: true, caseSensitiveInputType: false }
        ],
        '@graphql-eslint/no-typename-prefix': 'error'
      }
    }
  ]
}
