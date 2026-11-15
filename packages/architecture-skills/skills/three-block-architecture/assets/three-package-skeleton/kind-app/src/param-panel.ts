// The param panel of a page that hosts an engine: plain DOM built from the engine's plain-data
// specs (`ParamSpec[]`, with range, enum, toggle and colour controls, `CommandSpec[]`, `ReadoutSpec[]`, `InputBindingSpec[]`), so it needs no
// framework and no three.js. It sends every change to `setParams`, follows the engine's own
// `paramsChanged` and `runningChanged` events, and shows the values the engine actually holds
// (clamped, made consistent) after each change.
import type { CommandSpec, InputBindingSpec, ParamSpec, ReadoutSpec } from '~libs/example-domain';

type Values = Readonly<Record<string, unknown>>;

/** What the panel needs of an engine: every `EffectEngine` fits, and a `CommandEngine` adds `dispatch`. */
export type PanelEngine = {
  setParams(patch: Record<string, unknown>): void;
  setRunning(running: boolean): void;
  on(type: 'paramsChanged', listener: (params: Values) => void): () => void;
  on(type: 'runningChanged', listener: (running: boolean) => void): () => void;
  snapshot(): { params: Values; running: boolean; state: unknown };
  dispatch?(command: string, argument?: string): void;
};

/** What the panel lists; every list is optional and absent means no section. */
export type ParamPanelSpecs = {
  params: readonly ParamSpec[];
  commands?: readonly CommandSpec[];
  readouts?: readonly ReadoutSpec[];
  bindings?: readonly InputBindingSpec[];
};

const READOUT_INTERVAL_MS = 250;

const STYLE = `
.param-panel { position: fixed; top: 12px; right: 12px; z-index: 1; width: 260px; max-height: calc(100% - 24px);
  overflow: auto; box-sizing: border-box; padding: 12px; border-radius: 8px; color: #e8e8ee;
  background: rgb(18 18 24 / 0.82); font: 13px/1.4 system-ui, sans-serif; }
.param-panel h2 { margin: 0 0 8px; font-size: 13px; font-weight: 600; }
.param-panel label { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; margin: 8px 0; }
.param-panel label > input[type='range'], .param-panel label > select { grid-column: 1 / -1; width: 100%; }
.param-panel label.toggle { grid-template-columns: auto 1fr; justify-content: start; }
.param-panel output { font-variant-numeric: tabular-nums; opacity: 0.8; }
.param-panel button { margin: 4px 4px 0 0; padding: 4px 10px; color: inherit; background: #333344; border: 0; border-radius: 4px; cursor: pointer; }
.param-panel .readouts { margin: 8px 0 0; }
.param-panel .readout { margin: 2px 0; }
.param-panel .bindings { margin: 8px 0 0; padding: 0; list-style: none; opacity: 0.8; }
.param-panel kbd { padding: 0 4px; border-radius: 3px; background: #333344; font: inherit; }
`;

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  init: Partial<HTMLElementTagNameMap[K]> = {},
  children: readonly (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), init);
  node.append(...children);
  return node;
}

/** Pluralises an English noun by the regular rules (`bunny` to `bunnies`, `hit` to `hits`). */
function plural(noun: string): string {
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(noun)) return `${noun}es`;
  return `${noun}s`;
}

/** A `count` reads `3 bunnies` (`1 bunny`; the label is the singular noun), a `text` reads `Mood: calm`. */
function formatReadout(spec: ReadoutSpec, value: unknown): string {
  if (spec.format === 'text') return `${spec.label}: ${typeof value === 'string' ? value : '–'}`;
  const count = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  return `${count} ${count === 1 ? spec.label : plural(spec.label)}`;
}

/** A control of the panel: how to show a value the engine holds. */
type Control = { show(value: unknown): void };

function rangeControl(
  spec: Extract<ParamSpec, { kind: 'range' }>,
  send: (value: number) => void,
): { node: HTMLElement; control: Control } {
  const input = element('input', {
    type: 'range',
    min: String(spec.min),
    max: String(spec.max),
    step: String(spec.step),
    value: String(spec.default),
  });
  const output = element('output', { textContent: String(spec.default) });
  input.addEventListener('input', () => send(Number(input.value)));
  const node = element('label', {}, [element('span', { textContent: spec.label }), output, input]);
  return {
    node,
    control: {
      show(value) {
        if (typeof value !== 'number') return;
        input.value = String(value);
        output.textContent = String(Math.round(value * 1000) / 1000);
      },
    },
  };
}

function enumControl(
  spec: Extract<ParamSpec, { kind: 'enum' }>,
  send: (value: string) => void,
): { node: HTMLElement; control: Control } {
  const select = element(
    'select',
    {},
    spec.options.map((option) =>
      element('option', { value: option.value, textContent: option.label }),
    ),
  );
  select.value = spec.default;
  select.addEventListener('change', () => send(select.value));
  const node = element('label', {}, [element('span', { textContent: spec.label }), select]);
  return {
    node,
    control: {
      show(value) {
        if (typeof value === 'string') select.value = value;
      },
    },
  };
}

