# toolshed

> A neighbourhood tool library: members borrow and lend tools, and stewards look after the shared shelf.

## 1. Packages

| Package             | Role     | May depend on                     |
| ------------------- | -------- | --------------------------------- |
| @toolshed/web       | app      | @toolshed/contracts               |
| @toolshed/api       | service  | @toolshed/contracts, @toolshed/db |
| @toolshed/db        | database | none                              |
| @toolshed/contracts | contract | none                              |
| @toolshed/e2e       | e2e      | @toolshed/contracts               |

## 2. Glossary

| Term    | Meaning                                            | Not to be confused with                     |
| ------- | -------------------------------------------------- | ------------------------------------------- |
| Loan    | A tool lent to a member for a fixed period.        | Reservation: a claim on a future loan.      |
| Steward | A member who checks tools in and out at the shelf. | Owner: the member who contributed the tool. |
| Shelf   | The shared place where contributed tools are kept. |                                             |
