# @gergelyszerovay/reviewer2-app

> Serves one repository's live worktree and commits as manifest sessions over a single tRPC WebSocket.

## 1. Boundaries

| Concern                                                          | Owner                                            |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| Building, diffing and streaming manifests; watching the worktree | `@gergelyszerovay/reviewer2-repository-manifest` |
| Reading Git history, commits, blobs and worktrees                | `@gergelyszerovay/reviewer2-repository-history`  |
| Wire DTOs and their schemas                                      | `@gergelyszerovay/reviewer2-api-types`           |
| Keeping a client-side replica and rendering it                   | `@gergelyszerovay/reviewer2-frontend`            |
| Serving more than one repository per process                     | nobody: one repository per process               |

## 2. Approved Packages

| Package                                        | Layers              | Reason                                                                                                                                       |
| ---------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| @gergelyszerovay/reviewer2-repository-manifest | domain, application | Its manifest, patch, source and change-feed types are the files-layer vocabulary that manifest-sync's models, rules and port are written in. |
| node:crypto                                    | domain              | `gitBlobId` hashes bytes the way Git does; hashing is a pure computation.                                                                    |

## 4. Decisions

| ID  | Decision                                                                                                             | Checked by                                      | Why                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| D1  | One `wsLink` WebSocket carries every query, mutation and subscription, and ordinary HTTP requests get `404`.         | review                                          | Decided in `planning/0005/plan.md`.                                                            |
| D2  | One repository is served per process, given at startup, so both bridges close over one resolved worktree root.       | review                                          |                                                                                                |
| D3  | In `app/`, only bridges, the composition root and the entry point import repository-manifest and repository-history. | tool:cross-package-adapters-only-in-composition | Those packages are other hexagons, and bridges are where they're wrapped (skill D9).           |
| D4  | The type-only `./trpc` export points at `app/app.router.ts` source instead of a generated declaration.               | review                                          | A declaration for a router with a `tracked()` subscription can't be emitted portably (TS2883). |

## 5. Contexts

| Context        | May depend on | Why                                                                                      |
| -------------- | ------------- | ---------------------------------------------------------------------------------------- |
| manifest       | none          | Manifest sync and revisions own the replica every other context reads.                   |
| source-control | manifest      | The changes view resolves paths and revisions through the manifest's use cases.          |
| agent          | manifest      | Agent access and the terminal read the manifest through bridges.                         |
| platform       | none          | Instance configuration and the static site serve the process, not a part of the product. |