function toggleControl(
  spec: Extract<ParamSpec, { kind: 'toggle' }>,
  send: (value: boolean) => void,
): { node: HTMLElement; control: Control } {
  const input = element('input', { type: 'checkbox', checked: spec.default });
  input.addEventListener('change', () => send(input.checked));
  const node = element('label', { className: 'toggle' }, [
    input,
    element('span', { textContent: spec.label }),
  ]);
  return {
    node,
    control: {
      show(value) {
        if (typeof value === 'boolean') input.checked = value;
      },
    },
  };
}

function colorControl(
  spec: Extract<ParamSpec, { kind: 'color' }>,
  send: (value: string) => void,
): { node: HTMLElement; control: Control } {
  const input = element('input', { type: 'color', value: spec.default });
  input.addEventListener('input', () => send(input.value));
  const node = element('label', {}, [element('span', { textContent: spec.label }), input]);
  return {
    node,
    control: {
      show(value) {
        if (typeof value === 'string') input.value = value;
      },
    },
  };
}

/** The control of one spec row, by its kind. */
function controlOf(
  spec: ParamSpec,
  send: (value: unknown) => void,
): { node: HTMLElement; control: Control } {
  switch (spec.kind) {
    case 'range':
      return rangeControl(spec, send);
    case 'enum':
      return enumControl(spec, send);
    case 'toggle':
      return toggleControl(spec, send);
    case 'color':
      return colorControl(spec, send);
  }
}

/**
 * Mounts the panel into `host` and returns the function that removes it and every listener.
 * The panel sets no state of its own: the engine's `snapshot()` is what every control shows.
 */
export function mountParamPanel(
  host: HTMLElement,
  engine: PanelEngine,
  specs: ParamPanelSpecs,
): () => void {
  const style = element('style', { textContent: STYLE });
  const panel = element('aside', { className: 'param-panel' }, [
    element('h2', { textContent: 'Parameters' }),
  ]);
  const controls = new Map<string, Control>();

  const showParams = (params: Values): void => {
    for (const [key, control] of controls) control.show(params[key]);
  };
  const send = (key: string, value: unknown): void => {
    engine.setParams({ [key]: value });
    showParams(engine.snapshot().params);
  };

  for (const spec of specs.params) {
    const built = controlOf(spec, (value) => send(spec.key, value));
    built.node.dataset['param'] = spec.key;
    built.node.dataset['group'] = spec.group;
    built.node.dataset['phase'] = spec.phase;
    controls.set(spec.key, built.control);
    panel.append(built.node);
  }

  const run = element('button', { type: 'button' });
  const showRunning = (running: boolean): void => {
    run.textContent = running ? 'Pause' : 'Run';
  };
  run.addEventListener('click', () => {
    engine.setRunning(!engine.snapshot().running);
    showRunning(engine.snapshot().running);
  });
  const buttons = element('div', {}, [run]);
  for (const command of specs.commands ?? []) {
    const button = element('button', {
      type: 'button',
      textContent: command.label,
      title: command.description ?? '',
    });
    button.dataset['command'] = command.key;
    // A command with an argument gets a choice of its options beside its button.
    const choice = command.argument
      ? element(
          'select',
          { title: command.argument.label },
          command.argument.options.map((option) =>
            element('option', { value: option.value, textContent: option.label }),
          ),
        )
      : undefined;
    button.addEventListener('click', () => engine.dispatch?.(command.key, choice?.value));
    buttons.append(...(choice ? [choice] : []), button);
  }
  panel.append(buttons);

  const readoutNodes = new Map<string, HTMLElement>();
  const readouts = element('div', { className: 'readouts' });
  for (const readout of specs.readouts ?? []) {
    const node = element('p', { className: 'readout' });
    node.dataset['readout'] = readout.key;
    readoutNodes.set(readout.key, node);
    readouts.append(node);
  }
  if (readoutNodes.size > 0) panel.append(readouts);
  const showReadouts = (): void => {
    const state = engine.snapshot().state;
    const values = typeof state === 'object' && state !== null ? (state as Values) : {};
    for (const readout of specs.readouts ?? []) {
      const node = readoutNodes.get(readout.key);
      if (node) node.textContent = formatReadout(readout, values[readout.key]);
    }
  };

  if ((specs.bindings ?? []).length > 0) {
    const list = element('ul', { className: 'bindings' });
    for (const binding of specs.bindings ?? []) {
      const keys = [...binding.keys, ...(binding.pointer ? [binding.pointer] : [])];
      list.append(
        element('li', {}, [
          ...keys.map((key) => element('kbd', { textContent: key })),
          ` ${binding.description}`,
        ]),
      );
    }
    panel.append(list);
  }

  showParams(engine.snapshot().params);
  showRunning(engine.snapshot().running);
  showReadouts();
  host.append(style, panel);

  const stops = [engine.on('paramsChanged', showParams), engine.on('runningChanged', showRunning)];
  const timer = readoutNodes.size > 0 ? setInterval(showReadouts, READOUT_INTERVAL_MS) : undefined;

  return () => {
    for (const stop of stops) stop();
    if (timer !== undefined) clearInterval(timer);
    panel.remove();
    style.remove();
  };
}
