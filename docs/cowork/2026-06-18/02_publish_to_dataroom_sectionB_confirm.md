# §B Pre-Build Confirmation — Fingerprint Wiring & Defaults

**For:** Claude Code · **Branch:** `feat/publish-to-dataroom`
**When:** read this immediately before starting §B of `01_publish_to_dataroom_pipeline.md`. It resolves the two checkpoint questions and corrects one spec detail.

---

## Defaults — both accepted as-is

1. **Fingerprint basis:** SHA-256 of normalized source text; PDF-bytes hash for external sources. ✓
2. **Removal behavior:** soft-unpublish (`is_published=false`); row, storage file, and view-audit history retained. Never a silent hard delete. ✓

## Clarification A — lock the text-normalization rule to ALPHANUMERIC-ONLY

Normalize as: **lowercase → keep only `[a-z0-9]` (drop ALL whitespace AND punctuation) → exclude the control page → SHA-256.**

This **supersedes** the looser "whitespace-collapsed" wording in `01_..._pipeline.md` §B2. Reason: it is stable across extraction tools and cosmetic re-exports, so reconcile flags real content edits only (the false-positive protection the founder requires).

The prepped **Vision & Strategy** baseline already uses this rule:

```
text_sha256 = 12f3079003cad8187a369e942c4332841dd8f689192fe97ff5be15bb9bbdb310
```

Match it so the first validation publish reports `current`, not false drift.

## Clarification B — who computes the Drive fingerprint (the Node script cannot reach Google Drive)

- **Drive-sourced docs:** the Node pipeline does **not** fetch Drive or hash source text itself. It **persists** the `source.text_sha256` supplied in `manifest.json` (computed Cowork-side at export time) into `investor_documents.content_sha256`.
- **External-sourced docs** (RealReal 10-K, press release): the Node pipeline **does** hash the local PDF bytes from the seed dir (it has the file) and stores that.
- The **authoritative Drive drift check** in §C (recompute the source hash, compare, set `content_status`, emit `dataroom/drift.detected`) runs on the **Cowork side** in the daily audit, which has Drive access — **not** inside the Node script.

### Net scope adjustments
- **§B (Node script):** `--publish` stamps provenance — persisting the manifest `text_sha256` for Drive docs, computing the byte-hash for external docs — and soft-prunes. `--check` dry-runs `ADD/UPDATE/PRUNE/UNCHANGED/DRIFT` (manifest vs DB + local bytes) and exits non-zero on unexpected drift. The Node script must **not** attempt to open Google Drive.
- **§C (Code's part):** the DB status fields, the Inngest `notify-dataroom-drift` function + Resend email, and the `data_room_currency` view. The Drive read + hash recompute + status write is performed by the Cowork daily audit via the service role; Code does not implement Drive access.

Proceed with §B on this basis.
