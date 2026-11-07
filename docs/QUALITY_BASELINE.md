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

## Security Audit Baseline

- Verified commit: a0b6ef7
- Full dependency audit: 0 vulnerabilities
- Production dependency audit: 0 vulnerabilities
- Security overrides:
  - glob: 14.0.2
  - minimatch: 11.0.1
- Direct tooling versions retained:
  - c8: 12.0.0
  - node-pg-migrate: 9.0.0
- Tests: 108 passed, 0 failed
- Coverage:
  - Statements: 100%
  - Branches: 99.44%
  - Functions: 100%
  - Lines: 100%
- Migration discovery: passed for both current migration files.

## Current Verified Baseline

- Verified merged commit: 1b7fb43
- Tests: 117 passed, 0 failed
- Statements: 100%
- Branches: 99.5%
- Functions: 100%
- Lines: 100%
- Full dependency audit: 0 vulnerabilities
- Production dependency audit: 0 vulnerabilities
- Official coverage command: `npm run test:coverage`
