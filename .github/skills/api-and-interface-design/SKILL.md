---
name: api-and-interface-design
description: Designs stable interfaces and contracts. Use when defining public data shapes, Liquid include parameters, JSON feeds, script inputs, or other repo surfaces that other files or tools consume.
---

# API and Interface Design

## Overview

On oviney/blog, interfaces are not limited to HTTP APIs. Front matter schemas, `_data/` structures, Liquid include parameters, `search.json`, script environment variables, and workflow inputs are all public contracts once other files depend on them. Design these surfaces so they are explicit, additive, and hard to misuse.

## When to Use

- Creating or changing front matter, `_data/`, or JSON output shapes
- Designing include parameters or layout-level data contracts
- Adding script inputs, workflow variables, or config surface area
- Defining browser-to-script or page-to-JavaScript data handoffs
- Modifying any published interface another file or tool consumes

## Principles for This Repo

### Contract First

Write down the shape before implementing it. If a field, parameter, or output cannot be described clearly, it is not ready to become a repo contract.

### Prefer Addition Over Breakage

Extend existing interfaces with optional or clearly defaulted fields where possible. Renames, removals, and type changes create hidden migration work across templates, content, scripts, and tests.

### Validate at the Boundary

Validate external and author-controlled input where it enters the system:

- front matter
- `_data/` files
- search or manifest JSON output
- environment variables and script flags
- third-party responses consumed by scripts

Once data is validated at the boundary, keep internal flows simple.

### Be Intentional About What Becomes Observable

If a value appears in generated HTML, JSON, docs, or scripts, treat it like a supported contract. Hidden coupling forms quickly in static-site repos because templates, content, tests, and automation all read the same surface.

## High-Value Interface Surfaces

| Surface | Design concern |
|---|---|
| Front matter | stable keys, clear defaults, exact category values where required |
| Liquid includes | named parameters, predictable fallback behavior |
| JSON feeds like `search.json` | additive fields, consistent naming, documented consumers |
| Script inputs | explicit env vars and flags, minimal surprise |
| Workflow or command docs | real commands only, one unambiguous execution path |

## Design Moves That Age Well

- prefer explicit names over positional assumptions
- keep optional fields truly optional
- document fallback behavior near the contract
- separate input shape from rendered or generated output shape
- plan the exit path before expanding a public surface

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It is just a small field rename" | Small renames can silently break templates, docs, tests, and content. |
| "We can document it after implementation" | In this repo, the contract often is the documentation. |
| "Only one file uses this include today" | Once visible, other files will copy it. Design for reuse early. |
| "Static sites do not have APIs" | Generated JSON, front matter, and include parameters are still interfaces. |

## Red Flags

- Inconsistent field names across related outputs
- Required fields without defaults or migration plan
- Include behavior that changes based on undocumented side effects
- Script or workflow docs showing commands that do not exist in the repo
- Breaking a public shape without checking all of its consumers

## Verification

After changing an interface:

- [ ] The contract is explicit in code or docs near the change
- [ ] New fields are additive or a migration story exists
- [ ] All known consumers in scope were updated consistently
- [ ] `bundle exec jekyll build` passed
- [ ] Relevant existing QA or security commands were rerun for affected consumers

## Related Files

- [`../deprecation-and-migration/SKILL.md`](../deprecation-and-migration/SKILL.md) — retiring interfaces safely
- [`../../../CLAUDE.md`](../../../CLAUDE.md) — lifecycle and command truth
- [`../../../package.json`](../../../package.json) — real QA and security commands that consume repo surfaces
