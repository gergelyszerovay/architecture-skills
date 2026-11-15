# Spartan UI boilerplate

This is the pre-Reviewer Angular starter extracted from `apps/code-canvas-ng`, which
was later moved to `reviewer/frontend` in commit `ad0b979e`. The snapshot is from
commit `08e006a8`, after the local Spartan UI setup and before Foblex Flow or Reviewer
features were added.

It contains the Angular CLI 22.1.3 application shell, Tailwind CSS configuration,
Spartan's `nova` component configuration, and local Helm component sources under
`libs/ui/`. `package.json` and `angular.json` use the `spartan-ui-boilerplate` name.

Linting and formatting follow the skill's `references/linting.md`: `eslint.config.mjs`,
`.prettierrc.json`, `.prettierignore` (the vendor root) and `tsdoc.json`.

This directory is a skill asset, not a registered workspace package. Copy it into a
project or workspace before installing dependencies and running the Angular scripts.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open the address it prints in your browser. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

The unit tests run with the [Vitest](https://vitest.dev/) test runner in Vitest's browser mode,
in headless Chromium driven by Playwright, so a spec measures real layout, focus and scrolling
rather than jsdom's stand-ins. Install Chromium once:

```bash
pnpm exec playwright install chromium
```

Then run the tests:

```bash
ng test
```

To use a Chromium already installed instead, point `CHROME_BIN` at it; Angular's unit-test
builder launches that executable:

```bash
CHROME_BIN=/path/to/chromium ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
