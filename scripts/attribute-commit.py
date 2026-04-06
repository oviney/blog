#!/usr/bin/env python3
"""
attribute-commit.py — Best-effort commit attribution for production escapes.

Given a list of suspected file paths and the defect-log.json, finds the most
recent git commit that touched any of the suspected files. Falls back to the
last merge commit on main if no matching commit is found.

Usage:
  python3 scripts/attribute-commit.py --files "_sass/economist-theme.scss assets/js/nav.js"
  python3 scripts/attribute-commit.py  # no files → fall back to last merge commit
"""
import argparse
import subprocess
import sys


def attribute(suspected_files: list[str]) -> str:
    """Return the short SHA of the best-effort attributed commit."""
    # Try each suspected file in order
    for f in suspected_files:
        try:
            result = subprocess.run(
                ["git", "log", "-1", "--oneline", "--", f],
                capture_output=True, text=True, check=False
            )
            if result.stdout.strip():
                return result.stdout.split()[0]
        except Exception:
            pass

    # Fall back to last merge commit on main
    try:
        result = subprocess.run(
            ["git", "log", "--merges", "-1", "--pretty=format:%h", "main"],
            capture_output=True, text=True, check=False
        )
        sha = result.stdout.strip()
        if sha:
            return sha
    except Exception:
        pass

    # Final fallback
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--pretty=format:%h"],
            capture_output=True, text=True, check=False
        )
        sha = result.stdout.strip()
        if sha:
            return sha
    except Exception:
        pass

    return "unknown"


def main():
    parser = argparse.ArgumentParser(description="Attribute production escape to a commit")
    parser.add_argument("--files", default="",
                        help="Space-separated list of suspected file paths")
    args = parser.parse_args()

    suspected = [f for f in args.files.split() if f]
    sha = attribute(suspected)
    print(sha)


if __name__ == "__main__":
    main()
