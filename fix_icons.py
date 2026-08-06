"""Fix remaining ?? placeholder icons in AdminPortalApp.tsx based on their context."""

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Targeted replacements based on label context
fixes = [
    # Department icons
    ("label: 'Church Clerk',\n    icon: '??'",     "label: 'Church Clerk',\n    icon: '\U0001f4cb'"),   # 📋
    ("label: 'Communication Department',\n    icon: '??'", "label: 'Communication Department',\n    icon: '\U0001f4e1'"),  # 📡
    ("label: 'Evangelistic Department',\n    icon: '??'",  "label: 'Evangelistic Department',\n    icon: '\U0001f30d'"),  # 🌍
    ("label: 'Deaconery Department',\n    icon: '??'",     "label: 'Deaconery Department',\n    icon: '\U0001f91d'"),     # 🤝
    ("label: 'Church Leaders',\n    icon: '?'",            "label: 'Church Leaders',\n    icon: '\u2618\ufe0f'"),         # ☘️

    # Dashboard Ministry Overview icons
    ("label: 'Prayer Requests', value: prayers.length, icon: '??'",
     "label: 'Prayer Requests', value: prayers.length, icon: '\U0001f64f'"),   # 🙏
    ("label: 'Bible Studies', value: bibleStudies.length, icon: '??'",
     "label: 'Bible Studies', value: bibleStudies.length, icon: '\U0001f4d6'"), # 📖
    ("label: 'Events', value: events.length, icon: '??'",
     "label: 'Events', value: events.length, icon: '\U0001f4c5'"),             # 📅
    ("label: 'Sermons', value: sermons.length, icon: '???'",
     "label: 'Sermons', value: sermons.length, icon: '\U0001f399\ufe0f'"),     # 🎙️
    ("label: 'Testimonies', value: testimonies.length, icon: '?'",
     "label: 'Testimonies', value: testimonies.length, icon: '\u2728'"),       # ✨
    ("label: 'Blog Posts', value: blogPosts.length, icon: '??'",
     "label: 'Blog Posts', value: blogPosts.length, icon: '\U0001f4dd'"),      # 📝
    ("label: 'Announcements', value: announcements.length, icon: '??'",
     "label: 'Announcements', value: announcements.length, icon: '\U0001f4e3'"), # 📣
    ("label: 'Total Donations', value: `${totalDonations.toLocaleString()} UGX`, icon: '??'",
     "label: 'Total Donations', value: `${totalDonations.toLocaleString()} UGX`, icon: '\U0001f4b0'"), # 💰

    # Donations stats
    ("label: 'Total Collected', value: `${totalAll.toLocaleString()} UGX`, color: '#1e3a8a', bg: '#eff6ff', icon: '??'",
     "label: 'Total Collected', value: `${totalAll.toLocaleString()} UGX`, color: '#1e3a8a', bg: '#eff6ff', icon: '\U0001f4b0'"), # 💰
    ("label: 'Transactions', value: donations.length, color: '#059669', bg: '#ecfdf5', icon: '??'",
     "label: 'Transactions', value: donations.length, color: '#059669', bg: '#ecfdf5', icon: '\U0001f9fe'"),  # 🧾
    ("bg: '#fffbeb', icon: '??'",    "bg: '#fffbeb', icon: '\U0001f4c5'"),     # 📅
    ("bg: '#f5f3ff', icon: '??'",    "bg: '#f5f3ff', icon: '\U0001f4ca'"),     # 📊

    # Events stats
    ("label: 'Total Events', value: events.length, color: '#1e3a8a', bg: '#eff6ff', icon: '??'",
     "label: 'Total Events', value: events.length, color: '#1e3a8a', bg: '#eff6ff', icon: '\U0001f4c5'"),    # 📅
    ("label: 'Upcoming', value: upcomingCount, color: '#059669', bg: '#ecfdf5', icon: '??'",
     "label: 'Upcoming', value: upcomingCount, color: '#059669', bg: '#ecfdf5', icon: '\u23f0'"),             # ⏰
    ("label: 'Registered', value: totalAttendees, color: '#7c3aed', bg: '#f5f3ff', icon: '??'",
     "label: 'Registered', value: totalAttendees, color: '#7c3aed', bg: '#f5f3ff', icon: '\U0001f465'"),     # 👥
    ("label: 'On Waitlist', value: totalWaitlist, color: '#d97706', bg: '#fffbeb', icon: '?'",
     "label: 'On Waitlist', value: totalWaitlist, color: '#d97706', bg: '#fffbeb', icon: '\u23f3'"),          # ⏳
    ("label: 'Published', value: publishedCount, color: '#0891b2', bg: '#ecfeff', icon: '?'",
     "label: 'Published', value: publishedCount, color: '#0891b2', bg: '#ecfeff', icon: '\U0001f310'"),       # 🌐

    # Checklist items
    ("id: 'sabbath', label: 'Attended Sabbath School', icon: '??'",
     "id: 'sabbath', label: 'Attended Sabbath School', icon: '\U0001f4d6'"),    # 📖
    ("id: 'prayer', label: 'Personal Prayer Time', icon: '??'",
     "id: 'prayer', label: 'Personal Prayer Time', icon: '\U0001f64f'"),        # 🙏
    ("id: 'devotion', label: 'Daily Devotion (5 Days)', icon: '??'",
     "id: 'devotion', label: 'Daily Devotion (5 Days)', icon: '\u2600\ufe0f'"), # ☀️
    ("id: 'verse', label: 'Memorized a Scripture Verse', icon: '??'",
     "id: 'verse', label: 'Memorized a Scripture Verse', icon: '\U0001f4dc'"),  # 📜
    ("id: 'tithe', label: 'Returned Tithe & Offering', icon: '??'",
     "id: 'tithe', label: 'Returned Tithe & Offering', icon: '\U0001f4b8'"),    # 💸
    ("id: 'outreach', label: 'Shared Faith with Someone', icon: '??'",
     "id: 'outreach', label: 'Shared Faith with Someone', icon: '\U0001f91d'"), # 🤝

    # Sabbath lesson resources
    ("title: 'Official Adult Lesson', desc: \"Download this quarter's official Sabbath School lesson booklet and study daily.\", link: 'https://www.sabbath.school/', icon: '??'",
     "title: 'Official Adult Lesson', desc: \"Download this quarter's official Sabbath School lesson booklet and study daily.\", link: 'https://www.sabbath.school/', icon: '\U0001f4da'"),  # 📚
    ("title: 'Hope Channel Video', desc: 'Watch video presentations for each lesson from Hope Channel International.', link: 'https://www.hopechannel.com/', icon: '??'",
     "title: 'Hope Channel Video', desc: 'Watch video presentations for each lesson from Hope Channel International.', link: 'https://www.hopechannel.com/', icon: '\U0001f4fa'"),  # 📺
    ("title: 'SDA Church Quarterly', desc: 'Access the global SDA Sabbath School quarterly archives and resources.', link: 'https://sspm.adventist.org/', icon: '??'",
     "title: 'SDA Church Quarterly', desc: 'Access the global SDA Sabbath School quarterly archives and resources.', link: 'https://sspm.adventist.org/', icon: '\U0001f4f0'"),  # 📰
    ("title: 'WhatsApp Study Group', desc: \"Join our SIC Bugema WhatsApp group where members discuss each day's lesson.\", link: 'https://wa.me/256700000000', icon: '??'",
     "title: 'WhatsApp Study Group', desc: \"Join our SIC Bugema WhatsApp group where members discuss each day's lesson.\", link: 'https://wa.me/256700000000', icon: '\U0001f4ac'"),  # 💬
    ("title: 'Audio Bible Study', desc: \"Listen to this week's lesson discussion podcast from various SDA ministries.\", link: 'https://www.sabbath.school/', icon: '??'",
     "title: 'Audio Bible Study', desc: \"Listen to this week's lesson discussion podcast from various SDA ministries.\", link: 'https://www.sabbath.school/', icon: '\U0001f3a7'"),  # 🎧

    # Announcement default icon
    ("setAddAnnouncementForm({ title: '', body: '', date: '', priority: 'normal', icon: '??'",
     "setAddAnnouncementForm({ title: '', body: '', date: '', priority: 'normal', icon: '\U0001f4e3'"),  # 📣

    # Quick Actions
    ("label: '?? Manage Accounts'",  "label: '\U0001f464 Manage Accounts'"),  # 👤
]

for old, new in fixes:
    c = text.count(old)
    if c:
        text = text.replace(old, new)
        print(f"Fixed {c}x: {old[:50]!r}")
    else:
        print(f"NOT FOUND: {old[:50]!r}")

with open(r'c:/Users/ADMIN/Desktop/Church Site/frontend/src/AdminPortalApp.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(text)

# Check remaining ??
remaining = text.count("icon: '??'") + text.count("icon: '?'") + text.count("icon: '???'")
print(f"\nRemaining ?? icons: {remaining}")
print('Done.')
