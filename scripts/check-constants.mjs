// Checks the generated A40 constants before a build:
//   1. src/blog/a40-constants.generated.json is up to date with
//      content/a40/constants.yaml, scripts/a40_constants.py and
//      scripts/a40_geometry_results.json (same hash as the Python writer);
//   2. every {{placeholder}} in content/a40/*.md resolves (same code the
//      site uses, src/blog/a40Constants.ts), and none sit in frontmatter;
//   3. src/blog/roadmapData.ts loads (its k()/raw() calls resolve).
//
//   node scripts/check-constants.mjs        (runs first in `npm run build`)
//
// Exits non-zero with the post and placeholder name on failure.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const errors = [];

// 1. Staleness (mirrors source_hash() in scripts/a40_constants.py).
const generatedPath = path.join(root, 'src/blog/a40-constants.generated.json');
const sources = ['content/a40/constants.yaml', 'scripts/a40_constants.py', 'scripts/a40_geometry_results.json'];
const h = crypto.createHash('sha256');
for (const s of sources) {
  const p = path.join(root, s);
  h.update(Buffer.concat([Buffer.from(rel(p)), Buffer.from([0])]));
  if (fs.existsSync(p)) h.update(fs.readFileSync(p));
  h.update(Buffer.from([0]));
}
const want = h.digest('hex').slice(0, 16);
const have = fs.existsSync(generatedPath) ? JSON.parse(fs.readFileSync(generatedPath, 'utf8')).source_hash : undefined;
if (want !== have) {
  errors.push(`${rel(generatedPath)} is stale (hash ${have} != ${want}): run \`npm run constants\` and commit the result.`);
}

// 2 + 3. Placeholders, through the site's own substitution code.
const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});
let posts = 0;
let used = 0;
try {
  const { substituteConstants, placeholdersIn } = await server.ssrLoadModule('/src/blog/a40Constants.ts');
  const { parseFrontmatter } = await server.ssrLoadModule('/src/blog/frontmatter.ts');
  const dir = path.join(root, 'content/a40');
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const file = `content/a40/${f}`;
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { body } = parseFrontmatter(raw);
    const front = raw.slice(0, raw.length - body.length);
    for (const p of placeholdersIn(front)) errors.push(`${file}: ${p} in frontmatter (not substituted there)`);
    // Report every unknown name in the post, not just the first.
    for (const p of placeholdersIn(body)) {
      try {
        substituteConstants(p, file);
      } catch (err) {
        errors.push(err.message);
      }
    }
    used += placeholdersIn(body).length;
    posts++;
    try {
      const left = substituteConstants(body, file).match(/\{\{[^}]*\}\}/g);
      if (left) errors.push(`${file}: malformed placeholder ${left[0]}`);
    } catch {
      // already reported above, name by name
    }
  }
  try {
    await server.ssrLoadModule('/src/blog/roadmapData.ts');
  } catch (err) {
    errors.push(`src/blog/roadmapData.ts: ${err.message}`);
  }
} finally {
  await server.close();
}

if (errors.length) {
  console.error(`check-constants: ${errors.length} problem(s)\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`ok   A40 constants up to date; ${used} placeholders in ${posts} posts resolve`);
