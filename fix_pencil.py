with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'rb') as f:
    raw = f.read()

# Find the corrupted pencil+variation-selector (✏️ = U+270F U+FE0F)
# U+270F UTF-8: E2 9C 8F
# U+FE0F UTF-8: EF B8 8F
# Their Windows-1252 double-encoded form:
# E2 -> C3 A2 (â)
# 9C -> C2 9C (control)
# 8F -> C2 8F (control)
# EF -> C3 AF (ï)
# B8 -> C2 B8 (¸)
# 8F -> C2 8F (control)

import re

# Find the sequence with the corrupted edit emoji
text = raw.decode('utf-8')
for m in re.finditer(r'Edit', text):
    s = max(0, m.start() - 8)
    chunk = text[s:m.end()]
    b = raw[s:m.start()]
    if len(b) > 0 and b[0] > 127:
        print(f"Before Edit bytes: {b.hex()!r}")
        print(f"Before Edit chars: {repr(chunk)}")
