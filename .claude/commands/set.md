---
description: Change one supplied descriptive field. Access decisions use access-review. Never change a file checksum to make a failed check pass.
---

# set

Change one supplied descriptive field. Access decisions use access-review. Never change a file checksum to make a failed check pass.

Run:

```bash
npm run preservation -- set --ref="<asset>" --field=owner --value="<owner>" --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
