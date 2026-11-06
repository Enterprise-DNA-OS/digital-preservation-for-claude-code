---
description: Copy intact content to the operator’s chosen storage directory. Verify the copy against its original baseline. A different label on the same disk is not independent protection.
---

# replicate

Copy intact content to the operator’s chosen storage directory. Verify the copy against its original baseline. A different label on the same disk is not independent protection.

Run:

```bash
npm run preservation -- replicate --file-id="<file id>" --to="<independent storage directory>" --location="<storage label>" --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
