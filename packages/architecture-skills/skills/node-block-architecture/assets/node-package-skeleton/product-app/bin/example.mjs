#!/usr/bin/env node
// A committed entry for the `example` bin, so package managers can link it before the package
// is built; the program itself is the tsdown output in `dist/`.
const built = 'example.main.mjs';
try {
  await import(`../dist/${built}`);
} catch (error) {
  const notBuilt = error?.code === 'ERR_MODULE_NOT_FOUND' && String(error.message).includes(built);
  if (!notBuilt) throw error;
  process.stderr.write('The package is not built yet; run `pnpm build` in its folder.\n');
  process.exitCode = 1;
}
