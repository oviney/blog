# TODO

**Cycle in progress:** restore the product boundary of `oviney/blog`.
Spec: [`SPEC.md`](../SPEC.md) · Plan: [`plan.md`](plan.md)

The masthead cycle is archived under
[tasks/archive/2026-08-29-masthead-grid-alignment/](archive/2026-08-29-masthead-grid-alignment/)
(shipped as #1282).

## This cycle

- [x] **Slice 1** — unblock `main`: alt text on the quality-ownership draft and
      its SVG `<desc>`. **Shipped as [#1307](https://github.com/oviney/blog/pull/1307).**
      `main` had been red seven consecutive nights; 1 error → 0.
- [x] **Slice 2** — clear the merge queue.
      **[#1282](https://github.com/oviney/blog/pull/1282) merged** (`9ba1bc9`)
      after 14 days green. #1296 deliberately held for slice 6.
- [x] **Slice 3** — stop the producer at source.
      **[oviney/economist-agents#484](https://github.com/oviney/economist-agents/pull/484)**
      adds the `<desc>` prompt-language guard. Awaiting merge in that repo;
      [#1289](https://github.com/oviney/blog/issues/1289) stays open until it lands.
- [ ] **Slice 4** — untrack `vendor/` (3,599 files) and `.playwright-mcp/` (24);
      drop the `Gemfile.lock` line from `.gitignore`
- [ ] **Slice 5** — delete workflows and scripts that neither run nor are acted on
- [ ] **Slice 6** — decide keep/retire on the observability surface; settles #1296
- [ ] **Slice 7** — collapse six backlogs to two and write the routing rule down
- [ ] **Slice 8** — ADR + migration spec for extracting the agent framework

## Open, not in this cycle

- **[#1063](https://github.com/oviney/blog/issues/1063)** — real email signup.
  **Blocked on owner approval, not on work:** `ROADMAP.md` lists
  "Newsletter or email subscription service" under *Out of Scope*, and the issue
  names that conflict as a PR-0 gate. Needs a provider chosen and an account
  created — not an agent decision.
- **Cross-check the original Claude Design bundle.** The bundle lives in a Claude
  Design project and is not on this machine. Carried over from the masthead
  cycle; owner agreed to paste the contents. The masthead half shipped in #1282.
- **Two stale stashes** on `main` (`scoring-verification-baseline`,
  `copilot-temp-before-pull`), both verified obsolete in the 2026-08-10 cycle.
  Dropping them is a one-liner and the owner's call.
