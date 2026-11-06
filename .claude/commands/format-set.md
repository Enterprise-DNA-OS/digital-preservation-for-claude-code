---
description: Record the archivist’s extension policy, evidence and next review. Do not invent a conversion result.
---

# format-set

Record the archivist’s extension policy, evidence and next review. Do not invent a conversion result.

Run:

```bash
npm run preservation -- format-set --extension=.txt --risk=low --action="<preservation action>" --review-on=2099-01-01 --evidence="<policy reference>" --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
