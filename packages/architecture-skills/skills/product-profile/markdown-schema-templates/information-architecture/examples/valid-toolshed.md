# Toolshed

> Members browse the shelf, open a tool, and see their loans; stewards lend tools from the desk.

## 1. Places

| Place    | Route         | Purpose                                      | Objects            |
| -------- | ------------- | -------------------------------------------- | ------------------ |
| shelf    | /shelf        | Find an available tool.                      | Tool               |
| tool     | /tools/:label | See a tool and when it is free.              | Tool, Loan         |
| my-loans | /me/loans     | See what I have borrowed and when it is due. | Loan               |
| desk     | /desk         | Lend tools out and take them back.           | Member, Tool, Loan |

## 2. Regions

| Place | Region       | Shows                                       |
| ----- | ------------ | ------------------------------------------- |
| shelf | tool-list    | The tools on the shelf, filterable by name. |
| shelf | tool-preview | The selected tool's photo and availability. |
| desk  | open-loans   | Loans that are out, overdue first.          |

## 3. Navigation

| ID  | From            | To   | By              | Carries          |
| --- | --------------- | ---- | --------------- | ---------------- |
| N1  | shelf/tool-list | tool | click on a tool | the tool's label |

## 4. Modes

| ID  | Mode    | Values        | Set by                           | Affects                             |
| --- | ------- | ------------- | -------------------------------- | ----------------------------------- |
| M1  | listing | grouped, flat | the toggle in the shelf's header | shelf/tool-list, shelf/tool-preview |

## 5. Commands

| Id         | Command     | Scope | Effect                       |
| ---------- | ----------- | ----- | ---------------------------- |
| tools.open | Tools: Open | shelf | opens the selected tool (N1) |

## 6. Wireframes

| Place | Wireframe                              |
| ----- | -------------------------------------- |
| shelf | [shelf sketch](./wireframes/shelf.png) |
