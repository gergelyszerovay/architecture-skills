# @gergelyszerovay/reviewer2-frontend

> Angular client that browses a repository's live worktree or a commit as a package and file tree.

## 1. Boundaries

| Concern                                      | Owner                                |
| -------------------------------------------- | ------------------------------------ |
| Building, diffing and streaming the manifest | `@gergelyszerovay/reviewer2-app`     |
| Classifying file roles and binary files      | `@gergelyszerovay/reviewer2-app`     |
| Reading Git history, commits and worktrees   | `@gergelyszerovay/reviewer2-app`     |
| Keeping any state beyond one page session    | nobody: state lasts one page session |

## 2. Provider Scopes

| Provider                                                                       | Scope | Why                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@gergelyszerovay/reviewer2-frontend:manifest-replica#ManifestSessionRealtime` | app   | The app has one route, and Angular keeps route injectors alive after navigation unless its experimental injector cleanup is enabled, so app scope is the narrowest scope covering the subscription's consumers. |
| `@gergelyszerovay/reviewer2-frontend:manifest-replica#ManifestReplicaStore`    | app   | Every library reads the replica, and its blob cache is shared across revisions for the whole page session.                                                                                                      |

## 4. Decisions

| ID  | Decision                                                               | Checked by | Why                                 |
| --- | ---------------------------------------------------------------------- | ---------- | ----------------------------------- |
| D1  | One `wsLink` WebSocket carries every query, mutation and subscription. | review     | Decided in `planning/0005/plan.md`. |

## 5. Approved Packages

| Package                                | Layers       | Why                                                            |
| -------------------------------------- | ------------ | -------------------------------------------------------------- |
| `@gergelyszerovay/reviewer2-api-types` | domain       | The constants the backend and the browser share.               |
| `@spartan-ng/helm`                     | presentation | The vendor root's components, used by the presentation blocks. |

## 6. Contexts

| Context      | May depend on          | Why                                                                      |
| ------------ | ---------------------- | ------------------------------------------------------------------------ |
| manifest     | none                   | The replica every other context reads; it reads nothing of them.         |
| declarations | manifest               | The graph is built from the replica's declarations layer.                |
| source       | manifest, declarations | The editor marks declarations and reads the replica's files and content. |

## 7. Vendor Roots

| Directory | Package          | Owner                                  | Why                                                                                                    |
| --------- | ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| libs/ui   | @spartan-ng/helm | the spartan-ng CLI (`components.json`) | The helm components, generated in spartan's own layout and imported as `@spartan-ng/helm/<component>`. |
