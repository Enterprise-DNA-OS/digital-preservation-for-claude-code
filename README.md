# Digital Preservation for Claude Code

Own the record of what arrived, where its files live and whether the copies still match. Built for archive teams who need a weekly preservation review grounded in their own evidence.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and try the demo. | Your accession fields, restrictions, source exports and documents. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=preservica) · [Instead of Preservica](https://enterprisedna.co/omni/instead-of/preservica?utm_source=github&utm_medium=readme&utm_campaign=preservica)

## Start with a real file check

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/digital-preservation-for-claude-code.git
cd digital-preservation-for-claude-code
npm install
npm test
npm run demo
npm run preservation -- weekly-review
npm run docs
npm run view
```

Open the folder with Claude Code, Codex, OpenCode or Cursor. All use the same recipes through CLAUDE.md and AGENTS.md. PGlite runs locally without a server. DATABASE_URL selects PostgreSQL. DATA_DIR chooses the local database, VAULT_DIR chooses original-file storage and OUTPUT_DIR chooses private report/export output. Back up both the database and content files.

The fictional Kauri Heritage Trust demo contains a well-checked accession, a deliberately damaged generated copy, an overdue personal-record review and metadata with no content. The seed is idempotent and leaves existing rows and files in place. Never seed a live archive. PostgreSQL seeding requires ALLOW_DEMO_DATABASE=1 for a disposable database.

## Five archive rituals

- Monday review: /weekly-review combines accessions, attention and storage.
- Accession intake: /add, /ingest and /draft-accession record the receipt and hash the actual content.
- Integrity round: /fixity-due and /fixity detect changed, missing or unreadable copies.
- Copy review: /copy-gaps and /replicate make a verified copy from intact content.
- Preservation meeting: /format-watch, /rights-review and /action-queue turn evidence gaps into owned work.

32 CLI commands and 35 slash-command recipes. Every CLI command supports --json. Mutations require --actor. Names match without case sensitivity, and unique partial IDs work. Ambiguous references list candidates and exit 1. Run npm run preservation -- help for the full command list.

## What the checks mean

Ingest copies the supplied original into the private vault, hashes the received bytes, and compares them with the source. Replicate refuses when it cannot find a copy matching that baseline. Fixity records every result and never replaces a baseline to hide damage. The latest result wins; a later mismatch invalidates an earlier pass.

Two passing location labels checked within 30 days satisfy the demo’s copy policy. This is a local policy choice, not a preservation certification. A second directory on the same disk is not independent storage. Hashes do not establish readability, provenance before intake, malware safety or lawful access.

/compliance checks recorded restrictions, retention purpose, review dates, rights evidence, copies and format decisions. [Rules and sources](docs/compliance.md). Access decisions are metadata, not permissions. Use trusted operators, private storage and a database owner role; configure identity and restricted roles for a shared deployment. History is actor-attributed, not tamper-proof.

## Ten questions this build answers

These are working analyses, not an unsupported claim about Preservica’s reporting limits.

1. Which accessions have metadata but no original files? Run accessions.
2. Which files have fewer than two recently checked storage copies? Run copy-gaps.
3. Which passing checks are too old for our review policy? Run fixity-due.
4. Which copies changed since their original baseline? Run fixity.
5. Which formats have no preservation decision or an overdue one? Run format-watch.
6. Which personal records need a purpose or access review? Run rights-review.
7. Who owns the largest backlog of preservation findings? Run owner-load.
8. Where did identical content arrive under different accessions? Run duplicate-content.
9. Which location has the most failed or stale copy checks? Run storage.
10. Who changed a restriction, and what evidence did they record? Run asset.

## Bring your records

The importer reads Preservica’s documented xip CSV export, preserves custom source columns and folder rows, and defaults imported accessions to restricted. An unchanged repeat creates no duplicate assets. Changed rows require --update; changed source restrictions reset the recorded access decision.

```bash
npm run preservation -- import preservica --file=fixtures/preservica.csv --collection=DEMO --actor="Your name" --dry-run
```

Metadata is not the content archive. Export original files separately with Preservica’s OPEX workflow, map and ingest agreed originals, and reconcile counts, checksums and restrictions. PAX generations, rich metadata, existing vendor history and portals require migration work. [Exact export, mapping and checking steps](docs/replace-preservica.md).

## Documents and read-only views

Change brand.json to put your business name, logo and colours on accession receipts, preservation reviews and transfer checklists. npm run docs writes private HTML drafts. npm run view renders the week, storage review and formats/access report. /draft-accession and /draft-transfer produce individual drafts. Nothing sends or publishes. [What a front end adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our archive’s name and logo on the receipt.
2. Import one collection without saving it.
3. Map our exported accession number.
4. Add our donor deed reference.
5. Set our actual storage location names.
6. Show the files that have never been checked.
7. Change our check interval with a tested migration.
8. Add an owner to every overdue review.
9. Group our preservation actions by collection.
10. Draft next week’s archive review.

/customise writes and tests a migration. /new-view adds a read-only report. This base has no application front end, automatic format conversion or public access service. Enterprise DNA scopes those with the storage, security and migration requirements for your version.

## Verification and price context

npm test runs in a temporary database and exercises all 32 CLI commands, including corrupt and missing files, guarded replication, rollback, idempotent import, restriction changes, exports and escaped documents. The workflow defines Node 20/22 on Linux/Windows and PostgreSQL 17. Read actual run results before claiming an environment passed. TEST_DATABASE_URL must be an empty disposable database.

Preservica Professional and Enterprise are priced privately. A UK council’s historical procurement record shows a five-figure annual fee; it is not a current quote or a verified NZ/AU customer bill. [Selection, scores and sources](docs/research.md).

Enterprise DNA brings across agreed records, checks files and copies, and builds your preservation rules and documents. Omni by Enterprise DNA runs your version for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=preservica).

MIT. Not affiliated with Preservica or Anthropic. Hosting, storage and coding-agent usage have their own costs.
