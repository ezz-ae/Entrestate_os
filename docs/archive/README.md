# Archive — dated planning documents, kept for the record

Nothing in this folder is authoritative. These are drafts, briefs and generated
hand-off packages from the build, moved here on 2026-09-02 from the repository
root and from `lib/` and `components/`, where they had been sitting among the
source files.

They are kept because they are the paper trail of how the product was reasoned
about, and a claim in this repository is easier to check when the argument
behind it is still readable. They are **not** kept as a description of what the
system currently does.

## What is authoritative instead

| Question | Answer lives in |
|---|---|
| What is built, and what is not | [`README.md`](../../README.md) status table |
| How the Decision Tunnel works | [`docs/decision-infrastructure/`](../decision-infrastructure/) |
| The data counts | `lib/platform-metrics.ts` — the numbers the product renders |
| The route catalog | [`site-map.md`](../../site-map.md) |
| Which routes are public | `lib/surface.ts`, enforced by `proxy.ts` |

## Read these with the dates on

Several documents here exist in more than one revision — `-rev1`, `-rev3` and so
on. Those suffixes were `(1)` and `(3)` in the filenames, which is what a
browser writes when the same file is downloaded twice. The later revision is
usually, but not always, the better one, and the revisions disagree with each
other. Two examples, so nobody trusts the wrong one:

- `enterprise-architecture-spec-v2.md` reads *"Not a infrastructure platform.
  Not a enterprise infrastructure."* That is a find-and-replace that ran over
  the words "marketplace" and "consumer app" without reading the result.
  `enterprise-architecture-spec-v2-rev1.md` still has the sentence intact.
- The data counts drift across documents: 167 areas in one, 211 in another;
  74 developers, 75, and 481. The product renders **2,813 projects, 167 areas,
  74 rated developers (481 in the registry) and 36,841 DLD transactions** —
  `lib/platform-metrics.ts`, corroborated by the live `/api/areas` and
  `/api/developers` counts recorded in
  `2026-04-09-data-sync-deployment-status.md`. Any other number in this folder
  is a draft's number, not the system's.

`infiner-template-customization.md` is older still: it is the customization
guide of the purchased template this codebase started from, and it describes a
logo and a brand that are no longer anywhere in the code.

## Two files that are not here

Two Hex exports named `Enterprise Decision Infrastructure Finalization (N).yaml`
were removed rather than archived on 2026-09-02: they carried a live PostgreSQL
connection string for the production database, including the password, and this
repository is public. `.gitignore` had listed the file under `# private specs`
since before they were committed — the browser's ` (2)` and ` (4)` suffixes
walked past the pattern. The globs are suffix-tolerant now, and
`tests/repo-hygiene.test.ts` fails the build if a ` (N)` filename returns.

Removing them from the working tree does not remove them from git history, and
it does not make an exposed password safe. Rotating the role's password is what
closes an exposure like this one; deleting the file only stops it being handed
to the next reader.
