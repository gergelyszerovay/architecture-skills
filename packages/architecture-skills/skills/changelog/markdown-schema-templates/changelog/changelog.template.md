<!-- TEMPLATE-ONLY: guide
// The release notes of one published package or one skill: `CHANGELOG.md` beside the
// package's `package.json`, or in the skill's own folder beside `SKILL.md`. Rules and workflow:
// the `changelog` skill.
//
// Title: "Changelog: " and the package's name (`@scope/name`) or the skill's `name`.
//
// The text before the first section is one sentence naming the audience; the skill's
// `SKILL.md` gives the wording.
//
// Unreleased: the entries of work not released yet, empty ("") after a release. A package or
// skill whose version is already raised ahead of its last release keeps those entries under
// its own version heading, and `## Unreleased` stays empty.
//
// Versions: after `## Unreleased`, one `## <version>` section per release, newest first. The
// heading is the version and nothing else (no date, no "v", no note). The template is open
// because a version heading is the section's key, which a template cannot declare; the
// refine checks the headings: semantic versions, strictly descending.
//
// Inside a section: `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`,
// `### Security`, in that order, none empty, none twice. Each is a list of bullets. A version section
// of a `CHANGELOG.public.md` may instead be the one line `No changes for users of the package.` A bullet
// opens with a bold sentence and may cite its plan: `- **The cage refuses a link.** The
// reason. (reviewer2 plan 0127)`. A bullet that needs action from the consumer starts with
// `**Breaking:**` and then the bold sentence.
-->

# Changelog: <!-- TEMPLATE-ONLY: string; required -->

<!-- TEMPLATE-ONLY: document; open -->

Release notes for those who consume a version. The rules are in the `changelog` skill.

## Unreleased

<!-- TEMPLATE-ONLY: freetext; optional -->

### Added

- **The first change.** What a consumer of the version notices. (lab plan 0001)
