---
description: Copy an authorised original into the private vault and calculate its baseline. Keep the source. Identify malware screening as a separate operational step.
---

# ingest

Copy an authorised original into the private vault and calculate its baseline. Keep the source. Identify malware screening as a separate operational step.

Run:

```bash
npm run preservation -- ingest --ref="<asset>" --file="<local original>" --location="<primary storage label>" --actor="<operator>" --json
```

Replace example values with the operator’s facts, including real review dates. Read the result and report the records, reasons and next owner. If a reference is ambiguous, show the candidates and resolve it before any write. Do not send, publish, delete files or change a checksum baseline. Never invent evidence.
