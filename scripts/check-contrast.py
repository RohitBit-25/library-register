#!/usr/bin/env python3
"""Fails if any text/background pair in the light palette misses WCAG AA.

Run: python3 scripts/check-contrast.py
Values must be kept in sync with the :root block of app/globals.css.
"""
import re
import sys
from pathlib import Path

CSS = Path(__file__).resolve().parent.parent / "app" / "globals.css"


def _lin(c: float) -> float:
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def ratio(fg: str, bg: str) -> float:
    a, b = luminance(fg), luminance(bg)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def tokens() -> dict[str, str]:
    """Parse `--name: #hex;` declarations out of globals.css."""
    text = CSS.read_text()
    return {
        m.group(1): m.group(2)
        for m in re.finditer(r"(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;", text)
    }


# (foreground, background, minimum) — 4.5 for body text, 3.0 for UI boundaries.
CHECKS = [
    ("--text-primary",   "--bg-surface", 4.5),
    ("--text-primary",   "--bg-void",    4.5),
    ("--text-secondary", "--bg-surface", 4.5),
    ("--text-secondary", "--bg-void",    4.5),
    ("--text-tertiary",  "--bg-surface", 4.5),
    ("--text-tertiary",  "--bg-void",    4.5),
    ("--text-tertiary",  "--bg-muted",   4.5),
    ("--text-accent",    "--bg-surface", 4.5),
    ("--text-link",      "--bg-surface", 4.5),
    ("--text-inverse",   "--saffron-600", 4.5),   # primary button
    ("--saffron-700",    "--saffron-50",  4.5),   # "due" badge
    ("--emerald-600",    "--emerald-50",  4.5),   # "active" badge
    ("--ruby-600",       "--ruby-50",     4.5),   # "expired" badge
    ("--marigold-700",   "--marigold-50", 4.5),   # "expiring" badge
    ("--sapphire-600",   "--sapphire-50", 4.5),   # "vacant" badge
    ("--indigo-600",     "--indigo-50",   4.5),   # "pending" badge
    # Solid-fill buttons carrying light text (Renew, Mark Paid, Assign Seat).
    # These rendered as no-ops until the bare `bg-sapphire-500` utilities were
    # converted to token form, so their contrast had never actually applied.
    ("--saffron-50",     "--sapphire-600", 4.5),
    ("--saffron-50",     "--emerald-600",  4.5),
    ("--saffron-50",     "--indigo-500",   4.5),
    ("--border-strong",  "--bg-surface",  3.0),   # input / focusable edges
    ("--emerald-500",    "--bg-surface",  3.0),   # status dots & rings
    ("--ruby-500",       "--bg-surface",  3.0),
    ("--sapphire-500",   "--bg-surface",  3.0),
]


def main() -> int:
    tok = tokens()
    failures, missing = [], []

    for fg, bg, need in CHECKS:
        if fg not in tok or bg not in tok:
            missing.append(fg if fg not in tok else bg)
            continue
        r = ratio(tok[fg], tok[bg])
        status = "ok  " if r >= need else "FAIL"
        print(f"{status} {r:5.2f}:1 (need {need})  {fg} on {bg}")
        if r < need:
            failures.append((fg, bg, r, need))

    if missing:
        print(f"\nUndefined tokens referenced by this check: {sorted(set(missing))}")
    if failures:
        print(f"\n{len(failures)} contrast failure(s).")
    if missing or failures:
        return 1

    print(f"\nAll {len(CHECKS)} pairs pass WCAG AA.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
