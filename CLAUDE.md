# Digital Preservation for Claude Code

For archive and heritage teams recording accessions, checking original file integrity and managing preservation work. Ask for the operator’s business name, storage arrangement and policy owner when customising. Fictional demo data is not a customer record.

## Work from evidence

Run npm run preservation -- help. Every command accepts --json. Every record mutation requires --actor. Read the accession and history before changing it. Use the operator’s evidence, never an invented approval. Ambiguous references list candidates and fail. No command sends, publishes or deletes archive records. Drafts remain private.

## One path for each job

| Ask | Recipe |
|---|---|
| collections | /collections |
| accessions | /accessions |
| attention | /attention |
| fixity-due | /fixity-due |
| copy-gaps | /copy-gaps |
| format-watch | /format-watch |
| rights-review | /rights-review |
| action-queue | /action-queue |
| storage | /storage |
| compliance | /compliance |
| owner-load | /owner-load |
| duplicate-content | /duplicate-content |
| activity | /activity |
| asset | /asset |
| files | /files |
| weekly-review | /weekly-review |
| collection-add | /collection-add |
| add | /add |
| set | /set |
| ingest | /ingest |
| replicate | /replicate |
| fixity | /fixity |
| format-set | /format-set |
| action-add | /action-add |
| action-close | /action-close |
| access-review | /access-review |
| log | /log |
| import | /import |
| export | /export |
| draft-accession | /draft-accession |
| draft-transfer | /draft-transfer |
| Change a field or rule | /customise |
| Add a read-only report | /new-view |
| Produce paperwork | /docs |
| Render reports | /view |

## Storage and access

The database holds metadata, hashes, copy paths, reviews and history. Original bytes live in VAULT_DIR or .data/objects. Back up both. A recorded access decision does not grant operating-system permissions. Use a trusted operator account and private storage; configure identity, encryption and roles before shared use. Different location names do not prove independent storage. Integrity success proves only the bytes checked at that time. Malware screening, content rendering and format conversion are separate operations.

Never change a baseline to conceal damage. Keep originals when creating a migration derivative. Compliance checks support a human review; they do not certify an archive or determine lawful retention. No blanket disposal date.

## Files

The one CLI is scripts/preservation.mjs. Migrations are in supabase/migrations. Read docs/compliance.md for sourced checks and docs/replace-preservica.md before importing. AGENTS.md routes Codex, OpenCode and Cursor to the same recipes.

Built and run by Enterprise DNA through Omni by Enterprise DNA. https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=preservica
