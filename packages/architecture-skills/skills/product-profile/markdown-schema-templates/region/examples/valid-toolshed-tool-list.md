# shelf/tool-list

> Find an available tool on the shelf and open it.

## Structure

| ID  | Element    | Role           | Parent | Shows                         | Layout               | Selecting it                     |
| --- | ---------- | -------------- | ------ | ----------------------------- | -------------------- | -------------------------------- |
| S1  | tool list  | `tree "Tools"` | —      | the tool groups               | fixed height, see R3 | —                                |
| S2  | tool group | `treeitem`     | S1     | the category's name           | —                    | expands or collapses it          |
| S3  | tool       | `treeitem`     | S2     | the tool's name and its owner | —                    | opens the tool                   |
| S4  | more tools | `treeitem`     | S2     | "More tools"                  | —                    | loads the next 20 into its group |

## States

| ID  | State      | Shows                                                           |
| --- | ---------- | --------------------------------------------------------------- |
| T1  | first load | the list's frame (S1) at its normal size, with a spinner inside |
| T2  | refreshing | the last list (S1), with a progress strip along its top edge    |
| T3  | empty      | the text of W1 in the list (S1)                                 |

## Interactions

| ID  | Input                | Effect                    |
| --- | -------------------- | ------------------------- |
| I1  | click or Enter on S2 | opens the tool            |
| I2  | typing               | filters the tools by name |

## Rules

| ID  | Rule                                                 | Why                                              | Checked by | Topic   |
| --- | ---------------------------------------------------- | ------------------------------------------------ | ---------- | ------- |
| R1  | Groups by category, tools by name within a group.    | Members look tools up by category, then by name. | spec       | order   |
| R2  | 20 tools per group first, then pages of 20 (L1).     | Most groups fit; long ones stay scannable.       | spec       | paging  |
| R3  | Loading and refreshing never change the list's size. | The page around it must not jump.                | visual     | drawing |

## Limits

| ID  | Limit                       | Value | Why                                        |
| --- | --------------------------- | ----- | ------------------------------------------ |
| L1  | tools per group, first page | 20    | Most groups fit; long ones stay scannable. |

## Messages

| ID  | When              | Text                  |
| --- | ----------------- | --------------------- |
| W1  | the list is empty | No tools on the shelf |

## Limitations

Tools on loan elsewhere are not listed yet (roadmap item 4).

## Wireframes

```text
[S1] Tools
  ▾ [S2] Hammers
      [S3] Claw hammer · Ann
      [S3] Mallet · Ben
      [S4] More tools
  ▸ [S2] Saws
```
