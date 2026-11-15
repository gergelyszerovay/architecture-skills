import { composeExample } from './compose-example.composition.ts';

process.exitCode = composeExample({
  write: (text) => {
    process.stdout.write(text);
  },
  writeError: (text) => {
    process.stderr.write(text);
  },
})(process.argv.slice(2));
