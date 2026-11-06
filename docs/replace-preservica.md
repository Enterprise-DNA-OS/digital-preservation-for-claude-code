# Move your Preservica records

Start with a reconciled sample, keep Preservica available while checking it, and keep your original exports. One command imports the metadata export described below. Moving and validating the content files is separate work.

## Export

Preservica’s [Content API reporting guide](https://developers.preservica.com/blog/custom-reporting-via-the-preservica-content-api) documents CSV export for Professional and above. Its default fields are xip.reference, xip.title, xip.description, xip.document_type, xip.parent_ref and xip.security_descriptor. Export IO assets and SO folders, including the reference, title and type columns. Preservica also documents Explorer’s CSV results export in its [API summary](https://developers.preservica.com/blog/developer-blog-api-summary-in-preservica-6-6-and-6-7); that guide describes a 5,000-result limit. Check counts and split large exports or use the documented paged API. Account permissions and product version determine what is available.

Keep the file private under imports/. Create a destination collection once:

```bash
npm run preservation -- collection-add --code=ARCHIVE --title="Our archive" --owner="Archivist" --actor="Archivist"
npm run preservation -- import preservica --file=imports/results.csv --collection=ARCHIVE --actor="Archivist" --dry-run
npm run preservation -- import preservica --file=imports/results.csv --collection=ARCHIVE --actor="Archivist"
```

## Mapping

| Source | Destination |
|---|---|
| xip.reference | Stable source_ref, with PV- prefixed accession code |
| xip.title | title |
| xip.description | description |
| xip.parent_ref | parent_ref retained for hierarchy reconstruction |
| xip.security_descriptor | source_security, retained verbatim; imported access remains restricted |
| xip.document_type | IO creates an accession; SO remains in the import batch’s source rows |
| Other columns | Original source_data, preserved without reinterpretation |

Folder rows are preserved in import events; they do not create a navigable folder tree. Missing reference, title or type, duplicate references, unsupported entity types and malformed CSV reject the whole batch. Unchanged repeats do not duplicate assets. Changed source rows require --update; descriptive source fields change, while operator owners and rights evidence stay. A changed source security tag resets access to restricted and brings the review date forward.

For renamed headings, --map=imports/columns.json accepts an explicit mapping such as {"ref":"Reference","title":"Title","type":"Type"}. Do not guess columns. Compare source IO/SO counts with the receipt and compare titles, parent references and security tags for samples from each collection. UTF-8, BOM, CRLF, quoted commas, doubled quotes and embedded newlines are supported.

## Bring the bytes

Use Preservica’s [OPEX export](https://developers.preservica.com/documentation/open-preservation-exchange-opex) to obtain content and metadata. Its export can contain PAX packages and several generations. Keep the package and the export settings. The base does not unpack OPEX/PAX, flatten generations or import vendor audit history. Extract and map agreed originals under your migration plan, then ingest each mapped file:

```bash
npm run preservation -- ingest --ref=PV-asset-101 --file="imports/original.txt" --location=primary --actor="Archivist"
npm run preservation -- files --ref=PV-asset-101
npm run preservation -- replicate --file-id="<file id>" --to="<independent storage directory>" --location=offsite --actor="Archivist"
npm run preservation -- fixity --ref=PV-asset-101 --actor="Archivist"
```

The generated baseline describes the bytes received here. Compare it with the source package checksums before treating a transfer as verified. No historical vendor checksum is inferred. Preserve originals, relationships, derivatives, audit records and restrictions in the migration inventory. Enterprise DNA maps and verifies these as part of a scoped migration. Do not cancel the source subscription until counts, content, restrictions, backups and a recovery rehearsal have been accepted by the responsible people.

## Export again

Run npm run preservation -- export. The private JSON snapshot includes every operational record and original imported column, but no content bytes. Back up the vault and replica locations separately. Treat all exports as private, including those with records classified public.
