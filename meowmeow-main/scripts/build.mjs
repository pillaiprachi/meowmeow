import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build, context} from 'esbuild';
import {routes} from '../src/routes.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, 'dist');
const serving = process.argv.includes('--serve');

if (dirname(output) !== root) throw new Error('Build output must be inside the project.');
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
await cp(join(root, 'public'), output, {recursive: true});

const template = await readFile(join(root, 'index.html'), 'utf8');
for (const [path, {title}] of Object.entries(routes)) {
  const slug = path.slice(1);
  const file = slug ? `${slug}.html` : 'index.html';
  const destination = join(output, file);
  const escapedTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
  const html = template.replace(/<title>.*<\/title>/, `<title>${escapedTitle}</title>`);
  await writeFile(destination, html);
  if (serving && slug) {
    // Serve clean routes directly. esbuild's directory redirect drops the query string.
    await writeFile(join(output, slug), html);
  }
}

const options = {
  absWorkingDir: root,
  entryPoints: {app: 'src/main.jsx'},
  outdir: join(output, 'assets'),
  bundle: true,
  format: 'esm',
  splitting: true,
  jsx: 'automatic',
  target: 'es2022',
  loader: {'.woff2': 'file'},
  assetNames: 'media/[name]-[hash]',
  chunkNames: 'chunks/[name]-[hash]',
  legalComments: 'linked',
  minify: !serving,
  sourcemap: serving ? 'inline' : false,
  logLevel: 'info'
};

if (serving) {
  const app = await context(options);
  await app.watch();
  const port = Number(process.env.PORT || 5173);
  await app.serve({servedir: output, host: '127.0.0.1', port});
} else {
  await build(options);
}
