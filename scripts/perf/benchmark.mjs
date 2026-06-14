#!/usr/bin/env node
/**
 * Benchmark VALEN build targets and write JSON + markdown summaries.
 * Usage: node scripts/build/benchmark.mjs [--quick]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const QUICK = process.argv.includes('--quick');

const TARGETS = QUICK
  ? [{ name: 'backend', cmd: 'pnpm', args: ['--filter', 'backend', 'run', 'build'] }]
  : [
      { name: 'backend', cmd: 'pnpm', args: ['--filter', 'backend', 'run', 'build'] },
      { name: 'frontend', cmd: 'pnpm', args: ['--filter', 'frontend', 'run', 'build'] },
      { name: 'all', cmd: 'pnpm', args: ['run', 'build'] },
    ];

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const child = spawn(cmd, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      const durationMs = Math.round(performance.now() - start);
      resolve({ code, durationMs, stdout, stderr });
    });
    child.on('error', reject);
  });
}

function parsePhases(output) {
  const phases = {};
  if (/Compiled successfully/i.test(output)) {
    const m = output.match(/Compiled successfully in ([\d.]+)(s|min)/i);
    if (m) phases.nextCompile = m[0];
  }
  if (/Linting and checking validity of types/i.test(output)) {
    phases.nextTypeAndLint = 'present';
  }
  if (/Generating static pages/i.test(output)) {
    phases.nextStaticGen = 'present';
  }
  if (/nest build/i.test(output) || /backend@/.test(output)) {
    phases.nestBuild = 'present';
  }
  return phases;
}

async function main() {
  const results = [];
  console.log(`[benchmark] root=${ROOT} quick=${QUICK}`);

  for (const target of TARGETS) {
    console.log(`[benchmark] running ${target.name}...`);
    const result = await run(target.cmd, target.args);
    results.push({
      target: target.name,
      exitCode: result.code,
      durationMs: result.durationMs,
      durationSec: +(result.durationMs / 1000).toFixed(1),
      phases: parsePhases(result.stdout + result.stderr),
      ok: result.code === 0,
    });
    console.log(`[benchmark] ${target.name}: ${result.durationMs}ms exit=${result.code}`);
  }

  const outDir = path.join(ROOT, 'logs');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outDir, `benchmark-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ at: new Date().toISOString(), results }, null, 2));

  const mdPath = path.join(ROOT, 'docs/build-performance-report.md');
  const lines = [
    '# VALEN Build Performance Report (Baseline)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '| Target | Duration (s) | Exit | Notes |',
    '|--------|-------------:|-----:|-------|',
    ...results.map((r) => `| ${r.target} | ${r.durationSec} | ${r.exitCode} | ${JSON.stringify(r.phases)} |`),
    '',
    'Raw JSON: `' + path.relative(ROOT, jsonPath) + '`',
    '',
    '## Observed bottlenecks',
    '',
    '- Frontend: Next.js webpack compile + typecheck/lint gate + static page generation (35 routes).',
    '- Backend: NestJS `nest build` TypeScript emit + decorator metadata.',
    '- Monorepo: `pnpm install` on WSL `/mnt/d` is slow due to cross-filesystem I/O.',
    '- Frontend prebuild: manifest sync copies 4 JSON files every build.',
    '',
  ];
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, lines.join('\n'));
  console.log(`[benchmark] wrote ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
