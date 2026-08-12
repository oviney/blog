---
name: review-legacy-class-retention
description: When a cleanup PR keeps one legacy class as an exception, check for equal-specificity source-order collisions with the modern component class on the same element
metadata:
  type: feedback
---

When a dead-code cleanup keeps **one** legacy class as a documented exception, always check whether that class sits on the *same element* as a modern component class, and diff their declaration blocks for overlapping properties.

**Why:** In this repo, legacy and modern classes are routinely stacked on one element (e.g. `<nav class="econ-topic-browse home-intro-links">`). Two single-class selectors have **equal specificity (0,1,0)**, so source order alone decides the winner — and the legacy block usually sits *later* in `economist-theme.scss` because it was appended over time. A legacy `margin: 0` will therefore silently defeat the modern component's intended spacing. Retaining the class under a reassuring new band comment ("link styling for X") can bless that latent override as if it were deliberate design.

**How to apply:**
- List every rule targeting each class in the *compiled* CSS (`grep -n 'classA\|classB' styles.css`) and compare line numbers — later wins at equal specificity.
- Flag any property declared in both blocks; ask whether the legacy value is intended or accidental.
- Prefer folding the surviving declarations into the modern component class (or a real modifier) and dropping the legacy class from the markup, over keeping a historically-named class alive with an explanatory comment. A comment documents the confusion; it does not remove it.
- Check the band comment actually describes *everything* the retained block does, not just the part the author cared about.

Related: [[review-dead-css-deletion]]
