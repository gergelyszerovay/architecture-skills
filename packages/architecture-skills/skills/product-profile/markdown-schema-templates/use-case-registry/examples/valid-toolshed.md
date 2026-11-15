# Toolshed

> Members borrow and contribute tools; stewards lend them out and take them back.

## 1. Use Cases

| ID  | Actor   | Goal                      | Benefit                                  | Journey         |
| --- | ------- | ------------------------- | ---------------------------------------- | --------------- |
| UC1 | member  | borrow a tool             | I can do the job without buying the tool | borrow-a-tool   |
| UC2 | member  | contribute a tool         | my idle tool gets used                   | contribute-tool |
| UC3 | steward | take a returned tool back | the shelf shows what is really available | return-a-tool   |

## 2. Extensions

| Use case | Condition                      | Outcome                                          | Covered by                                |
| -------- | ------------------------------ | ------------------------------------------------ | ----------------------------------------- |
| UC1      | The tool is already lent out   | The member sees the date it is due back.         | tool-unavailable                          |
| UC1      | The member has an overdue loan | Borrowing is refused until the loan is returned. | @toolshed/api:loans#overdue-blocks-borrow |
| UC3      | The tool comes back damaged    | The steward marks it for repair.                 | review                                    |
