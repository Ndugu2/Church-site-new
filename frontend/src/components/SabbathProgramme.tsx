import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, BookOpen, Mic2, Users, Star, Clock, ChevronLeft, ChevronRight, Calendar, Heart } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
};

interface Hymn {
  number: string;
  title: string;
  book: string;
  moment: string;
}

export interface SabbathProgram {
  date: string;
  theme: string;
  sabbathSchool: {
    superintendent: string;
    assistantSuperintendent: string;
    secretary: string;
    songLeader: string;
    openingPrayer: string;
    openingSongs: { number: string; title: string }[];
    memoryVerse: string;
    memoryVerseRef: string;
    lessonTitle: string;
    lessonNumber: number;
    quarter: string;
    dailyReadings: { day: string; title: string; text: string }[];
    classes: { name: string; ageRange: string; teacher: string; room: string }[];
    lessonLeader: string;
    discussionLeader: string;
    missionSpotlight: string;
    offeringDesignation: string;
    time: string;
  };
  divineService: {
    songLeader: string;
    organist: string;
    worshipCoordinator: string;
    openingPrayer: string;
    tithesOffering: string;
    welcomeAndAnnouncements: string;
    time: string;
  };
  sermon: {
    preacher: string;
    title: string;
    keyText: string;
    synopsis: string;
    role: string;
  };
  specialItems: {
    group: string;
    song: string;
    type: string;
    color: string;
  }[];
  hymns: Hymn[];
  closingPrayer: string;
  benediction: string;
  afternoonProgramme: {
    time: string;
    leader: string;
    prayerFocus: string;
    prayerPoints: string[];
    discussionTopic: string;
    discussionText: string;
    discussionLeader: string;
    discussionSummary: string;
  };
}

