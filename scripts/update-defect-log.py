#!/usr/bin/env python3
"""
update-defect-log.py — Update docs/defect-log.json with regression PR details.

Usage:
  python3 scripts/update-defect-log.py \
    --issue-number 123 \
    --pr-number 456 \
    --test-file tests/playwright-agents/regression/issue-123-slug.spec.ts
"""
import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser(description="Update defect-log.json with regression PR")
    parser.add_argument("--issue-number", required=True, type=int)
    parser.add_argument("--pr-number",    default="")
    parser.add_argument("--test-file",    default="")
    parser.add_argument("--log-path",     default="docs/defect-log.json")
    args = parser.parse_args()

    log_path = args.log_path

    try:
        with open(log_path) as f:
            log = json.load(f)
    except Exception:
        log = []

    pr_number = int(args.pr_number) if args.pr_number.isdigit() else None
    updated   = False

    for entry in log:
        if entry.get("issue") == args.issue_number:
            entry["regression_test_created"] = True
            entry["regression_pr"]           = pr_number
            entry["regression_test_file"]    = args.test_file
            updated = True
            break

    if not updated:
        # Entry may not exist yet (race condition with defect-tracker)
        log.append({
            "issue":                    args.issue_number,
            "title":                    "",
            "detected":                 "",
            "attributed_commit":        "unknown",
            "affected_area":            "unknown",
            "affected_url":             "",
            "req_ids":                  [],
            "regression_test_created":  True,
            "regression_pr":            pr_number,
            "regression_test_file":     args.test_file,
        })

    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)
        f.write("\n")

    print(f"Updated {log_path} for issue #{args.issue_number}")


if __name__ == "__main__":
    main()
