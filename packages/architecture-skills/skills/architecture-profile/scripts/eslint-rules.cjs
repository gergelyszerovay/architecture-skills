// ESLint flat-config entries built from a bound architecture profile. Only rules the
// profile marks `Enforced by: eslint` are built; the others belong to other tools. A frozen
// package (`architecture.frozen`) gets no rule from any builder. Beside
// them, `tsdocSyntaxPlugin` wraps `tsdoc/syntax` so a TSDoc row citation passes.

const parameters = (rule) =>
  Object.fromEntries(
    (rule.parameters === 'none' ? '' : rule.parameters)
      .split(';')
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        const at = pair.indexOf('=');
        return [pair.slice(0, at).trim(), pair.slice(at + 1).trim()];
      }),
  );
const listOf = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

function message(profile, rule, detail) {
  const cited = rule.decisions.map((id) => `${id}: ${profile.decisionText.get(id)}`).join(' ');
  return `Profile rule ${rule.rule} (${rule.decisions.join(', ')}). ${detail} ${cited}`.trim();
}

/**
 * Builds one flat-config entry per block that a `no-symbol` rule restricts. Each entry
 * sets `no-restricted-syntax` to the base selectors plus the block's own, because a
 * later entry setting the same rule replaces its options instead of merging them.
 * @param profile - A profile from `loadBoundProfile`.
 * @param {{ base?: unknown[], severity?: 'error' | 'warn' }} [options] - `base`: the
 *   `no-restricted-syntax` entries the package applies to every file.
 * @returns ESLint flat-config entries, to place after the package's general rules.
 */
function buildRestrictedSyntax(profile, { base = [], severity = 'error' } = {}) {
  if (profile.frozen !== undefined) return [];
  const byBlock = new Map();
  for (const rule of profile.structuralRules) {
    if (rule.rule !== 'no-symbol' || rule.enforcedBy !== 'eslint') continue;
    const { symbols, blocks } = parameters(rule);
    for (const block of listOf(blocks)) {
      if (!profile.blocks.some((known) => known.name === block)) {
        throw new Error(`no-symbol names an unknown block "${block}".`);
      }
      const selectors = byBlock.get(block) ?? [];
      for (const symbol of listOf(symbols)) {
        selectors.push({
          selector: `CallExpression:matches([callee.name="${symbol}"], [callee.property.name="${symbol}"])`,
          message: message(profile, rule, `.${block}.ts blocks don't call ${symbol}.`),
        });
      }
      byBlock.set(block, selectors);
    }
  }
  return [...byBlock].map(([block, selectors]) => ({
    name: `architecture-profile/no-symbol/${block}`,
    files: [`**/*.${block}.ts`],
    rules: { 'no-restricted-syntax': [severity, ...base, ...selectors] },
  }));
}

/**
 * The `max-facades-per-component` rule (constitution D10, D47) as an ESLint rule object: a
 * class decorated with `@Component` or `@Directive` injects at most `max` facades, counted
 * as `inject(X)` calls in its body and constructor whose argument's name ends in `Facade`.
 * Facades consumed through a parent's inputs are not injections and are not counted.
 */
function maxFacadesRule(profile, rule) {
  const max = Number(parameters(rule).max ?? '1');
  return {
    meta: {
      type: 'problem',
      docs: { description: `A component consumes at most ${max} facade(s).` },
      schema: [],
      messages: {
        tooMany: message(
          profile,
          rule,
          `{{name}} injects {{count}} facades ({{facades}}); a component consumes at most ${max}.`,
        ),
      },
    },
    create(context) {
      const isComponent = (node) =>
        (node.decorators ?? []).some(
          (decorator) =>
            decorator.expression.type === 'CallExpression' &&
            decorator.expression.callee.type === 'Identifier' &&
            ['Component', 'Directive'].includes(decorator.expression.callee.name),
        );
      return {
        ClassDeclaration(node) {
          if (!isComponent(node)) return;
          const facades = [];
          const visit = (value) => {
            if (value === null || typeof value !== 'object') return;
            if (Array.isArray(value)) {
              value.forEach(visit);
              return;
            }
            if (value.type === 'ClassDeclaration' && value !== node) return;
            if (
              value.type === 'CallExpression' &&
              value.callee.type === 'Identifier' &&
              value.callee.name === 'inject' &&
              value.arguments[0]?.type === 'Identifier' &&
              value.arguments[0].name.endsWith('Facade')
            ) {
              facades.push(value.arguments[0].name);
            }
            for (const key of Object.keys(value)) {
              if (key === 'parent' || key === 'loc' || key === 'range') continue;
              visit(value[key]);
            }
          };
          visit(node.body);
          const distinct = [...new Set(facades)];
          if (distinct.length > max) {
            context.report({
              node: node.id ?? node,
              messageId: 'tooMany',
              data: {
                name: node.id?.name ?? 'the component',
                count: String(distinct.length),
                facades: distinct.join(', '),
              },
            });
          }
        },
      };
    },
  };
}

