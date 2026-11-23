// tests/ts-loader.mjs
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const HOOK_CODE = `
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (
    process.env.ATRIL_TEST_MODE === '1' &&
    (specifier.endsWith('/lib/supabase') || specifier.endsWith('/lib/supabase.ts'))
  ) {
    const mockUrl = new URL('./supabase-test-db.ts', '${pathToFileURL(path.resolve('tests/ts-loader.mjs')).href}').href;
    return { url: mockUrl, shortCircuit: true };
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentPath = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd();
    const candidateBase = path.resolve(parentPath, specifier);
    for (const ext of ['', '.ts', '.tsx', '.js', '.mjs']) {
      const full = candidateBase + ext;
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return { url: pathToFileURL(full).href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('/types/atril.types.ts')) {
    const filePath = fileURLToPath(url);
    const raw = fs.readFileSync(filePath, 'utf8');
    const names = [];
    const regex = /export\\s+(?:type|interface)\\s+([A-Za-z0-9_]+)/g;
    let m;
    while ((m = regex.exec(raw)) !== null) {
      names.push(m[1]);
    }
    const stubs = names.map((n) => \`export const \${n} = undefined;\`).join('\\n');
    return {
      format: 'module',
      shortCircuit: true,
      source: stubs,
    };
  }
  return nextLoad(url, context);
}
`;

register(`data:text/javascript;base64,${Buffer.from(HOOK_CODE).toString('base64')}`, pathToFileURL('./'));
