## Bug: Quality gates bypassed — commit 528689d

**Commit:** [`528689d`](https://github.com/oviney/blog/commit/528689d4a486dc8b2d7edaf9abd1993493a5cd92)  
**Pipeline:** economist-agents (external, `oviney/economist-agents`)  
**Reverted by:** [#837](https://github.com/oviney/blog/pull/837)  
**Reported:** 2026-04-25

---

### Summary

The `economist-agents` Flow pipeline auto-published a blog post at commit `528689d` with the commit message claiming **"passed 5/5 quality gates + publication validator"**. The post was subsequently reverted (#837) because it contained multiple defects that should have been caught by those gates. At least four of those checks map directly to rules enforced by `scripts/validate-post-quality.sh` in this repo.

---

### Defects that slipped through

| # | Defect | Expected gate | Severity |
|---|--------|---------------|----------|
| 1 | **Malformed YAML front matter** — closing `---` delimiter jammed onto the same line as the `description` value, producing invalid YAML | Jekyll build / front-matter linter | 🔴 Error |
| 2 | **Default hero image** — `image: /assets/images/blog-default.svg` (placeholder) used instead of a proper DALL-E 3 generated image | Check 1 in `validate-post-quality.sh`: rejects `blog-default.svg` | 🔴 Error |
| 3 | **Missing chart asset** — body references `/assets/charts/platform-engineering-third-era.png` which does not exist in the repo | Check 9 in `validate-post-quality.sh`: warns on missing chart | 🟡 Warning |
| 4 | **Unresolvable citation URLs** — e.g., `https://github.com/productivity-research` returns 404; cited Netflix, Microsoft, and Google data cannot be verified | Citation-URL validation | 🔴 Error |
| 5 | **Wrong author** — front matter contains `author: "The Economist"` instead of `author: "Ouray Viney"` | Check 4 in `validate-post-quality.sh`: author must be `"Ouray Viney"` | 🔴 Error |
| 6 | **Categories in wrong format** — `["quality-engineering", "software-engineering"]` (kebab-case) instead of `["Quality Engineering", "Software Engineering"]` | Check 5 in `validate-post-quality.sh`: must match one of 4 allowed values | 🔴 Error |

---

### Reproduction

```bash
git checkout 528689d
bash scripts/validate-post-quality.sh
# Expected: multiple ERRORs
# Actual:   pipeline reported 5/5 gates passed
```

Running `scripts/validate-post-quality.sh` against the reverted post would have produced at minimum:

```
❌  _posts/2026-04-21-platform-engineering-s-third-era--the-release-paradox.md — hero image is the default placeholder (blog-default.svg)
❌  ... — author must be "Ouray Viney" (got: 'The Economist')
❌  ... — invalid category: 'quality-engineering'
❌  ... — invalid category: 'software-engineering'
⚠️  ... — no data chart found (assets/charts/platform-engineering-third-era.*)
```

---

### Impact

A malformed post reached `main` and was live on the blog before manual detection and revert. The invalid YAML likely caused Jekyll to skip or mis-render the page. Readers could have encountered missing or garbled content.

---

### Root cause hypothesis

The `economist-agents` pipeline runs its own internal quality-gate suite which does **not** call `scripts/validate-post-quality.sh` from this repo. The pipeline's gates appear to check different or weaker criteria, creating a gap where defects pass upstream validation but fail this repo's standards.

---

### Recommended fixes

1. **In `oviney/economist-agents`:** audit the 5 internal gate checks against `scripts/validate-post-quality.sh` and close any gaps (author, category format, hero-image placeholder, front-matter YAML validity, citation reachability).
2. **In this repo (`oviney/blog`):** add a CI step in `.github/workflows/content-validation.yml` that runs `scripts/validate-post-quality.sh --all` on every push to `main`, so the gate is enforced even if the upstream pipeline is misconfigured.
3. **Citation validation:** add a script or CI check that performs HTTP HEAD requests on all Markdown links in the References section and fails on 4xx/5xx responses.

---

### References

- Revert PR: https://github.com/oviney/blog/pull/837
- Offending commit: https://github.com/oviney/blog/commit/528689d4a486dc8b2d7edaf9abd1993493a5cd92
- Quality gate script: `scripts/validate-post-quality.sh`
- Content validation workflow: `.github/workflows/content-validation.yml`