/**
 * The `providers-only` rule (an Angular `.providers.ts` block) as an ESLint rule object: the
 * file holds provider wiring and nothing it could run. Its top level is imports, types and
 * exported `const` declarations whose value is an array of providers or
 * `makeEnvironmentProviders([...])`. The only calls are `makeEnvironmentProviders` (as such a
 * value), `provideEnvironmentInitializer` (as an element of the array) and `inject`; the only
 * functions are arrow functions with an expression body, as a provider's `useFactory` or as
 * the initializer `provideEnvironmentInitializer` takes, and `inject` is called only inside
 * one; nothing is written (no assignment, `++`/`--` or `delete`). So the block may resolve what
 * it wires and read a member of it, never call it or change it.
 */
function providersOnlyRule(profile, rule) {
  const WRAPPER = 'makeEnvironmentProviders';
  const INITIALIZER = 'provideEnvironmentInitializer';
  const calleeName = (node) =>
    node.type === 'CallExpression' && node.callee.type === 'Identifier'
      ? node.callee.name
      : undefined;
  // A function a provider may hold: a `useFactory` value or the initializer's argument.
  const isFactorySlot = (fn) => {
    const parent = fn.parent;
    if (parent?.type === 'Property' && parent.value === fn) {
      return (
        !parent.computed && parent.key.type === 'Identifier' && parent.key.name === 'useFactory'
      );
    }
    return calleeName(parent ?? {}) === INITIALIZER && parent.arguments[0] === fn;
  };
  const insideFactory = (node) => {
    for (let at = node.parent; at; at = at.parent) {
      if (at.type === 'ArrowFunctionExpression') return isFactorySlot(at);
    }
    return false;
  };
  // A value a top-level declaration may hold: an array, or `makeEnvironmentProviders([...])`.
  const isProvidersValue = (init) =>
    init?.type === 'ArrayExpression' ||
    (calleeName(init ?? {}) === WRAPPER &&
      init.arguments.length === 1 &&
      init.arguments[0].type === 'ArrayExpression');
  const isType = (node) =>
    node?.type === 'TSTypeAliasDeclaration' || node?.type === 'TSInterfaceDeclaration';
  return {
    meta: {
      type: 'problem',
      docs: { description: 'A providers block wires providers and calls nothing it wires.' },
      schema: [],
      messages: {
        statement: message(
          profile,
          rule,
          'A providers block holds imports, types and exported provider arrays (or makeEnvironmentProviders([...])) only; found a {{what}}.',
        ),
        call: message(
          profile,
          rule,
          `A providers block calls only ${WRAPPER}, ${INITIALIZER} and inject (inside a factory); found a call to {{callee}}.`,
        ),
        fn: message(
          profile,
          rule,
          `A providers block holds no function body: a function is an arrow with an expression body, as a useFactory or the initializer ${INITIALIZER} takes.`,
        ),
        write: message(
          profile,
          rule,
          'A providers block writes nothing: found an {{write}} (an assignment, ++/-- or delete).',
        ),
      },
    },
    create(context) {
      return {
        Program(program) {
          for (const statement of program.body) {
            if (statement.type === 'ImportDeclaration' || isType(statement)) continue;
            const declaration =
              statement.type === 'ExportNamedDeclaration' ? statement.declaration : null;
            if (isType(declaration)) continue;
            const ok =
              declaration?.type === 'VariableDeclaration' &&
              declaration.kind === 'const' &&
              declaration.declarations.every((declarator) => isProvidersValue(declarator.init));
            if (!ok) {
              context.report({
                node: statement,
                messageId: 'statement',
                data: { what: (declaration ?? statement).type },
              });
            }
          }
        },
        'CallExpression, NewExpression'(node) {
          const name = calleeName(node);
          const allowed =
            (name === WRAPPER && isProvidersValue(node)) ||
            (name === INITIALIZER && node.parent?.type === 'ArrayExpression') ||
            (name === 'inject' && insideFactory(node));
          if (allowed) return;
          const callee = context.sourceCode.getText(node.callee);
          context.report({
            node,
            messageId: 'call',
            data: { callee: node.type === 'NewExpression' ? `new ${callee}` : callee },
          });
        },
        'FunctionDeclaration, FunctionExpression'(node) {
          context.report({ node, messageId: 'fn' });
        },
        ArrowFunctionExpression(node) {
          if (node.body.type === 'BlockStatement' || !isFactorySlot(node)) {
            context.report({ node, messageId: 'fn' });
          }
        },
        'AssignmentExpression, UpdateExpression, UnaryExpression[operator="delete"]'(node) {
          context.report({ node, messageId: 'write', data: { write: node.type } });
        },
      };
    },
  };
}

