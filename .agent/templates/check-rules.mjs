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
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  for (const rule of lineRules) {
    if (!rule.re || !rule.applies(r)) continue;
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return; // bỏ dòng comment
      if (!rule.noAllow && line.includes(`allow:${rule.id}`)) return; // ngoại lệ có chủ đích
      if (rule.re.test(line)) violations.push(`${r}:${i + 1}  [${rule.id}] ${rule.msg}`);
    });
  }

  // R03: new Vector3/Quaternion/Matrix4/Euler/Color trong thân update(...)
  if (/\/(view|core)\//.test(r) || /Mode\.ts$/.test(r)) {
    const text = lines.join('\n');
    const m = /\bupdate\s*\([^)]*\)\s*(?::\s*void\s*)?\{/.exec(text);
    if (m) {
      let depth = 0, i = m.index + m[0].length - 1, start = i;
      for (; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}' && --depth === 0) break;
      }
      const body = text.slice(start, i);
      const hit = /new\s+(Vector[234]|Quaternion|Matrix[34]|Euler|Color)\s*\(/.exec(body);
      if (hit && !body.includes('allow:R03-new')) {
        const lineNo = text.slice(0, start + hit.index).split('\n').length;
        violations.push(`${r}:${lineNo}  [R03-newInUpdate] Không new ${hit[1]} trong update(); tái sử dụng biến (R03 §2.7).`);
      }
    }
  }

  // R01: mỗi *Mode.ts phải có dispose( và exit(
  if (/modes\/[^/]+\/[A-Za-z]+Mode\.ts$/.test(r)) {
    const text = lines.join('\n');
    for (const fn of ['init', 'enter', 'update', 'exit', 'dispose']) {
      if (!new RegExp(`\\b${fn}\\s*\\(`).test(text)) violations.push(`${r}:1  [R01-lifecycle] Mode thiếu ${fn}() (R01 §5).`);
    }
  }

  // R01: hai mode không import lẫn nhau
  const m1 = /^src\/modes\/(tarot|divination)\//.exec(r);
  if (m1) {
    const other = m1[1] === 'tarot' ? 'divination' : 'tarot';
    lines.forEach((line, i) => {
      if (new RegExp(`from\\s+['"][^'"]*modes/${other}/`).test(line) || new RegExp(`from\\s+['"]\\.\\./${other}/`).test(line)) {
        violations.push(`${r}:${i + 1}  [R01-cross-mode] Mode ${m1[1]} không được import mode ${other} (R01 §3).`);
      }
    });
  }
}

// R06: .env phải nằm trong .gitignore
const gi = join(ROOT, '.gitignore');
if (existsSync(gi)) {
  const t = readFileSync(gi, 'utf8');
  if (!/^\s*\.env(\*|\.local|\b)/m.test(t)) violations.push('.gitignore:1  [R06-env] .gitignore chưa loại trừ .env (R06 §1).');
} else {
  violations.push('.gitignore:1  [R06-env] Thiếu .gitignore.');
}

if (!existsSync(SRC)) console.warn('Cảnh báo: chưa có thư mục src/, chỉ kiểm .gitignore.');

if (violations.length) {
  console.error(violations.join('\n'));
  console.error(`\n${violations.length} vi phạm rule. Sửa hoặc thêm ngoại lệ có lý do (// allow:<RULE-ID> <lý do>).`);
  process.exit(1);
}
console.log(`OK: ${files.length} file đã kiểm, 0 vi phạm.`);
