#!/usr/bin/env node
// Kiểm rule tự động cho Fortune-Hunter (chạy được trên Windows/macOS/Linux, không cần grep).
// Dùng:  node scripts/check-rules.mjs          -> kiểm mã nguồn (G2)
//        node scripts/check-rules.mjs --links  -> kiểm link tương đối trong .agent/*.md
// Thoát mã 1 nếu có vi phạm. Cho phép ngoại lệ trên dòng bằng comment:  // allow:<RULE-ID> <lý do>

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const posix = (p) => p.split(sep).join('/');
const rel = (p) => posix(relative(ROOT, p));

function walk(dir, exts, skip = ['node_modules', 'dist', '.git']) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (skip.includes(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, exts, skip));
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

// ---------- Kiểm link trong .agent ----------
if (process.argv.includes('--links')) {
  const files = walk(join(ROOT, '.agent'), ['.md']);
  const re = /\]\(([^)\s]+)\)/g;
  let bad = 0;
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(text))) {
      const target = m[1];
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = target.split('#')[0];
      if (!path) continue;
      if (!existsSync(resolve(dirname(f), path))) {
        console.error(`LINK-HỎNG  ${rel(f)} -> ${target}`);
        bad++;
      }
    }
  }
  console.log(bad ? `\n${bad} link hỏng.` : `OK: ${files.length} file .md, mọi link tồn tại.`);
  process.exit(bad ? 1 : 0);
}

// ---------- Kiểm mã nguồn ----------
const SRC = join(ROOT, 'src');
const files = walk(SRC, ['.ts', '.js']).filter((f) => !/\.d\.ts$/.test(f));
const violations = [];

const PURE = [/^src\/shared\//, /^src\/services\//, /^src\/modes\/[^/]+\/logic\//, /^src\/core\/Random\.ts$/];
const isPure = (r) => PURE.some((re) => re.test(r));
const isTest = (r) => /__tests__\/|\.test\.ts$/.test(r);

const lineRules = [
  {
    id: 'R01-purity',
    applies: (r) => isPure(r),
    re: /from\s+['"](three(\/[^'"]*)?|gsap(\/[^'"]*)?)['"]|import\s+['"]three['"]/,
    msg: 'Vùng thuần không được import three/gsap (R01 §2).',
  },
  {
    id: 'R04-rng',
    applies: (r) => isPure(r) && !isTest(r),
    re: /Math\.random\s*\(/,
    msg: 'Cấm Math.random trong vùng thuần; dùng RandomSource (R04 §2).',
  },
  {
    id: 'R06-xss',
    applies: () => true,
    re: /\.innerHTML\s*[+]?=|\binsertAdjacentHTML\s*\(|dangerouslySetInnerHTML/,
    msg: 'Cấm innerHTML/insertAdjacentHTML; dùng textContent/createElement (R06 §2).',
  },
  {
    id: 'R02-any',
    applies: (r) => !isTest(r),
    re: /:\s*any\b|\bas\s+any\b|<any>|Array<any>/,
    msg: 'Cấm any; dùng unknown + type guard (R02 §1).',
  },
  {
    id: 'R06-secret',
    applies: () => true,
    re: /service_role|SUPABASE_SERVICE|sk-ant-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    msg: 'Nghi ngờ secret/khóa nhạy cảm trong mã nguồn (R06 §1).',
    noAllow: true,
  },
  {
    id: 'R03-newInUpdate',
    applies: (r) => /\/view\//.test(r) || /\/core\//.test(r),
    // heuristic nhẹ: cảnh báo new Vector3/Quaternion/Matrix4 nằm trong hàm tên update()
    re: null,
  },
];

for (const file of files) {
  const r = rel(file);
  const lines = readFileSync(file, 'utf8').split('\n');

  // Kiểm soát Mode.ts phải có dispose()
  if (/modes\/.*Mode\.ts$/.test(r) && !lines.some((l) => /dispose\s*\(/.test(l))) {
    violations.push({ file: r, line: 1, rule: 'R01-dispose', msg: 'Mode phải có phương thức dispose() (R01 §5).' });
  }

  let inUpdate = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const n = i + 1;
    // Bỏ qua dòng comment thuần
    if (/^\s*(\/\/|\/\*|\*)/.test(raw)) continue;

    // Theo dõi phạm vi hàm update()
    if (/^\s*(public\s+|private\s+)?update\s*\(/.test(raw)) inUpdate = true;
    if (inUpdate && /^ {0,2}\}/.test(raw)) inUpdate = false;

    if (inUpdate && /new\s+(Vector3|Quaternion|Matrix4|Color)\s*\(/.test(raw)) {
      if (!raw.includes('// allow:R03-newInUpdate')) {
        violations.push({
          file: r,
          line: n,
          rule: 'R03-newInUpdate',
          msg: 'Tránh "new Vector3/Quaternion/..." trong update(); tái sử dụng biến (R03 §2).',
          code: raw.trim(),
        });
      }
    }

    for (const rule of lineRules) {
      if (!rule.re || !rule.applies(r)) continue;
      if (rule.re.test(raw)) {
        if (!rule.noAllow && raw.includes(`// allow:${rule.id}`)) continue;
        violations.push({ file: r, line: n, rule: rule.id, msg: rule.msg, code: raw.trim() });
      }
    }
  }
}

// ---------- Kiểm cấu hình an toàn ----------
// .env không được commit, phải nằm trong .gitignore
const gi = existsSync('.gitignore') ? readFileSync('.gitignore', 'utf8') : '';
if (!/^\.env/m.test(gi) && !/\/\.env/m.test(gi)) {
  violations.push({ file: '.gitignore', line: 1, rule: 'R06-env', msg: '.env* phải nằm trong .gitignore (R06 §1).' });
}

// Báo cáo
if (violations.length === 0) {
  console.log(`OK: ${files.length} file quét, 0 vi phạm rule.`);
  process.exit(0);
}

console.error(`\nPHÁT HIỆN ${violations.length} VI PHẠM RULE:\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.msg}`);
  if (v.code) console.error(`    > ${v.code}`);
}
console.error('\nSửa vi phạm hoặc gắn comment "// allow:<RULE-ID> <lý do>" nếu có lý do chính đáng.\n');
process.exit(1);
