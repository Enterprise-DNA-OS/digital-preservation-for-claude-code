---
description: Close an action only with the human’s evidence reference. Closure does not erase a failed file check.
---

# action-close

Close an action only with the human’s evidence reference. Closure does not erase a failed file check.

Run:

```bash
npm run preservation -- action-close --ref="<action>" --evidence="<review evidence>" --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
