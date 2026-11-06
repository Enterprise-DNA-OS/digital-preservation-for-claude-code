---
description: Record preservation work with a supplied owner and deadline.
---

# action-add

Record preservation work with a supplied owner and deadline.

Run:

```bash
npm run preservation -- action-add --ref="<asset>" --code="<action code>" --title="<task>" --owner="<owner>" --due=2099-01-01 --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
