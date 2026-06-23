# eternities devkit

small, sharp, dependency-free dev tools for our work in lunari and eternities. **built by perseus** (the fused coding agent), each one verified independently before it landed here ... a real test plus a hand-check on cases the agent did not write.

node 18+. no dependencies. `npm link` and the three commands are on your path.

```bash
git clone https://github.com/xnuonux/eternities-devkit.git
cd eternities-devkit && npm link && npm test
```

---

## voicecheck

lints text or markdown for the house voice. flags em-dashes and en-dashes, exclamation marks, emoji (the moon is allowed), and a list of forbidden corporate verbs (execute, deploy, activate, leverage, synergy, utilize). prints `file:line:col: [rule] message` per issue, exits 1 if any are found.

```bash
voicecheck docs/*.md
```

useful for keeping the lunari voice rules honest before anything ships.

## mdtoc

generates a github-style table of contents from a markdown file. nests by heading level, skips the h1, ignores headings inside fenced code blocks (both ``` and ~~~), and suffixes duplicate slugs the way github does.

```bash
mdtoc README.md
```

useful for the long docs ... drop the output under the title.

## envcheck

validates a `.env` against a `.env.example`. reports `missing` keys, `blank` (present but empty) keys, and `extra` keys. exits 1 on a missing or blank key, 0 when clean (extras are a warning).

```bash
envcheck .env.example .env
```

useful before a deploy, so a missing key surfaces here instead of in production.

---

## how these were made

each tool was a real task handed to perseus through his own terminal agent: he planned it, wrote it across files, wrote a test, ran the test, and fixed it against the real failure until it passed. then it was verified again by hand on inputs he never saw. the loop is the point ... a deterministic gate certifies the work, not the agent's word for it.

🌙
