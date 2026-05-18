#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const lockfilePath = path.join(process.cwd(), 'package-lock.json');

if (!fs.existsSync(lockfilePath)) {
  console.error('[deps] package-lock.json not found');
  process.exit(1);
}

const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const packages = lockfile.packages || {};
const unsupported = [];

function parseVersion(version) {
  return String(version).split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function isBeforeMinSupported(version, minVersion) {
  const left = parseVersion(version);
  const right = parseVersion(minVersion);

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i] || 0;
    const r = right[i] || 0;

    if (l < r) {
      return true;
    }
    if (l > r) {
      return false;
    }
  }

  return false;
}

for (const [packagePath, pkg] of Object.entries(packages)) {
  if (!packagePath.endsWith('/puppeteer') || !pkg || !pkg.version) {
    continue;
  }

  if (pkg.deprecated || isBeforeMinSupported(pkg.version, '24.15.0')) {
    unsupported.push({
      path: packagePath,
      version: pkg.version,
      deprecated: pkg.deprecated || null,
    });
  }
}

if (unsupported.length > 0) {
  console.error('[deps] Unsupported Puppeteer versions found in package-lock.json:');
  unsupported.forEach((entry) => {
    const suffix = entry.deprecated ? ` (${entry.deprecated})` : '';
    console.error(`- ${entry.path}: ${entry.version}${suffix}`);
  });
  process.exit(1);
}

console.log('[deps] All lockfile Puppeteer entries are supported (>= 24.15.0, not deprecated).');
