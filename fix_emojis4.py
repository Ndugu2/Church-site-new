with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix common double-encoded non-ASCII chars (C2/C3 prefix patterns)
fixes = [
    # Arrows / symbols I used in my new code
    ('\u00e2\u2020\u00bb', '\u21bb'),  # â†» -> ↻ (refresh arrow)
    ('\u00e2\u20ac\u00a2', '\u2022'),  # â€¢ -> • (bullet)
    ('\u00e2\u2014\x8f',   '\u25cf'),  # â—\x8f -> ● (filled circle)
    ('\u00c2\u00b7',       '\u00b7'),  # Â· -> · (middle dot)
    # ✏️ = U+270F U+FE0F
    ('\u00e2\u009c\u008f\u00ef\u00b8\u008f', '\u270f\ufe0f'),  # âœï¸ -> ✏️
    # 🚪 Sign Out
    ('\u00f0\u0178\u009a\u00aa', '\U0001f6aa'),  # door emoji
    # → arrow
    ('\u00e2\u2020\u2019', '\u2192'),  # â†\u2019 -> →
    # … ellipsis
    ('\u00e2\u20ac\u00a6', '\u2026'),  # â€¦ -> …
    # Sign Out button (?? Sign Out fix)
    ("'?? Sign Out'", "'\U0001f6aa Sign Out'"),
]

for old, new in fixes:
    c = text.count(old)
    if c:
        text = text.replace(old, new)
        print(f'Fixed {c}x: {repr(old[:12])} -> {repr(new[:12])}')

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print('Secondary fixes complete.')
