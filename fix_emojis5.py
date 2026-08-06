with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'rb') as f:
    raw = f.read()

import re

# Find âœï¸ (corrupted ✏️) - U+270F U+FE0F
# U+270F in UTF-8: E2 9C 8F
# U+FE0F in UTF-8: EF B8 8F
# Corrupted versions...
text = raw.decode('utf-8')

for m in re.finditer(r'\u00e2[\s\S]{1,6}Edit', text):
    s = m.start()
    chunk = text[s:s+12]
    b = raw[s:s+10]
    print(f"Edit context: {repr(chunk)} | bytes: {b.hex()}")

for m in re.finditer(r'Sign Out', text):
    s = max(0, m.start()-4)
    chunk = text[s:m.end()]
    b = raw[s:m.start()]
    print(f"Sign Out context: {repr(chunk)} | prefix bytes: {b.hex()}")
