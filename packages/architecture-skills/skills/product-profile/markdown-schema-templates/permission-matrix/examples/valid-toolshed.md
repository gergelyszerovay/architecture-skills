# Toolshed

> Anyone can browse the shelf; members contribute tools and see their own loans; stewards lend tools out.

## 1. Roles

| Role      | Meaning                      | How assigned                |
| --------- | ---------------------------- | --------------------------- |
| anonymous | A visitor without a session. | Default before sign-in.     |
| member    | A neighbour who has joined.  | Any signed-in account.      |
| steward   | A member who runs the shelf. | Granted by another steward. |

## 2. Permissions

| Object | Action     | Role      | Access | Enforced by  |
| ------ | ---------- | --------- | ------ | ------------ |
| Tool   | view       | anonymous | allow  | @toolshed/db |
| Tool   | view       | member    | allow  | @toolshed/db |
| Tool   | view       | steward   | allow  | @toolshed/db |
| Tool   | contribute | anonymous | deny   | @toolshed/db |
| Tool   | contribute | member    | allow  | @toolshed/db |
| Tool   | contribute | steward   | allow  | @toolshed/db |
| Loan   | start      | anonymous | deny   | @toolshed/db |
| Loan   | start      | member    | deny   | @toolshed/db |
| Loan   | start      | steward   | allow  | @toolshed/db |
| Loan   | view       | anonymous | deny   | @toolshed/db |
| Loan   | view       | member    | own    | @toolshed/db |
| Loan   | view       | steward   | allow  | @toolshed/db |
