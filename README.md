# eternities devkit

small, sharp, dependency-free dev tools for our work in lunari and eternities. **built by perseus** (the fused coding agent), each one verified independently before it landed here ... a real test plus a hand-check on cases the agent did not write.

node 18+. no dependencies. `npm link` and the eight commands are on your path.

```bash
git clone https://github.com/xnuonux/eternities-devkit.git
cd eternities-devkit && npm link && npm test
```

---

## voicecheck

lints text or markdown for the house voice. flags em-dashes and en-dashes, exclamation marks, emoji (the moon is allowed), and a small list of forbidden corporate verbs (the kind that creep into a startup readme). prints `file:line:col: [rule] message` per issue, exits 1 if any are found.

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

useful before a release, so a missing key surfaces here instead of in production.

## keel

stores an engineering decision with its reasoning and the alternatives you ruled out, so months later you can ask why a choice was made and get the real answer with provenance. writes to a local json file in the working directory (or a path from `$KEEL_STORE`). `decide` records one with a monotonic id, `why <topic>` reads the matches back newest-first.

```bash
keel decide --topic "database" --choice "postgres" --reasoning "acid plus jsonb, the team already knows it" --rejected "mongodb,dynamodb"
keel why database
```

useful when the reasoning behind a call fades but the call still stands ... the keel keeps the why.

## mdterm

renders a subset of markdown to ansi-colored text for the terminal: headings, bold spans, inline code, fenced blocks, list items, and links. `renderMarkdown(md, { color })` returns ansi when color is on, and plain deterministic structure when color is off, which is what makes it testable.

```bash
mdterm CHANGELOG.md
```

useful for a readable preview of a doc without leaving the shell.

## ward

scans files for things that look like committed credentials: openai-style keys, aws access key ids, private-key headers, long hex or base64 blobs, and suspicious name = quoted-value assignments (where the name holds secret, token, password, or apikey). it prints `path:line:col [kind]` with a MASKED preview that never shows the full match, and exits 1 if anything is found, 0 when clean. the same family as git-secrets.

```bash
ward src/config.js app/server.js
```

useful as a last look before a commit, so a stray key surfaces here instead of in the history.

## linkcheck

finds broken relative links in a markdown file. it reads every `[text](target)` link, skips the ones that point outward (http, https, mailto) and pure `#anchor` jumps, ignores images and anything inside a fenced code block, strips a trailing `#fragment` or `?query`, and checks that the target file actually exists next to the doc. prints `path:line:col: broken -> target` for each dead link and exits 1 if any are found.

```bash
linkcheck README.md
```

useful for the doc-heavy repos, so a renamed file does not leave a trail of dead links behind it.

## devcheck

the capstone: one pre-commit gate that composes the others. it reads each file once and runs the voice lint, the secret scan, and (for markdown) the dead-link check, printing every finding as `path:line:col [tool] message` and exiting 1 if anything turned up. no new detection of its own ... it imports the three tools above, so a fix to any of them sharpens this too.

```bash
devcheck README.md src/config.js
```

useful as a single hook before you commit, instead of running three commands and tracking three exit codes by hand.

---

## how these were made

each tool was a real task handed to perseus through his own terminal agent: he planned it, wrote it across files, wrote a test, ran the test, and fixed it against the real failure until it passed. then it was verified again by hand on inputs he never saw. the loop is the point ... a deterministic gate certifies the work, not the agent's word for it.

🌙