/**
 * The `entry-only` rule (a Node `.entry.ts` block) as an ESLint rule object: the file selects
 * published names and holds nothing else. Every top-level statement is an `export { … } from`
 * or `export type { … } from` declaration; an `export *`, a declaration, a local export and any
 * other statement is a finding.
 */
function entryOnlyRule(profile, rule) {
  return {
    meta: {
      type: 'problem',
      schema: [],
      messages: {
        statement: message(
          profile,
          rule,
          'An entry holds only `export { … } from` declarations; found a {{what}}.',
        ),
        star: message(
          profile,
          rule,
          'An entry names what it publishes: `export *` is not allowed, list the names.',
        ),
      },
    },
    create(context) {
      return {
        Program(program) {
          for (const statement of program.body) {
            if (statement.type === 'ExportAllDeclaration') {
              context.report({ node: statement, messageId: 'star' });
            } else if (
              statement.type !== 'ExportNamedDeclaration' ||
              statement.source == null ||
              statement.declaration != null
            ) {
              context.report({
                node: statement,
                messageId: 'statement',
                data: { what: statement.declaration?.type ?? statement.type },
              });
            }
          }
        },
      };
    },
  };
}

// The ESLint rule factories, by the name of the profile rule each implements.
const PLUGIN_RULES = {
  'max-facades-per-component': maxFacadesRule,
  'providers-only': providersOnlyRule,
  'entry-only': entryOnlyRule,
};

// The Enforced by values whose rows each factory builds: `max-facades-per-component` is
// architecture-check's (its `facades` rule) since plan 0121, and ESLint is its fallback for a
// project that does not run `reviewer2-check`.
const ESLINT_OF = {
  'max-facades-per-component': ['eslint', 'architecture-check'],
  'providers-only': ['eslint'],
  'entry-only': ['eslint'],
};

const plugins = new Map();

/**
 * The one `architecture-profile` plugin object for a profile, with a rule for every profile
 * rule of `PLUGIN_RULES` marked with a value `ESLINT_OF` lists for it (`eslint`, or
 * `architecture-check` for `max-facades-per-component`, whose fallback this is). Every entry this module builds uses
 * the same object, because ESLint refuses two different objects under one plugin name for a
 * file; a profile loaded twice (one `loadBoundProfile` call per builder) gets it too.
 * @param profile - A profile from `loadBoundProfile`.
 * @returns The plugin object.
 */
function pluginOf(profile) {
  const key = `${profile.skillDir}|${profile.name}|${profile.version}`;
  let plugin = plugins.get(key);
  if (plugin === undefined) {
    const rules = {};
    for (const rule of profile.structuralRules) {
      const build = PLUGIN_RULES[rule.rule];
      if (build !== undefined && ESLINT_OF[rule.rule].includes(rule.enforcedBy)) {
        rules[rule.rule] = build(profile, rule);
      }
    }
    plugin = { rules };
    plugins.set(key, plugin);
  }
  return plugin;
}

