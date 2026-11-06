# Preservation checks and their sources

Checked 6 November 2026. These are review prompts for a trusted operator, not a complete legal assessment, certification or permission system. The free build does not carry statutory archive compliance for the customer.

| Rule | Implemented record check | Source and limit |
|---|---|---|
| PRIVACY-5 | Flag personal records classified public | [NZ Privacy Principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards. The flag asks for a review; a public classification can be lawful. It is not an automatic breach finding. |
| PRIVACY-9 | Flag personal records without a recorded purpose or review date | [NZ Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to lawful purposes. The Act does not prescribe our review interval. Historic archival and other lawful purposes need assessment by the operator. |
| NDSA-COPIES | Flag files with fewer than two distinct location labels having a recent passing check | [NDSA Levels 2.1](https://www.ndsa.org/publications/levels-of-digital-preservation/) provides preservation assessment guidance. Two copies and 30 days are this demo’s policy choices, not certification. Labels do not establish geographic separation. |
| NDSA-FIXITY | Flag each file with a latest mismatch, missing file or read error on a registered copy | [NDSA Levels](https://www.ndsa.org/publications/levels-of-digital-preservation/) and [OPEX integrity guidance](https://developers.preservica.com/documentation/open-preservation-exchange-opex). The CLI calculates SHA-256 over actual bytes. It never accepts changed content as a new baseline automatically. |
| REVIEW-POLICY | Flag a recorded review date before today | Local operator policy. The due date is supplied by the operator, not calculated from a statute. |
| RIGHTS-POLICY | Flag missing custody or rights evidence | Local accession policy. A text reference does not prove copyright ownership or consent. |
| FORMAT-POLICY | Flag missing, overdue, watch or obsolete extension decisions | Local policy informed by NDSA content assessment. An extension is a planning hint, not validated format identification. |

Files remain private. There is no deletion command, access portal, automatic retention disposal or transfer service. A donor, statutory archivist or records owner decides restrictions and disposition. Public records legislation, sector rules, Indigenous data governance and Australian jurisdiction requirements must be scoped for each customer. The 30-day review interval lives in v_copy_health and can be changed through /customise with a new migration.

Events record the supplied actor and before/after details where applicable. They are not authenticated signatures or tamper-proof logs. Store and restrict the database and content as operational records.
