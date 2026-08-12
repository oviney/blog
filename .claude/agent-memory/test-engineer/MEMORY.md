# Test Engineer Memory

- [Visual Gate Blind Spots](reference_visual_gate_blind_spots.md) — what "🖼️ 30/30 green" does not cover: the 769–1024px band, viewport-pinned listing pages, hidden `volatile` blocks
- [Local Visual Verification Trap](reference_local_visual_verification_trap.md) — `_site` is shared; a second `jekyll serve` overwrites it and both ports serve the same build
- [Selector-Keyed Guard Drift](reference_selector_keyed_guard_drift.md) — renaming a page wrapper drops it out of class-keyed layout guards *and* the theme's `:has()` width escape; both fail open
