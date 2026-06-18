#!/usr/bin/env python3
"""Canonical LLV data-room content fingerprint.

ONE definition of the fingerprint used by manifest.json `source.text_sha256`,
the publisher, and any reconcile/confirm step — so they can never disagree.

Rule (LOCKED, see docs/cowork/2026-06-18/02_publish_to_dataroom_sectionB_confirm.md):
  optionally strip the internal control page  →  lowercase  →
  keep only [a-z0-9] (drop ALL whitespace and punctuation)  →  SHA-256.

The fingerprint is taken over the SAME body that becomes the room PDF
(control page excluded). Alphanumeric-only normalization makes it stable
across extraction tools and cosmetic re-exports, so it changes only on real
content edits.

Usage:
  dataroom_fingerprint.py <text_file>            # strips control page if present
  dataroom_fingerprint.py --no-strip <text_file> # hash text as-is (already body-only)
  echo "text" | dataroom_fingerprint.py -        # read from stdin
"""
import sys, re, hashlib

# Control-page end markers (LLV house convention). Everything up to and
# including the first match is dropped before hashing.
_CTRL_MARKERS = [
    r'page\s*\d+\s*onward\s*is\s*self-?contained\.?',
    r'internal control page[^\n]*delete before external distribution[^\n]*',
]

def strip_control_page(text: str) -> str:
    for pat in _CTRL_MARKERS:
        m = re.search(pat, text, re.I)
        if m:
            return text[m.end():]
    return text

def fingerprint(text: str, strip: bool = True) -> str:
    if strip:
        text = strip_control_page(text)
    norm = re.sub(r'[^a-z0-9]', '', text.lower())
    return hashlib.sha256(norm.encode('utf-8')).hexdigest()

def _main(argv):
    strip = True
    args = [a for a in argv[1:]]
    if '--no-strip' in args:
        strip = False
        args.remove('--no-strip')
    src = args[0] if args else '-'
    text = sys.stdin.read() if src == '-' else open(src, encoding='utf-8').read()
    print(fingerprint(text, strip=strip))

if __name__ == '__main__':
    _main(sys.argv)
