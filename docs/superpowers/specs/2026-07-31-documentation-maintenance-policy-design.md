# Documentation Maintenance Policy Design

## Goal

Keep the repository documentation and GitHub Pages website aligned with every
release and every project change that affects users, operators, setup,
configuration, architecture, or documented behaviour.

## Approaches considered

1. Add one broad rule requiring documentation edits for every commit. This is
   simple, but it would create meaningless documentation churn for internal
   refactors, tests, and CI maintenance that do not change documented behaviour.
2. Add a scoped Development Rule and reinforce it in the Definition of Done.
   Releases always update both documentation surfaces; other changes update them
   when they affect documented behaviour. Internal-only changes still require a
   documentation-impact review.
3. Add a dedicated documentation-policy section with a detailed change matrix.
   This is explicit, but disproportionate for a short contributor rule and adds
   maintenance overhead.

## Selected design

Use approach 2. Update `AGENTS.md` in two places:

- Add a Development Rule requiring every release to update relevant repository
  documentation and the `site/` documentation website, including version
  references, release status, setup instructions, and feature availability.
- Require user-facing, operator-facing, configuration, architecture, setup, and
  documented-behaviour changes to update both documentation surfaces in the
  same change.
- State that internal-only changes must still be checked for documentation
  impact, but do not require artificial content edits when nothing documented
  changed.
- Add a Definition of Done item confirming that both documentation surfaces are
  current when the change affects them.

This keeps the requirement enforceable without forcing unrelated documentation
churn.

## Verification

- Confirm `AGENTS.md` contains the release requirement, scoped change
  requirement, and documentation-impact review.
- Confirm Definition of Done covers both repository docs and the website.
- Run `git diff --check`.
