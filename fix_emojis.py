with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix nav labels
nav_fixes = [
    ("'?? Dashboard Stats'",      "'\U0001f4ca Dashboard Stats'"),
    ("'?? Registration Accounts'","'\U0001f464 Registration Accounts'"),
    ("'?? Bible Studies'",        "'\U0001f4d6 Bible Studies'"),
    ("'?? Prayer Requests'",      "'\U0001f64f Prayer Requests'"),
    ("'?? Donations'",            "'\U0001f4b0 Donations'"),
    ("'?? Manage Events'",        "'\U0001f4c5 Manage Events'"),
    ("'??? Manage Sermons'",      "'\U0001f399\ufe0f Manage Sermons'"),
    ("'? Testimonies'",           "'\u2728 Testimonies'"),
    ("'?? Announcements'",        "'\U0001f4e3 Announcements'"),
    ("'????? Staff Directory'",   "'\U0001f9d1\u200d\U0001f4bc Staff Directory'"),
    ("'?? Forums'",               "'\U0001f4ac Forums'"),
    ("'?? Hymns Library'",        "'\U0001f3b5 Hymns Library'"),
    ("'?? Community Outreach'",   "'\U0001f91d Community Outreach'"),
    ("'?? Go Back To School'",    "'\U0001f392 Go Back To School'"),
    ("'?? Audit Trail'",          "'\U0001f9fe Audit Trail'"),
    ("'??? Manage Projects'",     "'\U0001f3d7\ufe0f Manage Projects'"),
    ("'?? Blog Posts'",           "'\U0001f4dd Blog Posts'"),
    ("'?? Manage Gallery'",       "'\U0001f4f8 Manage Gallery'"),
    ("'?? Lesson Videos'",        "'\U0001f3ac Lesson Videos'"),
    ("'??? Sabbath Programme'",   "'\U0001f5d3\ufe0f Sabbath Programme'"),
]
for old, new in nav_fixes:
    c = text.count(old)
    text = text.replace(old, new)
    if c: print(f"Nav fixed {c}x: {old[:30]}")

# 2. Fix double-encoded 4-byte emojis (pattern: U+00F0 U+0178 = corrupted F0 9F)
# Each original emoji byte >=0x80 was read as Windows-1252 and re-encoded to UTF-8
# We need to find these and replace with the known correct emoji
double_encoded = [
    ('\u00f0\u0178\u201c\x81',  '\U0001f4c1'),  # 📁
    ('\u00f0\u0178\u201c\xa2',  '\U0001f4e2'),  # 📢
    ('\u00f0\u0178\u201c\x8d',  '\U0001f50d'),  # 🔍
    ('\u00f0\u0178\u201c\x9d',  '\U0001f4dd'),  # 📝
    ('\u00f0\u0178\u201c\xb0',  '\U0001f4f0'),  # 📰
    ('\u00f0\u0178\u2122\x88',  '\U0001f648'),  # 🙈
    ('\u00f0\u0178\u2014\x91',  '\U0001f5d1'),  # 🗑
    ('\u00f0\u0178\u2019\xbe',  '\U0001f4be'),  # 💾
]
for bad, good in double_encoded:
    c = text.count(bad)
    text = text.replace(bad, good)
    if c: print(f"Button emoji fixed {c}x: {repr(bad)} -> {good}")

# Also fix corrupted ellipsis and other common chars
text = text.replace('\u00e2\u20ac\u00a6', '\u2026')  # â€¦ -> …
text = text.replace('\u00c3\u00af\u00bf\u00bd', '\ufffd')  # corrupted replacement char

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print('All emoji repairs complete.')
