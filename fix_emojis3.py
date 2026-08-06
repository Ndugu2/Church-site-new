with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

fixes = [
    ('\u00f0\u0178\u201d\x8d', '\U0001f50d'),   # 🔍 (search)
    ('\u00f0\u0178\u2122\u02c6', '\U0001f648'), # 🙈 (see-no-evil)
    ('\u00f0\u0178\u2014\u2018', '\U0001f5d1'), # 🗑 (trash)
]

for bad, good in fixes:
    c = text.count(bad)
    text = text.replace(bad, good)
    print(f'Fixed {c}x -> {good}')

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(text)

# Verify
import re
remaining = len(re.findall('\u00f0\u0178', text))
print(f'Remaining corrupted sequences: {remaining}')
print('Done!')