export const DEFAULT_SABBATH_PROGRAMMES: SabbathProgram[] = [
  {
    date: 'Sabbath, July 26, 2026',
    theme: 'The Sanctuary and the Covenant',
    sabbathSchool: {
      superintendent: 'Elder Niyomugabo Francis',
      assistantSuperintendent: 'Sis. Nabatanzi Faith',
      secretary: 'Sis. Kwagala Esther',
      songLeader: 'Bro. Twine Enok',
      openingPrayer: 'Deaconess Grace Apio',
      openingSongs: [
        { number: '7', title: 'From All That Dwell Below the Skies' },
        { number: '229', title: 'All Hail the Power of Jesus Name' },
        { number: '326', title: 'Open My Eyes That I May See' }
      ],
      memoryVerse: '"And he said unto me, Unto two thousand and three hundred days; then shall the sanctuary be cleansed."',
      memoryVerseRef: 'Daniel 8:14',
      lessonTitle: 'The Most Holy Place and the Day of Atonement',
      lessonNumber: 4,
      quarter: 'Q3 2026 — The Sanctuary',
      dailyReadings: [
        { day: 'Sunday', title: 'The Veil Was Torn', text: 'Matthew 27:51; Hebrews 10:19–22' },
        { day: 'Monday', title: 'The High Priest Enters', text: 'Leviticus 16:1–14; Hebrews 9:7' },
        { day: 'Tuesday', title: 'The Scapegoat', text: 'Leviticus 16:15–22; Isaiah 53:6' },
        { day: 'Wednesday', title: 'Investigative Judgment', text: 'Daniel 7:9–10; Revelation 14:7' },
        { day: 'Thursday', title: 'Cleansed by His Blood', text: 'Hebrews 9:23–28; 1 John 1:7' },
        { day: 'Friday', title: 'Further Study', text: 'E.G. White, The Great Controversy, pp. 480–491' }
      ],
      classes: [
        { name: 'Cradle Roll', ageRange: '0 – 3 yrs', teacher: 'Sis. Apio Grace', room: 'Room 1' },
        { name: 'Kindergarten', ageRange: '4 – 6 yrs', teacher: 'Sis. Namukasa Ruth', room: 'Room 2' },
        { name: 'Primary', ageRange: '7 – 9 yrs', teacher: 'Bro. Kato David', room: 'Room 3' },
        { name: 'Juniors', ageRange: '10 – 12 yrs', teacher: 'Sis. Miriam Akello', room: 'Room 4' },
        { name: 'Earliteens', ageRange: '13 – 15 yrs', teacher: 'Bro. Samuel Oundo', room: 'Room 5' },
        { name: 'Youth', ageRange: '16 – 25 yrs', teacher: 'Bro. Twine Enok', room: 'Chapel Annex' },
        { name: 'Young Adults', ageRange: '26 – 35 yrs', teacher: 'Sis. Kwagala Esther', room: 'Library' },
        { name: 'Adults', ageRange: '36 yrs +', teacher: 'Elder Niyomugabo Francis', room: 'Main Hall' }
      ],
      lessonLeader: 'Sis. Kwagala Esther',
      discussionLeader: 'Elder Niyomugabo Francis',
      missionSpotlight: 'SDA Mission in South Sudan — Building a School in Juba',
      offeringDesignation: 'World Mission Budget — 13th Sabbath Offering',
      time: '9:30 AM – 11:00 AM'
    },
    sermon: {
      preacher: 'Pastor Kagwa Rogers',
      title: 'Judgment Has Begun — Are You Ready?',
      keyText: 'Daniel 8:14 — "Unto two thousand and three hundred days; then shall the sanctuary be cleansed."',
      synopsis: 'Pastor Kagwa will lead us through the investigative judgment, the cleansing of the sanctuary, and what Christ\'s high priestly ministry means for our lives today.',
      role: 'Lead Pastor'
    },
    divineService: {
      songLeader: 'Bro. Twine Enok',
      organist: 'Sis. Nakato Agnes',
      worshipCoordinator: 'Sis. Nabatanzi Faith',
      openingPrayer: 'Deacon Peter Ssali',
      tithesOffering: 'Deacon James Mutebi',
      welcomeAndAnnouncements: 'Sis. Kwagala Esther',
      time: '11:00 AM – 1:00 PM'
    },
    specialItems: [
      { group: 'Seattle International Choir', song: 'How Great Thou Art', type: 'Choir Anthem', color: '#8B5CF6' },
      { group: 'Pathfinders', song: 'Give Me the Bible', type: 'Youth Special', color: '#10B981' }
    ],
    hymns: [
      { number: '1', title: 'All Praise to Jesus\' Holy Name', book: 'Bridge Hymnal', moment: 'Opening Hymn' },
      { number: '67', title: 'Holy, Holy, Holy! Lord God Almighty', book: 'Bridge Hymnal', moment: 'Hymn of Praise' },
      { number: '253', title: 'Jesus, Keep Me Near the Cross', book: 'Bridge Hymnal', moment: 'Pre-Sermon Hymn' },
      { number: '631', title: 'God Be With You Till We Meet Again', book: 'Bridge Hymnal', moment: 'Closing Hymn' }
    ],
    closingPrayer: 'Elder Niyomugabo Francis',
    benediction: 'Pastor Kagwa Rogers',
    afternoonProgramme: {
      time: '2:30 PM – 4:30 PM',
      leader: 'Bro. Twine Enok',
      prayerFocus: 'The Church, the Nation & Student Examinations',
      prayerPoints: [
        'Pray for students sitting end-of-semester exams this week',
        'Intercede for church family members who are ill',
        'Pray for the upcoming Camp Meeting — for souls to be won',
        'Pray for the nation of Uganda and its leadership',
        'Pray for missionaries serving in difficult fields'
      ],
      discussionTopic: 'What Does the Sanctuary Mean for My Daily Life?',
      discussionText: 'Hebrews 4:14–16 — “Let us therefore come boldly to the throne of grace, that we may obtain mercy and find grace to help in time of need.”',
      discussionLeader: 'Elder Niyomugabo Francis',
      discussionSummary: 'This discussion explores how the heavenly sanctuary ministry of Christ — our High Priest — gives us confidence in prayer, assurance of forgiveness, and motivation for holy living. We will discuss practical ways the sanctuary truth changes how we approach God every day.'
    }
  },
  {
    date: 'Sabbath, August 2, 2026',
    theme: 'Rest in Christ — Ceasing from Our Own Works',
    sabbathSchool: {
      superintendent: 'Elder Niyomugabo Francis',
      assistantSuperintendent: 'Deacon Peter Ssali',
      secretary: 'Sis. Kwagala Esther',
      songLeader: 'Sis. Ruth Namukasa',
      openingPrayer: 'Bro. Samuel Oundo',
      openingSongs: [
        { number: '388', title: 'Don\'t Forget the Sabbath' },
        { number: '469', title: 'Leaning on the Everlasting Arms' },
        { number: '524', title: 'Tis So Sweet to Trust in Jesus' }
      ],
      memoryVerse: '"There remains therefore a rest for the people of God. For he who has entered His rest has himself also ceased from his works as God did from His."',
      memoryVerseRef: 'Hebrews 4:9–10',
      lessonTitle: 'The Sabbath and the New Covenant Rest',
      lessonNumber: 5,
      quarter: 'Q3 2026 — The Sanctuary',
      dailyReadings: [
        { day: 'Sunday', title: 'Creation Rest', text: 'Genesis 2:1–3; Exodus 20:8–11' },
        { day: 'Monday', title: 'Rest and Redemption', text: 'Deuteronomy 5:12–15; Isaiah 58:13–14' },
        { day: 'Tuesday', title: 'Jesus and the Sabbath', text: 'Mark 2:27–28; Luke 4:16' },
        { day: 'Wednesday', title: 'A Rest for the Soul', text: 'Matthew 11:28–30; Hebrews 4:1–4' },
        { day: 'Thursday', title: 'Entering His Rest', text: 'Hebrews 4:9–11; Revelation 14:12' },
        { day: 'Friday', title: 'Further Study', text: 'E.G. White, Desire of Ages, pp. 281–289' }
      ],
      classes: [
        { name: 'Cradle Roll', ageRange: '0 – 3 yrs', teacher: 'Sis. Apio Grace', room: 'Room 1' },
        { name: 'Kindergarten', ageRange: '4 – 6 yrs', teacher: 'Sis. Namukasa Ruth', room: 'Room 2' },
        { name: 'Primary', ageRange: '7 – 9 yrs', teacher: 'Bro. Kato David', room: 'Room 3' },
        { name: 'Juniors', ageRange: '10 – 12 yrs', teacher: 'Sis. Miriam Akello', room: 'Room 4' },
        { name: 'Earliteens', ageRange: '13 – 15 yrs', teacher: 'Bro. Samuel Oundo', room: 'Room 5' },
        { name: 'Youth', ageRange: '16 – 25 yrs', teacher: 'Bro. Twine Enok', room: 'Chapel Annex' },
        { name: 'Young Adults', ageRange: '26 – 35 yrs', teacher: 'Sis. Kwagala Esther', room: 'Library' },
        { name: 'Adults', ageRange: '36 yrs +', teacher: 'Elder Niyomugabo Francis', room: 'Main Hall' }
      ],
      lessonLeader: 'Bro. David Kato',
      discussionLeader: 'Bro. David Kato',
      missionSpotlight: 'Adventist Development and Relief Agency (ADRA) — Flood Response in Eastern Uganda',
      offeringDesignation: 'Local Church Budget — Outreach & Evangelism Fund',
      time: '9:30 AM – 11:00 AM'
    },
    divineService: {
      songLeader: 'Sis. Ruth Namukasa',
      organist: 'Sis. Nakato Agnes',
      worshipCoordinator: 'Deacon Peter Ssali',
      openingPrayer: 'Elder Francis Niyomugabo',
      tithesOffering: 'Deaconess Grace Apio',
      welcomeAndAnnouncements: 'Sis. Kwagala Esther',
      time: '11:00 AM – 1:00 PM'
    },
    sermon: {
      preacher: 'Pastor Khear Hamis',
      title: 'Finding Rest in a Restless Generation',
      keyText: 'Matthew 11:28–30 — "Come unto me, all ye that labour and are heavy laden, and I will give you rest."',
      synopsis: 'In a world of noise, deadlines, and anxiety, Pastor Khear explores the deep rest that Christ offers — not just on Sabbath but as a daily posture of the soul.',
      role: 'Assistant Pastor'
    },
    specialItems: [
      { group: 'French-Speaking Fellowship Choir', song: 'Ce que tu m\'as donné', type: 'Choir Anthem', color: '#0EA5E9' },
      { group: 'Women\'s Ministries', song: 'It Is Well With My Soul', type: 'Special Item', color: '#EC4899' }
    ],
    hymns: [
      { number: '41', title: 'Jesus, Savior, Pilot Me', book: 'Bridge Hymnal', moment: 'Opening Hymn' },
      { number: '73', title: 'Jesus, I My Cross Have Taken', book: 'Bridge Hymnal', moment: 'Hymn of Praise' },
      { number: '184', title: 'O Love That Wilt Not Let Me Go', book: 'Bridge Hymnal', moment: 'Pre-Sermon Hymn' },
      { number: '625', title: 'There Is a Better World', book: 'Bridge Hymnal', moment: 'Closing Hymn' }
    ],
    closingPrayer: 'Deacon James Mutebi',
    benediction: 'Pastor Khear Hamis',
    afternoonProgramme: {
      time: '2:30 PM – 4:30 PM',
      leader: 'Sis. Ruth Namukasa',
      prayerFocus: 'Rest, Healing & Family Restoration',
      prayerPoints: [
        'Pray for members experiencing burnout and anxiety',
        'Intercede for families going through separation or conflict',
        'Pray for healing of the sick in our congregation',
        'Pray for students far from home who feel lonely',
        'Pray for new members to find community and belonging'
      ],
      discussionTopic: 'How Do We Truly Rest in a World That Never Stops?',
      discussionText: 'Psalm 46:10 — “Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.”',
      discussionLeader: 'Pastor Khear Hamis',
      discussionSummary: 'We live in a generation that glorifies busyness. This discussion challenges us to understand biblical rest — not merely physical rest on Sabbath, but a spiritual stillness that trusts God completely. We will share testimonies and discuss habits that cultivate soul-rest throughout the week.'
    }
  },
  {
    date: 'Sabbath, August 9, 2026',
    theme: 'The Blood of the Covenant — Forgiveness and Cleansing',
    sabbathSchool: {
      superintendent: 'Elder Niyomugabo Francis',
      assistantSuperintendent: 'Sis. Nabatanzi Faith',
      secretary: 'Sis. Kwagala Esther',
      songLeader: 'Bro. Twine Enok',
      openingPrayer: 'Deacon James Mutebi',
      openingSongs: [
        { number: '294', title: 'Power in the Blood' },
        { number: '195', title: 'There Is a Fountain Filled With Blood' },
        { number: '337', title: 'Redeemed' }
      ],
      memoryVerse: '"And without shedding of blood is no remission."',
      memoryVerseRef: 'Hebrews 9:22',
      lessonTitle: 'Atonement: The High Cost of Grace',
      lessonNumber: 6,
      quarter: 'Q3 2026 — The Sanctuary',
      dailyReadings: [
        { day: 'Sunday', title: 'The Price of Sin', text: 'Romans 6:23; Genesis 3:14–19' },
        { day: 'Monday', title: 'The Substitute', text: 'Isaiah 53:4–6; 1 Peter 2:24' },
        { day: 'Tuesday', title: 'The Blood Covenant', text: 'Hebrews 9:11–15; Exodus 24:6–8' },
        { day: 'Wednesday', title: 'Justification by Faith', text: 'Romans 3:21–26; 5:8–9' },
        { day: 'Thursday', title: 'Forgiven and Cleansed', text: '1 John 1:7–9; Psalm 103:10–12' },
        { day: 'Friday', title: 'Further Study', text: 'E.G. White, Steps to Christ, pp. 35–45' }
      ],
      classes: [
        { name: 'Cradle Roll', ageRange: '0 – 3 yrs', teacher: 'Sis. Apio Grace', room: 'Room 1' },
        { name: 'Kindergarten', ageRange: '4 – 6 yrs', teacher: 'Sis. Namukasa Ruth', room: 'Room 2' },
        { name: 'Primary', ageRange: '7 – 9 yrs', teacher: 'Bro. Kato David', room: 'Room 3' },
        { name: 'Juniors', ageRange: '10 – 12 yrs', teacher: 'Sis. Miriam Akello', room: 'Room 4' },
        { name: 'Earliteens', ageRange: '13 – 15 yrs', teacher: 'Bro. Samuel Oundo', room: 'Room 5' },
        { name: 'Youth', ageRange: '16 – 25 yrs', teacher: 'Bro. Twine Enok', room: 'Chapel Annex' },
        { name: 'Young Adults', ageRange: '26 – 35 yrs', teacher: 'Sis. Kwagala Esther', room: 'Library' },
        { name: 'Adults', ageRange: '36 yrs +', teacher: 'Elder Niyomugabo Francis', room: 'Main Hall' }
      ],
      lessonLeader: 'Sis. Miriam Akello',
      discussionLeader: 'Sis. Miriam Akello',
      missionSpotlight: 'Hope Channel Africa — Evangelistic Broadcasts Reaching Rural Communities',
      offeringDesignation: 'Sabbath School Mission Offering — Africa-Indian Ocean Division',
      time: '9:30 AM – 11:00 AM'
    },
    divineService: {
      songLeader: 'Bro. Twine Enok',
      organist: 'Sis. Nakato Agnes',
      worshipCoordinator: 'Sis. Nabatanzi Faith',
      openingPrayer: 'Bro. Samuel Oundo',
      tithesOffering: 'Deacon James Mutebi',
      welcomeAndAnnouncements: 'Sis. Kwagala Esther',
      time: '11:00 AM – 1:00 PM'
    },
    sermon: {
      preacher: 'Elder Caleb Ndikumana',
      title: 'Without the Shedding of Blood There Is No Remission',
      keyText: 'Hebrews 9:22 — "And without shedding of blood is no remission."',
      synopsis: 'Elder Ndikumana takes us on a journey through the sacrificial system, what it pointed forward to, and how the blood of Jesus answers every accusation.',
      role: 'Guest Preacher'
    },
    specialItems: [
      { group: 'SIC Youth Choir', song: 'The Blood Will Never Lose Its Power', type: 'Choir Anthem', color: '#EF4444' },
      { group: 'Campus Ministry Team', song: 'At the Cross', type: 'Youth Special', color: '#F59E0B' }
    ],
    hymns: [
      { number: '133', title: 'There Is a Fountain Filled With Blood', book: 'Bridge Hymnal', moment: 'Opening Hymn' },
      { number: '167', title: 'Power in the Blood', book: 'Bridge Hymnal', moment: 'Hymn of Praise' },
      { number: '212', title: 'Jesus Paid It All', book: 'Bridge Hymnal', moment: 'Pre-Sermon Hymn' },
      { number: '624', title: 'How Firm a Foundation', book: 'Bridge Hymnal', moment: 'Closing Hymn' }
    ],
    closingPrayer: 'Elder Niyomugabo Francis',
    benediction: 'Elder Caleb Ndikumana',
    afternoonProgramme: {
      time: '2:30 PM – 4:30 PM',
      leader: 'Deacon Peter Ssali',
      prayerFocus: 'Forgiveness, Repentance & the Blood of Christ',
      prayerPoints: [
        'Pray for a spirit of genuine repentance in our church',
        'Intercede for those who have drifted away from the faith',
        'Pray for the prison ministry team visiting next Saturday',
        'Pray for those struggling with guilt and shame',
        'Give thanks for the atoning blood of Jesus Christ'
      ],
      discussionTopic: 'Can I Be Sure My Sins Are Forgiven?',
      discussionText: '1 John 1:9 — “If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.”',
      discussionLeader: 'Elder Caleb Ndikumana',
      discussionSummary: 'Many believers carry the weight of past sins even after confessing them. This discussion unpacks the certainty of forgiveness through the blood of Christ, the difference between guilt and conviction, and how we can walk in the freedom that the gospel promises. Personal testimonies of redemption are welcome.'
    }
  }
];

