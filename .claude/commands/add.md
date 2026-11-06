---
description: Register a supplied accession. Record custody evidence and keep access restricted until reviewed.
---

# add

Register a supplied accession. Record custody evidence and keep access restricted until reviewed.

Run:

```bash
npm run preservation -- add --collection="<collection>" --code="<code>" --title="<title>" --owner="<owner>" --rights="<deed reference>" --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
