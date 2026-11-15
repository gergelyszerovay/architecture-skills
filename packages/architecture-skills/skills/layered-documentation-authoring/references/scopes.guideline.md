# Scopes — Diátaxis alignment and normative rules

> Why each non-index file carries a scope suffix, what each means, and the
> MUST/SHOULD rules for choosing one.

Companion to `../SKILL.md`. Naming/level rules are in `structure-rules.guideline.md`.

## Why Diátaxis

[Diátaxis](https://diataxis.fr/) splits documentation into four quadrants along
two axes: **practical vs. theoretical** and **learning vs. working**. Mixing
modes in one file is the most common cause of docs that are simultaneously
verbose and unhelpful — a tutorial buried inside a reference, a how-to
interrupted by rationale. By giving each file one scope, we keep modes separated
and let readers (LLM or human) load only the mode they need.

## The grid

```
                LEARNING              WORKING
          ┌────────────────┬────────────────┐
PRACTICAL │   .tutorial    │ .workflow .fix │
          ├────────────────┼────────────────┤
THEORY    │   .concept     │     .spec      │
          └────────────────┴────────────────┘

.example, .template span all quadrants (demonstration / reuse)
.index is the meta-navigation layer
```

## Scope semantics

| Scope      | Mode          | What it answers                           |
| ---------- | ------------- | ----------------------------------------- |
| `tutorial` | Learning      | "Walk me through building X."             |
| `workflow` | Working       | "How do I achieve a specific goal?"       |
| `fix`      | Working       | "Something is broken — how do I fix it?"  |
| `concept`  | Learning      | "Why does this exist? What's the model?"  |
| `spec`     | Working       | "What are the exact rules / API / facts?" |
| `example`  | Demonstration | Concrete code or pattern.                 |
| `template` | Reuse         | Copy-and-adapt starting point.            |
| `index`    | Navigation    | "What lives in this domain?"              |

## RFC 2119 keywords

MUST, MUST NOT, SHOULD, MAY are used per RFC 2119.

## When a doc has no scope

Template-bound docs (`<n>.<artifact>.<template-name>.md`) and indexes
(`<n>.index.md`) MUST NOT carry a scope suffix. The template is the structural
contract; the scope concept does not apply.

## When a doc has a scope

Every prose doc (free-form content not bound to a template) MUST carry exactly
one scope suffix, one of:

| Scope       | When to use                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `.concept`  | Explains why something exists, the mental model, the rationale, or the trade-offs.                               |
| `.spec`     | Defines hard rules, normative requirements, exact field formats, or reference facts that are not template-bound. |
| `.workflow` | Step-by-step procedure for accomplishing a specific developer task.                                              |
| `.fix`      | Diagnosis and remedy for a known failure mode or symptom.                                                        |
| `.tutorial` | Beginner walkthrough from zero, with learning as the explicit goal (rarely needed).                              |

A doc MUST NOT mix two scopes. If a file would naturally need two, split it into
two files at the same level.

## Picking the scope

```
Does the doc primarily teach a mental model?
├── Yes → .concept
└── No  → Does the doc primarily define rules / facts that are reference material?
         ├── Yes → .spec
         └── No  → Does the doc primarily walk through a task?
                  ├── Yes, achieving a goal step by step → .workflow
                  ├── Yes, fixing a known broken state    → .fix
                  └── Yes, teaching from zero             → .tutorial
```

Rules of thumb:

- A new file documenting **rules that MUST be followed** → `.spec`.
- A new file explaining **the rationale or mental model** behind those rules →
  `.concept` (often paired with a sibling `.spec`).
- A new file walking through **a specific task end-to-end** → `.workflow`.
- A new file solving **a known problem when something goes wrong** → `.fix`.
- A new file teaching **a beginner from zero** → `.tutorial`.

## What goes in `.concept` vs `.spec`

A common ambiguity. Resolve as follows:

| Question this doc answers                                         | Scope      |
| ----------------------------------------------------------------- | ---------- |
| "What is the model for X?" / "Why does the system work this way?" | `.concept` |
| "Is X allowed?" / "What value MUST field Y have?"                 | `.spec`    |
| "What's the trade-off between A and B?"                           | `.concept` |
| "What scopes are permitted in filenames?"                         | `.spec`    |
| "Why does a doc bind to its closest template?"                    | `.concept` |
| "What does the resolver pick when two templates share a name?"    | `.spec`    |

When unsure, default to `.spec` for terse rule-listing material, `.concept` for
material that uses analogies, justifies decisions, or compares alternatives.

## Pairing

A `.spec` and a `.concept` MAY be paired (same `<topic>`, both scopes). When paired:

- The `.concept` declares no prerequisite from the `.spec`.
- The `.spec` SHOULD declare the `.concept` as a prerequisite.
- The two files do not duplicate content; the `.spec` references the `.concept`
  for rationale.

## Banned topic terms and the `overview` exception

The topic segment MUST NOT use: `quickstart`, `guide`, `overview` (use a specific
name), `misc`, `other`, `various`, `stuff`, `things`, `utils`.

`overview` is the only occasionally tempting one; an existing
`overview.concept.md` is grandfathered because no more specific kebab-case word
captures the same scope. This is the lone exception — do not introduce others.

## Verification content (template-bound, no free scope)

Some Working-quadrant content is **verification**: the outcome-based test spec
for a feature — its functional requirements and acceptance criteria. This is not
a `.spec` (which states the rules) but the criteria that _prove_ the rules hold,
mapping 1:1 to test cases. Because it is highly structured
(suite → requirement → criterion → test), an app tier MAY bind it to a dedicated
**template** (e.g. `acceptance-criteria`) rather than free prose. Template-bound
docs carry no free scope suffix (the template is the contract), so verification
content does not add a quadrant to the grid — it is `.spec`'s practical sibling,
expressed as a template. See the app tier's templates list for whether such a
template exists.
