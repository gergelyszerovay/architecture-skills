# file-browser

> Shows the open revision's files as a package tree and displays the selected file's content.

## 1. Identity

- Role: capability

## 2. Boundaries

| Concern                                            | Owner                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Syncing the manifest and caching file content      | `@gergelyszerovay/reviewer2-frontend:manifest-replica#ManifestReplicaStore` |
| Fetching file content and declaring open files     | `@gergelyszerovay/reviewer2-frontend:manifest-replica#ReadContentCommand`   |
| Choosing which revision is open                    | revision-picker                                                             |
| Placing the tree and the viewer in resizable panes | shell                                                                       |
| Classifying file roles and binary files            | backend                                                                     |

## 3. State Ownership

| State                                | Kind         | Owner                                                                 | Notes                                                          |
| ------------------------------------ | ------------ | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| Selected path                        | presentation | `@gergelyszerovay/reviewer2-frontend:file-browser#/FileBrowserFacade` |                                                                |
| File tree groups                     | derived      | `@gergelyszerovay/reviewer2-frontend:file-browser#/FileBrowserFacade` | From the store's files and packages.                           |
| Viewer state                         | derived      | `@gergelyszerovay/reviewer2-frontend:file-browser#/FileBrowserFacade` | From the selected path, files, content cache and failed reads. |
| Expanded folders and the focused row | presentation | `@gergelyszerovay/reviewer2-frontend:file-browser#/FileTreeUi`        |                                                                |

## 4. Decisions

| ID  | Decision                                                                                                                                      | Checked by | Why                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| D1  | The tree scrolls with a native `overflow-y-auto` container, and its hosts use `h-full min-h-0`, instead of the spartan scroll-area component. | review     | The scroll-area version was buggy and the tree appeared not to scroll. |
