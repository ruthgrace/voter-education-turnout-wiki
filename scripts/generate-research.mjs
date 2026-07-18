// Generates the Research section pages and wires "Key Research" backlinks into
// each topic page. Run from the repo root: `node scripts/generate-research.mjs`
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAPERS, TOPIC_LABELS, THEMES } from './papers-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'src', 'content', 'docs');
const RESEARCH = join(DOCS, 'research');

// Must match `base` in astro.config.mjs (GitHub Pages project subpath).
const BASE = '/voter-education-turnout-wiki';

const y = (v) => JSON.stringify(v); // JSON strings are valid YAML scalars

function firstSentence(text) {
  const m = text.match(/^(.*?[.!?])\s/);
  let s = m ? m[1] : text;
  if (s.length > 175) s = s.slice(0, 172).trimEnd() + '…';
  return s;
}

// 1) Validate every contribution topic points at a real slug.
const validTopics = new Set(Object.keys(TOPIC_LABELS));
const slugs = new Set();
for (const p of PAPERS) {
  if (slugs.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
  slugs.add(p.slug);
  for (const c of p.contributions) {
    if (!validTopics.has(c.topic)) throw new Error(`Bad topic "${c.topic}" in ${p.slug}`);
  }
}

// 2) Write one page per paper.
mkdirSync(RESEARCH, { recursive: true });
for (const p of PAPERS) {
  const contribs = p.contributions
    .map((c) => `- [${TOPIC_LABELS[c.topic]}](${BASE}/${c.topic}/) — ${c.note}`)
    .join('\n');
  const body = `---
title: ${y(p.title)}
description: ${y(firstSentence(p.summary))}
sidebar:
  label: ${y(p.short)}
  order: 2
---

> ${p.citation}

**Source:** [View publication ↗](${p.url}) · Published ${p.year}

${p.summary}

## Contributions to this wiki

${contribs}
`;
  writeFileSync(join(RESEARCH, `${p.slug}.mdx`), body);
}

// 3) Write the research overview grouped by theme.
const byTheme = new Map(THEMES.map((t) => [t, []]));
for (const p of PAPERS) byTheme.get(p.theme).push(p);
let themeSections = '';
for (const t of THEMES) {
  const rows = byTheme
    .get(t)
    .sort((a, b) => a.year - b.year)
    .map((p) => `- [${p.short}](${BASE}/research/${p.slug}/) — ${firstSentence(p.summary)}`)
    .join('\n');
  themeSections += `## ${t}\n\n${rows}\n\n`;
}
const overview = `---
title: Research Library
description: A verified, cross-linked library of the key empirical and theoretical research on voter education and voter turnout.
sidebar:
  label: Research Library
  order: 1
---

This section collects ${PAPERS.length} foundational and important studies on voter
education, mobilization, and turnout. Each paper has its own page with a short summary and
a **"Contributions to this wiki"** note explaining what it adds to each relevant topic.
Topic pages throughout the wiki link back here from their **Key Research** sections.

Every citation has been verified against a primary source (journal, publisher, or DOI).
Works are grouped below by theme; a single paper may inform several topics.

${themeSections}## How to use this library

- Each **topic page** ends with a **Key Research** list linking to the papers most relevant to it.
- Each **paper page** lists its contributions across topics, so you can trace an idea in either direction.
- Effect sizes and findings are summarized from the source; follow the publication link for full detail.
`;
writeFileSync(join(RESEARCH, 'overview.mdx'), overview);

// 4) Invert contributions → per-topic Key Research, and rewrite topic pages.
const byTopic = new Map(Object.keys(TOPIC_LABELS).map((t) => [t, []]));
for (const p of PAPERS) {
  for (const c of p.contributions) byTopic.get(c.topic).push({ p, note: c.note });
}

let rewritten = 0;
for (const [topic, entries] of byTopic) {
  const file = join(DOCS, `${topic}.mdx`);
  let content = readFileSync(file, 'utf8');
  entries.sort((a, b) => a.p.year - b.p.year);
  const rows = entries
    .map((e) => `- [${e.p.short}](${BASE}/research/${e.p.slug}/) — ${e.note}`)
    .join('\n');
  const keyResearch = `## Key Research\n\nStudies from the [Research Library](${BASE}/research/overview/) most relevant to this topic:\n\n${rows}\n`;

  // Replace an existing "Key Research" or original "Further Reading" section
  // (both live at the end of the page), else append.
  let marker = content.indexOf('## Key Research');
  if (marker === -1) marker = content.indexOf('## Further Reading');
  if (marker !== -1) {
    content = content.slice(0, marker) + keyResearch;
  } else {
    content = content.trimEnd() + '\n\n' + keyResearch;
  }
  writeFileSync(file, content);
  rewritten++;
}

console.log(`Wrote ${PAPERS.length} paper pages + overview; rewrote ${rewritten} topic pages.`);
console.log('Research dir now has:', readdirSync(RESEARCH).length, 'files');
