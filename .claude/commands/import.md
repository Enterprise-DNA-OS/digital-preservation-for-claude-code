---
description: Read docs/replace-preservica.md. Import a Preservica CSV export as a dry run first. Reconcile asset and folder counts. Metadata import does not transfer content.
---

# import

Read docs/replace-preservica.md. Import a Preservica CSV export as a dry run first. Reconcile asset and folder counts. Metadata import does not transfer content.

Run:

```bash
npm run preservation -- import preservica --file="imports/results.csv" --collection="<collection>" --actor="<operator>" --dry-run --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
