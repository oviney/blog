# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email: security@viney.ca

Include the following details in your report:
- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if available)

You can expect an acknowledgement within 48 hours and a resolution timeline within 7 days for critical issues.

## Security Scanning

This repository uses the following automated security tooling:

- **npm audit** — scans npm dependencies for known CVEs on every push and pull request; builds fail on moderate or higher severity vulnerabilities
- **Dependabot** — automatically opens pull requests for security updates to npm, Bundler, and GitHub Actions dependencies on a weekly schedule

## Dependency Policy

- All npm dependencies are pinned to semver ranges and audited via `npm audit --audit-level=moderate`
- Ruby gems are managed via Bundler; updates are reviewed weekly via Dependabot
- No new runtime dependencies are added without explicit justification in the pull request

## Vulnerability Disclosure Timeline

| Severity | Response SLA |
| -------- | ------------ |
| Critical | 24 hours     |
| High     | 72 hours     |
| Moderate | 7 days       |
| Low      | 30 days      |
