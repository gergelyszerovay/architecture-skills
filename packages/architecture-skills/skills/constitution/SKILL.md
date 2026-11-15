---
name: constitution
description: Read, write, or amend a constitution — the short normative core of a skill, product, or package — with numbered requirements (R), non-goals (N), and decisions (D) stated as current truth. Use when recording or changing a significant decision, checking whether a change violates a constitution, citing R/N/D IDs, or creating a constitution for a new skill, product, or package.
metadata:
  version: '0.1.0'
---

# Constitution

A constitution states what a subject must satisfy, what it deliberately doesn't do, and
what was decided. Every entry is **current truth**, except decisions explicitly marked
`pending`: the discussion behind a decision lives in plans, and git keeps earlier versions. References explain a constitution; an
architecture profile implements its mechanically checkable subset.

Read the subject's constitution before other material. It overrides conflicting guidance
in references, plans, and code comments.

## Where constitutions live

| Subject                                       | File                                                             |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Skill                                         | `<skill>.constitution.md` next to the skill's `SKILL.md`         |
| Product or group                              | `<group>/layered-docs/<n>.<name>.constitution.md`                |
| Package (only if it has decisions of its own) | the package's `layered-docs/` tree, `<n>.<name>.constitution.md` |

`<n>` follows the layered-docs level rule: `1` when the constitution is the tree's only
doc, `2` under the tree's `1.index.md` when the tree holds other documents too (such as a
product's brief and use-case registry).

Libraries don't get a constitution; a lib doc's Decisions section uses the same entry
format.

## Template

`markdown-schema-templates/constitution/constitution.template.md` in this skill, with its
`constitution.refine.ts` and `examples/`. Use the markdown-schema skill for the directive
grammar and filling mechanics, and validate every change:

```sh
validate-md --template <path-to>/constitution.template.md <name>.constitution.md
```

## Rules

- **IDs** (`R1`, `N1`, `D1`) are never renumbered or reused. A removed entry leaves a gap.
- **Clarify in place, reverse with a new ID.** Rewording that keeps the meaning edits the
  entry. A reversal removes the old entry and adds a new ID, so stale citations stop
  resolving instead of silently changing meaning.
- **Every decision serves a requirement**, and every requirement is served by at least one
  decision. A decision that serves nothing is a candidate for removal; a requirement no
  decision serves is unaddressed.
- **Checked by** says how a violation is found: `tool:<rule>` (a profile rule name),
  `test`, or `review`. Prefer a tool or test where one can work.
- **Status** is `active` (the default; leave the cell empty) or `pending`. A pending
  decision is made but not yet built: new work follows it, existing code isn't flagged for
  not meeting it yet, and its Why names the plan that builds it. When it is built, change
  the status in place and keep the ID. Lib and package docs may add the same column to
  their Decisions tables; it can be left out while no decision is pending.
- Whether a rule is enforced by a tool yet is not a status: the profile's `Enforced by`
  says that. An active decision whose rule is `planned` is checked in review meanwhile.
- **Why** is optional; add it only when the reason isn't obvious from the decision, and
  always for a pending decision.
- **Non-goals** are explicit so recurring debates can cite them.
- Keep entries short and checkable. Detail belongs in references, not in the constitution.

## When code and constitution disagree

Never resolve a conflict silently. Either change the code to satisfy the constitution, or
amend the constitution explicitly in the same change and say so. A review that finds an
unexplained contradiction reports the decision ID it violates.
