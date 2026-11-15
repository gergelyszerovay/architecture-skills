<!-- TEMPLATE-ONLY: guide
// One per product with a UI (product-profile constitution D7): the places a
// user can be, what each is for and which objects it shows, the regions
// inside each place, the navigation between them, the modes that span regions,
// the commands of the command palette, and links to wireframes. Page objects in the end-to-end
// package cite a place or region by ID in their `@place` tag (`shelf`,
// `shelf/tool-list`); with the route, that is how tools derive whether a place
// is built (constitution D27). Routes and components are
// derivable from code; this doc holds the intent.
//
// Title: the product's name.
// Summary: how the product is organized, in one sentence.
//
// Cross-section rules enforced by information-architecture.refine.ts:
//   - Places.Place values are unique.
//   - Regions.Place names a row of Places; Place + Region is unique.
//   - Navigation.From and To name a place or a `<place>/<region>` of Regions.
//   - Commands.Scope names a place, a `<place>/<region>` or `global`.
//   - Wireframes.Place names a row of Places.
//
// Navigation (N), Modes (M) and Commands (Id) are keyed rows, so region
// documents, journeys and specs cite them (`<doc>#N3`), and a renamed or
// removed row is a broken link. Keys are unique across the document (D40).
-->

# <!-- TEMPLATE-ONLY: string; required -->

> <!-- TEMPLATE-ONLY: string; required; regex `^[^\n]{10,200}$` -->

## 1. Places

<!-- TEMPLATE-ONLY: guide
// Place: a kebab-case ID, used by page objects and journeys.
// Route: the URL pattern, or `none` for a place without one (a dialog, or the
// shell around every place).
// Objects: the domain-model objects it shows, comma-separated.
-->

| Place | Route | Purpose | Objects |
| ----- | ----- | ------- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Place: string; key; regex `^[a-z][a-z0-9-]*$`; required
Route: string; regex `^(none|/\S*)$`; required
Purpose: string; required
Objects: string; required
-->

| shelf | /shelf | Find an available tool. | Tool |

## 2. Regions

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Distinct regions inside a place that a user moves between, such as a list
// and a detail pane. Region: a kebab-case ID.
// A region that needs more than this line gets a region document.
-->

| Place | Region | Shows |
| ----- | ------ | ----- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Place: string; required
Region: string; regex `^[a-z][a-z0-9-]*$`; required
Shows: string; required
-->

| shelf | tool-list | The tools on the shelf, filterable by name. |

## 3. Navigation

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// One row per transition: from where to where, by what gesture, carrying what.
// From, To: a place (`shelf`) or a region (`shelf/tool-list`) of Regions.
// By: the gesture or command as the user does it (a click, a key, a command id,
// a link). Carries: what travels (a path, a declaration, a revision), or
// `nothing`. A region document's Interactions row that moves the user elsewhere
// cites its N row and says no more than the region's own part.
-->

| ID  | From | To  | By  | Carries |
| --- | ---- | --- | --- | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^N[1-9][0-9]*$`
From: string; required; regex `^[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)?$`
To: string; required; regex `^[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)?$`
By: string; required
Carries: string; required
-->

| N1 | shelf/tool-list | tool | click on a tool | the tool's label |

## 4. Modes

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// A mode is a state that more than one region reads. Values: the states it can
// be in. Set by: a gesture, the revision, the configuration. Affects: the
// regions that read it. A region document's States row that depends on a mode
// cites it instead of restating its values.
-->

| ID  | Mode | Values | Set by | Affects |
| --- | ---- | ------ | ------ | ------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
ID: string; key; regex `^M[1-9][0-9]*$`
Mode: string; required
Values: string; required
Set by: string; required
Affects: string; required
-->

| M1 | listing | grouped, flat | the toggle in the shelf's header | shelf/tool-list, shelf/tool-preview |

## 5. Commands

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// The command palette's entries. Id: the id the code declares,
// `<group>.<name>`. Command: the palette's label. Scope: a place, a region
// (`<place>/<region>`) or `global`. Effect: what it does, or the N row it
// performs. Keys are an instance's configuration and stay in the keymap
// document, which cites the Id.
-->

| Id  | Command | Scope | Effect |
| --- | ------- | ----- | ------ |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Id: string; key; regex `^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$`
Command: string; required
Scope: string; required; regex `^(global|[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)?)$`
Effect: string; required
-->

| tools.open | Tools: Open | shelf | opens the selected tool (N1) |

## 6. Wireframes

<!-- TEMPLATE-ONLY: section; optional -->

<!-- TEMPLATE-ONLY: guide
// Links to wireframes kept elsewhere (a design file, an image, a sketch).
// Wireframe: a Markdown link.
-->

| Place | Wireframe |
| ----- | --------- |

<!-- TEMPLATE-ONLY: row; min-rows: 1
Place: string; required
Wireframe: string; required
-->

| shelf | [shelf sketch](./wireframes/shelf.png) |
