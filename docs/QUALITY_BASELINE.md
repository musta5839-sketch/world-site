# Quality Baseline

- Verified commit: 762cdd8
- Tests: 108 passed, 0 failed
- Statements: 100%
- Branches: 99.44%
- Functions: 100%
- Lines: 100%
- Official command: npm run test:coverage
- Coverage thresholds:
  - Statements: 96%
  - Branches: 91%
  - Functions: 94%
  - Lines: 96%

The official coverage baseline uses c8 --all --include='src/**/*.js'.

The remaining uncovered branch counter is associated with the
try/catch/finally boundary in src/database/query.js. Cleanup execution
is covered by project tests and a standalone minimal reproduction.
