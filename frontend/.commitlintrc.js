module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subject line
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'never', 72],

    // Body
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'never', 100],

    // Footer
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'never', 100],

    // Type
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf', // Performance improvements
        'test', // Adding missing tests or correcting existing tests
        'chore', // Changes to the build process or auxiliary tools
        'ci', // Changes to our CI configuration files and scripts
        'build', // Changes that affect the build system or external dependencies
        'revert', // Revert a previous commit
        'security', // Security improvements
        'deps', // Dependency updates
      ],
    ],
  },
  plugins: [
    {
      rules: {
        // Custom rule for breaking changes
        'header-min-length': (parsed, when) => {
          const header = parsed.header;
          const minLength = when === 'always' ? 10 : 0;
          return [
            header.length >= minLength,
            `header must be at least ${minLength} characters long`,
          ];
        },
      },
    },
  ],
};
