# Toolshed

> The shelf, its tools, the members who contribute and borrow them, and the loans between them.

## 1. Objects

| Object | Meaning                                      | Identified by       | Owner        | Modeled by                   |
| ------ | -------------------------------------------- | ------------------- | ------------ | ---------------------------- |
| Member | A neighbour who has joined the tool library. | Their email address | @toolshed/db | `@toolshed/contracts#Member` |
| Tool   | A physical tool contributed to the shelf.    | Its label number    | @toolshed/db | `@toolshed/contracts#Tool`   |
| Loan   | A tool lent to a member for a fixed period.  | Tool and start date | @toolshed/db |                              |

## 2. Relationships

| From   | Relationship | To   | Cardinality |
| ------ | ------------ | ---- | ----------- |
| Member | contributes  | Tool | one-to-many |
| Member | borrows      | Loan | one-to-many |
| Loan   | lends        | Tool | many-to-one |

## 3. Attributes

| Object | Attribute | Kind    | Notes                              |
| ------ | --------- | ------- | ---------------------------------- |
| Tool   | Name      | core    |                                    |
| Tool   | Available | derived | No open loan holds the tool.       |
| Loan   | Due date  | core    |                                    |
| Loan   | Overdue   | derived | Open, and the due date has passed. |
