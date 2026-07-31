# Documentation Maintenance Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require releases and documentation-affecting project changes to keep repository documentation and the GitHub Pages website current.

**Architecture:** Add the policy to the existing Development Rules in `AGENTS.md`, then reinforce it as a Definition of Done requirement. Keep internal-only maintenance exempt from artificial content edits while requiring an explicit documentation-impact check.

**Tech Stack:** Markdown, Git

## Global Constraints

- Every version release updates relevant repository documentation and the `site/` documentation website.
- User-facing, operator-facing, setup, configuration, architecture, and documented-behaviour changes update both documentation surfaces in the same change.
- Internal-only changes require a documentation-impact review but no content edit when documented behaviour is unchanged.
- Do not add dependencies or modify project scope.

---

### Task 1: Add and verify the documentation maintenance policy

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: The existing Development Rules and Definition of Done contributor policy.
- Produces: A contributor requirement covering repository docs and `site/` content for releases and documentation-affecting changes.

- [ ] **Step 1: Add the Development Rules**

Replace the existing setup/config-only documentation rule with these rules:

```markdown
10. For every version release, update all relevant repository documentation and the documentation website under `site/` in the same change. Keep version references, release status, shipped features, setup instructions, and upgrade guidance aligned with the released application.
11. For user-facing, operator-facing, setup, configuration, architecture, or other documented-behaviour changes, update both the relevant repository documentation and corresponding `site/` pages in the same change.
12. For internal-only changes, explicitly check for documentation impact. Do not make artificial documentation edits when documented behaviour has not changed.
```

- [ ] **Step 2: Reinforce the policy in Definition of Done**

Add this item after the existing documentation item:

```markdown
* Relevant repository documentation and `site/` website content are current for every release and every change that affects documented behaviour.
```

- [ ] **Step 3: Verify policy coverage**

Run:

```bash
rg -n "For every version release|documented-behaviour changes|internal-only changes|site/ website content" AGENTS.md
```

Expected: four matches covering releases, scoped changes, internal-only impact review, and Definition of Done.

- [ ] **Step 4: Verify Markdown whitespace**

Run:

```bash
git diff --check
```

Expected: exit code 0 with no output.

- [ ] **Step 5: Review the focused diff**

Run:

```bash
git diff -- AGENTS.md
```

Expected: only the three Development Rules and one Definition of Done item are added or replaced.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md
git commit -m "docs: require website updates with project changes"
```
