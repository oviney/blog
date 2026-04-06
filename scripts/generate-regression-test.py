#!/usr/bin/env python3
"""
generate-regression-test.py — Auto-Regression Suite Growth (Story C, issue #634)

Generates a Playwright regression test skeleton from a production bug report.

Usage:
  python3 scripts/generate-regression-test.py \
    --issue-number 123 \
    --title "Nav breaks at 320px" \
    --body "$(cat issue_body.txt)" \
    [--output-dir tests/playwright-agents/regression]

Outputs:
  - Creates the test file
  - Prints the filename to stdout
"""
import argparse
import json
import os
import re
import sys
from datetime import date


def slugify(text, max_len=50):
    """Convert text to a URL-safe slug."""
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower())[:max_len].strip('-')
    return slug or "unknown"


def parse_issue_body(body, area_fallback="content"):
    """Extract structured data from the production-bug.yml issue template body."""
    # Affected URL
    url_match = re.search(r'(https?://[^\s\)]+)', body)
    affected_url = url_match.group(1).strip() if url_match else "https://www.viney.ca/"

    # Convert production URL to local path
    local_path = re.sub(r'https?://(?:www\.)?viney\.ca', '', affected_url) or "/"

    # Requirement area — handles both "Field: value" (inline) and "Field\nvalue" (next-line) formats
    area_match = re.search(
        r'(?:Affected Requirement Area|req_area)\s*[:\n]+\s*([^\n(]+)',
        body, re.IGNORECASE
    )
    area_raw = area_match.group(1).strip() if area_match else area_fallback
    # Remove trailing parenthetical REQ-ID hints like "(REQ-NAV-01, REQ-NAV-02)"
    area = re.sub(r'\s*\(.*\)', '', area_raw).strip().lower().replace(" ", "-") or "content"

    # REQ IDs
    req_ids = re.findall(r'REQ-[A-Z]+-\d+', body)
    if not req_ids:
        area_to_req = {
            "navigation":    ["REQ-NAV-01", "REQ-NAV-02"],
            "content":       ["REQ-CONTENT-01", "REQ-CONTENT-02"],
            "links":         ["REQ-LINKS-01"],
            "search":        ["REQ-SEARCH-01"],
            "accessibility": ["REQ-A11Y-01", "REQ-A11Y-02"],
            "visual":        ["REQ-VISUAL-01"],
            "performance":   ["REQ-PERF-01"],
            "security":      ["REQ-SEC-01"],
        }
        req_ids = area_to_req.get(area, ["REQ-CONTENT-01"])

    # Steps to reproduce
    steps_match = re.search(
        r'(?:Steps to Reproduce|steps)\s*[:\n]+\s*((?:\d+\..*\n?)+)',
        body, re.IGNORECASE
    )
    steps_text = steps_match.group(1).strip() if steps_match else ""

    # Expected behaviour — handles both inline and next-line formats
    expected_match = re.search(
        r'Expected Behaviour\s*[:\n]+\s*([^\n]+)',
        body, re.IGNORECASE
    )
    expected = expected_match.group(1).strip() if expected_match else "Page should render correctly"

    # Suspected files
    files_match = re.search(r'Suspected Changed Files[^\n]*\n+([^\n]+)', body, re.IGNORECASE)
    suspected_files = files_match.group(1).strip().split() if files_match else []

    return {
        "affected_url":    affected_url,
        "local_path":      local_path,
        "area":            area,
        "req_ids":         list(set(req_ids)),
        "steps_text":      steps_text,
        "expected":        expected,
        "suspected_files": suspected_files,
    }


def build_test_content(issue_number, title, parsed):
    """Build the Playwright test TypeScript content."""
    area         = parsed["area"]
    req_ids      = parsed["req_ids"]
    local_path   = parsed["local_path"]
    affected_url = parsed["affected_url"]
    steps_text   = parsed["steps_text"]
    expected     = parsed["expected"]

    req_ids_str = ", ".join(req_ids)
    tag         = f"@{area}"

    mobile_keywords = ["320", "mobile", "hamburger", "nav", "viewport"]
    combined_text   = (title + steps_text).lower()
    use_mobile = any(kw in combined_text for kw in mobile_keywords)

    # Convert reproduction steps to comment lines
    step_lines = [f"    // {line.strip()}" for line in steps_text.split("\n") if line.strip()]
    steps_comment = "\n".join(step_lines) if step_lines else "    // TODO: add reproduction steps from issue"

    viewport_line = ""
    if use_mobile:
        viewport_line = "\n    await page.setViewportSize({ width: 320, height: 568 });"

    repo = os.environ.get("GITHUB_REPOSITORY", "oviney/blog")
    # Use JSON string encoding for safe embedding in TypeScript string literals
    title_safe = json.dumps(title[:80])[1:-1]   # strip outer quotes, keep inner escapes
    expected_safe = json.dumps(expected[:120])[1:-1]

    lines = [
        "/**",
        f" * Regression test for production bug #{issue_number}",
        f" * @requirements {req_ids_str}",
        f" * @bug https://github.com/{repo}/issues/{issue_number}",
        " * @generated-by Auto-Regression workflow",
        " */",
        "import { test, expect } from '@playwright/test';",
        "",
        f"test.describe('{tag} regression #{issue_number}', () => {{",
        "",
        f"  test('regression #{issue_number}: {title_safe}', async ({{ page }}) => {{",
        f"    // Regression for production bug #{issue_number}",
        f"    // Original report: {affected_url}",
        f"{viewport_line}" if viewport_line else "",
        f"    await page.goto('{local_path}');",
        "    await page.waitForLoadState('networkidle');",
        "",
        steps_comment,
        "",
        "    // Verify the reported issue no longer occurs",
        f"    // Expected: {expected_safe}",
        "    // TODO: replace this skeleton assertion with a specific check",
        "    await expect(page.locator('body')).toBeVisible();",
        "",
        "    // Add more targeted assertions here after reviewing the issue:",
        "    // e.g. await expect(page.getByRole('navigation')).toBeVisible();",
        "  });",
        "});",
        "",
    ]

    return "\n".join(l for l in lines if l is not None)


def main():
    parser = argparse.ArgumentParser(description="Generate regression test skeleton")
    parser.add_argument("--issue-number", required=True, type=int)
    parser.add_argument("--title",        required=True)
    parser.add_argument("--body",         default="")
    parser.add_argument("--output-dir",   default="tests/playwright-agents/regression")
    parser.add_argument("--json-output",  action="store_true",
                        help="Emit JSON summary to stdout instead of just filename")
    args = parser.parse_args()

    parsed  = parse_issue_body(args.body)
    slug    = slugify(args.title)
    content = build_test_content(args.issue_number, args.title, parsed)

    os.makedirs(args.output_dir, exist_ok=True)
    filename = os.path.join(args.output_dir, f"issue-{args.issue_number}-{slug}.spec.ts")

    with open(filename, "w") as f:
        f.write(content)

    if args.json_output:
        summary = {
            "test_file": filename,
            "issue":     args.issue_number,
            "slug":      slug,
            "area":      parsed["area"],
            "req_ids":   parsed["req_ids"],
        }
        print(json.dumps(summary))
    else:
        print(filename)


if __name__ == "__main__":
    main()
