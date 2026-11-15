# manifest-sync

> Opens manifest sessions on the served worktree or a commit, streams their snapshots and patches, and reads file contents consistent with them.

## 1. Boundaries

| Concern                                                   | Owner                                            |
| --------------------------------------------------------- | ------------------------------------------------ |
| Listing the revisions a client may open                   | revisions                                        |
| Building and diffing manifests, watching worktree files   | `@gergelyszerovay/reviewer2-repository-manifest` |
| Reading commit blobs                                      | `@gergelyszerovay/reviewer2-repository-history`  |
| Mapping errors to tRPC codes                              | shared/trpc-errors                               |
| Implementing the manifest engine port over those packages | composition                                      |

## 3. Decisions

| ID  | Decision                                                                                                                                                      | Checked by | Why                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| D1  | A commit read fails when Git's blob ID differs from the one the manifest recorded.                                                                            | test       | Content is only ever associated with the blob ID the client already has.                    |
| D2  | A worktree read whose bytes differ from the manifest injects a change and waits up to 10 s for a patch covering it before answering at that patch's revision. | test       | The answer stays consistent with a revision the client can see (plan 0005, Consistency §3). |

## 4. Areas

| Area  | Use cases and flows                                                                             | Owns    |
| ----- | ----------------------------------------------------------------------------------------------- | ------- |
| graph | read-graph-declaration, read-graph-neighbourhood, read-graph-outline, search-graph-declarations | nothing |
| views | read-view                                                                                       | nothing |
