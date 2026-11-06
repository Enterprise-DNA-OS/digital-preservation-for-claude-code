---
description: Record the human’s access decision and evidence. This records a classification, not a grant of file-system or application permission.
---

# access-review

Record the human’s access decision and evidence. This records a classification, not a grant of file-system or application permission.

Run:

```bash
npm run preservation -- access-review --ref="<asset>" --decision=restricted --evidence="<authority reference>" --next-review=2099-01-01 --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