/**
 * Builds the flat-config entry for the profile's `max-facades-per-component` rule when it
 * is marked `Enforced by: eslint`, or `architecture-check` for a project that does not run
 * `reviewer2-check` (the fallback): a plugin named `architecture-profile` with the rule, on
 * the files of the blocks that are components. Returns no entry when the profile has no
 * such rule.
 * @param profile - A profile from `loadBoundProfile`.
 * @param {{ files?: string[], severity?: 'error' | 'warn' }} [options] - `files`: the
 *   globs to lint (default: every `.ts` file); `severity`: a package's override while it
 *   adopts the rule (the package doc's Rule Exceptions table records why).
 * @returns ESLint flat-config entries.
 */
function buildMaxFacades(profile, { files = ['**/*.ts'], severity = 'error' } = {}) {
  if (profile.frozen !== undefined) return [];
  const plugin = pluginOf(profile);
  if (plugin.rules['max-facades-per-component'] === undefined) return [];
  return [
    {
      name: 'architecture-profile/max-facades-per-component',
      files,
      plugins: { 'architecture-profile': plugin },
      rules: { 'architecture-profile/max-facades-per-component': severity },
    },
  ];
}

/**
 * Builds the flat-config entries for the profile's `providers-only` rule when it is marked
 * `Enforced by: eslint`: the plugin rule `architecture-profile/providers-only` on the files of
 * each block its `blocks` parameter names (`**` + `/*.providers.ts`). Returns no entry when the
 * profile has no such rule.
 * @param profile - A profile from `loadBoundProfile`.
 * @param {{ severity?: 'error' | 'warn' }} [options] - `severity`: a package's override while
 *   it adopts the rule (the package doc's Rule Exceptions table records why).
 * @returns ESLint flat-config entries.
 */
function buildProvidersOnly(profile, { severity = 'error' } = {}) {
  if (profile.frozen !== undefined) return [];
  const rule = profile.structuralRules.find(
    (candidate) => candidate.rule === 'providers-only' && candidate.enforcedBy === 'eslint',
  );
  if (rule === undefined) return [];
  const plugin = pluginOf(profile);
  return listOf(parameters(rule).blocks).map((block) => {
    if (!profile.blocks.some((known) => known.name === block)) {
      throw new Error(`providers-only names an unknown block "${block}".`);
    }
    return {
      name: `architecture-profile/providers-only/${block}`,
      files: [`**/*.${block}.ts`],
      plugins: { 'architecture-profile': plugin },
      rules: { 'architecture-profile/providers-only': severity },
    };
  });
}

/**
 * Builds the flat-config entries for the profile's `entry-only` rule when it is marked
 * `Enforced by: eslint`: the plugin rule `architecture-profile/entry-only` on the files of each
 * block its `blocks` parameter names (`**` + `/*.entry.ts`). Returns no entry when the profile
 * has no such rule.
 * @param profile - A profile from `loadBoundProfile`.
 * @param {{ severity?: 'error' | 'warn' }} [options] - `severity`: a package's override while
 *   it adopts the rule (the package doc's Rule Exceptions table records why).
 * @returns ESLint flat-config entries.
 */
function buildEntryOnly(profile, { severity = 'error' } = {}) {
  if (profile.frozen !== undefined) return [];
  const rule = profile.structuralRules.find(
    (candidate) => candidate.rule === 'entry-only' && candidate.enforcedBy === 'eslint',
  );
  if (rule === undefined) return [];
  const plugin = pluginOf(profile);
  return listOf(parameters(rule).blocks).map((block) => {
    if (!profile.blocks.some((known) => known.name === block)) {
      throw new Error(`entry-only names an unknown block "${block}".`);
    }
    return {
      name: `architecture-profile/entry-only/${block}`,
      files: [`**/*.${block}.ts`],
      plugins: { 'architecture-profile': plugin },
      rules: { 'architecture-profile/entry-only': severity },
    };
  });
}