const momentColors: Record<string, string> = {
  'Opening Hymn': '#0EA5E9',
  'Hymn of Praise': '#8B5CF6',
  'Pre-Sermon Hymn': '#F59E0B',
  'Closing Hymn': '#10B981'
};

interface SabbathProgrammeProps {
  programmesData?: SabbathProgram[];
}

export const SabbathProgramme: React.FC<SabbathProgrammeProps> = ({ programmesData }) => {
  const programmes = programmesData && programmesData.length > 0 ? programmesData : DEFAULT_SABBATH_PROGRAMMES;
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex > programmes.length - 1) {
      setSelectedIndex(0);
    }
  }, [programmes.length, selectedIndex]);

  const prog = programmes[selectedIndex];
  const overviewStats = [
    { label: 'Sabbath School', value: prog.sabbathSchool.time, color: '#0EA5E9' },
    { label: 'Divine Service', value: prog.divineService.time, color: '#8B5CF6' },
    { label: 'Afternoon', value: prog.afternoonProgramme.time, color: '#10B981' },
    { label: 'Preacher', value: prog.sermon.preacher, color: 'var(--accent)' },
  ];
  const leadershipRows = [
    { label: 'Song Leader', value: prog.sabbathSchool.songLeader },
    { label: 'Opening Prayer', value: prog.sabbathSchool.openingPrayer },
    { label: 'Superintendent', value: prog.sabbathSchool.superintendent },
    { label: 'Assistant Superintendent', value: prog.sabbathSchool.assistantSuperintendent },
    { label: 'Secretary', value: prog.sabbathSchool.secretary },
    { label: 'Lesson Leader', value: prog.sabbathSchool.lessonLeader },
  ];
  const divineRows = [
    { label: 'Song Leader', value: prog.divineService.songLeader },
    { label: 'Organist', value: prog.divineService.organist },
    { label: 'Worship Coordinator', value: prog.divineService.worshipCoordinator },
    { label: 'Opening Prayer', value: prog.divineService.openingPrayer },
    { label: 'Tithes & Offering', value: prog.divineService.tithesOffering },
    { label: 'Announcements', value: prog.divineService.welcomeAndAnnouncements },
  ];
  const serviceTimeline = [
    { time: '9:30 AM', item: 'Sabbath School Song Service', detail: `Led by ${prog.sabbathSchool.songLeader}`, color: '#0EA5E9' },
    { time: '9:45 AM', item: 'Welcome and Opening Prayer', detail: `${prog.sabbathSchool.superintendent} · ${prog.sabbathSchool.openingPrayer}`, color: '#0EA5E9' },
    { time: '10:00 AM', item: 'Lesson Study', detail: `Lesson ${prog.sabbathSchool.lessonNumber}: ${prog.sabbathSchool.lessonTitle}`, color: '#0EA5E9' },
    { time: '10:40 AM', item: 'Mission and Offering', detail: prog.sabbathSchool.offeringDesignation, color: '#10B981' },
    { time: '11:00 AM', item: 'Divine Service Begins', detail: `Opening hymn #${prog.hymns[0].number}`, color: '#8B5CF6' },
    { time: '11:45 AM', item: 'Sermon', detail: `${prog.sermon.title} — ${prog.sermon.preacher}`, color: 'var(--accent)' },
    { time: '12:50 PM', item: 'Benediction', detail: prog.benediction, color: '#8B5CF6' },
    { time: '2:30 PM', item: 'Afternoon Programme', detail: `Led by ${prog.afternoonProgramme.leader}`, color: '#10B981' },
  ];
  const sabbathHymns = [
    ...prog.sabbathSchool.openingSongs.map((song) => ({
      number: song.number,
      title: song.title,
      moment: 'Opening Song Service',
      book: 'Sabbath School',
      color: '#0EA5E9',
    })),
    ...prog.hymns.map((hymn) => ({
      number: hymn.number,
      title: hymn.title,
      moment: hymn.moment,
      book: hymn.book,
      color: momentColors[hymn.moment],
    })),
  ];

  return (
    <div>
      {/* Hero */}
      <motion.div className="page-header" variants={fadeUp} initial="hidden" animate="visible">
        <div className="container text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ width: '68px', height: '68px', borderRadius: '18px', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Calendar size={34} color="var(--accent)" />
          </motion.div>
          <h1 style={{ marginBottom: '0.5rem' }}>Sabbath Programme</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '520px', margin: '0 auto 2rem' }}>
            Every detail of our Sabbath worship — prepared with prayer and care for every soul.
          </p>

          {/* Sabbath Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '0.5rem 0.75rem', cursor: selectedIndex === 0 ? 'not-allowed' : 'pointer', color: 'white', opacity: selectedIndex === 0 ? 0.4 : 1 }}>
              <ChevronLeft size={20} />
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {programmes.map((p, i) => (
                <button key={i} onClick={() => setSelectedIndex(i)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '10px', border: '2px solid',
                    fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: selectedIndex === i ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                    background: selectedIndex === i ? 'rgba(212,175,55,0.2)' : 'transparent',
                    color: selectedIndex === i ? 'var(--accent)' : 'rgba(255,255,255,0.8)'
                  }}>
                  {p.date.replace('Sabbath, ', '')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedIndex(Math.min(programmes.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === programmes.length - 1}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '0.5rem 0.75rem', cursor: selectedIndex === programmes.length - 1 ? 'not-allowed' : 'pointer', color: 'white', opacity: selectedIndex === programmes.length - 1 ? 0.4 : 1 }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="section-padding">
        <div className="container">

          {/* Theme Banner */}
          <motion.div key={prog.date} variants={fadeUp} initial="hidden" animate="visible"
            style={{ background: 'linear-gradient(135deg, var(--primary), #1e4494)', borderRadius: '20px', padding: '2rem', marginBottom: '2.5rem', color: 'white', textAlign: 'center' }}>
            <p style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              📅 {prog.date}
            </p>
            <h2 style={{ color: 'white', marginBottom: '0.25rem', fontSize: '1.5rem' }}>"{prog.theme}"</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Q3 2026 Sabbath School Series — The Sanctuary</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {overviewStats.map((item) => (
              <motion.div
                key={item.label}
                variants={staggerItem}
                className="card"
                style={{ padding: '1rem 1.1rem', borderTop: `4px solid ${item.color}` }}>
                <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, color: '#0f172a', fontSize: '0.98rem', fontWeight: '700', lineHeight: '1.4' }}>{item.value}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="card"
            style={{ marginBottom: '1.5rem', borderTop: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(212,175,55,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={22} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Hymns for This Sabbath</h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>All opening and worship hymns for {prog.date}</p>
                </div>
              </div>
              <span style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '800', padding: '0.35rem 0.7rem', borderRadius: '999px' }}>
                {sabbathHymns.length} hymns
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {sabbathHymns.map((hymn, index) => (
                <div key={`${hymn.number}-${hymn.moment}-${index}`} style={{ padding: '0.9rem 1rem', borderRadius: '14px', border: `1px solid ${hymn.color}22`, background: `${hymn.color}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.45rem' }}>
                    <span style={{ color: hymn.color, fontWeight: '800', fontSize: '0.82rem' }}>#{hymn.number}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '999px', background: `${hymn.color}18`, color: hymn.color }}>{hymn.moment}</span>
                  </div>
                  <p style={{ margin: '0 0 0.25rem', color: '#0f172a', fontWeight: '700', fontSize: '0.92rem', lineHeight: '1.4' }}>{hymn.title}</p>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem' }}>{hymn.book}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            key={prog.date + '-grid'}
            variants={staggerContainer} initial="hidden" animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* Sabbath School */}
            <motion.div variants={staggerItem} className="card" style={{ borderTop: '4px solid #0EA5E9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={22} color="#0EA5E9" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Sabbath School</h3>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {prog.sabbathSchool.time}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '14px', padding: '1rem 1.1rem', borderLeft: '4px solid #0EA5E9' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>This Week's Lesson</p>
                  <p style={{ margin: '0 0 0.45rem', color: '#0f172a', fontWeight: '700', fontSize: '1rem' }}>
                    Lesson {prog.sabbathSchool.lessonNumber}: "{prog.sabbathSchool.lessonTitle}"
                  </p>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.84rem' }}>{prog.sabbathSchool.quarter}</p>
                </div>

                <div style={{ background: 'rgba(14,165,233,0.04)', borderRadius: '14px', padding: '1rem 1.1rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Memory Verse — {prog.sabbathSchool.memoryVerseRef}</p>
                  <p style={{ color: 'var(--primary)', fontStyle: 'italic', fontSize: '0.93rem', lineHeight: '1.7', margin: 0 }}>{prog.sabbathSchool.memoryVerse}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {leadershipRows.map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'baseline', paddingBottom: '0.45rem', borderBottom: '1px solid #eef2f7', fontSize: '0.86rem' }}>
                      <span style={{ color: '#94A3B8', fontWeight: '700' }}>{row.label}</span>
                      <span style={{ color: '#1E293B', fontWeight: '600', textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '12px', padding: '0.9rem 1rem', borderLeft: '3px solid #F59E0B' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Mission Spotlight</p>
                    <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0 }}>{prog.sabbathSchool.missionSpotlight}</p>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '12px', padding: '0.9rem 1rem', borderLeft: '3px solid #10B981' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Offering Designation</p>
                    <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0 }}>{prog.sabbathSchool.offeringDesignation}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Divine Service */}
            <motion.div variants={staggerItem} className="card" style={{ borderTop: '4px solid #8B5CF6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} color="#8B5CF6" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Divine Service</h3>
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} /> {prog.divineService.time}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {divineRows.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: '0.88rem', color: '#333', textAlign: 'right', fontWeight: '500' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Sermon */}
          <motion.div variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="card" style={{ borderLeft: '6px solid var(--accent)', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(30,58,138,0.03), rgba(212,175,55,0.05))' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.3rem', flexShrink: 0 }}>
                {prog.sermon.preacher.split(' ').slice(-1)[0].charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--accent)', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    <Mic2 size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />Sermon
                  </span>
                  <span style={{ background: 'rgba(30,58,138,0.08)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    {prog.sermon.role}
                  </span>
                </div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '0.25rem', fontSize: '1.25rem' }}>"{prog.sermon.title}"</h2>
                <p style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '0.92rem', marginBottom: '0.75rem' }}>
                  Preacher: {prog.sermon.preacher}
                </p>
                <div style={{ background: 'rgba(30,58,138,0.06)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.75rem', borderLeft: '3px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Key Text</p>
                  <p style={{ color: 'var(--primary)', fontStyle: 'italic', fontWeight: '500', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>{prog.sermon.keyText}</p>
                </div>
                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.7', margin: 0 }}>{prog.sermon.synopsis}</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={22} color="#0EA5E9" />
              </div>
              <div>
                <h3 style={{ color: 'var(--primary)', margin: 0 }}>Opening Song Service</h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.82rem' }}>Songs prepared for the Sabbath School opening</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {prog.sabbathSchool.openingSongs.map((song, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.85rem 0.95rem', borderRadius: '12px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)' }}>
                  <span style={{ minWidth: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14,165,233,0.12)', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.82rem' }}>#{song.number}</span>
                  <span style={{ color: '#1E293B', fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.4' }}>{song.title}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            <motion.details variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" open style={{ borderTop: '4px solid #0EA5E9' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Lesson Readings</h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>Daily study guide for the week</p>
                </div>
                <span style={{ color: '#0EA5E9', fontSize: '0.8rem', fontWeight: '700' }}>{prog.sabbathSchool.dailyReadings.length} readings</span>
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {prog.sabbathSchool.dailyReadings.map((reading, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '0.65rem 0', borderBottom: '1px solid #eef2f7' }}>
                    <span style={{ minWidth: '74px', color: '#94A3B8', fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase' }}>{reading.day}</span>
                    <div>
                      <p style={{ margin: '0 0 0.15rem', color: '#0f172a', fontWeight: '700', fontSize: '0.9rem' }}>{reading.title}</p>
                      <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem', lineHeight: '1.5' }}>{reading.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.details>

            <motion.details variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ borderTop: '4px solid #10B981' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Classes and Teachers</h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>Grouped by age and study room</p>
                </div>
                <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: '700' }}>{prog.sabbathSchool.classes.length} classes</span>
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {prog.sabbathSchool.classes.map((item, index) => (
                  <div key={index} style={{ padding: '0.8rem 0.95rem', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontWeight: '700', fontSize: '0.9rem' }}>{item.name}</p>
                      <span style={{ color: '#10B981', fontWeight: '700', fontSize: '0.78rem' }}>{item.ageRange}</span>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', color: '#64748B', fontSize: '0.83rem' }}>{item.teacher} · {item.room}</p>
                  </div>
                ))}
              </div>
            </motion.details>

            <motion.details variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ borderTop: '4px solid #F59E0B' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Worship Hymns</h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>Key congregational hymns for the day</p>
                </div>
                <span style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: '700' }}>{prog.hymns.length} hymns</span>
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {prog.hymns.map((hymn, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', borderRadius: '12px', background: '#fafafa', border: '1px solid #f0f0f0' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                      background: `${momentColors[hymn.moment]}18`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '0.65rem', color: momentColors[hymn.moment], fontWeight: '800', lineHeight: 1 }}>#{hymn.number}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '700', color: '#1e293b', margin: '0 0 0.15rem', fontSize: '0.9rem' }}>{hymn.title}</p>
                      <p style={{ color: '#aaa', fontSize: '0.75rem', margin: 0 }}>{hymn.book}</p>
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '999px', flexShrink: 0,
                      background: `${momentColors[hymn.moment]}15`,
                      color: momentColors[hymn.moment]
                    }}>{hymn.moment}</span>
                  </div>
                ))}
              </div>
            </motion.details>

            {/* Special Items */}
            <motion.details variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="card" style={{ borderTop: '4px solid #EC4899' }}>
              <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={22} color="#EC4899" />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--primary)', margin: 0 }}>Special Items</h3>
                    <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>Choirs, youth items, and closing moments</p>
                  </div>
                </div>
                <span style={{ color: '#EC4899', fontSize: '0.8rem', fontWeight: '700' }}>{prog.specialItems.length} items</span>
              </summary>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {prog.specialItems.map((item, i) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: '14px', background: `${item.color}08`, border: `1.5px solid ${item.color}25` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', background: `${item.color}18`, color: item.color, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>{item.type}</span>
                    </div>
                    <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem', fontSize: '0.95rem' }}>"{item.song}"</p>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={13} /> {item.group}
                    </p>
                  </div>
                ))}
              </div>

              {/* Closing */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f0f0f0' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Closing</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { label: 'Closing Prayer', value: prog.closingPrayer },
                    { label: 'Benediction', value: prog.benediction }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#aaa', fontWeight: '600' }}>{item.label}</span>
                      <span style={{ color: '#333', fontWeight: '500' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.details>
          </div>

          {/* Afternoon Programme */}
          <motion.details variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} open className="card" style={{ marginBottom: '1.5rem', paddingTop: '1.5rem' }}>
            <summary style={{ cursor: 'pointer', listStyle: 'none', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, transparent, #e5e7eb)' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>Afternoon Programme</span>
                <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #e5e7eb, transparent)' }} />
              </div>
            </summary>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Prayer focus and group discussion for the afternoon session.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

              {/* Hour of Prayer */}
              <motion.div variants={staggerItem} className="card" style={{ borderTop: '4px solid #8B5CF6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={22} color="#8B5CF6" />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--primary)', margin: 0 }}>Hour of Prayer</h3>
                    <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> {prog.afternoonProgramme.time} &nbsp;·&nbsp; Led by {prog.afternoonProgramme.leader}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'rgba(139,92,246,0.06)', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1.25rem', borderLeft: '3px solid #8B5CF6' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Focus Area</p>
                  <p style={{ color: '#333', fontWeight: '600', margin: 0, fontSize: '0.92rem' }}>{prog.afternoonProgramme.prayerFocus}</p>
                </div>

                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Prayer Points</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {prog.afternoonProgramme.prayerPoints.map((point, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#8B5CF6' }}>{i + 1}</span>
                      </div>
                      <p style={{ color: '#444', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>{point}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Topic of Discussion */}
              <motion.div variants={staggerItem} className="card" style={{ borderTop: '4px solid #10B981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={22} color="#10B981" />
                  </div>
                  <div>
                    <h3 style={{ color: 'var(--primary)', margin: 0 }}>Topic of Discussion</h3>
                    <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                      Led by {prog.afternoonProgramme.discussionLeader}
                    </p>
                  </div>
                </div>

                <h4 style={{ color: '#1e293b', fontSize: '1.05rem', marginBottom: '1rem', lineHeight: '1.5', fontWeight: '700' }}>
                  "{prog.afternoonProgramme.discussionTopic}"
                </h4>

                <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: '12px', padding: '0.9rem 1rem', marginBottom: '1.25rem', borderLeft: '3px solid #10B981' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Anchor Text</p>
                  <p style={{ color: 'var(--primary)', fontStyle: 'italic', fontWeight: '500', margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>{prog.afternoonProgramme.discussionText}</p>
                </div>

                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.7', margin: 0 }}>{prog.afternoonProgramme.discussionSummary}</p>

                <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Users size={15} color="#10B981" />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>
                    All members are encouraged to bring their Bibles and participate actively.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.details>

          {/* Order of Service Timeline */}
          <motion.details variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card"
            open
            style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.03), rgba(212,175,55,0.05))', marginBottom: '1.5rem' }}>
            <summary style={{ cursor: 'pointer', listStyle: 'none', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(30,58,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Order of Service</h3>
                  <p style={{ margin: '0.2rem 0 0', color: '#94A3B8', fontSize: '0.82rem' }}>Quick running order for the whole day</p>
                </div>
              </div>
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {serviceTimeline.map((row, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
                  {/* Timeline line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: row.color, marginTop: '4px', flexShrink: 0, boxShadow: `0 0 0 3px ${row.color}25` }} />
                    {i < arr.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '32px', background: '#f0f0f0', margin: '4px 0' }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#bbb', minWidth: '62px' }}>{row.time}</span>
                      <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{row.item}</span>
                    </div>
                    {row.detail && <p style={{ color: '#888', fontSize: '0.8rem', margin: '0.2rem 0 0 62px' }}>{row.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.details>

          {/* Notice */}
          <motion.div className="dark-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Heart size={28} color="var(--accent)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 0.25rem', color: 'white' }}>Everyone Is Welcome This Sabbath</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  Whether you are a first-time visitor or a long-time member — come as you are. Our doors open at <strong style={{ color: 'var(--accent)' }}>9:00 AM</strong> every Saturday.
                  SIC Chapel, Bugema University, Uganda.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
