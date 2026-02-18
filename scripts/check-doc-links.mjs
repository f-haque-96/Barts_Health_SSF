import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist']);
const MARKDOWN_LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function isExternal(link) {
  return (
    link.startsWith('http://') ||
    link.startsWith('https://') ||
    link.startsWith('mailto:') ||
    link.startsWith('#')
  );
}

function normalizeLinkTarget(link) {
  return link.split('#')[0].trim();
}

async function main() {
  const mdFiles = await walk(ROOT);
  const missing = [];

  for (const file of mdFiles) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      MARKDOWN_LINK_RE.lastIndex = 0;
      let match;

      while ((match = MARKDOWN_LINK_RE.exec(line)) !== null) {
        const rawLink = match[1];
        if (!rawLink || isExternal(rawLink)) continue;

        const target = normalizeLinkTarget(rawLink);
        if (!target) continue;

        const resolved = path.resolve(path.dirname(file), target);
        try {
          await fs.access(resolved);
        } catch {
          missing.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            link: rawLink,
          });
        }
      }
    }
  }

  if (missing.length > 0) {
    console.error(`\n❌ Missing local markdown links detected: ${missing.length}\n`);
    for (const issue of missing) {
      console.error(`- ${issue.file}:${issue.line} -> ${issue.link}`);
    }
    process.exit(1);
  }

  console.log(`✅ Markdown link check passed (${mdFiles.length} markdown files scanned).`);
}

main().catch((err) => {
  console.error('❌ Failed to run markdown link check:', err);
  process.exit(1);
});