// The messages `tsdoc/syntax` gives a `{@link}` whose target starts with `/`: with a `#` the
// parser reads the path as an import path that "must not start with /", without one it misses
// the `#`. A row citation (`{@link /products/reviewer2/layered-docs/2.reviewer2.constitution.md#D21 | D21}`,
// the citations skill, "Rows") is such a target.
const ROOT_LINK_MESSAGES = new Set([
  'tsdoc-reference-malformed-import-path',
  'tsdoc-reference-missing-hash',
]);
// A repository-root path to a file with an extension, and an optional fragment.
const ROOT_LINK_TARGET = /^\/[^\s#|{}]+\.[A-Za-z0-9]+(?:#[A-Za-z0-9][\w.-]*)?$/;

/**
 * Whether the TSDoc message at `start` reports the target of a `{@link}` that is a
 * repository-root path (`/<path>.<extension>` with an optional `#<key>`), followed by nothing or
 * by one `| <text>` before the tag's closing brace.
 * @param {string} text - The source text.
 * @param {number} start - The offset the message starts at.
 * @returns {boolean} `true` for a root link's target.
 */
function isRootLinkTarget(text, start) {
  if (text[start] !== '/') return false;
  // Back over the white space and a continuation line's `*` to the tag.
  let at = start;
  while (at > 0 && /[\s*]/.test(text[at - 1])) at -= 1;
  if (at === start || !text.slice(0, at).endsWith('{@link')) return false;
  const target = /^[^\s|}]+/.exec(text.slice(start))?.[0] ?? '';
  // The rest of the tag is nothing, or one `| text`, then the closing brace: a second target,
  // a second `|` or text without one is still the parser's to report.
  const rest = text.slice(start + target.length);
  return ROOT_LINK_TARGET.test(target) && /^\s*(?:\|[^|{}]*)?\}/.test(rest);
}

const tsdocPlugins = new WeakMap();

/**
 * The `architecture-skills` plugin for a package's `eslint-plugin-tsdoc`: its rule
 * `tsdoc-syntax` is `tsdoc/syntax` (the same parser and the package's `tsdoc.json`) and reports
 * every message `tsdoc/syntax` reports except the one on a `{@link}` whose target is a
 * repository-root path, `/<path>.<extension>` with an optional `#<key>`: the parser rejects
 * every target with a leading `/`, and `@microsoft/tsdoc` has no setting to silence one message.
 * The plugin is passed in, so this module needs no dependency; one object per plugin, as ESLint
 * requires one object under a plugin name for a file.
 * @param {{ rules: { syntax: object } }} tsdoc - The package's `eslint-plugin-tsdoc`.
 * @returns {{ rules: { 'tsdoc-syntax': object } }} The plugin, to register as
 *   `architecture-skills` and enable as `'architecture-skills/tsdoc-syntax': 'error'`.
 */
function tsdocSyntaxPlugin(tsdoc) {
  let plugin = tsdocPlugins.get(tsdoc);
  if (plugin !== undefined) return plugin;
  const syntax = tsdoc.rules.syntax;
  plugin = {
    rules: {
      'tsdoc-syntax': {
        meta: {
          ...syntax.meta,
          docs: {
            ...syntax.meta.docs,
            description:
              'tsdoc/syntax, accepting a {@link} to a repository-root path (/<path>.<extension>#<key>)',
          },
        },
        create(context) {
          const sourceCode = context.sourceCode ?? context.getSourceCode();
          // ESLint freezes the context, so the rule gets an object that inherits it and only
          // replaces `report`.
          const filtered = Object.create(context, {
            report: {
              value(descriptor) {
                if (
                  ROOT_LINK_MESSAGES.has(descriptor.messageId) &&
                  descriptor.loc?.start !== undefined &&
                  isRootLinkTarget(
                    sourceCode.text,
                    sourceCode.getIndexFromLoc(descriptor.loc.start),
                  )
                ) {
                  return;
                }
                context.report(descriptor);
              },
            },
          });
          return syntax.create(filtered);
        },
      },
    },
  };
  tsdocPlugins.set(tsdoc, plugin);
  return plugin;
}

module.exports = {
  buildRestrictedSyntax,
  buildMaxFacades,
  buildProvidersOnly,
  buildEntryOnly,
  tsdocSyntaxPlugin,
};
