module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, no code change
        'refactor', // Code restructuring
        'perf',     // Performance improvement
        'test',     // Adding/fixing tests
        'build',    // Build system or dependencies
        'ci',       // CI configuration
        'chore',    // Maintenance tasks
        'revert',   // Revert a commit
      ],
    ],
    'scope-enum': [
      1, // Warning, not error — allows new scopes
      'always',
      [
        'core', 'stock', 'sales', 'hr', 'finance',
        'calendar', 'storage', 'email', 'tasks',
        'rbac', 'audit', 'admin', 'notifications',
        'requests', 'ui', 'api', 'db', 'ci', 'deps',
      ],
    ],
    'subject-max-length': [2, 'always', 100],
  },
};
