import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Users, GraduationCap, Music, Map as MapIcon, Heart, HandHelping, LogOut, User, BookOpen, Calendar, MessageSquare, Award, Search, X, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from './config';

// Import new components
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { BlogPage } from './components/BlogPage';
import { StaffDirectory } from './components/StaffDirectory';
import { MemberDashboard } from './components/MemberDashboard';
import { ForumsPage } from './components/ForumsPage';
import { HymnsPage } from './components/HymnsPage';
import { CommunityOutreach } from './components/CommunityOutreach';
import { GoBackToSchool } from './components/GoBackToSchool';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SabbathProgramme, DEFAULT_SABBATH_PROGRAMMES, type SabbathProgram } from './components/SabbathProgramme';

// --- Animation Variants ---
const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SMOOTH } }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } }
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE_SMOOTH } }
};

const slideRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE_SMOOTH } }
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_SMOOTH } }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_SMOOTH } }
};

const pageTransition: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' } }
};

// API root definition
const API_URL = API_BASE_URL;

// --- Types ---
interface Sermon {
  id: number;
  title: string;
  speaker: string;
  date: string;
  passage: string;
  category: string;
}

interface ChurchEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  desc: string;
}

interface BibleStudy {
  id?: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  course: string;
  status?: string;
}

interface PrayerRequest {
  id?: number;
  name: string;
  content: string;
  confidential: boolean;
  follow_up_status?: 'received' | 'assigned' | 'contacted' | 'ongoing' | 'completed';
  care_request_type?: 'none' | 'pastoral_call' | 'elder_visit' | 'counseling' | 'prayer_partner';
  follow_up_notes?: string;
}

interface TestimonyItem {
  id: number;
  title: string;
  content: string;
  author_name?: string;
  created_at: string;
  testimony_type?: 'prayer_answered' | 'spiritual_growth' | 'community_support' | 'healing_restoration' | 'outreach_impact';
  next_step?: 'none' | 'mentor' | 'growth_class' | 'prayer_team' | 'service_team';
  is_featured?: boolean;
}

interface Donation {
  id?: number;
  amount: number;
  fund: string;
  method: string;
  status?: string;
}

interface ChurchProject {
  id: number;
  title: string;
  category: string;
  desc: string;
  goal_amount: number;
  raised_amount: number;
  image_url: string;
  status: string;
  is_published?: boolean;
}

interface ProjectHistoryEntry {
  id: number;
  project_title: string;
  action: 'create' | 'update' | 'delete';
  changed_fields: Record<string, any>;
  updated_by_username?: string;
  created_at: string;
}

type ProjectHistoryActionFilter = 'all' | 'create' | 'update' | 'delete';

const PROJECT_HISTORY_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  category: 'Category',
  desc: 'Description',
  goal_amount: 'Goal Amount',
  raised_amount: 'Raised Amount',
  image_url: 'Image URL',
  status: 'Status',
  is_published: 'Published',
};

const formatProjectHistoryField = (field: string): string => {
  if (PROJECT_HISTORY_FIELD_LABELS[field]) return PROJECT_HISTORY_FIELD_LABELS[field];
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatProjectHistoryValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'Empty';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const getHistoryActionStyles = (action: ProjectHistoryEntry['action']) => {
  if (action === 'create') {
    return { background: '#dcfce7', color: '#166534' };
  }
  if (action === 'delete') {
    return { background: '#fee2e2', color: '#991b1b' };
  }
  return { background: '#e0f2fe', color: '#075985' };
};

interface GalleryImage {
  id?: string;
  album: string;
  title: string;
  img_url: string;
  created_at?: string;
}

interface ActivityLog {
  time: string;
  msg: string;
}

interface AdminAuditEntry {
  id: number;
  action: 'create' | 'update' | 'delete';
  resource_type: string;
  resource_id: string;
  resource_label: string;
  actor_username?: string;
  created_at: string;
  details: Record<string, any>;
}

type AdminAuditActionFilter = 'all' | 'create' | 'update' | 'delete';

interface Announcement {
  id: number;
  title: string;
  body: string;
  date: string;
  scheduled_publish?: string;
  priority: 'high' | 'normal' | 'low';
  icon: string;
  slug?: string;
  is_published?: boolean;
}

interface EventRegistrationReceipt {
  eventTitle: string;
  reference: string;
}

type SabbathProgrammeScope = 'none' | 'full' | 'sabbath_school_only';

type AdminTabId =
  | 'admin-stats'
  | 'admin-accounts'
  | 'admin-studies'
  | 'admin-prayers'
  | 'admin-donations'
  | 'admin-events'
  | 'admin-sermons'
  | 'admin-announcements'
  | 'admin-audit'
  | 'admin-projects'
  | 'admin-gallery'
  | 'admin-lessons'
  | 'admin-sabbath-programme';

type AdminTabMeta = { id: AdminTabId; label: string };

const ADMIN_TABS: AdminTabMeta[] = [
  { id: 'admin-stats', label: '📊 Dashboard Stats' },
  { id: 'admin-accounts', label: '👤 Registration Accounts' },
  { id: 'admin-studies', label: '📖 Bible Studies' },
  { id: 'admin-prayers', label: '🙏 Prayer Requests' },
  { id: 'admin-donations', label: '💰 Donations' },
  { id: 'admin-events', label: '📅 Manage Events' },
  { id: 'admin-sermons', label: '🎙️ Manage Sermons' },
  { id: 'admin-announcements', label: '📣 Announcements' },
  { id: 'admin-audit', label: '🧾 Audit Trail' },
  { id: 'admin-projects', label: '🏗️ Manage Projects' },
  { id: 'admin-gallery', label: '📸 Manage Gallery' },
  { id: 'admin-lessons', label: '🎬 Lesson Videos' },
  { id: 'admin-sabbath-programme', label: '🗓️ Sabbath Programme' },
];

const ACCESS_RIGHT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'bible_studies', label: 'Bible Study' },
  { id: 'sabbath_programme', label: 'Sabbath Programme' },
  { id: 'prayers', label: 'Prayer Requests' },
  { id: 'donations', label: 'Donations' },
  { id: 'events', label: 'Manage Events' },
  { id: 'sermons', label: 'Manage Sermons' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'projects', label: 'Manage Projects' },
  { id: 'gallery', label: 'Manage Gallery' },
  { id: 'lessons', label: 'Lesson Videos' },
];

const ACCESS_RIGHT_LABELS: Record<string, string> = {
  account_registration: 'Registration Accounts',
  announcements: 'Announcements',
  bible_studies: 'Bible Study',
  sabbath_programme: 'Sabbath Programme',
  prayers: 'Prayer Requests',
  donations: 'Donations',
  events: 'Manage Events',
  sermons: 'Manage Sermons',
  audit: 'Audit Trail',
  projects: 'Manage Projects',
  gallery: 'Manage Gallery',
  lessons: 'Lesson Videos',
};

type SabbathProgrammeForm = {
  date: string;
  theme: string;
  sabbathSchoolTime: string;
  superintendent: string;
  lessonTitle: string;
  lessonNumber: number;
  divineServiceTime: string;
  songLeader: string;
  openingPrayer: string;
  sermonPreacher: string;
  sermonTitle: string;
  sermonKeyText: string;
  sermonSynopsis: string;
  sermonRole: string;
  closingPrayer: string;
  benediction: string;
  afternoonTime: string;
  afternoonLeader: string;
};

const applySabbathProgrammeForm = (base: SabbathProgram, form: SabbathProgrammeForm): SabbathProgram => ({
  ...base,
  date: form.date,
  theme: form.theme,
  sabbathSchool: {
    ...base.sabbathSchool,
    time: form.sabbathSchoolTime,
    superintendent: form.superintendent,
    lessonTitle: form.lessonTitle,
    lessonNumber: Number(form.lessonNumber) || 1,
  },
  divineService: {
    ...base.divineService,
    time: form.divineServiceTime,
    songLeader: form.songLeader,
    openingPrayer: form.openingPrayer,
  },
  sermon: {
    ...base.sermon,
    preacher: form.sermonPreacher,
    title: form.sermonTitle,
    keyText: form.sermonKeyText,
    synopsis: form.sermonSynopsis,
    role: form.sermonRole,
  },
  closingPrayer: form.closingPrayer,
  benediction: form.benediction,
  afternoonProgramme: {
    ...base.afternoonProgramme,
    time: form.afternoonTime,
    leader: form.afternoonLeader,
  },
});

const toSabbathProgrammeForm = (programme: SabbathProgram): SabbathProgrammeForm => ({
  date: programme.date,
  theme: programme.theme,
  sabbathSchoolTime: programme.sabbathSchool.time,
  superintendent: programme.sabbathSchool.superintendent,
  lessonTitle: programme.sabbathSchool.lessonTitle,
  lessonNumber: programme.sabbathSchool.lessonNumber,
  divineServiceTime: programme.divineService.time,
  songLeader: programme.divineService.songLeader,
  openingPrayer: programme.divineService.openingPrayer,
  sermonPreacher: programme.sermon.preacher,
  sermonTitle: programme.sermon.title,
  sermonKeyText: programme.sermon.keyText,
  sermonSynopsis: programme.sermon.synopsis,
  sermonRole: programme.sermon.role,
  closingPrayer: programme.closingPrayer,
  benediction: programme.benediction,
  afternoonTime: programme.afternoonProgramme.time,
  afternoonLeader: programme.afternoonProgramme.leader,
});

// --- Initial Fallback Mock Data ---
const DEFAULT_LEADERS = [
  { name: "Kagwa Rogers", role: "Lead Pastor", photo: "/images/kagwa-rogers.jpg", bio: "Pastor Kagwa Rogers has served the global SDA community for many years and has a deep passion for student chaplaincy." },
  { name: "Khear Hamis", role: "Assistant Pastor", photo: "", bio: "A dedicated servant of the church, focused on campus outreach and counselling." },
  { name: "Niyomugabo Francis", role: "First Elder", photo: "", bio: "Coordinates board operations, spiritual fellowships, and guest relations for our international members." },
  { name: "Nabatanzi Faith", role: "Head Deaconess", photo: "", bio: "Leads a team of deaconesses focused on hospitality, visitation, and church neatness." },
  { name: "Twine Enok", role: "Youth Leader", photo: "", bio: "Organizes student programs, choir coordination, and voluntary missions around the campus." },
  { name: "Grace Kente", role: "Pathfinder Director", photo: "", bio: "Guides our pathfinders and adventurers in skill building, community outreach, and scripture memorization." },
  { name: "Ndagire Recheal", role: "Treasurer", photo: "/images/ndagire-recheal.jpg", bio: "Ensures meticulous accounting practices, budget compliance, and transparent reporting." },
  { name: "Kwagala Esther", role: "Church Clerk", photo: "", bio: "Handles memberships, transfers, announcements, and board meeting minutes." }
];

const DEFAULT_MINISTRIES = [
  {
    id: "youth",
    title: "Youth Ministry",
    short: "Empowering young professionals and students.",
    desc: "Our Youth Ministry provides a space where students connect, share, and grow. We organize campouts, vespers, and forums on mental health, careers, and relationships.",
    icon: <Users size={24} />
  },
  {
    id: "campus",
    title: "Campus Ministry",
    short: "Reaching student hearts at Bugema.",
    desc: "Being situated right inside Bugema University, we coordinate Bible classes, Friday evening vespers, cell group interactions, and baptismal instruction specifically tailored for university students.",
    icon: <GraduationCap size={24} />
  },
  {
    id: "music",
    title: "Music Ministry",
    short: "Worship through international harmonies.",
    desc: "We host multiple choirs representing various linguistic and regional groups. Join our praise band, dynamic orchestra, or the Seattle International Choir.",
    icon: <Music size={24} />
  },
  {
    id: "pathfinders",
    title: "Pathfinders & Adventurers",
    short: "Training children and teens for God.",
    desc: "An active scouting-style club focused on physical skills, nature studies, camping, survival guides, and foundational Bible learning for ages 6-18.",
    icon: <MapIcon size={24} />
  },
  {
    id: "women",
    title: "Women's Ministries",
    short: "Nurturing faith, family, and sisterhood.",
    desc: "Providing opportunities for spiritual growth, fellowship, and mentoring among women of all backgrounds. We host prayer circles, cooking workshops, and charity outreaches.",
    icon: <Heart size={24} />
  },
  {
    id: "prayer",
    title: "Prayer Ministry",
    short: "Standing in the gap for our community.",
    desc: "Our prayer warriors maintain a chain of prayer. We gather for prayer requests submitted online or physically, hosting early morning devotions and specialized fasting sessions.",
    icon: <HandHelping size={24} />
  }
];

const DEFAULT_SERMONS: Sermon[] = [
  { id: 1, title: "The Sanctuary & The Sanctuary Guard", speaker: "Kagwa Rogers", date: "2026-07-11", passage: "Hebrews 8:1-5", category: "Sabbath Sermons" },
  { id: 2, title: "Finding Rest in a Restless Campus", speaker: "Khear Hamis", date: "2026-07-04", passage: "Matthew 11:28-30", category: "Sabbath Sermons" },
  { id: 3, title: "Unshakable Faith in Prophetic Times", speaker: "Elder Caleb Ndikumana", date: "2026-06-20", passage: "Daniel 2:44", category: "Week of Prayer" },
  { id: 4, title: "Stepping into the Waters of Covenant", speaker: "Kagwa Rogers", date: "2026-06-13", passage: "Romans 6:3-4", category: "Bible Studies" }
];

const DEFAULT_EVENTS: ChurchEvent[] = [
  { id: 1, title: "Bugema University Camp Meeting", date: "2026-08-15", location: "Main Assembly Pavilion", desc: "A week-long spiritual feast under the theme 'Behold, He Comes!' featuring international speakers, choirs, and community services." },
  { id: 2, title: "Youth Week of Devotion", date: "2026-09-05", location: "SIC Chapel", desc: "Interactive evenings centered on student mental wellness, career integrity, and spiritual stewardship." },
  { id: 3, title: "Choir Grand Concert", date: "2026-09-26", location: "University Auditorium", desc: "A praise celebration representing choral music from 10 different countries." }
];

const BIBLE_VERSES = [
  { text: "Growing in grace, and in the knowledge of our Lord and Saviour Jesus Christ.", ref: "2 Peter 3:18" },
  { text: "Commit your way to the Lord; trust in him, and he will act.", ref: "Psalm 37:5" },
  { text: "Watch, stand fast in the faith, be brave, be strong. Let all that you do be done with love.", ref: "1 Corinthians 16:13-14" },
  { text: "Remember the Sabbath day, to keep it holy.", ref: "Exodus 20:8" },
  { text: "For I know the plans I have for you, plans to give you hope and a future.", ref: "Jeremiah 29:11" }
];

const DEFAULT_GALLERY = [
  { album: "Sabbath Worship", title: "Joyful Choirs Singing", img: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600" },
  { album: "Baptism", title: "15 Students Baptized", img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600" },
  { album: "Graduation Sabbath", title: "Blessing the Graduating Class", img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600" },
  { album: "Youth Camp", title: "Hiking & Bible Study", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600" },
  { album: "Choir", title: "International Ensemble Rehearsal", img: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=600" },
  { album: "Community Outreach", title: "Free Health Checkups Clinic", img: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600" }
];

const DEFAULT_PROJECTS: ChurchProject[] = [
  {
    id: 1,
    title: "Church Sanctuary Construction",
    category: "Construction",
    desc: "We are building a permanent, state-of-the-art sanctuary to replace the current temporary structure at Bugema University. The new building will seat 1,200 members and include a multimedia worship center, sound-proof recording room, and dedicated Sabbath School classrooms.",
    goal_amount: 350000000,
    raised_amount: 127500000,
    image_url: "https://images.unsplash.com/photo-1562521879-0e1d6b0da7de?auto=format&fit=crop&q=80&w=600",
    status: "Active"
  },
  {
    id: 2,
    title: "Student Fellowship & Resource Center",
    category: "Community",
    desc: "A dedicated multi-purpose student hub featuring quiet study rooms, a library of Christian literature, counseling offices, and a commons area for cell group meetings, mentorship programs, and student welfare services.",
    goal_amount: 180000000,
    raised_amount: 62400000,
    image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600",
    status: "Active"
  },
  {
    id: 3,
    title: "Church Outreach Transport Van",
    category: "Outreach",
    desc: "Acquiring a 22-seater church van for weekly outreach programs to surrounding communities, hospital visitations, and transportation of choir groups to events. This will greatly expand our mission reach in Luwero and Mukono districts.",
    goal_amount: 85000000,
    raised_amount: 41200000,
    image_url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=600",
    status: "Active"
  },
  {
    id: 4,
    title: "Solar Power Installation",
    category: "Infrastructure",
    desc: "Installing a 30-panel solar energy system on the church campus to reduce electricity costs, power the media and livestreaming equipment, and ensure uninterrupted worship services during load-shedding periods.",
    goal_amount: 45000000,
    raised_amount: 38900000,
    image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=600",
    status: "Almost Complete"
  },
  {
    id: 5,
    title: "Back to School Initiative",
    category: "Community",
    desc: "Helping vulnerable children in our local community get back to school by providing tuition fees, school supplies, and uniforms. Let's invest in the future of our young ones and show them Christ's love.",
    goal_amount: 15000000,
    raised_amount: 2500000,
    image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600",
    status: "Active"
  },
];

const DEFAULT_BELIEFS = [
  { title: "The Bible", desc: "The Holy Scriptures are the written Word of God, given by divine inspiration. They are the supreme standard of character and test of experience." },
  { title: "The Sabbath", desc: "The seventh day of the week, Sabbath (Saturday), is a holy day of rest, worship, and ministry, established at Creation and kept by Jesus." },
  { title: "Salvation", desc: "In infinite love, God made Christ, who knew no sin, to be sin for us, so that in Him we might be made the righteousness of God." },
  { title: "Second Coming", desc: "The second coming of Christ is the blessed hope of the church, the grand climax of the gospel, when he returns to rescue His people." },
  { title: "Health Message", desc: "Our bodies are temples of the Holy Spirit. We believe in adopting a healthy diet, getting clean air, water, and rest to serve God fully." },
  { title: "Baptism", desc: "By baptism we confess our faith in the death and resurrection of Jesus Christ, and testify of our death to sin and purpose to walk in newness of life." }
];

const DEFAULT_PRAYERS: PrayerRequest[] = [
  {
    id: 1,
    name: "Grace Kemigisha",
    content: "Praying for guidance and peace as I prepare for my final exams at Bugema University this semester.",
    confidential: false,
    follow_up_status: 'assigned',
    care_request_type: 'prayer_partner',
    follow_up_notes: 'Prayer partner assigned for weekly check-ins.'
  },
  {
    id: 2,
    name: "Anonymous",
    content: "Please pray for my mother's quick recovery from a severe malaria infection.",
    confidential: false,
    follow_up_status: 'ongoing',
    care_request_type: 'pastoral_call',
    follow_up_notes: 'Pastoral call completed. Continuing prayer support.'
  },
  {
    id: 3,
    name: "Elder Samuel",
    content: "Let's pray for the upcoming campus camp meeting outreach program to touch many young souls.",
    confidential: false,
    follow_up_status: 'received',
    care_request_type: 'none',
    follow_up_notes: ''
  }
];

const CORE_MISSION_STATEMENT = 'We stand together in prayer, strengthen one another in love, and grow continually in the knowledge of God as one family in Christ.';

const DISCIPLESHIP_PATH = [
  { id: 'pray', title: 'Pray Together', desc: 'Share a request and stand with others in intercession.', route: 'prayer-requests' },
  { id: 'connect', title: 'Connect in Community', desc: 'Build one another through fellowship and care ministries.', route: 'forums' },
  { id: 'grow', title: 'Grow in Knowledge', desc: 'Join Bible study and engage sermons with purpose.', route: 'bible-study' },
  { id: 'serve', title: 'Serve on Mission', desc: 'Turn faith into action through outreach and ministry service.', route: 'community-outreach' },
  { id: 'mentor', title: 'Mentor Others', desc: 'Share testimony and disciple the next believer.', route: 'testimonies' },
];

const CARE_REQUEST_LABELS: Record<string, string> = {
  none: 'No additional care needed',
  pastoral_call: 'Pastoral call',
  elder_visit: 'Elder visit',
  counseling: 'Counseling support',
  prayer_partner: 'Prayer partner',
};

const FOLLOW_UP_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  assigned: 'Assigned',
  contacted: 'Contacted',
  ongoing: 'Ongoing Support',
  completed: 'Completed',
};

const TESTIMONY_TYPE_LABELS: Record<string, string> = {
  prayer_answered: 'Prayer Answered',
  spiritual_growth: 'Spiritual Growth',
  community_support: 'Community Support',
  healing_restoration: 'Healing & Restoration',
  outreach_impact: 'Outreach Impact',
};

const TESTIMONY_NEXT_STEP_LABELS: Record<string, string> = {
  none: 'No follow-up needed',
  mentor: 'Connect to Mentor',
  growth_class: 'Invite to Growth Class',
  prayer_team: 'Connect to Prayer Team',
  service_team: 'Connect to Service Team',
};

const LESSON_VIDEOS = [
  { week: 1, title: "Week 1: The Foundation of God's Kingdom", date: "2026-07-04", youtubeId: "dQw4w9WgXcQ", desc: "Understanding the eternal covenant and how the sanctuary services reflect the character of God." },
  { week: 2, title: "Week 2: The Sanctuary and the Covenant", date: "2026-07-11", youtubeId: "dQw4w9WgXcQ", desc: "A deep dive into the earthly sanctuary symbols and their fulfillment in the ministry of Jesus." },
  { week: 3, title: "Week 3: The Sanctuary Guard & The Holy Place", date: "2026-07-18", youtubeId: "dQw4w9WgXcQ", desc: "Exploring the role of the priests and the daily services in the outer court and the holy place." },
  { week: 4, title: "Week 4: Judgment and the Most Holy Place", date: "2026-07-25", youtubeId: "dQw4w9WgXcQ", desc: "Understanding the Day of Atonement, the cleansing of the sanctuary, and the work of our High Priest." },
];

const IS_ADMIN_ENTRY = typeof window !== 'undefined' && /\/admin\.html$/i.test(window.location.pathname);

const PUBLIC_ROUTE_WHITELIST = new Set([
  'home',
  'about',
  'sermons',
  'sabbath-programme',
  'hymns',
  'watch-live',
  'prayer-requests',
  'testimonies',
  'bible-study',
  'forums',
  'blog',
  'dashboard',
  'events',
  'ministries',
  'community-outreach',
  'projects',
  'gallery',
  'announcements',
  'go-back-to-school',
  'contact',
  'staff',
  'give',
  'youth-ministry',
  'campus-ministry',
  'music-ministry',
  'pathfinders-ministry',
  'women-ministry',
  'prayer-ministry',
  'analytics',
]);

const ADMIN_ROUTE_WHITELIST = new Set([
  'admin',
]);

const ROUTE_WHITELIST = IS_ADMIN_ENTRY ? ADMIN_ROUTE_WHITELIST : PUBLIC_ROUTE_WHITELIST;

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(IS_ADMIN_ENTRY ? 'admin' : 'home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuSearch, setMobileMenuSearch] = useState('');
  const [mobileMenuSectionOpen, setMobileMenuSectionOpen] = useState<string>('home-about');

  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user_token'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  // Core Data States
  const [sermons, setSermons] = useState<Sermon[]>(DEFAULT_SERMONS);
  const [events, setEvents] = useState<ChurchEvent[]>(DEFAULT_EVENTS);
  const [prayers, setPrayers] = useState<PrayerRequest[]>(DEFAULT_PRAYERS);
  const [bibleStudies, setBibleStudies] = useState<BibleStudy[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [testimonies, setTestimonies] = useState<TestimonyItem[]>([]);
  const [projects, setProjects] = useState<ChurchProject[]>(DEFAULT_PROJECTS);
  const [selectedProjectFund, setSelectedProjectFund] = useState('Building Fund');
  const [logs, setLogs] = useState<ActivityLog[]>([{ time: new Date().toLocaleTimeString(), msg: "App loaded." }]);

  // Interactive View States
  const [dailyVerse, setDailyVerse] = useState(BIBLE_VERSES[0]);
  const [selectedSermonCat, setSelectedSermonCat] = useState('all');
  const [sermonSearchTerm, setSermonSearchTerm] = useState('');
  const [sermonPage, setSermonPage] = useState(1);
  const [selectedGalleryAlbum, setSelectedGalleryAlbum] = useState('all');
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryCloudAvailable, setGalleryCloudAvailable] = useState(isSupabaseConfigured);
  const [galleryUploadForm, setGalleryUploadForm] = useState({ title: '', album: 'Sabbath Worship' });
  const [galleryUploadFile, setGalleryUploadFile] = useState<File | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [selectedLessonWeek, setSelectedLessonWeek] = useState(3);
  const [lessonVideos, setLessonVideos] = useState<any[]>(LESSON_VIDEOS);
  const [addLessonForm, setAddLessonForm] = useState({ week: '', title: '', date: '', youtube_id: '', desc: '' });
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // ── Weekly Discipleship State ──────────────────────────────────────────────
  const getWeekKey = () => {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    return 'week-' + Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7) + '-' + d.getFullYear();
  };

  const [checklist, setChecklist] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('sic_checklist_' + getWeekKey()) || '{}'); } catch { return {}; }
  });

  const [pollVoted, setPollVoted] = useState<string|null>(() =>
    localStorage.getItem('sic_poll_' + getWeekKey())
  );
  const [pollResults, setPollResults] = useState<Record<string,number>>(() => {
    try { return JSON.parse(localStorage.getItem('sic_poll_results') || '{"Hebrews":18,"Romans":14,"Genesis":9,"John":22}'); } catch { return {"Hebrews":18,"Romans":14,"Genesis":9,"John":22}; }
  });

  const [praiseWall, setPraiseWall] = useState<{name:string;text:string;time:string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('sic_praise_wall') || '[]'); } catch { return []; }
  });
  const [praiseForm, setPraiseForm] = useState({ name: '', text: '' });

  const [prayerSupport, setPrayerSupport] = useState<Record<number,number>>(() => {
    try { return JSON.parse(localStorage.getItem('sic_prayer_support') || '{}'); } catch { return {}; }
  });
  const [prayerSupportedIds, setPrayerSupportedIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('sic_prayer_supported_ids') || '[]'); } catch { return []; }
  });

  const [quizAnswers, setQuizAnswers] = useState<Record<number,string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const weekKey = getWeekKey();
  const [weeklyPromptDismissed, setWeeklyPromptDismissed] = useState<boolean>(() =>
    localStorage.getItem('sic_weekly_prompt_' + getWeekKey()) === 'dismissed'
  );
  const [weeklyEssentialsProgress, setWeeklyEssentialsProgress] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('sic_weekly_essentials_' + getWeekKey()) || '{}');
    } catch {
      return {};
    }
  });

  const CHECKLIST_ITEMS = [
    { id: 'sabbath', label: 'Attended Sabbath School', icon: '📖' },
    { id: 'sermon', label: 'Listened to a Sermon', icon: '🎙️' },
    { id: 'prayer', label: 'Personal Prayer Time', icon: '🙏' },
    { id: 'devotion', label: 'Daily Devotion (5 Days)', icon: '📔' },
    { id: 'verse', label: 'Memorized a Scripture Verse', icon: '✝️' },
    { id: 'tithe', label: 'Returned Tithe & Offering', icon: '💰' },
    { id: 'outreach', label: 'Shared Faith with Someone', icon: '🌍' },
  ];

  const POLL_OPTIONS = ['Hebrews', 'Romans', 'Genesis', 'John'];

  const WEEKLY_ESSENTIALS = [
    { id: 'programme', label: 'Check this Sabbath programme', route: 'sabbath-programme', cta: 'Open Programme' },
    { id: 'notices', label: 'Read weekly church notices', route: 'announcements', cta: 'Read Notices' },
    { id: 'prayer', label: 'Submit or support a prayer request', route: 'prayer-requests', cta: 'Prayer Room' },
    { id: 'sermon', label: 'Listen to this week\'s sermon', route: 'sermons', cta: 'Open Sermons' },
  ];

  const QUIZ_QUESTIONS = [
    { q: 'What day is the Seventh-day Adventist Sabbath?', options: ['Friday','Saturday','Sunday','Monday'], answer: 'Saturday' },
    { q: 'Which chapter begins "For God so loved the world..."?', options: ['John 1','John 3','John 11','Romans 8'], answer: 'John 3' },
    { q: 'Complete: "Remember the Sabbath day, to keep it ___"', options: ['blessed','holy','sacred','quiet'], answer: 'holy' },
  ];

  const toggleChecklistItem = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    localStorage.setItem('sic_checklist_' + getWeekKey(), JSON.stringify(updated));
  };

  const completeWeeklyEssential = (id: string, route: string) => {
    const updated = { ...weeklyEssentialsProgress, [id]: true };
    setWeeklyEssentialsProgress(updated);
    localStorage.setItem('sic_weekly_essentials_' + weekKey, JSON.stringify(updated));
    setCurrentRoute(route);
  };

  const dismissWeeklyPrompt = () => {
    setWeeklyPromptDismissed(true);
    localStorage.setItem('sic_weekly_prompt_' + weekKey, 'dismissed');
  };

  const submitPollVote = (option: string) => {
    if (pollVoted) return;
    const updated = { ...pollResults, [option]: ((pollResults[option] || 0) + 1) };
    setPollResults(updated);
    setPollVoted(option);
    localStorage.setItem('sic_poll_results', JSON.stringify(updated));
    localStorage.setItem('sic_poll_' + getWeekKey(), option);
    toast.success('Vote for "' + option + '" recorded! Thank you.');
  };

  const submitPraise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!praiseForm.text.trim()) return;
    const newEntry = { name: praiseForm.name || 'Anonymous', text: praiseForm.text, time: new Date().toLocaleDateString() };
    const updated = [newEntry, ...praiseWall].slice(0, 20);
    setPraiseWall(updated);
    localStorage.setItem('sic_praise_wall', JSON.stringify(updated));
    setPraiseForm({ name: '', text: '' });
    toast.success('Praise added to the wall! 🙌');
  };

  const supportPrayer = (id: number) => {
    if (prayerSupportedIds.includes(id)) return;
    const updated = { ...prayerSupport, [id]: (prayerSupport[id] || 0) + 1 };
    const updatedIds = [...prayerSupportedIds, id];
    setPrayerSupport(updated);
    setPrayerSupportedIds(updatedIds);
    localStorage.setItem('sic_prayer_support', JSON.stringify(updated));
    localStorage.setItem('sic_prayer_supported_ids', JSON.stringify(updatedIds));
    toast.success('You are praying with this person! 🙏');
  };

  const submitQuiz = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, i) => { if (quizAnswers[i] === q.answer) score++; });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  // Modals States
  const [selectedMinistry, setSelectedMinistry] = useState<typeof DEFAULT_MINISTRIES[0] | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<ChurchEvent | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddSermonModal, setShowAddSermonModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editingSermonId, setEditingSermonId] = useState<number | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editingStudyId, setEditingStudyId] = useState<number | null>(null);
  const [editingPrayerId, setEditingPrayerId] = useState<number | null>(null);
  const [editingDonationId, setEditingDonationId] = useState<number | null>(null);
  const [studyDrafts, setStudyDrafts] = useState<Record<number, BibleStudy>>({});
  const [prayerDrafts, setPrayerDrafts] = useState<Record<number, PrayerRequest>>({});
  const [donationDrafts, setDonationDrafts] = useState<Record<number, Donation>>({});

  // Form input states
  const [addEventForm, setAddEventForm] = useState({ title: '', date: '', location: '', desc: '' });
  const [addSermonForm, setAddSermonForm] = useState({ title: '', speaker: '', date: '', passage: '', category: 'Sabbath Sermons' });
  const [studyForm, setStudyForm] = useState({ name: '', email: '', phone: '', country: '', course: '' });
  const [prayerForm, setPrayerForm] = useState<{
    name: string;
    content: string;
    confidential: boolean;
    care_request_type: 'none' | 'pastoral_call' | 'elder_visit' | 'counseling' | 'prayer_partner';
  }>({
    name: '',
    content: '',
    confidential: false,
    care_request_type: 'none',
  });
  const [testimonyForm, setTestimonyForm] = useState({
    title: '',
    content: '',
    testimony_type: 'spiritual_growth',
    next_step: 'none',
    image: '',
  });
  const [donationForm, setDonationForm] = useState({ amount: '', fund: 'Tithe', method: 'Mobile Money' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [eventRegForm, setEventRegForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [eventReceipt, setEventReceipt] = useState<EventRegistrationReceipt | null>(null);
  const [donationReceipt, setDonationReceipt] = useState<{ reference: string; amount: number; fund: string } | null>(null);
  const [addProjectForm, setAddProjectForm] = useState({
    title: '',
    category: 'Construction',
    desc: '',
    goal_amount: '',
    raised_amount: '0',
    image_url: '',
    status: 'Active',
    is_published: true,
  });
  const [projectDrafts, setProjectDrafts] = useState<Record<number, {
    title: string;
    category: string;
    desc: string;
    goal_amount: string;
    raised_amount: string;
    image_url: string;
    status: string;
    is_published: boolean;
  }>>({});
  const [projectHistoryById, setProjectHistoryById] = useState<Record<number, ProjectHistoryEntry[]>>({});
  const [openProjectHistoryId, setOpenProjectHistoryId] = useState<number | null>(null);
  const [projectHistoryFilter, setProjectHistoryFilter] = useState<ProjectHistoryActionFilter>('all');
  const [adminAuditEntries, setAdminAuditEntries] = useState<AdminAuditEntry[]>([]);
  const [adminAuditLoading, setAdminAuditLoading] = useState(false);
  const [adminAuditError, setAdminAuditError] = useState('');
  const [adminAuditActionFilter, setAdminAuditActionFilter] = useState<AdminAuditActionFilter>('all');
  const [adminAuditResourceFilter, setAdminAuditResourceFilter] = useState('');

  // Alerts
  const [studySuccess] = useState(false);
  const [prayerSuccess] = useState(false);
  const [donationSuccess] = useState(false);
  const [eventRegSuccess] = useState(false);
  const [contactSuccess] = useState(false);

  // Chat Feed Sim
  const [chatMessages, setChatMessages] = useState([
    { user: "Ruth Atwine", text: "Happy Sabbath everyone! Watching from Kampala." },
    { user: "Kagwa Rogers", text: "Amen, welcome Ruth! Blessed Sabbath." },
    { user: "David Miller", text: "Greetings from Seattle, USA. So glad to tune in today." }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [sabbathProgrammes, setSabbathProgrammes] = useState<SabbathProgram[]>(DEFAULT_SABBATH_PROGRAMMES);
  const [sabbathProgramEditor, setSabbathProgramEditor] = useState('');
  const [sabbathProgramError, setSabbathProgramError] = useState('');
  const [selectedSabbathProgramIndex, setSelectedSabbathProgramIndex] = useState(0);
  const [sabbathProgramForm, setSabbathProgramForm] = useState<SabbathProgrammeForm>(() =>
    toSabbathProgrammeForm(DEFAULT_SABBATH_PROGRAMMES[0])
  );

  // Admin Panel states
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabId>('admin-stats');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(localStorage.getItem('admin_authenticated') === 'true');
  const [isAdminSessionChecking, setIsAdminSessionChecking] = useState(false);
  const [allowedAdminTabs, setAllowedAdminTabs] = useState<AdminTabId[]>(() => {
    try {
      const raw = localStorage.getItem('admin_tabs');
      if (!raw) {
        return ADMIN_TABS.map((tab) => tab.id);
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return ADMIN_TABS.map((tab) => tab.id);
      }
      const known = new Set(ADMIN_TABS.map((tab) => tab.id));
      return parsed.filter((tab: string): tab is AdminTabId => known.has(tab as AdminTabId));
    } catch {
      return ADMIN_TABS.map((tab) => tab.id);
    }
  });
  const [sabbathProgrammeScope, setSabbathProgrammeScope] = useState<SabbathProgrammeScope>(() => {
    const value = localStorage.getItem('sabbath_programme_scope');
    if (value === 'sabbath_school_only' || value === 'none') {
      return value;
    }
    return 'full';
  });
  const [adminLoginForm, setAdminLoginForm] = useState({ username: '', password: '' });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<Array<{ id: number; username: string; email: string; full_name?: string; is_active?: boolean; is_superuser: boolean; department_roles: string[]; sections: string[]; sabbath_programme_scope?: SabbathProgrammeScope }>>([]);
  const [adminAccountsLoading, setAdminAccountsLoading] = useState(false);
  const [adminAccountsError, setAdminAccountsError] = useState('');
  const [creatingAdminAccount, setCreatingAdminAccount] = useState(false);
  const [updatingAdminAccount, setUpdatingAdminAccount] = useState(false);
  const [editingAdminAccountId, setEditingAdminAccountId] = useState<number | null>(null);
  const [accountFreezeModal, setAccountFreezeModal] = useState<null | { id: number; username: string; nextState: boolean }>(null);
  const [accountPasswordModal, setAccountPasswordModal] = useState<null | { id: number; username: string }>(null);
  const [accountPasswordForm, setAccountPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [accountPasswordSubmitting, setAccountPasswordSubmitting] = useState(false);
  const [adminAccountEditForm, setAdminAccountEditForm] = useState({
    full_name: '',
    username: '',
    email: '',
    access_sections: ['bible_studies'] as string[],
    sabbath_programme_scope: 'full' as SabbathProgrammeScope,
  });
  const [adminAccountForm, setAdminAccountForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    department_role: '',
    access_sections: ['bible_studies'],
    sabbath_programme_scope: 'full' as SabbathProgrammeScope,
  });

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: 1, title: "Baptism Service — This Sabbath", body: "We will have a special baptism service this Sabbath, 19th July. All baptismal candidates should arrive by 8:30 AM for final preparation.", date: "2026-07-17", priority: "high", icon: "💧" },
    { id: 2, title: "Church Choir Practice", body: "All choir members are reminded of the special combined rehearsal on Thursday evening at 6:00 PM in the main sanctuary. International Choir to attend.", date: "2026-07-16", priority: "normal", icon: "🎶" },
    { id: 3, title: "Mid-Year Thanksgiving Offering", body: "The 2nd quarter special project offering will be received this Sabbath. You can also give via mobile money or bank transfer. God bless your stewardship.", date: "2026-07-15", priority: "high", icon: "🙌" },
    { id: 4, title: "Campus Outreach — Luwero District", body: "Youth volunteers needed for our community health outreach this coming Sunday. Contact Brother Timothy Omondi to register. Transport will be provided.", date: "2026-07-14", priority: "normal", icon: "🌍" },
    { id: 5, title: "Pathfinder Club Investiture", body: "Pathfinder and Adventurer Club Investiture ceremony is scheduled for Saturday afternoon at 3:00 PM. Parents and guardians are invited to attend.", date: "2026-07-13", priority: "normal", icon: "⭐" },
    { id: 6, title: "New Member Orientation", body: "Welcome to all new members! A special orientation session will be held next Sabbath after the afternoon service. Light refreshments will be served.", date: "2026-07-12", priority: "low", icon: "👋" },
  ]);
  const [addAnnouncementForm, setAddAnnouncementForm] = useState({
    title: '',
    body: '',
    date: '',
    priority: 'normal',
    icon: '📣',
    is_published: true,
  });
  const getRouteFromHash = (): string | null => {
    const raw = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (!raw) return null;
    return ROUTE_WHITELIST.has(raw) ? raw : null;
  };

  useEffect(() => {
    const syncRouteFromHash = () => {
      if (IS_ADMIN_ENTRY) {
        setCurrentRoute((prev) => (prev === 'admin' ? prev : 'admin'));
        if (window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() !== 'admin') {
          window.history.replaceState(null, '', '#/admin');
        }
        return;
      }

      const hashRoute = getRouteFromHash();
      if (!hashRoute) return;
      setCurrentRoute((prev) => (prev === hashRoute ? prev : hashRoute));
    };

    syncRouteFromHash();
    window.addEventListener('hashchange', syncRouteFromHash);
    return () => window.removeEventListener('hashchange', syncRouteFromHash);
  }, []);

  useEffect(() => {
    if (IS_ADMIN_ENTRY && currentRoute !== 'admin') {
      setCurrentRoute('admin');
      return;
    }

    const currentHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (currentHash !== currentRoute) {
      window.history.replaceState(null, '', `#/${currentRoute}`);
    }
  }, [currentRoute]);

  useEffect(() => {
    if (IS_ADMIN_ENTRY) {
      if (window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() !== 'admin') {
        window.history.replaceState(null, '', '#/admin');
      }
      return;
    }

    const rawHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (rawHash === 'admin') {
      window.location.assign('/admin.html#/admin');
      return;
    }

    if (window.location.hash && !getRouteFromHash()) {
      window.history.replaceState(null, '', '#/home');
      if (currentRoute !== 'home') {
        setCurrentRoute('home');
      }
    };
  }, []);

  // --- API Sync on Load ---
  useEffect(() => {
    fetchSermons();
    fetchEvents();
    fetchPrayers();
    fetchBibleStudies();
    fetchDonations();
    fetchTestimonies();
    fetchProjects();
    fetchGallery();
    fetchLessonVideos();
    fetchSabbathProgrammes();
    fetchAnnouncements();
  }, []);

  // Pre-fill donation fund when navigating to Give from a project
  useEffect(() => {
    if (currentRoute === 'give') {
      setDonationForm(prev => ({ ...prev, fund: selectedProjectFund }));
    }
  }, [currentRoute, selectedProjectFund]);

  useEffect(() => {
    setSermonPage(1);
  }, [selectedSermonCat, sermonSearchTerm]);

  useEffect(() => {
    const titles: Record<string, string> = {
      home: 'Seattle International Church | Bugema University',
      sermons: 'Sermons | Seattle International Church',
      events: 'Events | Seattle International Church',
      give: 'Give | Seattle International Church',
      forums: 'Forums | Seattle International Church',
      blog: 'Blog | Seattle International Church',
      contact: 'Contact | Seattle International Church',
    };
    document.title = titles[currentRoute] || 'Seattle International Church | Bugema University';
  }, [currentRoute]);

  useEffect(() => {
    localStorage.setItem('admin_authenticated', String(isAdminAuthenticated));
    if (!isAdminAuthenticated) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_username');
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    const syncAdminStateAcrossEntries = (event: StorageEvent) => {
      if (event.key === 'admin_authenticated') {
        setIsAdminAuthenticated(event.newValue === 'true');
      }
      if (event.key === 'admin_token' && !event.newValue) {
        setIsAdminAuthenticated(false);
      }
      if (event.key === 'user_token' && !event.newValue) {
        setIsLoggedIn(false);
        setUserEmail('');
      }
      if (event.key === 'user_token' && event.newValue) {
        setIsLoggedIn(true);
      }
      if (event.key === 'user_email') {
        setUserEmail(event.newValue || '');
      }
    };

    window.addEventListener('storage', syncAdminStateAcrossEntries);
    return () => window.removeEventListener('storage', syncAdminStateAcrossEntries);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileMenuSearch('');
    setMobileMenuSectionOpen('home-about');
    setOpenDropdown(null);
  };

  const goToRouteFromMobile = (route: string) => {
    setCurrentRoute(route);
    closeMobileMenu();
  };

  const mobileMenuSections: Array<{
    id: string;
    title: string;
    subtitle: string;
    items: Array<{ label: string; route: string }>;
  }> = [
    {
      id: 'home-about',
      title: 'Home & About',
      subtitle: 'Start here, know the church, and plan your first visit.',
      items: [
        { label: 'Home', route: 'home' },
        { label: 'Our Church', route: 'about' },
        { label: 'Leadership & Staff', route: 'staff' },
        { label: 'Contact Us', route: 'contact' },
      ],
    },
    {
      id: 'worship',
      title: 'Worship',
      subtitle: 'Gather for worship through sermons, programme, hymns, and live service.',
      items: [
        { label: 'Sermon Archive', route: 'sermons' },
        { label: 'Sabbath Programme', route: 'sabbath-programme' },
        { label: 'Hymns', route: 'hymns' },
        { label: 'Watch Live', route: 'watch-live' },
      ],
    },
    {
      id: 'prayer',
      title: 'Prayer',
      subtitle: 'Stand together in prayer and encourage others through testimonies.',
      items: [
        { label: 'Prayer Requests', route: 'prayer-requests' },
        { label: 'Testimonies', route: 'testimonies' },
      ],
    },
    {
      id: 'growth',
      title: 'Growth',
      subtitle: 'Grow in biblical knowledge and discipleship community.',
      items: [
        { label: 'Bible Study', route: 'bible-study' },
        { label: 'Forums', route: 'forums' },
        { label: 'Blog', route: 'blog' },
        { label: 'Member Dashboard', route: 'dashboard' },
      ],
    },
    {
      id: 'community',
      title: 'Community',
      subtitle: 'Serve, connect, and join mission-focused outreach.',
      items: [
        { label: 'Events', route: 'events' },
        { label: 'Ministries', route: 'ministries' },
        { label: 'Community Outreach', route: 'community-outreach' },
        { label: 'Projects', route: 'projects' },
        { label: 'Gallery', route: 'gallery' },
        { label: 'Notices', route: 'announcements' },
        { label: 'Go Back to School', route: 'go-back-to-school' },
      ],
    },
  ];

  const searchTerm = mobileMenuSearch.trim().toLowerCase();
  const filteredMobileSections = mobileMenuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.label.toLowerCase().includes(searchTerm)),
    }))
    .filter((section) => section.items.length > 0);

  const openFirstSearchResult = () => {
    const first = filteredMobileSections[0]?.items[0];
    if (first) {
      goToRouteFromMobile(first.route);
    }
  };

  useEffect(() => {
    setSabbathProgramEditor(JSON.stringify(sabbathProgrammes, null, 2));
  }, [sabbathProgrammes]);

  useEffect(() => {
    if (sabbathProgrammes.length === 0) {
      return;
    }

    const safeIndex = Math.min(selectedSabbathProgramIndex, sabbathProgrammes.length - 1);
    if (safeIndex !== selectedSabbathProgramIndex) {
      setSelectedSabbathProgramIndex(safeIndex);
      return;
    }

    setSabbathProgramForm(toSabbathProgrammeForm(sabbathProgrammes[safeIndex]));
  }, [sabbathProgrammes, selectedSabbathProgramIndex]);

  useEffect(() => {
    const nextDrafts: Record<number, {
      title: string;
      category: string;
      desc: string;
      goal_amount: string;
      raised_amount: string;
      image_url: string;
      status: string;
      is_published: boolean;
    }> = {};
    projects.forEach((proj) => {
      nextDrafts[proj.id] = {
        title: proj.title,
        category: proj.category,
        desc: proj.desc,
        goal_amount: String(proj.goal_amount),
        raised_amount: String(proj.raised_amount),
        image_url: proj.image_url || '',
        status: proj.status,
        is_published: proj.is_published !== false,
      };
    });
    setProjectDrafts(nextDrafts);
  }, [projects]);

  const triggerLog = (msg: string) => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev]);
  };

  const getAdminAuthHeaders = (): HeadersInit => {
    const adminToken = localStorage.getItem('admin_token');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (adminToken) {
      headers['Authorization'] = `Token ${adminToken}`;
    }
    return headers;
  };

  const normalizeEditorialText = (text: string): string => {
    return text
      .replace(/\bSeatle\b/gi, 'Seattle')
      .replace(/\bJhon\b/gi, 'John')
      .replace(/\bPr\.?\s+/gi, 'Pastor ')
      .replace(/Come here listen to the word of God/gi, 'Join us as we worship and listen to the Word of God.')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const normalizeSermon = (item: Sermon): Sermon => ({
    ...item,
    title: normalizeEditorialText(item.title),
    speaker: normalizeEditorialText(item.speaker),
    passage: normalizeEditorialText(item.passage),
    category: normalizeEditorialText(item.category),
  });

  const normalizeEvent = (item: ChurchEvent): ChurchEvent => ({
    ...item,
    title: normalizeEditorialText(item.title),
    location: normalizeEditorialText(item.location),
    desc: normalizeEditorialText(item.desc),
  });

  const openEventEditor = (item: ChurchEvent) => {
    setEditingEventId(item.id);
    setAddEventForm({ title: item.title, date: item.date, location: item.location, desc: item.desc });
    setShowAddEventModal(true);
  };

  const openSermonEditor = (item: Sermon) => {
    setEditingSermonId(item.id);
    setAddSermonForm({ title: item.title, speaker: item.speaker, date: item.date, passage: item.passage, category: item.category });
    setShowAddSermonModal(true);
  };

  const openAnnouncementEditor = (item: Announcement) => {
    setEditingAnnouncementId(item.id);
    setAddAnnouncementForm({
      title: item.title,
      body: item.body,
      date: item.scheduled_publish || item.date,
      priority: item.priority,
      icon: item.icon,
      is_published: item.is_published !== false,
    });
    setActiveAdminTab('admin-announcements');
  };

  const openLessonEditor = (item: { id?: number; week: number; title: string; date: string; youtubeId: string; desc: string }) => {
    if (!item.id) return;
    setEditingLessonId(item.id);
    setAddLessonForm({ week: String(item.week), title: item.title, date: item.date, youtube_id: item.youtubeId, desc: item.desc });
    setActiveAdminTab('admin-lessons');
  };

  const fetchSermons = async () => {
    try {
      const res = await fetch(`${API_URL}/sermons/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setSermons(list.length > 0 ? list.map((s: Sermon) => normalizeSermon(s)) : DEFAULT_SERMONS.map(normalizeSermon));
      }
    } catch {
      // Keep fallback data
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/events/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setEvents(list.length > 0 ? list.map((e: ChurchEvent) => normalizeEvent(e)) : DEFAULT_EVENTS.map(normalizeEvent));
      }
    } catch {
      // Keep fallback data
    }
  };

  const fetchPrayers = async () => {
    try {
      const res = await fetch(`${API_URL}/prayers/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setPrayers(list.length > 0 ? list : DEFAULT_PRAYERS);
      }
    } catch {
      // Local fallback
    }
  };

  const fetchBibleStudies = async () => {
    try {
      const res = await fetch(`${API_URL}/bible-studies/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setBibleStudies(list);
      }
    } catch {
      // Local fallback
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch(`${API_URL}/donations/`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        const normalized = list.map((item: any) => ({
          ...item,
          amount: Number(item.amount),
        }));
        setDonations(normalized);
      }
    } catch {
      // Local fallback
      setDonations([]);
    }
  };

  const fetchProjects = async (adminMode = false) => {
    try {
      const res = await fetch(`${API_URL}/projects/`, {
        headers: adminMode ? getAdminAuthHeaders() : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        const normalized = list.map((item: any) => ({
          ...item,
          goal_amount: Number(item.goal_amount),
          raised_amount: Number(item.raised_amount),
        }));
        setProjects(normalized.length > 0 ? normalized : DEFAULT_PROJECTS);
      }
    } catch {
      // Local fallback
    }
  };

  const fetchProjectHistory = async (projectId: number) => {
    const res = await fetch(`${API_URL}/projects/${projectId}/history/`, {
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Could not load project history.');
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results ?? []);
    setProjectHistoryById((prev) => ({ ...prev, [projectId]: list }));
  };

  const mapAnnouncement = (item: any): Announcement => {
    const priorityFromCategory = item?.scheduled_publish ? 'high' : 'normal';
    return {
      id: item.id,
      title: item.title,
      body: item.content,
      date: item.scheduled_publish ? String(item.scheduled_publish).slice(0, 10) : (item.created_at ? String(item.created_at).slice(0, 10) : ''),
      scheduled_publish: item.scheduled_publish ? String(item.scheduled_publish).slice(0, 10) : '',
      priority: (item.priority as 'high' | 'normal' | 'low') || priorityFromCategory,
      icon: item.featured_image || '📣',
      slug: item.slug,
      is_published: item.is_published,
    };
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/blog/by_category/?category=announcement`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        if (list.length > 0) {
          setAnnouncements(list.map(mapAnnouncement));
        }
      }
    } catch {
      // Keep fallback notices
    }
  };

  const fetchAdminAnnouncements = async () => {
    const res = await fetch(`${API_URL}/blog/by_category/?category=announcement`, {
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Could not load announcements.');
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.results ?? []);
    setAnnouncements(list.map(mapAnnouncement));
  };

  const fetchAdminAuditLogs = async (
    actionFilter: AdminAuditActionFilter = adminAuditActionFilter,
    resourceFilter: string = adminAuditResourceFilter
  ) => {
    setAdminAuditLoading(true);
    setAdminAuditError('');
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }
      if (resourceFilter.trim()) {
        params.set('resource_type', resourceFilter.trim());
      }
      const query = params.toString();
      const res = await fetch(`${API_URL}/admin-audit-logs/${query ? `?${query}` : ''}`, {
        headers: getAdminAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Could not load admin audit logs.');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setAdminAuditEntries(list);
    } catch {
      setAdminAuditError('Unable to fetch audit trail data from backend.');
    } finally {
      setAdminAuditLoading(false);
    }
  };

  const fetchAdminAccounts = async () => {
    setAdminAccountsLoading(true);
    setAdminAccountsError('');
    try {
      const res = await fetch(`${API_URL}/admin/users/`, {
        headers: getAdminAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error();
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAdminAccounts(list);
    } catch {
      setAdminAccountsError('Unable to load registration accounts.');
    } finally {
      setAdminAccountsLoading(false);
    }
  };

  const handleCreateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, email, password, access_sections } = adminAccountForm;
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error('Please complete all required account fields.');
      return;
    }
    if (!Array.isArray(access_sections) || access_sections.length === 0) {
      toast.error('Select at least one data access right.');
      return;
    }

    setCreatingAdminAccount(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(adminAccountForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Could not create account.');
        return;
      }
      setAdminAccountForm({
        full_name: '',
        username: '',
        email: '',
        password: '',
        department_role: '',
        access_sections: ['bible_studies'],
        sabbath_programme_scope: 'full',
      });
      await fetchAdminAccounts();
      triggerLog(`Registration account created: ${data?.username || username}`);
      toast.success('Department account created successfully.');
    } catch {
      toast.error('Could not create account.');
    } finally {
      setCreatingAdminAccount(false);
    }
  };

  const openEditAdminAccount = (account: { id: number; full_name?: string; username: string; email: string; sections: string[]; sabbath_programme_scope?: SabbathProgrammeScope; is_superuser: boolean }) => {
    setEditingAdminAccountId(account.id);
    setAdminAccountEditForm({
      full_name: account.full_name || '',
      username: account.username,
      email: account.email,
      access_sections: account.sections.length > 0 ? account.sections : ['bible_studies'],
      sabbath_programme_scope: account.sabbath_programme_scope || 'full',
    });
  };

  const cancelEditAdminAccount = () => {
    setEditingAdminAccountId(null);
  };

  const handleUpdateAdminAccount = async (accountId: number) => {
    if (!adminAccountEditForm.username.trim() || !adminAccountEditForm.email.trim()) {
      toast.error('Username and email are required.');
      return;
    }
    if (adminAccountEditForm.access_sections.length === 0) {
      toast.error('Select at least one data access right.');
      return;
    }

    setUpdatingAdminAccount(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          id: accountId,
          ...adminAccountEditForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Could not update account.');
        return;
      }
      await fetchAdminAccounts();
      setEditingAdminAccountId(null);
      triggerLog(`Account updated: ${data?.username || accountId}`);
      toast.success('Account updated successfully.');
    } catch {
      toast.error('Could not update account.');
    } finally {
      setUpdatingAdminAccount(false);
    }
  };

  const handleToggleFreezeAccount = async (account: { id: number; username: string; is_active?: boolean; is_superuser: boolean }) => {
    const nextState = !(account.is_active !== false);
    setAccountFreezeModal({ id: account.id, username: account.username, nextState });
  };

  const confirmToggleFreezeAccount = async () => {
    if (!accountFreezeModal) {
      return;
    }

    const { id, username, nextState } = accountFreezeModal;

    try {
      const res = await fetch(`${API_URL}/admin/users/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ id, is_active: nextState }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Could not update account status.');
        return;
      }
      await fetchAdminAccounts();
      triggerLog(`Account ${nextState ? 'unfrozen' : 'frozen'}: ${username}`);
      toast.success(`Account ${nextState ? 'unfrozen' : 'frozen'} successfully.`);
      setAccountFreezeModal(null);
    } catch {
      toast.error('Could not update account status.');
    }
  };

  const handleResetAccountPassword = async (account: { id: number; username: string; is_superuser: boolean }) => {
    setAccountPasswordModal({ id: account.id, username: account.username });
    setAccountPasswordForm({ password: '', confirmPassword: '' });
  };

  const confirmResetAccountPassword = async () => {
    if (!accountPasswordModal) {
      return;
    }

    const nextPassword = accountPasswordForm.password.trim();
    if (nextPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (nextPassword !== accountPasswordForm.confirmPassword.trim()) {
      toast.error('Password confirmation does not match.');
      return;
    }

    setAccountPasswordSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ id: accountPasswordModal.id, new_password: nextPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Could not reset password.');
        return;
      }
      triggerLog(`Password reset for account: ${accountPasswordModal.username}`);
      toast.success('Password reset successfully.');
      setAccountPasswordModal(null);
      setAccountPasswordForm({ password: '', confirmPassword: '' });
    } catch {
      toast.error('Could not reset password.');
    } finally {
      setAccountPasswordSubmitting(false);
    }
  };

  const normalizeSabbathProgramme = (item: any): SabbathProgram | null => {
    const content = item?.content;
    if (!content || typeof content !== 'object') {
      return null;
    }
    return {
      ...content,
      date: content.date || item.service_date,
      theme: content.theme || item.theme,
    } as SabbathProgram;
  };

  const saveSabbathProgrammesToBackend = async (programmes: SabbathProgram[]) => {
    const res = await fetch(`${API_URL}/sabbath-programmes/`, {
      method: 'GET',
      headers: getAdminAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error('Failed to load existing Sabbath programmes.');
    }

    const existing = await res.json();
    const existingList: any[] = Array.isArray(existing) ? existing : (existing.results ?? []);
    const existingByDate = new globalThis.Map<string, any>(existingList.map((item: any) => [item.service_date, item]));
    const incomingDates = new Set<string>();

    for (const programme of programmes) {
      const serviceDate = new Date(programme.date).toString() !== 'Invalid Date'
        ? new Date(programme.date).toISOString().slice(0, 10)
        : programme.date;
      incomingDates.add(serviceDate);
      const payload = {
        service_date: serviceDate,
        theme: programme.theme,
        content: programme,
        is_published: true,
      };
      const existingItem = existingByDate.get(serviceDate);
      const url = existingItem ? `${API_URL}/sabbath-programmes/${existingItem.id}/` : `${API_URL}/sabbath-programmes/`;
      const method = existingItem ? 'PUT' : 'POST';
      const saveRes = await fetch(url, {
        method,
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) {
        throw new Error(`Failed to save Sabbath programme for ${programme.date}.`);
      }
    }

    for (const item of existingList) {
      if (!incomingDates.has(item.service_date)) {
        await fetch(`${API_URL}/sabbath-programmes/${item.id}/`, {
          method: 'DELETE',
          headers: getAdminAuthHeaders(),
        });
      }
    }
  };

  const fetchSabbathProgrammes = async () => {
    try {
      const res = await fetch(`${API_URL}/sabbath-programmes/`);
      if (!res.ok) {
        throw new Error('Failed to fetch Sabbath programmes.');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      const mapped = list.map(normalizeSabbathProgramme).filter(Boolean) as SabbathProgram[];
      if (mapped.length > 0) {
        setSabbathProgrammes(mapped);
        return;
      }

      if (isAdminAuthenticated) {
        await saveSabbathProgrammesToBackend(DEFAULT_SABBATH_PROGRAMMES);
        setSabbathProgrammes(DEFAULT_SABBATH_PROGRAMMES);
      }
    } catch {
      setSabbathProgrammes(DEFAULT_SABBATH_PROGRAMMES);
    }
  };

  const fetchGallery = async () => {
    if (!isSupabaseConfigured) {
      setGalleryCloudAvailable(false);
      setGalleryLoading(false);
      return;
    }

    setGalleryLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setGalleryCloudAvailable(true);
        setGallery(data as GalleryImage[]);
      } else if (error) {
        setGalleryCloudAvailable(false);
      }
    } catch {
      setGalleryCloudAvailable(false);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchLessonVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/lessons/`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          // Map backend snake_case fields to frontend camelCase
          setLessonVideos(data.map((v: any) => ({
            week: v.week,
            title: v.title,
            date: v.date,
            youtubeId: v.youtube_id,
            desc: v.desc,
            id: v.id,
          })));
          setSelectedLessonWeek(data[0].week);
        }
      }
    } catch {
      // Fallback to LESSON_VIDEOS constant
    }
  };

  const handleAdminDeleteLessonVideo = async (id: number, week: number) => {
    if (!window.confirm(`Remove Week ${week} lesson video?`)) return;
    try {
      await fetch(`${API_URL}/lessons/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      fetchLessonVideos();
    } catch {
      setLessonVideos(prev => prev.filter(v => v.id !== id));
    }
    triggerLog(`Lesson Week ${week} video removed.`);
    toast.success(`Week ${week} video removed.`);
  };

  const handleGalleryUpload = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('Gallery cloud is not configured. Add Supabase keys in frontend .env.');
      return;
    }
    if (!galleryUploadFile) { toast.error('Please select an image file.'); return; }
    setGalleryUploading(true);
    try {
      const fileName = `${Date.now()}-${galleryUploadFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('church-gallery')
        .upload(fileName, galleryUploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('church-gallery').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: insertError } = await supabase
        .from('gallery')
        .insert([{ album: galleryUploadForm.album, title: galleryUploadForm.title, img_url: publicUrl }]);

      if (insertError) throw insertError;

      toast.success('Image uploaded to gallery successfully! 🎉');
      setGalleryUploadForm({ title: '', album: 'Sabbath Worship' });
      setGalleryUploadFile(null);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
      fetchGallery();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Check your Supabase bucket permissions.';
      toast.error(message);
    } finally {
      setGalleryUploading(false);
    }
  };

  // --- Submissions handlers ---

  const handleBibleStudySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/bible-studies/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyForm)
      });
      if (res.ok) {
        fetchBibleStudies();
      } else {
        throw new Error();
      }
    } catch {
      // Local storage sync fallback
      const data = { ...studyForm, id: Date.now(), status: 'Pending Guide Assignment' };
      setBibleStudies(prev => [...prev, data]);
    }
    triggerLog(`New Bible study registered for ${studyForm.name} (${studyForm.course})`);
    toast.success("Thank you for registering! Our team will reach out to you shortly.");
    setStudyForm({ name: '', email: '', phone: '', country: '', course: '' });
  };

  const handlePrayerRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/prayers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prayerForm)
      });
      if (res.ok) {
        fetchPrayers();
      } else {
        throw new Error();
      }
    } catch {
      const data = { ...prayerForm, id: Date.now(), follow_up_status: 'received' as const };
      setPrayers(prev => [...prev, data]);
    }
    triggerLog(`New prayer request submitted by ${prayerForm.name || 'Anonymous'}`);
    toast.success("Your prayer request has been submitted. We are praying with you.");
    setPrayerForm({ name: '', content: '', confidential: false, care_request_type: 'none' });
  };

  async function fetchTestimonies() {
    try {
      const res = await fetch(`${API_URL}/testimonies/`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || [];
      setTestimonies(items);
    } catch {
      setTestimonies([]);
    }
  }

  const handleTestimonySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('user_token');
    if (!token) {
      setShowAuthModal(true);
      toast.error('Please log in to share a testimony.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/testimonies/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(testimonyForm),
      });

      if (!res.ok) {
        throw new Error('Unable to submit testimony at the moment.');
      }
      toast.success('Testimony submitted for pastoral review. Thank you for sharing.');
      triggerLog(`Testimony submitted: ${testimonyForm.title}`);
      setTestimonyForm({
        title: '',
        content: '',
        testimony_type: 'spiritual_growth',
        next_step: 'none',
        image: '',
      });
      fetchTestimonies();
    } catch {
      toast.error('Submission failed. Please try again.');
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(donationForm.amount);
    if (!amountNum || amountNum <= 0) return;
    
    try {
      const res = await fetch(`${API_URL}/donations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, fund: donationForm.fund, method: donationForm.method })
      });
      if (res.ok) {
        fetchDonations();
      } else {
        throw new Error();
      }
    } catch {
      const data = { amount: amountNum, fund: donationForm.fund, method: donationForm.method, id: Date.now(), status: 'Completed Stewardship' };
      setDonations(prev => [...prev, data]);
    }
    triggerLog(`Donation received: ${amountNum.toLocaleString()} UGX for ${donationForm.fund}`);
    const donationReference = `DON-${Date.now()}`;
    setDonationReceipt({ reference: donationReference, amount: amountNum, fund: donationForm.fund });
    toast.success(`Donation of ${amountNum} received for ${donationForm.fund}! Ref: ${donationReference}`);
    setDonationForm({ amount: '', fund: 'Tithe', method: 'Mobile Money' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerLog(`Contact inquiry message received from ${contactForm.name}`);
    toast.success("Your message has been sent successfully.");
    setContactForm({ name: '', email: '', message: '' });
  };

  const handleEventRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent) return;

    const token = localStorage.getItem('user_token');
    if (!token) {
      toast.error('Please log in first to register for events.');
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/events/${registeringEvent.id}/register/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not register for the event.');
      }

      const data = await res.json();
      const reference = data?.id ? `EVR-${String(data.id).padStart(4, '0')}` : `EVR-${Date.now()}`;

      triggerLog(`Registration received from ${eventRegForm.name} for event: ${registeringEvent.title}`);
      toast.success(`Successfully registered. Ref: ${reference}`);
      setEventReceipt({ eventTitle: registeringEvent.title, reference });
      setEventRegForm({ name: '', email: '', phone: '', notes: '' });
      setRegisteringEvent(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not register for the event.';
      toast.error(message);
    }
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { user: "You", text: chatInput.trim() }]);
    setChatInput('');
  };

  // Add Event Action (Admin)
  const handleAdminAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, date, location, desc } = addEventForm;
    try {
      const url = editingEventId ? `${API_URL}/events/${editingEventId}/` : `${API_URL}/events/`;
      const res = await fetch(url, {
        method: editingEventId ? 'PATCH' : 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ title, date, location, desc })
      });
      if (res.ok) {
        fetchEvents();
      } else {
        throw new Error();
      }
    } catch {
      const nextId = events.length > 0 ? Math.max(...events.map(ev => ev.id)) + 1 : 1;
      setEvents(prev => [...prev, { id: nextId, title, date, location, desc }]);
    }
    triggerLog(`Event "${title}" added to calendar.`);
    toast.success("Event added successfully!");
    setAddEventForm({ title: '', date: '', location: '', desc: '' });
    setEditingEventId(null);
    setShowAddEventModal(false);
  };

  // Add Sermon Action (Admin)
  const handleAdminAddSermonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, speaker, date, passage, category } = addSermonForm;
    try {
      const url = editingSermonId ? `${API_URL}/sermons/${editingSermonId}/` : `${API_URL}/sermons/`;
      const res = await fetch(url, {
        method: editingSermonId ? 'PATCH' : 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ title, speaker, date, passage, category })
      });
      if (res.ok) {
        fetchSermons();
      } else {
        throw new Error();
      }
    } catch {
      const nextId = sermons.length > 0 ? Math.max(...sermons.map(s => s.id)) + 1 : 1;
      setSermons(prev => [{ id: nextId, title, speaker, date, passage, category }, ...prev]);
    }
    triggerLog(`Sermon "${title}" added to archive.`);
    toast.success("Sermon added successfully!");
    setAddSermonForm({ title: '', speaker: '', date: '', passage: '', category: 'Sabbath Sermons' });
    setEditingSermonId(null);
    setShowAddSermonModal(false);
  };

  const handleAdminUpdateStudy = async (id: number) => {
    const draft = studyDrafts[id];
    if (!draft) return;

    try {
      const res = await fetch(`${API_URL}/bible-studies/${id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          country: draft.country,
          course: draft.course,
          status: draft.status,
        }),
      });
      if (!res.ok) throw new Error();

      await fetchBibleStudies();
      setEditingStudyId(null);
      triggerLog(`Bible study registration updated: ID ${id}`);
      toast.success('Bible study saved successfully.');
    } catch {
      setBibleStudies((prev) => prev.map((item) => (item.id === id ? { ...item, ...draft } : item)));
      setEditingStudyId(null);
      triggerLog(`Bible study registration updated locally: ID ${id}`);
      toast.success('Bible study saved locally.');
    }
  };

  const handleAdminUpdatePrayer = async (id: number) => {
    const draft = prayerDrafts[id];
    if (!draft) return;

    try {
      const res = await fetch(`${API_URL}/prayers/${id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          name: draft.name,
          content: draft.content,
          confidential: draft.confidential,
          follow_up_status: draft.follow_up_status,
          care_request_type: draft.care_request_type,
          follow_up_notes: draft.follow_up_notes,
        }),
      });
      if (!res.ok) throw new Error();

      await fetchPrayers();
      setEditingPrayerId(null);
      triggerLog(`Prayer request updated: ID ${id}`);
      toast.success('Prayer request saved successfully.');
    } catch {
      setPrayers((prev) => prev.map((item) => (item.id === id ? { ...item, ...draft } : item)));
      setEditingPrayerId(null);
      triggerLog(`Prayer request updated locally: ID ${id}`);
      toast.success('Prayer request saved locally.');
    }
  };

  const handleAdminUpdateDonation = async (id: number) => {
    const draft = donationDrafts[id];
    if (!draft) return;

    const amount = Number(draft.amount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Donation amount must be a valid number.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/donations/${id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          amount,
          fund: draft.fund,
          method: draft.method,
          status: draft.status,
        }),
      });
      if (!res.ok) throw new Error();

      await fetchDonations();
      setEditingDonationId(null);
      triggerLog(`Donation updated: ID ${id}`);
      toast.success('Donation saved successfully.');
    } catch {
      setDonations((prev) => prev.map((item) => (item.id === id ? { ...item, amount, fund: draft.fund, method: draft.method, status: draft.status } : item)));
      setEditingDonationId(null);
      triggerLog(`Donation updated locally: ID ${id}`);
      toast.success('Donation saved locally.');
    }
  };

  // Delete Handlers
  const handleAdminDeleteEvent = async (id: number) => {
    try {
      await fetch(`${API_URL}/events/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      fetchEvents();
    } catch {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    triggerLog(`Removed event ID: ${id}`);
  };

  const handleAdminDeleteSermon = async (id: number) => {
    try {
      await fetch(`${API_URL}/sermons/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      fetchSermons();
    } catch {
      setSermons(prev => prev.filter(s => s.id !== id));
    }
    triggerLog(`Removed sermon ID: ${id}`);
  };

  const handleAdminDeletePrayer = async (id: number) => {
    try {
      await fetch(`${API_URL}/prayers/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      fetchPrayers();
    } catch {
      setPrayers(prev => prev.filter(p => p.id !== id));
    }
    triggerLog(`Deleted Prayer Request ID: ${id}`);
  };

  const handleAdminDeleteStudy = async (id: number) => {
    try {
      await fetch(`${API_URL}/bible-studies/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      fetchBibleStudies();
    } catch {
      setBibleStudies(prev => prev.filter(b => b.id !== id));
    }
    triggerLog(`Deleted Bible Study registration ID: ${id}`);
  };

  const handleAdminAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: addProjectForm.title.trim(),
      category: addProjectForm.category,
      desc: addProjectForm.desc.trim(),
      goal_amount: Number(addProjectForm.goal_amount),
      raised_amount: Number(addProjectForm.raised_amount || '0'),
      image_url: addProjectForm.image_url.trim(),
      status: addProjectForm.status,
      is_published: addProjectForm.is_published,
    };

    if (!payload.title || !payload.desc || !payload.goal_amount || payload.goal_amount <= 0) {
      toast.error('Please provide title, description, and a valid goal amount.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/projects/`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();

      await fetchProjects(true);
      setAddProjectForm({
        title: '',
        category: 'Construction',
        desc: '',
        goal_amount: '',
        raised_amount: '0',
        image_url: '',
        status: 'Active',
        is_published: true,
      });
      triggerLog(`Project added: ${payload.title}`);
      toast.success('Project added successfully.');
    } catch {
      toast.error('Could not create project.');
    }
  };

  const handleAdminUpdateProject = async (id: number) => {
    const draft = projectDrafts[id];
    if (!draft) return;

    const raisedAmount = Number(draft.raised_amount);
    const goalAmount = Number(draft.goal_amount);
    if (Number.isNaN(raisedAmount) || raisedAmount < 0 || Number.isNaN(goalAmount) || goalAmount <= 0) {
      toast.error('Goal and raised amounts must be valid numbers.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/projects/${id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          title: draft.title.trim(),
          category: draft.category,
          desc: draft.desc.trim(),
          goal_amount: goalAmount,
          raised_amount: raisedAmount,
          image_url: draft.image_url.trim(),
          status: draft.status,
          is_published: draft.is_published,
        }),
      });
      if (!res.ok) throw new Error();

      await fetchProjects(true);
      if (openProjectHistoryId === id) {
        await fetchProjectHistory(id);
      }
      triggerLog(`Project updated: ID ${id}`);
      toast.success('Project updated successfully.');
    } catch {
      toast.error('Could not update project.');
    }
  };

  const handleAdminDeleteProject = async (id: number) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/projects/${id}/`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });
      if (!res.ok) throw new Error();

      await fetchProjects(true);
      setProjectHistoryById((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (openProjectHistoryId === id) {
        setOpenProjectHistoryId(null);
      }
      triggerLog(`Project deleted: ID ${id}`);
      toast.success('Project removed.');
    } catch {
      toast.error('Could not delete project.');
    }
  };

  const handleAdminQuickToggleProjectPublish = async (id: number) => {
    const project = projects.find((item) => item.id === id);
    if (!project) return;

    const nextPublished = !(project.is_published !== false);

    try {
      const res = await fetch(`${API_URL}/projects/${id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ is_published: nextPublished }),
      });
      if (!res.ok) throw new Error();

      await fetchProjects(true);
      if (openProjectHistoryId === id) {
        await fetchProjectHistory(id);
      }
      setProjectDrafts((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] ?? {
            title: project.title,
            category: project.category,
            desc: project.desc,
            goal_amount: String(project.goal_amount),
            raised_amount: String(project.raised_amount),
            image_url: project.image_url || '',
            status: project.status,
            is_published: project.is_published !== false,
          }),
          is_published: nextPublished,
        },
      }));
      triggerLog(`${nextPublished ? 'Published' : 'Hidden'} project: ${project.title}`);
      toast.success(nextPublished ? 'Project published to viewers.' : 'Project hidden from viewers.');
    } catch {
      toast.error('Could not update project visibility.');
    }
  };

  const handleToggleProjectHistory = async (id: number) => {
    if (openProjectHistoryId === id) {
      setOpenProjectHistoryId(null);
      return;
    }

    try {
      await fetchProjectHistory(id);
      setOpenProjectHistoryId(id);
    } catch {
      toast.error('Could not load project history.');
    }
  };

  const handleAdminAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, body, date, priority, icon, is_published } = addAnnouncementForm;
    if (!title || !body || !date) {
      toast.error('Please fill in title, message, and date.');
      return;
    }

    try {
      const scheduledPublish = new Date(`${date}T00:00:00`).toISOString();
      const url = editingAnnouncementId ? `${API_URL}/blog/${editingAnnouncementId}/` : `${API_URL}/blog/`;
      const res = await fetch(url, {
        method: editingAnnouncementId ? 'PATCH' : 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          title,
          content: body,
          category: 'announcement',
          featured_image: icon,
          is_published,
          priority,
          scheduled_publish: scheduledPublish,
        })
      });

      if (!res.ok) {
        throw new Error();
      }

      await fetchAdminAnnouncements();
      setAddAnnouncementForm({ title: '', body: '', date: '', priority: 'normal', icon: '📣', is_published: true });
      setEditingAnnouncementId(null);
      triggerLog(`Announcement published: ${title}`);
      toast.success('Announcement saved successfully.');
    } catch {
      toast.error('Could not save announcement.');
    }
  };

  const handleAdminDeleteAnnouncement = async (id: number) => {
    try {
      await fetch(`${API_URL}/blog/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      await fetchAdminAnnouncements();
      triggerLog(`Announcement removed: ${id}`);
      toast.success('Announcement removed.');
    } catch {
      toast.error('Could not remove announcement.');
    }
  };

  const handleAdminAddLessonVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const { week, title, date, youtube_id, desc } = addLessonForm;
    if (!week || !title || !date || !youtube_id || !desc) {
      toast.error('Please fill in all fields.');
      return;
    }

    let ytId = youtube_id.trim();
    const ytMatch = ytId.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ytMatch) ytId = ytMatch[1];

    try {
      const url = editingLessonId ? `${API_URL}/lessons/${editingLessonId}/` : `${API_URL}/lessons/`;
      const res = await fetch(url, {
        method: editingLessonId ? 'PATCH' : 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ week: parseInt(week), title, date, youtube_id: ytId, desc }),
      });
      if (res.ok) {
        fetchLessonVideos();
        toast.success(`Week ${week} lesson video saved!`);
      } else {
        const err = await res.json();
        toast.error(err.week?.[0] || 'Error saving lesson video.');
        return;
      }
    } catch {
      const newVideo = { week: parseInt(week), title, date, youtubeId: ytId, desc, id: Date.now() };
      setLessonVideos((prev) => {
        const next = prev.filter((video) => video.id !== editingLessonId);
        return [...next, newVideo].sort((a, b) => a.week - b.week);
      });
      toast.success(`Week ${week} lesson video saved (offline mode).`);
    }
    setAddLessonForm({ week: '', title: '', date: '', youtube_id: '', desc: '' });
    setEditingLessonId(null);
    triggerLog(`Lesson Week ${week} video saved: "${title}"`);
  };

  const handleEditBibleStudy = (item: BibleStudy) => {
    if (!item.id) return;
    setEditingStudyId(item.id);
    setStudyDrafts((prev) => ({ ...prev, [item.id as number]: { ...item } }));
  };

  const handleEditPrayer = (item: PrayerRequest) => {
    if (!item.id) return;
    setEditingPrayerId(item.id);
    setPrayerDrafts((prev) => ({ ...prev, [item.id as number]: { ...item } }));
  };

  const handleEditDonation = (item: Donation) => {
    if (!item.id) return;
    setEditingDonationId(item.id);
    setDonationDrafts((prev) => ({ ...prev, [item.id as number]: { ...item } }));
  };

  const handleSaveSabbathProgrammes = () => {
    setSabbathProgramError('');
    try {
      const parsed = JSON.parse(sabbathProgramEditor);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setSabbathProgramError('Programme data must be a non-empty JSON array.');
        return;
      }

      const invalid = parsed.find(
        (item: any) =>
          !item ||
          typeof item !== 'object' ||
          typeof item.date !== 'string' ||
          typeof item.theme !== 'string' ||
          !item.sermon ||
          typeof item.sermon.preacher !== 'string' ||
          typeof item.sermon.title !== 'string'
      );

      if (invalid) {
        setSabbathProgramError('Each programme needs at least: date, theme, sermon.preacher, and sermon.title.');
        return;
      }

      void (async () => {
        try {
          await saveSabbathProgrammesToBackend(parsed as SabbathProgram[]);
          await fetchSabbathProgrammes();
          triggerLog(`Sabbath programmes updated (${parsed.length} entries).`);
          toast.success('Sabbath programme updated successfully.');
        } catch {
          setSabbathProgramError('Could not save programme to backend.');
        }
      })();
    } catch {
      setSabbathProgramError('Invalid JSON format. Please fix syntax and try again.');
    }
  };

  const handleResetSabbathProgrammes = () => {
    void (async () => {
      try {
        await saveSabbathProgrammesToBackend(DEFAULT_SABBATH_PROGRAMMES);
        await fetchSabbathProgrammes();
        setSabbathProgramError('');
        triggerLog('Sabbath programmes reset to default template.');
        toast('Sabbath programme reset to default.');
      } catch {
        setSabbathProgramError('Could not reset programme in backend.');
      }
    })();
  };

  const handleSelectSabbathProgramme = (index: number) => {
    setSelectedSabbathProgramIndex(index);
    setSabbathProgramError('');
  };

  const handleSaveSabbathProgrammeForm = () => {
    if (!sabbathProgramForm.date.trim() || !sabbathProgramForm.theme.trim() || !sabbathProgramForm.sermonPreacher.trim() || !sabbathProgramForm.sermonTitle.trim()) {
      setSabbathProgramError('Date, theme, sermon preacher, and sermon title are required.');
      return;
    }

    const nextProgrammes = sabbathProgrammes.map((item, idx) =>
      idx === selectedSabbathProgramIndex ? applySabbathProgrammeForm(item, sabbathProgramForm) : item
    );

    void (async () => {
      try {
        await saveSabbathProgrammesToBackend(nextProgrammes);
        await fetchSabbathProgrammes();
        setSabbathProgramError('');
        triggerLog(`Sabbath programme entry updated: ${sabbathProgramForm.date}`);
        toast.success('Sabbath programme information saved.');
      } catch {
        setSabbathProgramError('Could not save programme information to backend.');
      }
    })();
  };

  const handleAddSabbathProgramme = () => {
    const base = sabbathProgrammes[selectedSabbathProgramIndex] || DEFAULT_SABBATH_PROGRAMMES[0];
    const clone: SabbathProgram = JSON.parse(JSON.stringify(base));
    clone.date = `Sabbath, ${new Date().toLocaleDateString()}`;
    clone.theme = 'New Sabbath Theme';
    clone.sermon.title = 'New Sermon Title';
    clone.sermon.preacher = 'Preacher Name';

    const nextProgrammes = [...sabbathProgrammes, clone];

    void (async () => {
      try {
        await saveSabbathProgrammesToBackend(nextProgrammes);
        await fetchSabbathProgrammes();
        setSelectedSabbathProgramIndex(nextProgrammes.length - 1);
        setSabbathProgramError('');
        triggerLog('New Sabbath programme entry created.');
        toast.success('New Sabbath programme entry added.');
      } catch {
        setSabbathProgramError('Could not add new programme entry to backend.');
      }
    })();
  };

  const handleDeleteSabbathProgramme = () => {
    if (sabbathProgrammes.length <= 1) {
      setSabbathProgramError('At least one programme entry must remain.');
      return;
    }

    const removingDate = sabbathProgrammes[selectedSabbathProgramIndex]?.date || 'selected entry';
    const nextProgrammes = sabbathProgrammes.filter((_, idx) => idx !== selectedSabbathProgramIndex);

    void (async () => {
      try {
        await saveSabbathProgrammesToBackend(nextProgrammes);
        await fetchSabbathProgrammes();
        setSelectedSabbathProgramIndex(prev => Math.max(0, prev - 1));
        setSabbathProgramError('');
        triggerLog(`Sabbath programme entry removed: ${removingDate}`);
        toast('Sabbath programme entry removed.');
      } catch {
        setSabbathProgramError('Could not remove programme entry from backend.');
      }
    })();
  };

  // Filter systems
  const filteredSermons = sermons.filter((s: Sermon) => {
    const categoryMatch = selectedSermonCat === 'all' || s.category === selectedSermonCat;
    const q = sermonSearchTerm.trim().toLowerCase();
    const searchMatch =
      q.length === 0 ||
      s.title.toLowerCase().includes(q) ||
      s.speaker.toLowerCase().includes(q) ||
      s.passage.toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  });

  const featuredSermon = filteredSermons[0] || sermons[0] || null;
  const sermonsPerPage = 6;
  const totalSermonPages = Math.max(1, Math.ceil(filteredSermons.length / sermonsPerPage));
  const paginatedSermons = filteredSermons.slice((sermonPage - 1) * sermonsPerPage, sermonPage * sermonsPerPage);

  const parsedEvents = (Array.isArray(events) ? events : DEFAULT_EVENTS).map((event) => ({
    ...event,
    parsedDate: new Date(event.date),
  }));
  const now = new Date();
  const thisWeekEnd = new Date(now);
  thisWeekEnd.setDate(now.getDate() + 7);

  const eventsThisWeek = parsedEvents.filter((e) => e.parsedDate >= now && e.parsedDate <= thisWeekEnd);
  const upcomingEvents = parsedEvents.filter((e) => e.parsedDate > thisWeekEnd);
  const pastEvents = parsedEvents.filter((e) => e.parsedDate < now).sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
  const thisSabbathEvent = eventsThisWeek[0] || upcomingEvents[0] || parsedEvents[0] || null;

  const weeklyEssentialsDone = Object.values(weeklyEssentialsProgress).filter(Boolean).length;
  const weeklyEssentialsTotal = WEEKLY_ESSENTIALS.length;
  const essentialCompletionPercent = Math.round((weeklyEssentialsDone / weeklyEssentialsTotal) * 100);

  const priorityScore: Record<string, number> = { high: 0, normal: 1, low: 2 };
  const weeklyPriorityNotices = [...announcements]
    .sort((a, b) => {
      const scoreA = priorityScore[a.priority] ?? 3;
      const scoreB = priorityScore[b.priority] ?? 3;
      if (scoreA !== scoreB) return scoreA - scoreB;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 3);

  const gallerySource = gallery.length > 0 ? gallery : DEFAULT_GALLERY.map(g => ({ ...g, img_url: g.img }));
  const filteredGallery = selectedGalleryAlbum === 'all' 
    ? gallerySource 
    : gallerySource.filter(g => g.album === selectedGalleryAlbum);

  const totalDonations = donations.reduce((sum, item) => sum + item.amount, 0);
  const visibleAdminTabs = ADMIN_TABS.filter((tab) => allowedAdminTabs.includes(tab.id));
  const sabbathSchoolOnlyAccess = sabbathProgrammeScope === 'sabbath_school_only';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError('');
    try {
      const res = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminLoginForm),
      });
      const data = await res.json();
      if (res.ok) {
        if (!data?.is_staff) {
          setAdminLoginError('Access denied. This account is not an administrator.');
          setIsAdminAuthenticated(false);
          return;
        }
        const nextTabs = Array.isArray(data?.admin_tabs) && data.admin_tabs.length > 0
          ? data.admin_tabs as AdminTabId[]
          : ADMIN_TABS.map((tab) => tab.id);
        const nextSabbathScope: SabbathProgrammeScope = data?.sabbath_programme_scope === 'sabbath_school_only'
          ? 'sabbath_school_only'
          : data?.sabbath_programme_scope === 'none'
            ? 'none'
            : 'full';
        setAllowedAdminTabs(nextTabs);
        setSabbathProgrammeScope(nextSabbathScope);
        localStorage.setItem('admin_tabs', JSON.stringify(nextTabs));
        localStorage.setItem('sabbath_programme_scope', nextSabbathScope);
        if (data?.token) {
          localStorage.setItem('admin_token', data.token);
        }
        localStorage.setItem('admin_username', data?.username || adminLoginForm.username);
        const validSession = await verifyAdminSession();
        if (!validSession) {
          setAdminLoginError('Unable to verify staff session. Please sign in again.');
          return;
        }
        fetchAdminAnnouncements();
        fetchProjects(true);
        fetchAdminAuditLogs();
        if (nextTabs.includes('admin-accounts')) {
          fetchAdminAccounts();
        }
        triggerLog(`Admin logged in: ${data?.username || adminLoginForm.username}`);
        toast.success('Welcome back, Administrator!');
      } else {
        setAdminLoginError(data?.error || 'Invalid username or password. Please try again.');
      }
    } catch {
      setAdminLoginError('Cannot connect to server. Please check backend API connection.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const verifyAdminSession = async () => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      setIsAdminAuthenticated(false);
      return false;
    }

    setIsAdminSessionChecking(true);
    try {
      const res = await fetch(`${API_URL}/admin/session/`, {
        headers: {
          Authorization: `Token ${adminToken}`,
        },
      });

      if (!res.ok) {
        setIsAdminAuthenticated(false);
        return false;
      }

      const data = await res.json();
      const allowed = Boolean(data?.authenticated && data?.is_staff);
      setIsAdminAuthenticated(allowed);
      if (!allowed) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_tabs');
        localStorage.removeItem('sabbath_programme_scope');
      } else {
        const nextTabs = Array.isArray(data?.admin_tabs) && data.admin_tabs.length > 0
          ? data.admin_tabs as AdminTabId[]
          : ADMIN_TABS.map((tab) => tab.id);
        const nextSabbathScope: SabbathProgrammeScope = data?.sabbath_programme_scope === 'sabbath_school_only'
          ? 'sabbath_school_only'
          : data?.sabbath_programme_scope === 'none'
            ? 'none'
            : 'full';
        setAllowedAdminTabs(nextTabs);
        setSabbathProgrammeScope(nextSabbathScope);
        localStorage.setItem('admin_tabs', JSON.stringify(nextTabs));
        localStorage.setItem('sabbath_programme_scope', nextSabbathScope);
        if (nextTabs.includes('admin-accounts')) {
          fetchAdminAccounts();
        }
      }
      return allowed;
    } catch {
      setIsAdminAuthenticated(false);
      return false;
    } finally {
      setIsAdminSessionChecking(false);
    }
  };

  useEffect(() => {
    if (currentRoute === 'admin' && isAdminAuthenticated) {
      void verifyAdminSession();
    }
  }, [currentRoute]);

  useEffect(() => {
    if (!allowedAdminTabs.includes(activeAdminTab)) {
      const fallback = allowedAdminTabs[0] || 'admin-stats';
      setActiveAdminTab(fallback);
    }
  }, [allowedAdminTabs, activeAdminTab]);

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAllowedAdminTabs(ADMIN_TABS.map((tab) => tab.id));
    setSabbathProgrammeScope('full');
    setAdminLoginForm({ username: '', password: '' });
    setOpenProjectHistoryId(null);
    setCurrentRoute(IS_ADMIN_ENTRY ? 'admin' : 'home');
    localStorage.removeItem('admin_tabs');
    localStorage.removeItem('sabbath_programme_scope');
    fetchProjects();
    toast('You have been signed out of the admin portal.');
  };


  return (
    <div>
      <Toaster position="top-right" />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <>
      {/* Top Bar with Tagline & Social / Admin Link */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <span className="tagline">Growing in Christ • Serving the World • Sharing Hope</span>
        </div>
      </div>

      {/* Header & Navigation */}
      <header className="main-header">
        <div className="container header-container">
          <a href="#home" onClick={() => setCurrentRoute('home')} className="logo-area">
            <div className="logo-icon">
              <svg width="40" height="40" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="85" cy="85" r="85" fill="#1E3A8A" />
                <g transform="translate(17, 17) scale(0.8)">
                  <g transform="translate(-20.5, -20.6)" fill="#D4AF37">
                    <path d="m 128.7,161.7 c -11.5,-1.9 -17.7,3.5 -19.6,8.6 -0.2,0.5 -0.7,0.4 -0.7,0 v -1.6 c 0,-5.7 5.1,-10.9 11.1,-17 l 10,-10 26.6,4.6 c 0,0 7.6,7.6 14.1,14.1 12.5,-14.8 20.1,-34 20.1,-54.9 0,-46.9 -38,-84.9 -84.9,-84.9 -46.9,0 -84.9,38 -84.9,84.9 0,20.9 7.6,40.1 20.1,54.9 6.5,-6.5 14.1,-14.1 14.1,-14.1 l 30.2,-5.2 c 14,-2.4 17.5,0.7 17.5,5.4 0,0.2 -0.2,0.4 -0.4,0.4 h -8.5 c -0.2,0 -0.2,0.2 -0.2,0.4 v 5.2 c 0,0.2 -0.2,0.2 0,0.2 h 8.7 c 0.2,0 0.4,0.2 0.4,0.4 0,0 0,16.9 0,17.3 0,0.4 -0.5,0.5 -0.7,0.1 -1.9,-5.1 -8.1,-10.5 -19.6,-8.6 0,0 -19.9,3.4 -34.7,6 15.2,14.1 35.5,22.8 57.9,22.8 22.4,0 42.7,-8.6 57.9,-22.8 -14.6,-2.8 -34.5,-6.2 -34.5,-6.2 z m -19.5,0.2 c -0.1,0.5 -0.7,0.5 -0.7,0 V 153 c 0,-0.2 0.1,-0.4 0.3,-0.4 h 4.4 c -1.9,2.7 -3.2,5.3 -4,9.3 z m 31.5,-55.5 c 2.1,6.9 0.7,17.4 -9.2,27.4 l -12,11.8 c -0.3,0.3 -0.7,0.8 -1,0.8 h -8.2 c 2,-3 5.4,-6.8 9.2,-10.6 l 8.3,-8.3 C 138.3,117 140,112 140,106.2 c 0.1,-0.4 0.6,-0.4 0.7,0.2 z m -16.3,-6.5 c 6.8,-6.8 8.5,-14.7 3,-19.4 -0.5,-0.4 -0.2,-0.9 0.4,-0.6 6.8,3.1 12.1,14.3 0.5,25.9 l -8.8,8.8 c -6,6 -8.8,8.8 -10.3,16.1 -0.1,0.5 -0.7,0.5 -0.7,0 v -8.9 c 0,-5.7 5,-10.9 11.1,-17 z m -54.1,8 C 68.2,101 69.6,90.5 79.5,80.5 l 26.4,-26.4 c 6,-6 9.1,-8.9 10.6,-16.1 0.1,-0.5 1,-0.5 1,0 v 8.9 c 0,5.7 -5.3,10.9 -11.4,17 L 83.3,86.6 C 72.7,97.2 71,102.1 71,107.9 c 0,0.6 -0.5,0.6 -0.7,0 z m 4,15.7 c -5.9,-7.2 -3.9,-18.4 7.7,-30 l 23.9,-23.9 c 6,-6 9.1,-8.9 10.6,-16.2 0.1,-0.5 1,-0.5 1,0 v 9 c 0,5.7 -5.3,10.9 -11.4,17 l -21.2,21.1 c -4.4,4.4 -13.9,13.8 -10,22.6 0.3,0.6 -0.2,0.9 -0.6,0.4 z m 12.3,-9.2 c -6.8,6.8 -8.5,14.7 -3,19.4 0.5,0.4 0.2,0.9 -0.4,0.6 -6.8,-3.1 -12.1,-14.3 -0.5,-25.9 l 23.2,-23.2 c 6,-6 9.1,-8.8 10.6,-16.1 0.1,-0.5 1,-0.5 1,0 v 8.9 c 0,5.7 -5.3,10.9 -11.4,17 z m 21.9,23 c 0,-5.7 5,-10.9 11.1,-17 l 6.7,-6.7 c 4.4,-4.4 13.8,-13.8 9.9,-22.6 -0.3,-0.6 0.2,-0.9 0.6,-0.4 5.9,7.2 3.9,18.4 -7.7,30 l -9.5,9.5 c -6,6 -8.8,8.9 -10.3,16.2 -0.1,0.5 -0.7,0.5 -0.7,0 v -9 z" />
                  </g>
                </g>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-title">Seattle International</span>
              <span className="logo-sub">Church at Bugema University</span>
            </div>
          </a>
          <nav className={`nav-bar ${mobileMenuOpen ? 'active' : ''}`}>
            {/* Home */}
            <button
              onClick={() => { setCurrentRoute('home'); setMobileMenuOpen(false); setOpenDropdown(null); }}
              className={`nav-link ${currentRoute === 'home' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Home
            </button>

            {/* Worship Dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setOpenDropdown(null)}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'worship' ? null : 'worship')}
                onMouseEnter={() => setOpenDropdown('worship')}
                className={`nav-link ${['sermons', 'sabbath-programme', 'hymns', 'watch-live'].includes(currentRoute) ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Worship
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.3s', transform: openDropdown === 'worship' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4L6 8L10 4" />
                </svg>
              </button>
              {openDropdown === 'worship' && (
                <div className="dropdown-menu" onMouseEnter={() => setOpenDropdown('worship')}>
                  <button
                    onClick={() => { setCurrentRoute('sermons'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'sermons' ? 'active' : ''}`}
                  >
                    <MessageSquare size={18} />
                    <span>Sermon Archive</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('sabbath-programme'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'sabbath-programme' ? 'active' : ''}`}
                  >
                    <Calendar size={18} />
                    <span>Sabbath Programme</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('hymns'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'hymns' ? 'active' : ''}`}
                  >
                    <Music size={18} />
                    <span>Hymns</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('watch-live'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'watch-live' ? 'active' : ''}`}
                  >
                    <MapIcon size={18} />
                    <span>Watch Live</span>
                  </button>
                </div>
              )}
            </div>

            {/* Prayer Dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setOpenDropdown(null)}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'prayer' ? null : 'prayer')}
                onMouseEnter={() => setOpenDropdown('prayer')}
                className={`nav-link ${['prayer-requests', 'testimonies'].includes(currentRoute) ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Prayer
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.3s', transform: openDropdown === 'prayer' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4L6 8L10 4" />
                </svg>
              </button>
              {openDropdown === 'prayer' && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => { setCurrentRoute('prayer-requests'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'prayer-requests' ? 'active' : ''}`}
                  >
                    <Heart size={18} />
                    <span>Prayer Requests</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('testimonies'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'testimonies' ? 'active' : ''}`}
                  >
                    <BookOpen size={18} />
                    <span>Testimonies</span>
                  </button>
                </div>
              )}
            </div>

            {/* Growth Dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setOpenDropdown(null)}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'growth' ? null : 'growth')}
                onMouseEnter={() => setOpenDropdown('growth')}
                className={`nav-link ${['bible-study', 'forums', 'blog', 'dashboard'].includes(currentRoute) ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Growth
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.3s', transform: openDropdown === 'growth' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4L6 8L10 4" />
                </svg>
              </button>
              {openDropdown === 'growth' && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => { setCurrentRoute('bible-study'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'bible-study' ? 'active' : ''}`}
                  >
                    <BookOpen size={18} />
                    <span>Bible Study</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('forums'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'forums' ? 'active' : ''}`}
                  >
                    <MessageSquare size={18} />
                    <span>Forums</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('blog'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'blog' ? 'active' : ''}`}
                  >
                    <Calendar size={18} />
                    <span>Blog</span>
                  </button>
                  {isLoggedIn && (
                    <button
                      onClick={() => { setCurrentRoute('dashboard'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                      className={`dropdown-item ${currentRoute === 'dashboard' ? 'active' : ''}`}
                    >
                      <User size={18} />
                      <span>Member Dashboard</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setOpenDropdown(null)}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'community' ? null : 'community')}
                onMouseEnter={() => setOpenDropdown('community')}
                className={`nav-link ${['events', 'ministries', 'gallery', 'community-outreach', 'go-back-to-school', 'projects', 'announcements'].includes(currentRoute) ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Community
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.3s', transform: openDropdown === 'community' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4L6 8L10 4" />
                </svg>
              </button>
              {openDropdown === 'community' && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => { setCurrentRoute('events'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'events' ? 'active' : ''}`}
                  >
                    <Calendar size={18} />
                    <span>Events</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('ministries'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'ministries' ? 'active' : ''}`}
                  >
                    <Users size={18} />
                    <span>Ministries</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('community-outreach'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'community-outreach' ? 'active' : ''}`}
                  >
                    <HandHelping size={18} />
                    <span>Community Outreach</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('gallery'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'gallery' ? 'active' : ''}`}
                  >
                    <MapIcon size={18} />
                    <span>Gallery</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('go-back-to-school'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'go-back-to-school' ? 'active' : ''}`}
                  >
                    <Award size={18} />
                    <span>Go Back to School</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('projects'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'projects' ? 'active' : ''}`}
                  >
                    <HandHelping size={18} />
                    <span>Projects</span>
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('announcements'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'announcements' ? 'active' : ''}`}
                  >
                    <Award size={18} />
                    <span>Notices</span>
                  </button>
                </div>
              )}
            </div>

            {/* About Dropdown */}
            <div className="nav-dropdown" onMouseLeave={() => setOpenDropdown(null)}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'about' ? null : 'about')}
                onMouseEnter={() => setOpenDropdown('about')}
                className={`nav-link ${['about', 'staff', 'contact'].includes(currentRoute) ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                About
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 0.3s', transform: openDropdown === 'about' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M2 4L6 8L10 4" />
                </svg>
              </button>
              {openDropdown === 'about' && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => { setCurrentRoute('about'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'about' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Our Church
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('staff'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'staff' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Leadership & Staff
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('blog'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'blog' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Blog
                  </button>
                  <button
                    onClick={() => { setCurrentRoute('contact'); setMobileMenuOpen(false); setOpenDropdown(null); }}
                    className={`dropdown-item ${currentRoute === 'contact' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Contact Us
                  </button>
                </div>
              )}
            </div>

            {/* Give Button */}
            <button 
              onClick={() => { setCurrentRoute('give'); setMobileMenuOpen(false); setOpenDropdown(null); }} 
              className="nav-link give-btn"
              style={{ border: 'none', cursor: 'pointer', fontWeight: '700', background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)', color: '#1E3A8A' }}
            >
              Give
            </button>

            {/* Watch Live Button */}
            <button 
              onClick={() => { setCurrentRoute('watch-live'); setMobileMenuOpen(false); setOpenDropdown(null); }} 
              className="nav-link watch-live-btn"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <span className="pulse-dot"></span>
              Watch Live
            </button>

            {/* Auth & Language Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '1rem' }}>
              <LanguageSwitcher currentLanguage={language} onLanguageChange={(lang) => { setLanguage(lang); localStorage.setItem('language', lang); }} />
              
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setCurrentRoute('dashboard')}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <User size={18} />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      localStorage.removeItem('user_token');
                      localStorage.removeItem('user_email');
                      setCurrentRoute('home');
                      toast.success('Logged out successfully');
                    }}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#d4a574',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </nav>
          <button
            className={`mobile-nav-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`} aria-hidden={!mobileMenuOpen}>
        <button className="mobile-menu-backdrop" onClick={closeMobileMenu} aria-label="Close mobile menu" />

        <aside className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div className="mobile-menu-top-row">
            <div className="mobile-menu-brand">Seattle International Church</div>
            <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <form
            className="mobile-menu-search-row"
            onSubmit={(e) => {
              e.preventDefault();
              openFirstSearchResult();
            }}
          >
            <div className="mobile-menu-search-box">
              <Search size={16} />
              <input
                type="search"
                value={mobileMenuSearch}
                onChange={(e) => setMobileMenuSearch(e.target.value)}
                placeholder="Search..."
                aria-label="Search menu"
              />
            </div>
            <button className="mobile-menu-search-btn" type="submit">Search</button>
          </form>

          <div className="mobile-menu-sections">
            {filteredMobileSections.map((section) => (
              <div key={section.id} className="mobile-menu-section">
                <button
                  className="mobile-section-toggle"
                  onClick={() => setMobileMenuSectionOpen((prev) => (prev === section.id ? '' : section.id))}
                  aria-expanded={mobileMenuSectionOpen === section.id}
                >
                  <span className="mobile-section-heading-block">
                    <span className="mobile-section-title">{section.title}</span>
                    <span className="mobile-section-subtitle">{section.subtitle}</span>
                  </span>
                  <ChevronDown size={16} style={{ transform: mobileMenuSectionOpen === section.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                </button>

                {mobileMenuSectionOpen === section.id && (
                  <div className="mobile-section-items">
                    {section.items.map((item) => (
                      <button
                        key={item.route}
                        className={`mobile-route-btn ${currentRoute === item.route ? 'active' : ''}`}
                        onClick={() => goToRouteFromMobile(item.route)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="mobile-study-btn" onClick={() => goToRouteFromMobile('bible-study')}>Start Bible Study</button>

          <div className="mobile-short-links">
            <button onClick={() => goToRouteFromMobile('contact')}>Plan a Visit</button>
            <button onClick={() => goToRouteFromMobile('blog')}>Church News</button>
          </div>

          <div className="mobile-menu-cta-row">
            <button className="mobile-give-btn" onClick={() => goToRouteFromMobile('give')}>Give</button>
            <button className="mobile-live-btn" onClick={() => goToRouteFromMobile('watch-live')}>Watch Live</button>
          </div>

          <div className="mobile-menu-footer-copy">
            Seattle International Church at Bugema University exists to help students and families grow in Christ, serve with compassion, and live with hope.
          </div>
        </aside>
      </div>

      {/* Content wrapper */}
      <main id="main-content" className="content-wrapper">
        {eventReceipt && currentRoute === 'events' && (
          <div className="container" style={{ marginTop: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #16a34a', padding: '0.9rem 1rem' }}>
              <strong>Registration confirmed:</strong> {eventReceipt.eventTitle} • Reference {eventReceipt.reference}
            </div>
          </div>
        )}
        
        <AnimatePresence>
        {/* ================= HOME VIEW ================= */}
        {currentRoute === 'home' && (
          <motion.div key="home" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="hero-section">
              {/* Decorative ring */}
              <div className="hero-ring" />
              <div className="hero-ring hero-ring-2" />

              <motion.div className="hero-content" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                <motion.div className="hero-badge" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.05 }}>
                  <span className="pulse-dot"></span>
                  <span>Sabbath Worship • Every Saturday</span>
                </motion.div>
                <motion.h1 className="hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>Seattle International Church</motion.h1>
                <motion.p className="hero-location" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>Bugema University, Uganda</motion.p>
                <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}>Welcome to a Christ-Centered International Family of Faith — Growing in Grace, Serving the World, Sharing Hope.</motion.p>
                <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} style={{ fontWeight: 600 }}>
                  {CORE_MISSION_STATEMENT}
                </motion.p>
                <motion.div className="hero-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}>
                  <button onClick={() => setCurrentRoute('contact')} className="btn btn-hero-primary">Plan Your Visit</button>
                  <button onClick={() => setCurrentRoute('prayer-requests')} className="btn btn-hero-primary">Join Prayer</button>
                  <button onClick={() => setCurrentRoute('watch-live')} className="btn btn-hero-outline">
                    <span className="pulse-dot"></span>
                    Watch Live
                  </button>
                </motion.div>
              </motion.div>

              {/* Scroll cue */}
              <motion.div className="hero-scroll-cue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              </motion.div>
            </div>

            {/* Stats bar */}
            <motion.div className="hero-stats-bar" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}>
              {[
                { value: '50+', label: 'Nations Represented' },
                { value: '1,200+', label: 'Active Members' },
                { value: '15+', label: 'Student Ministries' },
                { value: '40+', label: 'Years of Ministry' },
              ].map((stat) => (
                <motion.div key={stat.label} className="hero-stat-item" variants={fadeUp}>
                  <span className="hero-stat-value">{stat.value}</span>
                  <span className="hero-stat-label">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {thisSabbathEvent && (
              <div className="container" style={{ marginTop: '1.25rem' }}>
                <motion.div className="card" variants={fadeUp} initial="hidden" animate="visible" style={{ borderLeft: '4px solid var(--accent)', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This Sabbath</p>
                    <h3 style={{ marginBottom: '0.3rem' }}>{thisSabbathEvent.title}</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>{thisSabbathEvent.date} • {thisSabbathEvent.location}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button onClick={() => setCurrentRoute('events')} className="btn btn-outline btn-small">View Details</button>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-accent btn-small">Get Directions</button>
                  </div>
                </motion.div>
              </div>
            )}

            <div className="container" style={{ marginTop: '1rem' }}>
              {!weeklyPromptDismissed && (
                <motion.div className="weekly-prompt-card" variants={fadeUp} initial="hidden" animate="visible">
                  <div>
                    <p className="weekly-kicker">Weekly check-in</p>
                    <h3 style={{ marginBottom: '0.35rem' }}>Your church week starts here</h3>
                    <p style={{ marginBottom: 0, color: 'var(--text-muted)' }}>
                      Review the programme, notices, and prayer priorities so you stay aligned with this week&apos;s mission.
                    </p>
                  </div>
                  <div className="weekly-prompt-actions">
                    <button className="btn btn-primary btn-small" onClick={() => setCurrentRoute('announcements')}>Start Weekly Check</button>
                    <button className="btn btn-outline btn-small" onClick={dismissWeeklyPrompt}>Dismiss</button>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-2 gap-3 margin-top-2">
                <motion.div className="card weekly-essentials-card" variants={fadeUp} initial="hidden" animate="visible">
                  <div className="weekly-header-row">
                    <div>
                      <p className="weekly-kicker">This Week at SIC</p>
                      <h3 style={{ marginBottom: '0.2rem' }}>Essentials for Every Member</h3>
                    </div>
                    <span className="weekly-progress-pill">{weeklyEssentialsDone}/{weeklyEssentialsTotal}</span>
                  </div>
                  <div className="weekly-progress-track" aria-hidden="true">
                    <div className="weekly-progress-fill" style={{ width: `${essentialCompletionPercent}%` }} />
                  </div>
                  <div className="weekly-essentials-list">
                    {WEEKLY_ESSENTIALS.map((item) => (
                      <div key={item.id} className="weekly-essential-item">
                        <div className="weekly-essential-copy">
                          <span className={`weekly-check ${weeklyEssentialsProgress[item.id] ? 'done' : ''}`}>
                            {weeklyEssentialsProgress[item.id] ? '✓' : '○'}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <button className="btn btn-outline btn-small" onClick={() => completeWeeklyEssential(item.id, item.route)}>
                          {item.cta}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div className="card weekly-notices-card" variants={fadeUp} initial="hidden" animate="visible">
                  <div className="weekly-header-row">
                    <div>
                      <p className="weekly-kicker">Must Read</p>
                      <h3 style={{ marginBottom: '0.2rem' }}>Priority Notices</h3>
                    </div>
                    <button className="btn btn-outline btn-small" onClick={() => setCurrentRoute('announcements')}>All Notices</button>
                  </div>
                  <div className="weekly-notice-list">
                    {weeklyPriorityNotices.map((notice) => (
                      <div key={notice.id} className="weekly-notice-item">
                        <span className={`notice-priority ${notice.priority}`}>{notice.priority.toUpperCase()}</span>
                        <div>
                          <p style={{ marginBottom: '0.2rem', fontWeight: 700 }}>{notice.title}</p>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem' }}>{notice.date}</p>
                        </div>
                      </div>
                    ))}
                    {weeklyPriorityNotices.length === 0 && (
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>No notices yet. Check back this week.</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="section-padding" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
              <div className="container">
                <motion.div className="card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '1rem', borderLeft: '4px solid var(--accent)' }}>
                  <h3 style={{ marginBottom: '0.4rem' }}>Our Shared Mission</h3>
                  <p style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>{CORE_MISSION_STATEMENT}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setCurrentRoute('about')} className="btn btn-outline btn-small">See Mission & Values</button>
                    <button onClick={() => setCurrentRoute('testimonies')} className="btn btn-accent btn-small">Read Testimonies</button>
                  </div>
                </motion.div>
                <motion.div className="grid grid-3 gap-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem} whileHover={{ y: -4 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>New Here?</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Get service times, directions, and what to expect for your first Sabbath with us.</p>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-primary btn-small">Plan Your Visit</button>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem} whileHover={{ y: -4 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Need Prayer?</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Share a request with our prayer team and let the church stand with you in faith.</p>
                    <button onClick={() => setCurrentRoute('prayer-requests')} className="btn btn-outline btn-small">Submit Prayer Request</button>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem} whileHover={{ y: -4 }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Support Ministry</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Give securely toward tithe, offerings, student outreach, and mission projects.</p>
                    <button onClick={() => setCurrentRoute('give')} className="btn btn-accent btn-small">Give Now</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            <div className="section-padding bg-light" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
              <div className="container">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title text-center">Your Next Faith Step</h2>
                  <p className="section-subtitle text-center">A practical discipleship path rooted in prayer, community, and growth.</p>
                </motion.div>
                <motion.div className="grid grid-3 gap-3 margin-top-2" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {DISCIPLESHIP_PATH.map((step, idx) => (
                    <motion.div key={step.id} className="card" variants={staggerItem} whileHover={{ y: -4 }}>
                      <p className="weekly-kicker">Step {idx + 1}</p>
                      <h3 style={{ marginBottom: '0.5rem' }}>{step.title}</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '0.9rem' }}>{step.desc}</p>
                      <button onClick={() => setCurrentRoute(step.route)} className="btn btn-outline btn-small">Continue</button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="section-padding bg-light">
              <motion.div className="container grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
                <motion.div className="pastor-welcome-card card" variants={slideLeft}>
                  <div className="pastor-img-placeholder">
                    {DEFAULT_LEADERS[0].photo ? (
                      <img src={DEFAULT_LEADERS[0].photo} alt="Kagwa Rogers" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>
                  <div className="pastor-greeting">
                    <h2 className="section-title">Welcome from our Pastor</h2>
                    <p className="pastor-quote">"Greetings in the matchless name of our Lord and Savior Jesus Christ! Whether you are a student at Bugema University, a member of the local community, or visiting from abroad, we welcome you to our international family of faith. Together, we seek to grow in grace, serve our community, and share the hope of Christ's soon return."</p>
                    <p className="pastor-signature">- Kagwa Rogers, Lead Pastor</p>
                  </div>
                </motion.div>
                
                <motion.div className="service-times-card card dark-card" variants={slideRight}>
                  <h2 className="card-title text-gold">Sabbath Worship Times</h2>
                  <ul className="worship-list">
                    <li>
                      <span className="worship-title">Sabbath School</span>
                      <span className="worship-time">9:00 AM</span>
                    </li>
                    <li>
                      <span className="worship-title">Divine Worship Service</span>
                      <span className="worship-time">11:00 AM</span>
                    </li>
                    <li>
                      <span className="worship-title">Afternoon Bible Study</span>
                      <span className="worship-time">2:30 PM</span>
                    </li>
                  </ul>
                  <div className="midweek-times">
                    <h3 className="midweek-title text-gold">Midweek Fellowship</h3>
                    <p><strong>Wednesday Prayer Meeting:</strong> 6:00 PM</p>
                    <p><strong>Friday Vespers:</strong> 6:30 PM</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Student Hub Feature */}
            <div className="section-padding accent-bg">
              <div className="container">
                <motion.div className="section-header text-center" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title">Student Ministry Hub</h2>
                  <p className="section-subtitle">Empowering students at Bugema University for service, fellowship, and discipleship</p>
                </motion.div>
                <motion.div className="grid grid-3 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
                  <motion.div className="student-card card" variants={staggerItem} whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                    <div className="student-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
                      </svg>
                    </div>
                    <h3>Bible Study Groups</h3>
                    <p>Join specialized student-led cell groups that study, discuss, and encourage one another during the academic semester.</p>
                    <button onClick={() => setCurrentRoute('bible-study')} className="btn btn-outline margin-top-1 btn-small">Sign Up for Study</button>
                  </motion.div>
                  <motion.div className="student-card card" variants={staggerItem} whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                    <div className="student-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <h3>Volunteer Opportunities</h3>
                    <p>Get involved in local community service, healthcare outreaches, orphanage visits, and high school ministry campaigns.</p>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-outline margin-top-1 btn-small">Join Volunteer Team</button>
                  </motion.div>
                  <motion.div className="student-card card" variants={staggerItem} whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
                    <div className="student-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                    <h3>Choir & Music Schedules</h3>
                    <p>Lend your voice to the International Choir or assist in the instrumental praise teams during worship services.</p>
                    <button onClick={() => setCurrentRoute('ministries')} className="btn btn-outline margin-top-1 btn-small">Explore Music Ministry</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Home previews */}
            <div className="section-padding">
              <motion.div className="container grid grid-3 gap-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                <motion.div className="home-sermon-preview card" variants={staggerItem} whileHover={{ y: -5 }}>
                  <span className="badge">Latest Sermon</span>
                  {sermons.length > 0 && (
                    <div className="margin-top-2">
                      <h3>{sermons[0].title}</h3>
                      <p className="text-muted font-size-sm">Speaker: {sermons[0].speaker} | Passage: {sermons[0].passage}</p>
                      <p className="font-size-sm">Preached on: {sermons[0].date}</p>
                    </div>
                  )}
                  <button onClick={() => setCurrentRoute('sermons')} className="btn btn-outline margin-top-2 btn-small">View All Sermons</button>
                </motion.div>
                
                <motion.div className="home-events-preview card" variants={staggerItem} whileHover={{ y: -5 }}>
                  <span className="badge badge-accent">Upcoming Event</span>
                  {events.length > 0 && (
                    <div className="margin-top-2">
                      <h3>{events[0].title}</h3>
                      <p className="text-muted font-size-sm">Date: {events[0].date} | Location: {events[0].location}</p>
                      <p className="font-size-sm text-truncate" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{events[0].desc}</p>
                    </div>
                  )}
                  <button onClick={() => setCurrentRoute('events')} className="btn btn-outline margin-top-2 btn-small">View All Events</button>
                </motion.div>

                <motion.div className="daily-verse-card card dark-card text-center justify-center" variants={staggerItem} whileHover={{ y: -5 }}>
                  <div className="verse-icon">&#10077;</div>
                  <p className="verse-text">"{dailyVerse.text}"</p>
                  <p className="verse-ref">{dailyVerse.ref}</p>
                  <motion.button 
                    onClick={() => setDailyVerse(BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)])} 
                    className="btn btn-small btn-accent"
                    whileTap={{ scale: 0.95 }}
                  >
                    Refresh Verse
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>

            {/* ========= WEEKLY DISCIPLESHIP DASHBOARD ========= */}
            <div className="section-padding" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container">
                <motion.div className="section-header text-center" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title" style={{ color: '#D4AF37' }}>Your Weekly Spiritual Checkpoint</h2>
                  <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>Track your discipleship journey this week — reset every Sabbath</p>
                </motion.div>

                <div className="grid grid-3 gap-3 margin-top-3">

                  {/* Discipleship Checklist */}
                  <motion.div className="card dark-card" variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>✅ Weekly Checklist</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {CHECKLIST_ITEMS.map(item => (
                        <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => toggleChecklistItem(item.id)}>
                          <span style={{ fontSize: '1rem', width: '24px', height: '24px', borderRadius: '6px', background: checklist[item.id] ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', flexShrink: 0, color: '#fff' }}>
                            {checklist[item.id] ? '✓' : ''}
                          </span>
                          <span style={{ fontSize: '0.9rem', color: checklist[item.id] ? '#10b981' : 'rgba(255,255,255,0.85)', textDecoration: checklist[item.id] ? 'line-through' : 'none', transition: 'all 0.3s' }}>
                            {item.icon} {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                      {Object.values(checklist).filter(Boolean).length} / {CHECKLIST_ITEMS.length} completed this week
                    </p>
                  </motion.div>

                  {/* Poll + Praise Wall */}
                  <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <div className="card dark-card" style={{ flex: 1 }}>
                      <h3 style={{ color: '#D4AF37', marginBottom: '0.75rem' }}>📊 Lesson Poll</h3>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.75rem' }}>Which Bible book impacted you most this Sabbath?</p>
                      {POLL_OPTIONS.map(option => {
                        const total = Object.values(pollResults).reduce((s: number, v) => s + Number(v), 0);
                        const pct = total > 0 ? Math.round(Number(pollResults[option] || 0) / total * 100) : 0;
                        return (
                          <div key={option} style={{ marginBottom: '0.5rem' }}>
                            <button
                              onClick={() => submitPollVote(option)}
                              disabled={!!pollVoted}
                              style={{ width: '100%', textAlign: 'left', padding: '0.4rem 0.75rem', background: pollVoted === option ? '#1e3a8a' : 'rgba(255,255,255,0.06)', border: '1px solid ' + (pollVoted === option ? '#D4AF37' : 'rgba(255,255,255,0.15)'), borderRadius: '6px', color: '#fff', cursor: pollVoted ? 'default' : 'pointer', transition: 'all 0.2s', fontSize: '0.88rem' }}
                            >
                              <span>{option}</span>
                              {pollVoted && <span style={{ float: 'right', color: '#D4AF37' }}>{pct}%</span>}
                            </button>
                            {pollVoted && (
                              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '2px' }}>
                                <div style={{ height: '100%', width: pct + '%', background: '#D4AF37', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="card dark-card" style={{ flex: 1 }}>
                      <h3 style={{ color: '#D4AF37', marginBottom: '0.75rem' }}>🙌 Community Praise Wall</h3>
                      <div style={{ maxHeight: '130px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                        {praiseWall.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Be the first to share a praise!</p>}
                        {praiseWall.map((p, i) => (
                          <div key={i} style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.85rem' }}>
                            <strong style={{ color: '#D4AF37' }}>{p.name}:</strong>
                            <span style={{ color: 'rgba(255,255,255,0.8)', marginLeft: '0.4rem' }}>{p.text}</span>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={submitPraise} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <input type="text" value={praiseForm.name} onChange={e => setPraiseForm({ ...praiseForm, name: e.target.value })} placeholder="Your name (optional)" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#fff', fontSize: '0.85rem' }} />
                        <input type="text" value={praiseForm.text} onChange={e => setPraiseForm({ ...praiseForm, text: e.target.value })} placeholder="Share a praise report..." required style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#fff', fontSize: '0.85rem' }} />
                        <button type="submit" className="btn btn-accent btn-small">Post Praise 🙏</button>
                      </form>
                    </div>
                  </motion.div>

                  {/* Weekly Bible Quiz */}
                  <motion.div className="card dark-card" variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>📝 Weekly Bible Quiz</h3>
                    {!quizSubmitted ? (
                      <>
                        {QUIZ_QUESTIONS.map((q, i) => (
                          <div key={i} style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.4rem' }}><strong>{i + 1}.</strong> {q.q}</p>
                            {q.options.map(opt => (
                              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.3rem', cursor: 'pointer' }}>
                                <input type="radio" name={'q-' + i} value={opt} checked={quizAnswers[i] === opt} onChange={() => setQuizAnswers({ ...quizAnswers, [i]: opt })} style={{ accentColor: '#D4AF37' }} />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ))}
                        <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length} className="btn btn-accent btn-block">Submit Quiz</button>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{quizScore === QUIZ_QUESTIONS.length ? '🏆' : quizScore >= 2 ? '⭐' : '📖'}</div>
                        <h4 style={{ color: '#D4AF37' }}>Score: {quizScore} / {QUIZ_QUESTIONS.length}</h4>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', marginTop: '0.5rem' }}>
                          {quizScore === QUIZ_QUESTIONS.length ? 'Perfect! You are a true Bible champion!' : quizScore >= 2 ? "Well done! Keep studying God's Word." : 'Keep growing! Open your Bible this week.'}
                        </p>
                        <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(0); }} className="btn btn-outline btn-small margin-top-2">Retry Quiz</button>
                      </div>
                    )}
                  </motion.div>

                </div>

                <motion.div className="grid grid-3 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card dark-card" variants={staggerItem}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '0.5rem' }}>Mission Impact</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Prayer requests this week: <strong>{prayers.length}</strong></p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 0 }}>Public testimonies published: <strong>{testimonies.length}</strong></p>
                  </motion.div>
                  <motion.div className="card dark-card" variants={staggerItem}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '0.5rem' }}>Growth Movement</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Bible study registrations: <strong>{bibleStudies.length}</strong></p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 0 }}>Weekly essentials completed: <strong>{weeklyEssentialsDone}/{weeklyEssentialsTotal}</strong></p>
                  </motion.div>
                  <motion.div className="card dark-card" variants={staggerItem}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '0.5rem' }}>Care & Strengthening</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>Prayer support actions: <strong>{Object.values(prayerSupport).reduce((sum, value) => sum + value, 0)}</strong></p>
                    <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 0 }}>Community praises shared: <strong>{praiseWall.length}</strong></p>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ABOUT VIEW ================= */}
        {currentRoute === 'about' && (
          <motion.div key="about" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>About Our Church</h1>
                <p>Learn about our history, mission, and beliefs</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container grid grid-2 gap-4">
                <div>
                  <h2 className="section-title">Our History</h2>
                  <p>Seattle International Church (SIC) was established to provide a vibrant, spirit-filled worship atmosphere specifically designed for the diverse and multi-ethnic community at Bugema University. Over the years, it has grown from a small gathering of students and faculty members into a prominent international spiritual hub.</p>
                  <p>As a Seventh-day Adventist congregation, we celebrate diversity and strive to be a home away from home for students representing dozens of nations, fostering deep spiritual integration and professional excellence under God's guidance.</p>
                  
                  <div className="mission-vision margin-top-3">
                    <div className="statement-card">
                      <h3>Our Mission</h3>
                      <p>To proclaim the everlasting gospel of Jesus Christ and prepare people for His soon return.</p>
                    </div>
                    <div className="statement-card margin-top-2">
                      <h3>Our Vision</h3>
                      <p>To build an international family of believers that reflects Christ's love through worship, discipleship, and service.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="section-title">Core Values</h2>
                  <div className="values-grid">
                    <div className="value-item">
                      <strong>Biblical Truth</strong>
                      <p>We hold the Word of God as our ultimate standard of faith and practice.</p>
                    </div>
                    <div className="value-item">
                      <strong>Prayer</strong>
                      <p>We believe prayer is the lifeline of our relationship with God and the foundation of all ministry.</p>
                    </div>
                    <div className="value-item">
                      <strong>Love</strong>
                      <p>We practice the unconditional love of Jesus in our relationships and community interaction.</p>
                    </div>
                    <div className="value-item">
                      <strong>Service</strong>
                      <p>We follow Christ's example of humble service to meet the physical and spiritual needs of others.</p>
                    </div>
                    <div className="value-item">
                      <strong>Fellowship</strong>
                      <p>We cultivate a warm, inclusive international family where everyone belongs.</p>
                    </div>
                    <div className="value-item">
                      <strong>Integrity</strong>
                      <p>We strive to walk in honesty, transparency, and consistency in our words and actions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-padding bg-light">
              <div className="container">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title text-center">Our Core Beliefs</h2>
                  <p className="section-subtitle text-center">As Seventh-day Adventists, we accept the Bible as our only creed and hold certain fundamental beliefs.</p>
                </motion.div>
                <motion.div className="grid grid-3 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                  {DEFAULT_BELIEFS.map(b => (
                    <motion.div key={b.title} className="belief-card card" variants={staggerItem} whileHover={{ y: -4, borderTopColor: 'var(--accent)' }}>
                      <h3>{b.title}</h3>
                      <p>{b.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="section-padding">
              <div className="container">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title text-center">Our Leadership</h2>
                  <p className="section-subtitle text-center">Dedicated servants coordinating ministries and spiritual growth</p>
                </motion.div>
                <motion.div className="grid grid-4 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                  {DEFAULT_LEADERS.map(l => (
                    <motion.div key={l.name} className="leader-card card" variants={staggerItem} whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)' }}>
                      <div className="leader-avatar-mock">
                        {l.photo ? (
                          <img src={l.photo} alt={l.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </div>
                      <div className="leader-name">{l.name}</div>
                      <div className="leader-role">{l.role}</div>
                      <div className="leader-bio">{l.bio}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= MINISTRIES VIEW ================= */}
        {currentRoute === 'ministries' && (
          <motion.div key="ministries" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Our Ministries</h1>
                <p>Discover where you can grow and serve</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-3 gap-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                  {DEFAULT_MINISTRIES.map(m => (
                    <motion.div key={m.id} className="card student-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedMinistry(m)} variants={staggerItem} whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)', borderTopColor: 'var(--primary)' }}>
                      <div className="student-icon">{m.icon}</div>
                      <h3>{m.title}</h3>
                      <p>{m.short}</p>
                      <span className="card-link text-gold">Learn More &arr;</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= SERMONS VIEW ================= */}
        {currentRoute === 'sermons' && (
          <motion.div key="sermons" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Sermon Archive</h1>
                <p>Listen, download resources, and grow in God's Word</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container">
                {featuredSermon && (
                  <motion.div className="card sermon-featured-card" variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
                    <p className="sermon-featured-kicker" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Featured Message</p>
                    <h2 className="sermon-featured-title" style={{ marginBottom: '0.45rem' }}>{featuredSermon.title}</h2>
                    <p className="sermon-featured-meta" style={{ color: 'var(--text-muted)', marginBottom: '0.65rem' }}>Speaker: <strong>{featuredSermon.speaker}</strong> • {featuredSermon.passage} • {featuredSermon.date}</p>
                    <div className="sermon-featured-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setCurrentRoute('watch-live')} className="btn btn-primary btn-small">Watch Sermon</button>
                      <button onClick={() => setCurrentRoute('forums')} className="btn btn-outline btn-small">Discuss This Sermon</button>
                    </div>
                  </motion.div>
                )}

                <div className="sermon-filters">
                  {['all', 'Sabbath Sermons', 'Week of Prayer', 'Evangelistic Series', 'Bible Studies'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedSermonCat(cat)} 
                      className={`filter-btn ${selectedSermonCat === cat ? 'active' : ''}`}
                    >
                      {cat === 'all' ? 'All Sermons' : cat}
                    </button>
                  ))}
                </div>

                <div className="margin-top-2 sermon-search-wrap" style={{ maxWidth: '460px' }}>
                  <input
                    type="search"
                    value={sermonSearchTerm}
                    onChange={(e) => setSermonSearchTerm(e.target.value)}
                    placeholder="Search by title, speaker, or Bible text"
                    aria-label="Search sermons"
                    className="sermon-search-input"
                    style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>

                <motion.div className="grid grid-3 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" animate="visible">
                  {Array.isArray(paginatedSermons) && paginatedSermons.map(s => (
                    <motion.div key={s.id} className="card sermon-card" variants={staggerItem} layout whileHover={{ y: -4 }}>
                      <span className="badge badge-accent">{s.category}</span>
                      <h3 className="margin-top-2">{s.title}</h3>
                      <p className="sermon-meta">Speaker: <strong>{s.speaker}</strong> | Text: {s.passage}</p>
                      <p className="font-size-sm">Delivered: {s.date}</p>
                      <div className="sermon-actions">
                        <button onClick={() => setCurrentRoute('watch-live')} className="btn btn-small btn-primary">Watch Sermon</button>
                        <button className="btn btn-small btn-outline" onClick={() => alert(`Download PDF for ${s.title}`)}>Notes PDF</button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {filteredSermons.length === 0 && (
                  <div className="card margin-top-3" style={{ textAlign: 'center' }}>
                    No sermons matched your search. Try another keyword or category.
                  </div>
                )}

                {totalSermonPages > 1 && (
                  <div className="sermon-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-small" disabled={sermonPage === 1} onClick={() => setSermonPage((p) => Math.max(1, p - 1))}>Previous</button>
                    <span className="sermon-pagination-text" style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Page {sermonPage} of {totalSermonPages}</span>
                    <button className="btn btn-outline btn-small" disabled={sermonPage === totalSermonPages} onClick={() => setSermonPage((p) => Math.min(totalSermonPages, p + 1))}>Next</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= SABBATH PROGRAMME VIEW ================= */}
        {currentRoute === 'sabbath-programme' && (
          <motion.div key="sabbath-programme" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <SabbathProgramme programmesData={sabbathProgrammes} />
          </motion.div>
        )}

        {/* ================= EVENTS VIEW ================= */}
        {currentRoute === 'events' && (
          <motion.div key="events" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Upcoming Events</h1>
                <p>Keep up to date with events, programs, and outreach campaigns</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container">
                <section>
                  <h2 style={{ marginBottom: '0.75rem' }}>This Week</h2>
                  {eventsThisWeek.length === 0 ? (
                    <div className="card" style={{ color: 'var(--text-muted)' }}>No events scheduled in the next 7 days.</div>
                  ) : (
                    <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                      {eventsThisWeek.map(e => (
                        <motion.div key={e.id} className="card event-card" variants={staggerItem} whileHover={{ y: -5 }}>
                          <div className="event-banner-placeholder">
                            {e.title}
                            <span className="event-date-badge">{e.date}</span>
                          </div>
                          <h3>{e.title}</h3>
                          <p className="text-muted font-size-sm">Venue: <strong>{e.location}</strong></p>
                          <p className="margin-top-1">{e.desc}</p>
                          <motion.button onClick={() => setRegisteringEvent(e)} className="btn btn-accent btn-small margin-top-2" whileTap={{ scale: 0.97 }}>Register for Event</motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>

                <section className="margin-top-4">
                  <h2 style={{ marginBottom: '0.75rem' }}>Upcoming</h2>
                  {upcomingEvents.length === 0 ? (
                    <div className="card" style={{ color: 'var(--text-muted)' }}>No additional upcoming events right now.</div>
                  ) : (
                    <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                      {upcomingEvents.map(e => (
                        <motion.div key={e.id} className="card event-card" variants={staggerItem} whileHover={{ y: -5 }}>
                          <div className="event-banner-placeholder">
                            {e.title}
                            <span className="event-date-badge">{e.date}</span>
                          </div>
                          <h3>{e.title}</h3>
                          <p className="text-muted font-size-sm">Venue: <strong>{e.location}</strong></p>
                          <p className="margin-top-1">{e.desc}</p>
                          <motion.button onClick={() => setRegisteringEvent(e)} className="btn btn-accent btn-small margin-top-2" whileTap={{ scale: 0.97 }}>Register for Event</motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </section>

                {pastEvents.length > 0 && (
                  <section className="margin-top-4">
                    <h2 style={{ marginBottom: '0.75rem' }}>Past Highlights</h2>
                    <div className="grid grid-2 gap-3">
                      {pastEvents.slice(0, 4).map((e) => (
                        <div key={e.id} className="card">
                          <h3 style={{ marginBottom: '0.3rem' }}>{e.title}</h3>
                          <p className="text-muted" style={{ marginBottom: '0.35rem' }}>{e.date} • {e.location}</p>
                          <p style={{ marginBottom: 0 }}>{e.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= COMMUNITY OUTREACH VIEW ================= */}
        {currentRoute === 'community-outreach' && (
          <motion.div key="community-outreach" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <CommunityOutreach />
          </motion.div>
        )}

        {/* ================= GO BACK TO SCHOOL VIEW ================= */}
        {currentRoute === 'go-back-to-school' && (
          <motion.div key="go-back-to-school" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <GoBackToSchool />
          </motion.div>
        )}

        {/* ================= GALLERY VIEW ================= */}
        {currentRoute === 'gallery' && (
          <motion.div key="gallery" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Photo Gallery</h1>
                <p>Memorable moments of worship, fellowship, and service</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container">
                {!galleryCloudAvailable && (
                  <div className="card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: '1rem' }}>
                    Cloud gallery is disabled or unavailable in this environment. Showing local sample photos.
                  </div>
                )}
                <div className="gallery-albums">
                  {['all', ...Array.from(new Set(gallerySource.map(g => g.album)))].map(album => (
                    <button 
                      key={album} 
                      onClick={() => setSelectedGalleryAlbum(album)} 
                      className={`album-btn ${selectedGalleryAlbum === album ? 'active' : ''}`}
                    >
                      {album === 'all' ? 'All Albums' : album}
                    </button>
                  ))}
                </div>

                {galleryLoading && (
                  <div className="text-center margin-top-3" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                    <p>Loading photos from cloud...</p>
                  </div>
                )}
                <motion.div className="grid grid-3 gap-2 margin-top-3" variants={staggerContainer} initial="hidden" animate="visible">
                  <AnimatePresence mode="wait">
                  {filteredGallery.map((g, i) => (
                    <motion.div key={i} className="gallery-item" variants={scaleIn} layout whileHover={{ scale: 1.02 }}>
                      <div className="gallery-mock-img" style={{ backgroundImage: `url('${g.img_url || (g as {img?: string}).img || ''}')` }}></div>
                      <div className="gallery-overlay">
                        <span className="gallery-album-name">{g.album}</span>
                        <span className="gallery-title">{g.title}</span>
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= WATCH LIVE VIEW ================= */}
        {currentRoute === 'watch-live' && (
          <motion.div key="watch-live" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Watch Live</h1>
                <p>Worship with us virtually from anywhere in the world</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container grid grid-3 gap-4">
                <div className="col-span-2">
                  <div className="video-container shadow">
                    <iframe width="100%" height="450" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Worship Stream Player" frameBorder="0" allowFullScreen></iframe>
                  </div>
                  <div className="stream-info card margin-top-2">
                    <div className="flex justify-between items-center">
                      <span className="badge badge-accent pulsing-badge">LIVE NOW</span>
                      <span className="viewers-count">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        142 Watching
                      </span>
                    </div>
                    <h2 className="margin-top-2">Sabbath Divine Worship Service</h2>
                    <p className="text-muted">Seattle International Church, Bugema University - Live Broadcast</p>
                    <p className="margin-top-1">Welcome online family! We are currently worshiping together. Feel free to submit prayer requests during the service and participate in the live community chat.</p>
                  </div>
                </div>

                <div className="live-chat-panel card">
                  <h3 className="card-title">Live Prayer & Fellowship Chat</h3>
                  <div className="chat-messages">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="chat-msg">
                        <span className="chat-user">{msg.user}:</span>
                        <span className="chat-text">{msg.text}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleChatSend} className="chat-input-area margin-top-2">
                    <input 
                      type="text" 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      placeholder="Type a message..." 
                      required 
                    />
                    <button type="submit" className="btn btn-accent btn-small">Send</button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= BIBLE STUDY VIEW ================= */}
        {currentRoute === 'bible-study' && (
          <motion.div key="bible-study" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Bible Study Registration</h1>
                <p>Grow in knowledge of the scriptures with church leaders and friends</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container max-width-600 card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 className="section-title text-center">Register for Bible Study</h2>
                <p className="text-center text-muted">Submit the form below, and one of our study guides or elders will contact you to coordinate a group or individual session.</p>
                
                <form onSubmit={handleBibleStudySubmit} className="margin-top-3">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={studyForm.name} 
                      onChange={(e) => setStudyForm({ ...studyForm, name: e.target.value })} 
                      required 
                      placeholder="Enter your full name" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={studyForm.email} 
                      onChange={(e) => setStudyForm({ ...studyForm, email: e.target.value })} 
                      required 
                      placeholder="Enter your email" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      value={studyForm.phone} 
                      onChange={(e) => setStudyForm({ ...studyForm, phone: e.target.value })} 
                      required 
                      placeholder="e.g. +256 701 234567" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Country of Origin</label>
                    <input 
                      type="text" 
                      value={studyForm.country} 
                      onChange={(e) => setStudyForm({ ...studyForm, country: e.target.value })} 
                      required 
                      placeholder="e.g. Uganda, Kenya, Rwanda, USA" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Select Study Topic / Level</label>
                    <select 
                      value={studyForm.course} 
                      onChange={(e) => setStudyForm({ ...studyForm, course: e.target.value })} 
                      required
                    >
                      <option value="" disabled>Select a study guide...</option>
                      <option value="Discover Bible Lessons (Introduction)">Discover Bible Lessons (Introduction)</option>
                      <option value="Daniel and Revelation (Prophecy Focus)">Daniel & Revelation (Prophecy Focus)</option>
                      <option value="SDA Baptism Preparation Study">Baptism Preparation Study</option>
                      <option value="Christ-Centered Living (Discipleship)">Christ-Centered Living (Discipleship)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">Submit Registration</button>
                </form>

                {studySuccess && (
                  <motion.div className="alert alert-success margin-top-2" variants={fadeIn} initial="hidden" animate="visible">
                    Thank you for registering! Our Bible study team will reach out to you shortly.
                  </motion.div>
                )}
              </div>
            </div>

            {/* Sabbath School Lesson Discussion */}
            <div className="section-padding bg-light">
              <div className="container">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title text-center">📚 Sabbath School Lesson Discussion</h2>
                  <p className="section-subtitle text-center">Join the weekly SDA Adult lesson — study, discuss, and grow together</p>
                </motion.div>

                {/* Weekly Lesson Video Feature */}
                <motion.div 
                  className="card margin-top-3" 
                  variants={fadeUp} 
                  initial="hidden" 
                  whileInView="visible" 
                  viewport={{ once: true }}
                  style={{ padding: '2rem', marginBottom: '2.5rem', borderLeft: '5px solid var(--accent)' }}
                >
                  <div className="lesson-video-grid">
                    
                    {/* Left: Video Player */}
                    <div>
                      <h3 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>🎬 Weekly Discussion Broadcast</h3>
                      {(() => {
                        const currentVideo = lessonVideos.find(v => v.week === selectedLessonWeek) || lessonVideos[0];
                        return (
                          <div>
                            <div className="video-container shadow">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
                                title={currentVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                            <h4 className="margin-top-2" style={{ color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>{currentVideo.title}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>Study Date: {currentVideo.date}</p>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-color)', lineHeight: 1.65, margin: 0 }}>{currentVideo.desc}</p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Right: Weeks Selector */}
                    <div className="lesson-video-sidebar">
                      <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>Select Study Week</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {lessonVideos.map(video => (
                          <button
                            key={video.week}
                            onClick={() => setSelectedLessonWeek(video.week)}
                            className={`lesson-week-btn ${selectedLessonWeek === video.week ? 'active' : ''}`}
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedLessonWeek === video.week ? 'var(--primary)' : 'var(--primary-dark)' }}>
                              Week {video.week}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {video.title.split(': ')[1] || video.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>

                <motion.div className="grid grid-3 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {[
                    { title: 'Official Adult Lesson', desc: "Download this quarter's official Sabbath School lesson booklet and study daily.", link: 'https://www.sabbath.school/', icon: '📖', cta: 'Get Lesson' },
                    { title: 'SSNET Discussion Guides', desc: 'Deep-dive commentary and teacher guides for each weekly lesson from ssnet.org.', link: 'https://ssnet.org/lessons/', icon: '🗣️', cta: 'Read Commentary' },
                    { title: 'Hope Channel Video', desc: 'Watch video presentations for each lesson from Hope Channel International.', link: 'https://www.hopechannel.com/', icon: '📺', cta: 'Watch Lesson' },
                    { title: 'SDA Church Quarterly', desc: 'Access the global SDA Sabbath School quarterly archives and resources.', link: 'https://sspm.adventist.org/', icon: '📰', cta: 'View Quarterly' },
                    { title: 'WhatsApp Study Group', desc: "Join our SIC Bugema WhatsApp group where members discuss each day's lesson.", link: 'https://wa.me/256700000000', icon: '💬', cta: 'Join Group' },
                    { title: 'Audio Bible Study', desc: "Listen to this week's lesson discussion podcast from various SDA ministries.", link: 'https://www.sabbath.school/', icon: '🎧', cta: 'Listen Now' },
                  ].map((res, i) => (
                    <motion.div key={i} className="card student-card" variants={staggerItem} whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)' }}>
                      <div className="student-icon" style={{ fontSize: '1.6rem' }}>{res.icon}</div>
                      <h3>{res.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1 }}>{res.desc}</p>
                      <a href={res.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-small margin-top-2">{res.cta} →</a>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= HYMNS PAGE ================= */}
        {currentRoute === 'hymns' && (
          <motion.div key="hymns" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <HymnsPage />
          </motion.div>
        )}

        {/* ================= PRAYER VIEW ================= */}
        {currentRoute === 'prayer-requests' && (
          <motion.div key="prayer-requests" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Prayer Request Chamber</h1>
                <p>You are not alone. Let us stand with you in prayer.</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container max-width-600 card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 className="section-title text-center">Submit a Prayer Request</h2>
                <p className="text-center text-muted">Your request will be delivered to our pastors and elders. If checked confidential, only the pastors will receive it.</p>
                
                <form onSubmit={handlePrayerRequestSubmit} className="margin-top-3">
                  <div className="form-group">
                    <label>Your Name (Optional)</label>
                    <input 
                      type="text" 
                      value={prayerForm.name} 
                      onChange={(e) => setPrayerForm({ ...prayerForm, name: e.target.value })} 
                      placeholder="Leave blank to submit anonymously" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Prayer Request</label>
                    <textarea 
                      value={prayerForm.content} 
                      onChange={(e) => setPrayerForm({ ...prayerForm, content: e.target.value })} 
                      required 
                      rows={6} 
                      placeholder="Write your petition or praise report here..."
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <input 
                      type="checkbox" 
                      id="prayer-check" 
                      checked={prayerForm.confidential} 
                      onChange={(e) => setPrayerForm({ ...prayerForm, confidential: e.target.checked })} 
                    />
                    <label htmlFor="prayer-check">Keep this request strictly confidential (Pastors only)</label>
                  </div>
                  <div className="form-group">
                    <label>Would you like a care follow-up?</label>
                    <select
                      value={prayerForm.care_request_type}
                      onChange={(e) => setPrayerForm({ ...prayerForm, care_request_type: e.target.value as 'none' | 'pastoral_call' | 'elder_visit' | 'counseling' | 'prayer_partner' })}
                    >
                      <option value="none">No additional care needed</option>
                      <option value="pastoral_call">Pastoral call</option>
                      <option value="elder_visit">Elder visit</option>
                      <option value="counseling">Counseling support</option>
                      <option value="prayer_partner">Prayer partner</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">Submit Request</button>
                </form>

                {prayerSuccess && (
                  <motion.div className="alert alert-success margin-top-2" variants={fadeIn} initial="hidden" animate="visible">
                    Your request has been submitted. Rest assured, our team will be praying for you.
                  </motion.div>
                )}
              </div>
            </div>

            {/* Community Prayer Support Wall */}
            <div className="section-padding bg-light">
              <div className="container">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title text-center">Community Prayer Support</h2>
                  <p className="section-subtitle text-center">Stand in prayer with your brothers and sisters this week</p>
                </motion.div>
                <motion.div className="grid grid-2 gap-3 margin-top-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {prayers.filter(p => !p.confidential).length > 0 ? (
                    prayers.filter(p => !p.confidential).map((pr, i) => (
                      <motion.div key={i} className="card" variants={staggerItem} whileHover={{ y: -3 }}>
                        <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{pr.content}"</p>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>— <strong>{pr.name || 'Anonymous'}</strong></p>
                        <p style={{ marginTop: '0.4rem', marginBottom: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Follow-up: <strong>{FOLLOW_UP_STATUS_LABELS[pr.follow_up_status || 'received']}</strong>
                          {pr.care_request_type && pr.care_request_type !== 'none' ? ` • Care: ${CARE_REQUEST_LABELS[pr.care_request_type]}` : ''}
                        </p>
                        <button
                          onClick={() => pr.id !== undefined && supportPrayer(pr.id)}
                          className="btn btn-small btn-outline margin-top-1"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          disabled={pr.id !== undefined && prayerSupportedIds.includes(pr.id)}
                        >
                          🙏 {pr.id !== undefined && prayerSupportedIds.includes(pr.id) ? 'Praying!' : 'Pray With Them'}
                          {pr.id !== undefined && prayerSupport[pr.id] > 0 && <span>({prayerSupport[pr.id]})</span>}
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="card col-span-2 text-center" style={{ padding: '2rem' }}>
                      <p style={{ color: 'var(--text-muted)' }}>No public prayer requests submitted yet. Be the first to share one!</p>
                    </div>
                  )}
                </motion.div>
                <motion.div className="card margin-top-3" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h3 style={{ marginBottom: '0.45rem' }}>Prayer Care Pathway</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                    Every request follows a care journey: Received -&gt; Assigned -&gt; Contacted -&gt; Ongoing Support -&gt; Completed.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {Object.entries(FOLLOW_UP_STATUS_LABELS).map(([key, label]) => (
                      <span key={key} className="badge" style={{ fontSize: '0.75rem' }}>{label}</span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= PROJECTS VIEW ================= */}
        {currentRoute === 'projects' && (
          <motion.div key="projects" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff' }}>Seattle Projects</h1>
                <p style={{ color: 'rgba(255,255,255,0.75)' }}>Active church initiatives — construction, community development, and outreach</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" animate="visible">
                  {projects.map(proj => {
                    const pct = Math.min(100, Math.round((proj.raised_amount / proj.goal_amount) * 100));
                    const categoryColors: Record<string,string> = {
                      Construction: '#1e3a8a',
                      Community: '#059669',
                      Outreach: '#d97706',
                      Infrastructure: '#7c3aed',
                    };
                    const color = categoryColors[proj.category] || '#1e3a8a';
                    return (
                      <motion.div key={proj.id} className="card" variants={staggerItem} whileHover={{ y: -6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }} style={{ overflow: 'hidden', padding: 0 }}>
                        {/* Project image */}
                        <div style={{ height: '200px', backgroundImage: 'url(' + proj.image_url + ')', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))' }} />
                          <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: color, color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                            {proj.category}
                          </span>
                          <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: pct >= 100 ? '#10b981' : pct >= 75 ? '#D4AF37' : 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                            {proj.status}
                          </span>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                          <h3 style={{ marginBottom: '0.5rem' }}>{proj.title}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{proj.desc}</p>

                          {/* Funding progress */}
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Funding Progress</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: color }}>{pct}%</span>
                            </div>
                            <div style={{ height: '10px', background: 'var(--bg-light, #f1f5f9)', borderRadius: '5px', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: pct + '%' }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, ' + color + ', ' + color + '99)', borderRadius: '5px' }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.82rem' }}>
                              <span style={{ color: '#059669', fontWeight: 600 }}>
                                UGX {proj.raised_amount.toLocaleString()} raised
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>
                                Goal: UGX {proj.goal_amount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedProjectFund(proj.category === 'Construction' ? 'Building Fund' : proj.category === 'Outreach' ? 'Mission Fund' : 'Offering');
                              setCurrentRoute('give');
                            }}
                            className="btn btn-primary btn-block"
                          >
                            🙌 Support This Project
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Project totals summary banner */}
                <motion.div
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="card dark-card text-center margin-top-4"
                  style={{ padding: '2rem' }}
                >
                  <h3 style={{ color: '#D4AF37', marginBottom: '0.5rem' }}>Total Project Funding Overview</h3>
                  <div className="grid grid-3 gap-3 margin-top-2">
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D4AF37' }}>
                        UGX {projects.reduce((s, p) => s + p.raised_amount, 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Total Raised</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                        UGX {projects.reduce((s, p) => s + p.goal_amount, 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Total Goal</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                        {Math.round(projects.reduce((s, p) => s + p.raised_amount, 0) / projects.reduce((s, p) => s + p.goal_amount, 0) * 100)}%
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Overall Progress</div>
                    </div>
                  </div>
                  <button onClick={() => setCurrentRoute('give')} className="btn btn-accent margin-top-3">Give Towards Any Project</button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= GIVE VIEW ================= */}
        {currentRoute === 'give' && (
          <motion.div key="give" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Giving & Support</h1>
                <p>Support our local church, student ministries, and outreach programs</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container grid grid-2 gap-4">
                <div className="card">
                  <h2 className="card-title text-gold">Online Tithes & Offerings</h2>
                  {donationReceipt && (
                    <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>
                      <strong>Transfer submitted:</strong> UGX {donationReceipt.amount.toLocaleString()} to {donationReceipt.fund}. Reference: {donationReceipt.reference}
                    </div>
                  )}
                  <form onSubmit={handleDonationSubmit} className="margin-top-2">
                    <div className="form-group">
                      <label>Amount (UGX / USD)</label>
                      <input 
                        type="number" 
                        value={donationForm.amount} 
                        onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })} 
                        required 
                        min="1000" 
                        placeholder="e.g. 50000" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Allocation Fund</label>
                      <select 
                        value={donationForm.fund} 
                        onChange={(e) => setDonationForm({ ...donationForm, fund: e.target.value })} 
                        required
                      >
                        <option value="Tithe">Tithe</option>
                        <option value="Offering">Offering</option>
                        <option value="Building Fund">Building Fund</option>
                        <option value="Mission Fund">Mission / Student Outreach</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select 
                        value={donationForm.method} 
                        onChange={(e) => setDonationForm({ ...donationForm, method: e.target.value })} 
                        required
                      >
                        <option value="Mobile Money">Mobile Money (MTN / Airtel)</option>
                        <option value="Bank Account">Bank Account Transfer</option>
                        <option value="PayPal">PayPal</option>
                      </select>
                    </div>

                    <div className="payment-detail-box">
                      {donationForm.method === 'Mobile Money' && (
                        <div>
                          <p>Enter your 10-digit mobile wallet number below. A prompt will be sent to your device.</p>
                          <div className="form-group margin-top-1">
                            <label>Wallet Number</label>
                            <input type="tel" required placeholder="e.g. 0770000000" />
                          </div>
                        </div>
                      )}
                      {donationForm.method === 'Bank Account' && (
                        <div>
                          <p>Please initiate a transfer from your bank app using the details provided on the right. Enter reference text below.</p>
                          <div className="form-group margin-top-1">
                            <label>Transaction Reference ID</label>
                            <input type="text" required placeholder="Enter reference number" />
                          </div>
                        </div>
                      )}
                      {donationForm.method === 'PayPal' && (
                        <div>
                          <p>You will be redirected to PayPal sandbox. Enter your PayPal email below.</p>
                          <div className="form-group margin-top-1">
                            <label>PayPal Email Address</label>
                            <input type="email" required placeholder="name@domain.com" />
                          </div>
                        </div>
                      )}
                    </div>

                    <button type="submit" className="btn btn-accent btn-block margin-top-2">Complete Transfer</button>
                  </form>

                  {donationSuccess && (
                    <div className="alert alert-success margin-top-2">
                      Thank you! Your donation request has been recorded. May God bless your stewardship.
                    </div>
                  )}
                </div>

                <div className="give-details-panel">
                  <h2 className="section-title">Giving Details</h2>
                  <p>Honoring the Lord with your substance is an act of worship. Here are the local bank and mobile accounts for Seattle International Church.</p>
                  
                  <div className="payment-method-card card margin-top-2">
                    <h3>Mobile Money (Uganda)</h3>
                    <p><strong>Airtel Money Merchant Code:</strong> 1224556</p>
                    <p><strong>MTN MoMo Pay Merchant Code:</strong> 889988</p>
                    <p className="text-muted">Account Name: Seattle International Church - Bugema</p>
                  </div>

                  <div className="payment-method-card card margin-top-2">
                    <h3>Bank Transfer</h3>
                    <p><strong>Bank:</strong> Stanbic Bank Uganda</p>
                    <p><strong>Branch:</strong> Mukono Branch</p>
                    <p><strong>Account Number:</strong> 9030018945628</p>
                    <p><strong>Swift Code:</strong> SBICUGKAX</p>
                  </div>

                  <div className="payment-method-card card margin-top-2">
                    <h3>Where Your Giving Goes</h3>
                    <p><strong>40%</strong> Worship & Sabbath Programs</p>
                    <p><strong>35%</strong> Student and Community Outreach</p>
                    <p><strong>25%</strong> Missions, Care, and Church Development</p>
                    <p className="text-muted">Monthly stewardship summaries are shared by church leadership for accountability.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= CONTACT VIEW ================= */}
        {currentRoute === 'contact' && (
          <motion.div key="contact" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Contact Us</h1>
                <p>Get in touch or visit Bugema University campus</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container grid grid-2 gap-4">
                <div className="card">
                  <h2 className="card-title">Send a Message</h2>
                  <form onSubmit={handleContactSubmit} className="margin-top-2">
                    <div className="form-group">
                      <label>Your Name</label>
                      <input 
                        type="text" 
                        value={contactForm.name} 
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} 
                        required 
                        placeholder="Enter name" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        value={contactForm.email} 
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} 
                        required 
                        placeholder="Enter email" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea 
                        value={contactForm.message} 
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} 
                        required 
                        rows={5} 
                        placeholder="Write message..." 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">Send Message</button>
                  </form>

                  {contactSuccess && (
                    <div className="alert alert-success margin-top-2">
                      Message sent successfully! We'll reply as soon as possible.
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="section-title">Where to Find Us</h2>
                  <p className="margin-top-1">Our chapel is situated on the beautiful campus of <strong>Bugema University</strong>, located along Gayaza-Zirobwe Road, 32 kilometers north of Kampala, Uganda.</p>
                  
                  <div className="contact-details margin-top-2">
                    <p><strong>Phone:</strong> +256 700 000 000 | +256 770 000 000</p>
                    <p><strong>Email:</strong> sic@bugema.ac.ug</p>
                    <p><strong>WhatsApp:</strong> +256 700 000 000</p>
                  </div>

                  <div className="mock-map margin-top-3">
                    <div className="map-inner">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <strong>Bugema University Campus</strong>
                      <span>Gayaza-Zirobwe Road, Uganda</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ANNOUNCEMENTS VIEW ================= */}
        {currentRoute === 'announcements' && (
          <motion.div key="announcements" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff' }}>Church Notices & Announcements</h1>
                <p style={{ color: 'rgba(255,255,255,0.75)' }}>Stay informed about events, reminders, and church news</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <motion.div className="section-header text-center" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title">Latest Notices</h2>
                  <p className="section-subtitle">Important updates from the church office and leadership</p>
                </motion.div>

                <motion.div className="margin-top-3" variants={staggerContainer} initial="hidden" animate="visible">
                  {announcements.map((notice) => {
                    const priorityColors: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
                      high: { bg: '#FFF7ED', border: '#EA580C', badge: '#EA580C', badgeText: '#fff' },
                      normal: { bg: '#EFF6FF', border: '#1E3A8A', badge: '#1E3A8A', badgeText: '#fff' },
                      low: { bg: '#F0FDF4', border: '#16A34A', badge: '#16A34A', badgeText: '#fff' },
                    };
                    const colors = priorityColors[notice.priority] || priorityColors.normal;
                    return (
                      <motion.div
                        key={notice.id}
                        variants={staggerItem}
                        whileHover={{ x: 4 }}
                        style={{
                          background: colors.bg,
                          borderRadius: '12px',
                          borderLeft: `5px solid ${colors.border}`,
                          padding: '1.5rem 1.75rem',
                          marginBottom: '1.25rem',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          display: 'flex',
                          gap: '1.25rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ fontSize: '2rem', flexShrink: 0, lineHeight: 1 }}>{notice.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>{notice.title}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem', borderRadius: '20px', background: colors.badge, color: colors.badgeText, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {notice.priority === 'high' ? '🔴 Urgent' : notice.priority === 'low' ? '🟢 Info' : '🔵 Notice'}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{notice.date}</span>
                            </div>
                          </div>
                          <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: 1.65 }}>{notice.body}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card dark-card text-center margin-top-4" style={{ padding: '2rem' }}>
                  <h3 style={{ color: '#D4AF37' }}>📣 Submit an Announcement</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Ministry leaders and elders can submit notices through the church office or admin portal.</p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-accent btn-small">Contact Church Office</button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= AUTH MODAL ================= */}
        {showAuthModal && (
          <motion.div key="auth" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div style={{
              padding: '2rem',
              maxWidth: '600px',
              margin: '2rem auto',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  float: 'right',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
              {authMode === 'login' ? (
                <div>
                  <LoginForm onSuccess={(username) => {
                    setIsLoggedIn(true);
                    setUserEmail(username);
                    setShowAuthModal(false);
                  }} />
                  <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                    Don't have an account? 
                    <button
                      onClick={() => setAuthMode('register')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#003d7a',
                        cursor: 'pointer',
                        marginLeft: '0.5rem'
                      }}
                    >
                      Register here
                    </button>
                  </p>
                </div>
              ) : (
                <div>
                  <RegisterForm onSuccess={() => {
                    setAuthMode('login');
                    toast.success('Account created! Please log in.');
                  }} />
                  <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                    Already have an account?
                    <button
                      onClick={() => setAuthMode('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#003d7a',
                        cursor: 'pointer',
                        marginLeft: '0.5rem'
                      }}
                    >
                      Log in here
                    </button>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ================= DASHBOARD ================= */}
        {currentRoute === 'dashboard' && isLoggedIn && (
          <motion.div key="dashboard" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <MemberDashboard userEmail={userEmail} />
          </motion.div>
        )}

        {/* ================= BLOG ================= */}
        {currentRoute === 'blog' && (
          <motion.div key="blog" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <BlogPage />
          </motion.div>
        )}

        {/* ================= TESTIMONIES ================= */}
        {currentRoute === 'testimonies' && (
          <motion.div key="testimonies" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header">
              <div className="container text-center">
                <h1>Testimonies of Grace</h1>
                <p>{CORE_MISSION_STATEMENT}</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container grid grid-2 gap-3">
                <motion.div className="card" variants={fadeUp} initial="hidden" animate="visible">
                  <h2 className="section-title">Share Your Testimony</h2>
                  <p className="text-muted">Your story can strengthen someone else and guide them to prayer, growth, and service.</p>
                  <form onSubmit={handleTestimonySubmit} className="margin-top-2">
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={testimonyForm.title}
                        onChange={(e) => setTestimonyForm({ ...testimonyForm, title: e.target.value })}
                        required
                        placeholder="A short title for your testimony"
                      />
                    </div>
                    <div className="form-group">
                      <label>Testimony Type</label>
                      <select
                        value={testimonyForm.testimony_type}
                        onChange={(e) => setTestimonyForm({ ...testimonyForm, testimony_type: e.target.value as 'prayer_answered' | 'spiritual_growth' | 'community_support' | 'healing_restoration' | 'outreach_impact' })}
                      >
                        <option value="prayer_answered">Prayer Answered</option>
                        <option value="spiritual_growth">Spiritual Growth</option>
                        <option value="community_support">Community Support</option>
                        <option value="healing_restoration">Healing and Restoration</option>
                        <option value="outreach_impact">Outreach Impact</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Your Testimony</label>
                      <textarea
                        rows={6}
                        value={testimonyForm.content}
                        onChange={(e) => setTestimonyForm({ ...testimonyForm, content: e.target.value })}
                        required
                        placeholder="Share what God has done and how it shaped your faith journey."
                      />
                    </div>
                    <div className="form-group">
                      <label>Suggested Next Step</label>
                      <select
                        value={testimonyForm.next_step}
                        onChange={(e) => setTestimonyForm({ ...testimonyForm, next_step: e.target.value as 'none' | 'mentor' | 'growth_class' | 'prayer_team' | 'service_team' })}
                      >
                        <option value="none">No follow-up needed</option>
                        <option value="mentor">Connect to Mentor</option>
                        <option value="growth_class">Invite to Growth Class</option>
                        <option value="prayer_team">Connect to Prayer Team</option>
                        <option value="service_team">Connect to Service Team</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">Submit Testimony</button>
                  </form>
                </motion.div>

                <motion.div className="card" variants={fadeUp} initial="hidden" animate="visible">
                  <h3 style={{ marginBottom: '0.45rem' }}>Testimony Ministry Workflow</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                    Submit -&gt; Review -&gt; Approve -&gt; Publish -&gt; Follow-up. This keeps testimonies pastoral, safe, and mission-driven.
                  </p>
                  <div style={{ display: 'grid', gap: '0.55rem' }}>
                    <div className="badge">Prayer Answered</div>
                    <div className="badge">Spiritual Growth</div>
                    <div className="badge">Community Support</div>
                    <div className="badge">Healing & Restoration</div>
                    <div className="badge">Outreach Impact</div>
                  </div>
                  <div className="margin-top-2" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-small" onClick={() => setCurrentRoute('prayer-requests')}>I Need Prayer</button>
                    <button className="btn btn-outline btn-small" onClick={() => setCurrentRoute('bible-study')}>Join Growth Class</button>
                    <button className="btn btn-outline btn-small" onClick={() => setCurrentRoute('community-outreach')}>Serve with Us</button>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="section-padding bg-light">
              <div className="container">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <h2 className="section-title text-center">Published Testimonies</h2>
                  <p className="section-subtitle text-center">Stories that strengthen faith and call the church to deeper discipleship.</p>
                </motion.div>
                <motion.div className="grid grid-3 gap-3 margin-top-2" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  {testimonies.length === 0 ? (
                    <div className="card text-center" style={{ gridColumn: '1 / -1' }}>
                      <p style={{ marginBottom: '0.4rem', fontWeight: 600 }}>No testimonies are published yet.</p>
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>Be the first to share what God has done.</p>
                    </div>
                  ) : (
                    testimonies.map((item) => (
                      <motion.div key={item.id} className="card" variants={staggerItem} whileHover={{ y: -4 }}>
                        <p className="weekly-kicker">{TESTIMONY_TYPE_LABELS[item.testimony_type || 'spiritual_growth']}</p>
                        <h3 style={{ marginBottom: '0.45rem' }}>{item.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.65rem' }}>
                          {item.author_name || 'Anonymous'} • {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                          {item.content.length > 220 ? `${item.content.slice(0, 220)}...` : item.content}
                        </p>
                        <span className="badge">Next step: {TESTIMONY_NEXT_STEP_LABELS[item.next_step || 'none']}</span>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= FORUMS ================= */}
        {currentRoute === 'forums' && (
          <motion.div key="forums" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <ForumsPage />
          </motion.div>
        )}

        {/* ================= STAFF DIRECTORY ================= */}
        {currentRoute === 'staff' && (
          <motion.div key="staff" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <StaffDirectory />
          </motion.div>
        )}

        {/* ================= MINISTRY DETAIL PAGES ================= */}
        {currentRoute === 'youth-ministry' && (
          <motion.div key="youth-ministry" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Youth Ministry</h1>
                <p style={{ color: 'var(--accent)', marginBottom: 0 }}>Empowering young professionals and students</p>
              </div>
            </div>
            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>What We Do</h3>
                    <p>Our Youth Ministry provides a space where students connect, share, and grow. We organize campouts, vespers, and forums on mental health, careers, and relationships. Whether you're seeking spiritual growth, leadership development, or simply a community of peers, the Youth Ministry welcomes you.</p>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Get Involved</h3>
                    <p>Join Bible study groups, participate in service projects, attend our weekly vespers, or help lead events for your peers. We meet regularly throughout the academic year and have opportunities for all involvement levels.</p>
                    <button onClick={() => setCurrentRoute('bible-study')} className="btn btn-primary margin-top-2">Join Bible Study Group</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {currentRoute === 'campus-ministry' && (
          <motion.div key="campus-ministry" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Campus Ministry</h1>
                <p style={{ color: 'var(--accent)', marginBottom: 0 }}>Reaching student hearts at Bugema</p>
              </div>
            </div>
            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Our Mission</h3>
                    <p>Campus Ministry focuses on reaching international and local students at Bugema University with the gospel message. We provide spiritual support, mentorship, and community for all students regardless of background or religious experience.</p>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Connect With Us</h3>
                    <p>Attend our weekly meetings, join a small group, participate in campus outreach events, or simply visit us at the chapel. We're here to support your spiritual journey during your university years.</p>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-primary margin-top-2">Get in Touch</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {currentRoute === 'music-ministry' && (
          <motion.div key="music-ministry" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Music Ministry</h1>
                <p style={{ color: 'var(--accent)', marginBottom: 0 }}>Worship through international harmonies</p>
              </div>
            </div>
            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Our Choirs</h3>
                    <p>We host multiple choirs representing various linguistic and regional groups. Join our praise band, dynamic orchestra, or the Seattle International Choir. Whether you're a seasoned vocalist or just learning, there's a place for you in our music ministry.</p>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Join the Music</h3>
                    <p>Auditions are open year-round. Come express your faith through music—from traditional hymns to contemporary worship. We practice weekly and perform during our main services and special events.</p>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-primary margin-top-2">Join the Choir</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {currentRoute === 'pathfinders-ministry' && (
          <motion.div key="pathfinders-ministry" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Pathfinders & Adventurers</h1>
                <p style={{ color: 'var(--accent)', marginBottom: 0 }}>Training children and teens for God</p>
              </div>
            </div>
            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Our Program</h3>
                    <p>An active scouting-style club focused on physical skills, nature studies, camping, survival guides, and foundational Bible learning for ages 6-18. We believe in developing well-rounded, faith-filled young people.</p>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Enroll Your Child</h3>
                    <p>Pathfinders meet regularly for activities, skill-building, community service, and spiritual growth. Parents are welcome to volunteer as leaders. Contact us for enrollment information and meeting schedules.</p>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-primary margin-top-2">Enroll Your Child</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {currentRoute === 'women-ministry' && (
          <motion.div key="women-ministry" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Women's Ministries</h1>
                <p style={{ color: 'var(--accent)', marginBottom: 0 }}>Nurturing faith, family, and sisterhood</p>
              </div>
            </div>
            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Our Fellowship</h3>
                    <p>Providing opportunities for spiritual growth, fellowship, and mentoring among women of all backgrounds. We host prayer circles, cooking workshops, and charity outreaches. Whether you're a student, professional, or parent, find your community here.</p>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Join Our Circle</h3>
                    <p>Meet new sisters in Christ, grow spiritually, and make a difference in our community. We meet monthly for fellowship and quarterly for special events. All women are invited and welcome.</p>
                    <button onClick={() => setCurrentRoute('contact')} className="btn btn-primary margin-top-2">Join Women's Circle</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {currentRoute === 'prayer-ministry' && (
          <motion.div key="prayer-ministry" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
              <div className="container text-center">
                <h1 style={{ color: '#fff', marginBottom: '0.5rem' }}>Prayer Ministry</h1>
                <p style={{ color: 'var(--accent)', marginBottom: 0 }}>Standing in the gap for our community</p>
              </div>
            </div>
            <div className="section-padding">
              <div className="container">
                <motion.div className="grid grid-2 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Our Mission</h3>
                    <p>Our prayer warriors maintain a chain of prayer for our church, community, and world. We gather for prayer requests submitted online or physically, hosting early morning devotions and specialized fasting sessions.</p>
                  </motion.div>
                  <motion.div className="card" variants={staggerItem}>
                    <h3>Join Prayer Warriors</h3>
                    <p>Submit prayer requests, join our prayer chain, attend our early morning prayer meetings, or fast with us for specific intentions. Prayer is the foundation of everything we do as a church community.</p>
                    <button onClick={() => setCurrentRoute('prayer-requests')} className="btn btn-primary margin-top-2">Join Prayer Warriors</button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ANALYTICS (For Admins) ================= */}
        {currentRoute === 'analytics' && (
          <motion.div key="analytics" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            <AnalyticsDashboard />
          </motion.div>
        )}

        {/* ================= ADMIN VIEW ================= */}
        {currentRoute === 'admin' && (
          <motion.div key="admin" variants={pageTransition} initial="hidden" animate="visible" exit="exit">
            {isAdminSessionChecking ? (
              <>
                <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
                  <div className="container text-center">
                    <h1 style={{ color: '#fff' }}>Admin Portal</h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)' }}>Verifying secure session...</p>
                  </div>
                </div>
                <div className="section-padding">
                  <div style={{ maxWidth: '440px', margin: '0 auto' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                      <p>Checking staff access with the backend...</p>
                    </div>
                  </div>
                </div>
              </>
            ) : !isAdminAuthenticated ? (
              /* ---- Admin Login Screen ---- */
              <>
                <div className="page-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
                  <div className="container text-center">
                    <h1 style={{ color: '#fff' }}>Admin Portal</h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)' }}>Authorized church staff access only</p>
                  </div>
                </div>
                <div className="section-padding">
                  <div style={{ maxWidth: '440px', margin: '0 auto' }}>
                    <motion.div className="card" variants={scaleIn} initial="hidden" animate="visible" style={{ borderTop: '4px solid var(--primary)' }}>
                      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: '60px', height: '60px', background: 'rgba(30,58,138,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                        <h2 style={{ color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>Sign In</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your church admin credentials</p>
                      </div>
                      <form onSubmit={handleAdminLogin}>
                        <div className="form-group">
                          <label>Username</label>
                          <input
                            type="text"
                            value={adminLoginForm.username}
                            onChange={e => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
                            required
                            placeholder="Enter username"
                            autoComplete="username"
                          />
                        </div>
                        <div className="form-group">
                          <label>Password</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showAdminPassword ? 'text' : 'password'}
                              value={adminLoginForm.password}
                              onChange={e => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                              required
                              placeholder="Enter password"
                              autoComplete="current-password"
                              style={{ paddingRight: '3rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminPassword((visible) => !visible)}
                              aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                              aria-pressed={showAdminPassword}
                              style={{
                                position: 'absolute',
                                right: '0.5rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.25rem',
                              }}
                            >
                              {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        {adminLoginError && (
                          <div className="alert-danger margin-top-1" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                            {adminLoginError}
                          </div>
                        )}
                        <button type="submit" className="btn btn-primary btn-block" disabled={adminLoginLoading}>
                          {adminLoginLoading ? 'Signing in...' : 'Sign In to Admin Portal'}
                        </button>
                      </form>
                      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Only staff accounts can access the admin portal.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </>
            ) : (
              /* ---- Authenticated Admin Dashboard ---- */
              <>
            <div className="page-header">
              <div className="container text-center">
                <h1>Admin Dashboard</h1>
                <p>Church Management and Request Portal</p>
              </div>
            </div>

            <div className="section-padding">
              <div className="container admin-container">
                <div className="admin-sidebar card">
                  <h3 className="admin-sidebar-title">Navigation</h3>
                  <ul className="admin-menu">
                    {visibleAdminTabs.map(tab => (
                      <li key={tab.id}>
                        <button 
                          onClick={() => setActiveAdminTab(tab.id)} 
                          className={`admin-tab-btn ${activeAdminTab === tab.id ? 'active' : ''}`}
                        >
                          {tab.label}
                        </button>
                      </li>
                    ))}
                    <li style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <button onClick={handleAdminLogout} className="admin-tab-btn" style={{ color: '#DC2626', width: '100%', textAlign: 'left' }}>
                        🚪 Sign Out
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="admin-main-panel card">
                  {/* Account Registration Tab */}
                  {activeAdminTab === 'admin-accounts' && (
                    <div className="admin-tab-content active">
                      <h2>Registration Accounts</h2>
                      <p className="text-muted">Super admin creates staff accounts and assigns exactly which data each account can access.</p>

                      <form onSubmit={handleCreateAdminAccount} className="card margin-top-2" style={{ padding: '1.25rem' }}>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group">
                            <label>Full Name</label>
                            <input
                              type="text"
                              value={adminAccountForm.full_name}
                              onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, full_name: e.target.value }))}
                              placeholder="e.g. Jane Doe"
                            />
                          </div>
                          <div className="form-group">
                            <label>Username *</label>
                            <input
                              type="text"
                              value={adminAccountForm.username}
                              onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, username: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email *</label>
                            <input
                              type="email"
                              value={adminAccountForm.email}
                              onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Temporary Password *</label>
                            <input
                              type="text"
                              value={adminAccountForm.password}
                              onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, password: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Data Access Rights *</label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                              {ACCESS_RIGHT_OPTIONS.map((section) => (
                                <label key={section.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={adminAccountForm.access_sections.includes(section.id)}
                                    onChange={(e) => {
                                      setAdminAccountForm((prev) => {
                                        const next = new Set(prev.access_sections);
                                        if (e.target.checked) {
                                          next.add(section.id);
                                        } else {
                                          next.delete(section.id);
                                        }
                                        return { ...prev, access_sections: Array.from(next) };
                                      });
                                    }}
                                  />
                                  {section.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          {adminAccountForm.access_sections.includes('sabbath_programme') && (
                            <div className="form-group">
                              <label>Sabbath Programme Scope</label>
                              <select
                                value={adminAccountForm.sabbath_programme_scope}
                                onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, sabbath_programme_scope: e.target.value as SabbathProgrammeScope }))}
                              >
                                <option value="full">Full Sabbath Programme Access</option>
                                <option value="sabbath_school_only">Sabbath School Fields Only</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <button type="submit" className="btn btn-accent" disabled={creatingAdminAccount}>
                          {creatingAdminAccount ? 'Creating...' : 'Create Department Account'}
                        </button>
                      </form>

                      <div className="margin-top-3">
                        <h3 style={{ marginBottom: '0.75rem' }}>Existing Staff Accounts</h3>
                        <p className="text-muted" style={{ marginTop: 0 }}>Super admin can edit rights, freeze/unfreeze, and reset passwords for staff accounts.</p>
                        {adminAccountsError && (
                          <div className="alert-danger" style={{ marginBottom: '0.75rem' }}>{adminAccountsError}</div>
                        )}
                        {adminAccountsLoading ? (
                          <p className="text-muted">Loading accounts...</p>
                        ) : adminAccounts.length === 0 ? (
                          <p className="text-muted">No staff accounts found.</p>
                        ) : (
                          <div className="table-responsive">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>Full Name</th>
                                  <th>Username</th>
                                  <th>Email</th>
                                  <th>Status</th>
                                  <th>Data Access</th>
                                  <th>Sabbath Scope</th>
                                  <th>Level</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminAccounts.map((account) => (
                                  editingAdminAccountId === account.id ? (
                                    <tr key={account.id}>
                                      <td>
                                        <input
                                          value={adminAccountEditForm.full_name}
                                          onChange={(e) => setAdminAccountEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                          placeholder="Full name"
                                        />
                                      </td>
                                      <td>
                                        <input
                                          value={adminAccountEditForm.username}
                                          onChange={(e) => setAdminAccountEditForm((prev) => ({ ...prev, username: e.target.value }))}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="email"
                                          value={adminAccountEditForm.email}
                                          onChange={(e) => setAdminAccountEditForm((prev) => ({ ...prev, email: e.target.value }))}
                                        />
                                      </td>
                                      <td>
                                        <span className="badge" style={{ backgroundColor: account.is_active === false ? '#FEE2E2' : 'var(--success-light)', color: account.is_active === false ? '#B91C1C' : 'var(--success)' }}>
                                          {account.is_active === false ? 'Frozen' : 'Active'}
                                        </span>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                          {ACCESS_RIGHT_OPTIONS.map((section) => (
                                            <label key={section.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                                              <input
                                                type="checkbox"
                                                checked={adminAccountEditForm.access_sections.includes(section.id)}
                                                onChange={(e) => {
                                                  setAdminAccountEditForm((prev) => {
                                                    const next = new Set(prev.access_sections);
                                                    if (e.target.checked) {
                                                      next.add(section.id);
                                                    } else {
                                                      next.delete(section.id);
                                                    }
                                                    return { ...prev, access_sections: Array.from(next) };
                                                  });
                                                }}
                                              />
                                              {section.label}
                                            </label>
                                          ))}
                                        </div>
                                      </td>
                                      <td>
                                        {adminAccountEditForm.access_sections.includes('sabbath_programme') ? (
                                          <select
                                            value={adminAccountEditForm.sabbath_programme_scope}
                                            onChange={(e) => setAdminAccountEditForm((prev) => ({ ...prev, sabbath_programme_scope: e.target.value as SabbathProgrammeScope }))}
                                          >
                                            <option value="full">Full</option>
                                            <option value="sabbath_school_only">Sabbath School Only</option>
                                          </select>
                                        ) : (
                                          <span className="text-muted">N/A</span>
                                        )}
                                      </td>
                                      <td>{account.is_superuser ? 'Superuser' : 'Staff'}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                          <button onClick={() => handleUpdateAdminAccount(account.id)} disabled={updatingAdminAccount} className="btn btn-small btn-accent">Save</button>
                                          <button onClick={cancelEditAdminAccount} className="btn btn-small btn-outline">Cancel</button>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    <tr key={account.id}>
                                      <td>{account.full_name || '-'}</td>
                                      <td><strong>{account.username}</strong></td>
                                      <td>{account.email || '-'}</td>
                                      <td>
                                        <span className="badge" style={{ backgroundColor: account.is_active === false ? '#FEE2E2' : 'var(--success-light)', color: account.is_active === false ? '#B91C1C' : 'var(--success)' }}>
                                          {account.is_active === false ? 'Frozen' : 'Active'}
                                        </span>
                                      </td>
                                      <td>{account.sections.length > 0 ? account.sections.map((section) => ACCESS_RIGHT_LABELS[section] || section).join(', ') : (account.department_roles.length > 0 ? account.department_roles.join(', ') : 'Full Access Staff')}</td>
                                      <td>{account.sabbath_programme_scope === 'sabbath_school_only' ? 'Sabbath School Only' : 'Full'}</td>
                                      <td>{account.is_superuser ? 'Superuser' : 'Staff'}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                          <button onClick={() => openEditAdminAccount(account)} className="btn btn-small btn-outline">Edit</button>
                                          <button onClick={() => handleToggleFreezeAccount(account)} className="btn btn-small btn-outline">
                                            {account.is_active === false ? 'Unfreeze' : 'Freeze'}
                                          </button>
                                          <button onClick={() => handleResetAccountPassword(account)} className="btn btn-small btn-outline">Change Password</button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className={`modal ${accountFreezeModal ? 'active' : ''}`} role="dialog" aria-modal="true" aria-label="Freeze account confirmation">
                        <div className="modal-content modal-medium">
                          <button className="close-modal" onClick={() => setAccountFreezeModal(null)} aria-label="Close freeze confirmation">&times;</button>
                          <div className="modal-header">
                            <h2>{accountFreezeModal?.nextState ? 'Unfreeze account' : 'Freeze account'}</h2>
                          </div>
                          <div className="modal-body">
                            <p>
                              {accountFreezeModal?.nextState
                                ? `This will restore login access for ${accountFreezeModal.username}.`
                                : `This will block login access for ${accountFreezeModal?.username}.`}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setAccountFreezeModal(null)}>Cancel</button>
                            <button className="btn btn-accent" onClick={confirmToggleFreezeAccount}>
                              {accountFreezeModal?.nextState ? 'Confirm Unfreeze' : 'Confirm Freeze'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={`modal ${accountPasswordModal ? 'active' : ''}`} role="dialog" aria-modal="true" aria-label="Reset account password">
                        <div className="modal-content modal-medium">
                          <button className="close-modal" onClick={() => setAccountPasswordModal(null)} aria-label="Close password reset">&times;</button>
                          <div className="modal-header">
                            <h2>Change account password</h2>
                          </div>
                          <div className="modal-body">
                            <p style={{ marginBottom: '1rem' }}>
                              Set a new password for <strong>{accountPasswordModal?.username}</strong>.
                            </p>
                            <div className="form-group">
                              <label>New Password</label>
                              <input
                                type="password"
                                value={accountPasswordForm.password}
                                onChange={(e) => setAccountPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="At least 8 characters"
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label>Confirm Password</label>
                              <input
                                type="password"
                                value={accountPasswordForm.confirmPassword}
                                onChange={(e) => setAccountPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Re-enter the new password"
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setAccountPasswordModal(null)}>Cancel</button>
                            <button className="btn btn-accent" onClick={confirmResetAccountPassword} disabled={accountPasswordSubmitting}>
                              {accountPasswordSubmitting ? 'Saving...' : 'Save Password'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gallery Upload Tab */}
                  {activeAdminTab === 'admin-gallery' && (
                    <div className="admin-tab-content active">
                      <h2>Manage Gallery</h2>
                      <p className="text-muted">Upload church photos directly to Supabase cloud storage. They will appear instantly in the Gallery page.</p>
                      <form onSubmit={handleGalleryUpload} className="card margin-top-2" style={{ padding: '1.5rem' }}>
                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Photo Title</label>
                            <input
                              type="text"
                              value={galleryUploadForm.title}
                              onChange={e => setGalleryUploadForm(f => ({ ...f, title: e.target.value }))}
                              placeholder="e.g., Youth Baptism 2025"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Album Category</label>
                            <select
                              value={galleryUploadForm.album}
                              onChange={e => setGalleryUploadForm(f => ({ ...f, album: e.target.value }))}
                            >
                              {['Sabbath Worship', 'Baptism', 'Graduation Sabbath', 'Youth Camp', 'Choir', 'Community Outreach', 'Back to School', 'Other'].map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-group margin-top-2">
                          <label>Select Photo</label>
                          <input
                            ref={galleryFileRef}
                            type="file"
                            accept="image/*"
                            onChange={e => setGalleryUploadFile(e.target.files?.[0] || null)}
                            required
                            style={{ padding: '0.5rem' }}
                          />
                          {galleryUploadFile && (
                            <div className="margin-top-2">
                              <img
                                src={URL.createObjectURL(galleryUploadFile)}
                                alt="Preview"
                                style={{ maxWidth: '200px', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--primary)' }}
                              />
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{galleryUploadFile.name}</p>
                            </div>
                          )}
                        </div>
                        <button type="submit" className="btn btn-primary margin-top-2" disabled={galleryUploading}>
                          {galleryUploading ? '⏳ Uploading...' : '📤 Upload to Supabase'}
                        </button>
                      </form>

                      <div className="margin-top-3">
                        <h3>Cloud Gallery ({gallery.length} photos)</h3>
                        {gallery.length === 0 ? (
                          <p className="text-muted" style={{ marginTop: '0.5rem' }}>No photos uploaded yet. Use the form above to add your first photo.</p>
                        ) : (
                          <div className="grid grid-3 gap-2 margin-top-2">
                            {gallery.map((img, i) => (
                              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <img src={img.img_url} alt={img.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                <div style={{ padding: '0.75rem' }}>
                                  <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>{img.title}</p>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{img.album}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ===================== LESSON VIDEOS TAB ===================== */}
                  {activeAdminTab === 'admin-lessons' && (
                    <div className="admin-tab-content active">
                      <h2>🎬 Lesson Videos</h2>
                      <p className="text-muted">Upload the YouTube discussion video for each Sabbath School lesson week. Paste any YouTube URL or just the video ID. Changes will appear immediately on the Bible Study page for all members.</p>

                      {/* Add Video Form */}
                      <form onSubmit={handleAdminAddLessonVideo} className="card margin-top-3" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent)' }}>
                        <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>➕ Add Weekly Lesson Video</h3>
                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Week Number</label>
                            <input
                              type="number"
                              min="1"
                              max="13"
                              value={addLessonForm.week}
                              onChange={e => setAddLessonForm(f => ({ ...f, week: e.target.value }))}
                              required
                              placeholder="e.g. 5"
                            />
                          </div>
                          <div className="form-group">
                            <label>Study Date</label>
                            <input
                              type="date"
                              value={addLessonForm.date}
                              onChange={e => setAddLessonForm(f => ({ ...f, date: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Lesson Title</label>
                          <input
                            type="text"
                            value={addLessonForm.title}
                            onChange={e => setAddLessonForm(f => ({ ...f, title: e.target.value }))}
                            required
                            placeholder="e.g. Week 5: The Covenant and the Sanctuary"
                          />
                        </div>
                        <div className="form-group">
                          <label>YouTube URL or Video ID</label>
                          <input
                            type="text"
                            value={addLessonForm.youtube_id}
                            onChange={e => setAddLessonForm(f => ({ ...f, youtube_id: e.target.value }))}
                            required
                            placeholder="e.g. https://www.youtube.com/watch?v=ABC123xyz or just ABC123xyz"
                          />
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Paste the full YouTube link — the video ID will be extracted automatically.
                          </small>
                        </div>
                        <div className="form-group">
                          <label>Short Description</label>
                          <textarea
                            value={addLessonForm.desc}
                            onChange={e => setAddLessonForm(f => ({ ...f, desc: e.target.value }))}
                            required
                            rows={3}
                            placeholder="A brief summary of what this week's lesson discussion covers..."
                          />
                        </div>
                        <button type="submit" className="btn btn-accent btn-block">
                          📤 Upload Lesson Video
                        </button>
                      </form>

                      {/* Current Lessons List */}
                      <div className="margin-top-3">
                        <h3 style={{ marginBottom: '1rem' }}>📋 Currently Uploaded Lesson Videos ({lessonVideos.length})</h3>
                        {lessonVideos.length === 0 ? (
                          <p className="text-muted">No lesson videos uploaded yet. Use the form above to add the first one.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {lessonVideos.map(v => (
                              <div key={v.id || v.week} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span style={{ background: 'var(--primary)', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                                      Week {v.week}
                                    </span>
                                    <strong style={{ fontSize: '0.95rem' }}>{v.title}</strong>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    📅 {v.date} &nbsp;|&nbsp; 🔗 youtube.com/watch?v={v.youtubeId}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                  <button onClick={() => openLessonEditor(v)} className="btn btn-outline btn-small">Edit</button>
                                  <a
                                    href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline btn-small"
                                  >
                                    ▶️ Preview
                                  </a>
                                  <button
                                    onClick={() => handleAdminDeleteLessonVideo(v.id, v.week)}
                                    className="btn btn-small"
                                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer' }}
                                  >
                                    🗑️ Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sabbath Programme Tab */}
                  {activeAdminTab === 'admin-sabbath-programme' && (
                    <div className="admin-tab-content active">
                      <h2>🗓️ Sabbath Programme Management</h2>
                      <p className="text-muted">
                        Manage Sabbath programme information directly. Changes appear immediately on the Sabbath Programme page.
                      </p>
                      {sabbathSchoolOnlyAccess && (
                        <div className="alert-info" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                          Sabbath School access: you can update Sabbath School fields and Bible Study access only.
                        </div>
                      )}

                      <div className="card margin-top-2" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                          <strong>Programme Entries: {sabbathProgrammes.length}</strong>
                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-outline btn-small" onClick={handleAddSabbathProgramme} disabled={sabbathSchoolOnlyAccess}>
                              + Add Entry
                            </button>
                            <button type="button" className="btn btn-small" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }} onClick={handleDeleteSabbathProgramme} disabled={sabbathSchoolOnlyAccess}>
                              Remove Entry
                            </button>
                            <button type="button" className="btn btn-outline btn-small" onClick={handleResetSabbathProgrammes} disabled={sabbathSchoolOnlyAccess}>
                              Reset to Default
                            </button>
                            <button type="button" className="btn btn-accent btn-small" onClick={handleSaveSabbathProgrammeForm}>
                              Save Information
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Select Programme Entry</label>
                          <select
                            value={selectedSabbathProgramIndex}
                            onChange={(e) => handleSelectSabbathProgramme(parseInt(e.target.value, 10))}
                          >
                            {sabbathProgrammes.map((item, index) => (
                              <option key={`${item.date}-${index}`} value={index}>
                                {item.date} - {item.theme}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Date</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.date}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, date: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                              placeholder="Sabbath, August 16, 2026"
                            />
                          </div>
                          <div className="form-group">
                            <label>Theme</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.theme}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, theme: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Sabbath School Time</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.sabbathSchoolTime}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, sabbathSchoolTime: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label>Divine Service Time</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.divineServiceTime}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, divineServiceTime: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Superintendent</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.superintendent}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, superintendent: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label>Lesson Number</label>
                            <input
                              type="number"
                              min="1"
                              value={sabbathProgramForm.lessonNumber}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, lessonNumber: parseInt(e.target.value || '1', 10) }))}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Lesson Title</label>
                          <input
                            type="text"
                            value={sabbathProgramForm.lessonTitle}
                            onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, lessonTitle: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Song Leader</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.songLeader}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, songLeader: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                          <div className="form-group">
                            <label>Opening Prayer</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.openingPrayer}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, openingPrayer: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Sermon Preacher</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.sermonPreacher}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, sermonPreacher: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                          <div className="form-group">
                            <label>Sermon Role</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.sermonRole}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, sermonRole: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Sermon Title</label>
                          <input
                            type="text"
                            value={sabbathProgramForm.sermonTitle}
                            onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, sermonTitle: e.target.value }))}
                            disabled={sabbathSchoolOnlyAccess}
                          />
                        </div>

                        <div className="form-group">
                          <label>Sermon Key Text</label>
                          <input
                            type="text"
                            value={sabbathProgramForm.sermonKeyText}
                            onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, sermonKeyText: e.target.value }))}
                            disabled={sabbathSchoolOnlyAccess}
                          />
                        </div>

                        <div className="form-group">
                          <label>Sermon Synopsis</label>
                          <textarea
                            value={sabbathProgramForm.sermonSynopsis}
                            onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, sermonSynopsis: e.target.value }))}
                            disabled={sabbathSchoolOnlyAccess}
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Closing Prayer</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.closingPrayer}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, closingPrayer: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                          <div className="form-group">
                            <label>Benediction</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.benediction}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, benediction: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Afternoon Time</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.afternoonTime}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, afternoonTime: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                          <div className="form-group">
                            <label>Afternoon Leader</label>
                            <input
                              type="text"
                              value={sabbathProgramForm.afternoonLeader}
                              onChange={(e) => setSabbathProgramForm(prev => ({ ...prev, afternoonLeader: e.target.value }))}
                              disabled={sabbathSchoolOnlyAccess}
                            />
                          </div>
                        </div>

                        <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

                        <details>
                          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}>Advanced JSON Editor</summary>
                          <p className="text-muted" style={{ marginTop: '0.6rem', marginBottom: '0.4rem' }}>
                            Use this for deep edits like hymns, special items, prayer points, and full structure changes.
                          </p>
                          <textarea
                            value={sabbathProgramEditor}
                            onChange={(e) => setSabbathProgramEditor(e.target.value)}
                            rows={12}
                            style={{
                              width: '100%',
                              border: '1px solid var(--border-color)',
                              borderRadius: '10px',
                              padding: '0.85rem',
                              fontFamily: 'Consolas, Menlo, Monaco, monospace',
                              fontSize: '0.8rem',
                              lineHeight: 1.5,
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                            <button type="button" className="btn btn-outline btn-small" onClick={handleSaveSabbathProgrammes}>
                              Save From JSON
                            </button>
                          </div>
                        </details>

                        {sabbathProgramError && (
                          <div className="alert-danger margin-top-1" style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>
                            {sabbathProgramError}
                          </div>
                        )}

                        <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                          Core fields here cover the main displayed programme information. Use the advanced editor for hymns, prayer points, and detailed nested sections.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Projects Tab */}
                  {activeAdminTab === 'admin-projects' && (

                    <div className="admin-tab-content active">
                      <h2>Manage Projects</h2>
                      <p className="text-muted">Create new projects, update fundraising progress, and remove completed or incorrect entries.</p>

                      <form onSubmit={handleAdminAddProject} className="card margin-top-2" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>➕ Add New Project</h3>
                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Project Title</label>
                            <input
                              type="text"
                              value={addProjectForm.title}
                              onChange={(e) => setAddProjectForm((f) => ({ ...f, title: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Category</label>
                            <select
                              value={addProjectForm.category}
                              onChange={(e) => setAddProjectForm((f) => ({ ...f, category: e.target.value }))}
                            >
                              {['Construction', 'Community', 'Outreach', 'Education', 'Media', 'Operations'].map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            rows={3}
                            value={addProjectForm.desc}
                            onChange={(e) => setAddProjectForm((f) => ({ ...f, desc: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="grid grid-3 gap-3">
                          <div className="form-group">
                            <label>Goal Amount (UGX)</label>
                            <input
                              type="number"
                              min="1"
                              value={addProjectForm.goal_amount}
                              onChange={(e) => setAddProjectForm((f) => ({ ...f, goal_amount: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Raised Amount (UGX)</label>
                            <input
                              type="number"
                              min="0"
                              value={addProjectForm.raised_amount}
                              onChange={(e) => setAddProjectForm((f) => ({ ...f, raised_amount: e.target.value }))}
                            />
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select
                              value={addProjectForm.status}
                              onChange={(e) => setAddProjectForm((f) => ({ ...f, status: e.target.value }))}
                            >
                              {['Active', 'Almost Complete', 'Completed', 'Paused'].map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Image URL (optional)</label>
                          <input
                            type="url"
                            value={addProjectForm.image_url}
                            onChange={(e) => setAddProjectForm((f) => ({ ...f, image_url: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            id="project-published"
                            type="checkbox"
                            checked={addProjectForm.is_published}
                            onChange={(e) => setAddProjectForm((f) => ({ ...f, is_published: e.target.checked }))}
                          />
                          <label htmlFor="project-published" style={{ margin: 0 }}>Publish this project to viewers</label>
                        </div>

                        <button type="submit" className="btn btn-accent btn-block">Save Project</button>
                      </form>

                      <div className="margin-top-2">
                        {projects.map(proj => {
                          const pct = Math.min(100, Math.round((proj.raised_amount / proj.goal_amount) * 100));
                          const statusBg = proj.status === 'Active' ? '#d1fae5' : proj.status === 'Completed' ? '#dcfce7' : '#fef3c7';
                          const statusColor = proj.status === 'Active' ? '#065f46' : proj.status === 'Completed' ? '#166534' : '#92400e';
                          const allHistoryEntries = projectHistoryById[proj.id] ?? [];
                          const filteredHistoryEntries = projectHistoryFilter === 'all'
                            ? allHistoryEntries
                            : allHistoryEntries.filter((entry) => entry.action === projectHistoryFilter);
                          return (
                            <div key={proj.id} className="card margin-top-2" style={{ padding: '1rem 1.25rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--bg-light, #f1f5f9)', padding: '0.2rem 0.6rem', borderRadius: '20px', marginBottom: '0.4rem', display: 'inline-block' }}>{proj.category}</span>
                                  <h4 style={{ margin: '0.25rem 0' }}>{proj.title}</h4>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                    UGX {proj.raised_amount.toLocaleString()} / {proj.goal_amount.toLocaleString()} — <strong style={{ color: 'var(--primary)' }}>{pct}% funded</strong>
                                  </p>
                                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '0.5rem' }}>
                                    <div style={{ height: '100%', width: pct + '%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                  </div>

                                  <div className="grid grid-2 gap-2 margin-top-2">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Title</label>
                                      <input
                                        type="text"
                                        value={projectDrafts[proj.id]?.title ?? proj.title}
                                        onChange={(e) => setProjectDrafts((prev) => ({
                                          ...prev,
                                          [proj.id]: {
                                            ...(prev[proj.id] ?? {
                                              title: proj.title,
                                              category: proj.category,
                                              desc: proj.desc,
                                              goal_amount: String(proj.goal_amount),
                                              raised_amount: String(proj.raised_amount),
                                              image_url: proj.image_url || '',
                                              status: proj.status,
                                              is_published: proj.is_published !== false,
                                            }),
                                            title: e.target.value,
                                          },
                                        }))}
                                      />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Category</label>
                                      <input
                                        type="text"
                                        value={projectDrafts[proj.id]?.category ?? proj.category}
                                        onChange={(e) => setProjectDrafts((prev) => ({
                                          ...prev,
                                          [proj.id]: { ...(prev[proj.id] ?? projectDrafts[proj.id]), category: e.target.value },
                                        }))}
                                      />
                                    </div>
                                  </div>

                                  <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>Description</label>
                                    <textarea
                                      rows={2}
                                      value={projectDrafts[proj.id]?.desc ?? proj.desc}
                                      onChange={(e) => setProjectDrafts((prev) => ({
                                        ...prev,
                                        [proj.id]: { ...(prev[proj.id] ?? projectDrafts[proj.id]), desc: e.target.value },
                                      }))}
                                    />
                                  </div>

                                  <div className="grid grid-2 gap-2 margin-top-2">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Goal Amount (UGX)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={projectDrafts[proj.id]?.goal_amount ?? String(proj.goal_amount)}
                                        onChange={(e) => setProjectDrafts((prev) => ({
                                          ...prev,
                                          [proj.id]: { ...(prev[proj.id] ?? projectDrafts[proj.id]), goal_amount: e.target.value },
                                        }))}
                                      />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Raised Amount (UGX)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={projectDrafts[proj.id]?.raised_amount ?? String(proj.raised_amount)}
                                        onChange={(e) => setProjectDrafts((prev) => ({
                                          ...prev,
                                          [proj.id]: {
                                            ...(prev[proj.id] ?? projectDrafts[proj.id]),
                                            raised_amount: e.target.value,
                                          },
                                        }))}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-2 gap-2 margin-top-2">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Image URL</label>
                                      <input
                                        type="url"
                                        value={projectDrafts[proj.id]?.image_url ?? proj.image_url}
                                        onChange={(e) => setProjectDrafts((prev) => ({
                                          ...prev,
                                          [proj.id]: { ...(prev[proj.id] ?? projectDrafts[proj.id]), image_url: e.target.value },
                                        }))}
                                      />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Status</label>
                                      <select
                                        value={projectDrafts[proj.id]?.status ?? proj.status}
                                        onChange={(e) => setProjectDrafts((prev) => ({
                                          ...prev,
                                          [proj.id]: {
                                            ...(prev[proj.id] ?? projectDrafts[proj.id]),
                                            status: e.target.value,
                                          },
                                        }))}
                                      >
                                        {['Active', 'Almost Complete', 'Completed', 'Paused'].map((status) => (
                                          <option key={status} value={status}>{status}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="form-group" style={{ marginTop: '0.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <input
                                      id={`project-published-${proj.id}`}
                                      type="checkbox"
                                      checked={projectDrafts[proj.id]?.is_published ?? (proj.is_published !== false)}
                                      onChange={(e) => setProjectDrafts((prev) => ({
                                        ...prev,
                                        [proj.id]: { ...(prev[proj.id] ?? projectDrafts[proj.id]), is_published: e.target.checked },
                                      }))}
                                    />
                                    <label htmlFor={`project-published-${proj.id}`} style={{ margin: 0, fontSize: '0.8rem' }}>Published to viewers</label>
                                  </div>

                                  {openProjectHistoryId === proj.id && (
                                    <div className="card margin-top-2" style={{ padding: '0.85rem', background: '#f8fafc' }}>
                                      <h5 style={{ margin: '0 0 0.5rem' }}>Change History</h5>
                                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                                        {([
                                          { value: 'all', label: 'All' },
                                          { value: 'update', label: 'Updates' },
                                          { value: 'create', label: 'Creates' },
                                          { value: 'delete', label: 'Deletes' },
                                        ] as Array<{ value: ProjectHistoryActionFilter; label: string }>).map((filterOption) => (
                                          <button
                                            key={filterOption.value}
                                            type="button"
                                            onClick={() => setProjectHistoryFilter(filterOption.value)}
                                            className="btn btn-small"
                                            style={{
                                              padding: '0.22rem 0.6rem',
                                              border: '1px solid #cbd5e1',
                                              background: projectHistoryFilter === filterOption.value ? '#e2e8f0' : '#fff',
                                              color: '#334155'
                                            }}
                                          >
                                            {filterOption.label}
                                          </button>
                                        ))}
                                      </div>
                                      {allHistoryEntries.length === 0 ? (
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>No history entries yet.</p>
                                      ) : filteredHistoryEntries.length === 0 ? (
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>No entries match this filter.</p>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                          {filteredHistoryEntries.map((entry) => {
                                            const actionStyles = getHistoryActionStyles(entry.action);
                                            return (
                                            <div key={entry.id} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>
                                              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', background: actionStyles.background, color: actionStyles.color, fontSize: '0.68rem', letterSpacing: '0.02em' }}>
                                                  {entry.action.toUpperCase()}
                                                </span>
                                                <span>{new Date(entry.created_at).toLocaleString()} · {entry.updated_by_username || 'System'}</span>
                                              </p>
                                              <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                {Object.entries(entry.changed_fields || {}).map(([field, rawValue], index) => {
                                                  if (field === 'new' || field === 'old') {
                                                    const snapshot = rawValue && typeof rawValue === 'object'
                                                      ? Object.entries(rawValue as Record<string, unknown>)
                                                      : [];
                                                    return (
                                                      <div key={`${entry.id}-${field}-${index}`}>
                                                        <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                                                          {field === 'new' ? 'Snapshot After Change' : 'Snapshot Before Change'}
                                                        </p>
                                                        {snapshot.length === 0 ? (
                                                          <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>No snapshot details.</p>
                                                        ) : (
                                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                            {snapshot.map(([snapshotField, snapshotValue]) => (
                                                              <p key={`${entry.id}-${field}-${snapshotField}`} style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
                                                                <strong>{formatProjectHistoryField(snapshotField)}:</strong> {formatProjectHistoryValue(snapshotValue)}
                                                              </p>
                                                            ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  }

                                                  if (rawValue && typeof rawValue === 'object' && ('old' in (rawValue as Record<string, unknown>) || 'new' in (rawValue as Record<string, unknown>))) {
                                                    const record = rawValue as Record<string, unknown>;
                                                    return (
                                                      <div key={`${entry.id}-${field}-${index}`} style={{ padding: '0.3rem 0.45rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>{formatProjectHistoryField(field)}</p>
                                                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                                                          <span style={{ color: '#991b1b', background: '#fee2e2', borderRadius: '4px', padding: '0.05rem 0.28rem' }}>Old: {formatProjectHistoryValue(record.old)}</span>
                                                          <span style={{ color: '#0f172a' }}>{'->'}</span>
                                                          <span style={{ color: '#166534', background: '#dcfce7', borderRadius: '4px', padding: '0.05rem 0.28rem' }}>New: {formatProjectHistoryValue(record.new)}</span>
                                                        </p>
                                                      </div>
                                                    );
                                                  }

                                                  return (
                                                    <p key={`${entry.id}-${field}-${index}`} style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
                                                      <strong>{formatProjectHistoryField(field)}:</strong> {formatProjectHistoryValue(rawValue)}
                                                    </p>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )})}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                  <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: statusBg, color: statusColor }}>{proj.status}</span>
                                  <span style={{ padding: '0.22rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: proj.is_published !== false ? '#dcfce7' : '#fee2e2', color: proj.is_published !== false ? '#166534' : '#991b1b' }}>
                                    {proj.is_published !== false ? 'Published' : 'Hidden'}
                                  </span>
                                  <button onClick={() => handleToggleProjectHistory(proj.id)} className="btn btn-small btn-outline">
                                    {openProjectHistoryId === proj.id ? 'Hide History' : 'View History'}
                                  </button>
                                  <button
                                    onClick={() => handleAdminQuickToggleProjectPublish(proj.id)}
                                    className="btn btn-small btn-outline"
                                  >
                                    {proj.is_published !== false ? 'Hide from Public' : 'Publish Now'}
                                  </button>
                                  <button onClick={() => handleAdminUpdateProject(proj.id)} className="btn btn-small btn-outline">Update</button>
                                  <button
                                    onClick={() => handleAdminDeleteProject(proj.id)}
                                    className="btn btn-small"
                                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dashboard Stats */}
                  {activeAdminTab === 'admin-stats' && (
                    <div className="admin-tab-content active">
                      <h2>Key Statistics</h2>
                      <div className="grid grid-3 gap-2 margin-top-2">
                        <div className="stat-card">
                          <span className="stat-num">{prayers.length}</span>
                          <span className="stat-label">Prayer Requests</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-num">{bibleStudies.length}</span>
                          <span className="stat-label">Bible Study Signups</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-num">{totalDonations.toLocaleString()} UGX</span>
                          <span className="stat-label">Total Donations</span>
                        </div>
                      </div>
                      <h3 className="margin-top-3">Recent Activity Logs</h3>
                      <div className="activity-log-table margin-top-1">
                        {logs.map((log, i) => (
                          <div key={i} className="activity-item">
                            <span className="activity-time">[{log.time}]</span>
                            <span>{log.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bible Studies List */}
                  {activeAdminTab === 'admin-studies' && (
                    <div className="admin-tab-content active">
                      <h2>Bible Study Registration List</h2>
                      <div className="table-responsive margin-top-2">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email / Phone</th>
                              <th>Country</th>
                              <th>Topic</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bibleStudies.length === 0 ? (
                              <tr><td colSpan={5} className="text-center">No registrations yet.</td></tr>
                            ) : (
                              bibleStudies.map(item => (
                                editingStudyId === item.id ? (
                                  <tr key={item.id}>
                                    <td><input value={studyDrafts[item.id!]?.name ?? item.name} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), name: e.target.value } }))} /></td>
                                    <td>
                                      <input value={studyDrafts[item.id!]?.email ?? item.email} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), email: e.target.value } }))} placeholder="Email" />
                                      <input value={studyDrafts[item.id!]?.phone ?? item.phone} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), phone: e.target.value } }))} placeholder="Phone" style={{ marginTop: '0.35rem' }} />
                                    </td>
                                    <td><input value={studyDrafts[item.id!]?.country ?? item.country} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), country: e.target.value } }))} /></td>
                                    <td><input value={studyDrafts[item.id!]?.course ?? item.course} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), course: e.target.value } }))} /></td>
                                    <td>
                                      <button onClick={() => handleAdminUpdateStudy(item.id!)} className="btn btn-small btn-accent">Save</button>
                                      <button onClick={() => setEditingStudyId(null)} className="btn btn-small btn-outline">Cancel</button>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={item.id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.email}<br />{item.phone}</td>
                                    <td>{item.country}</td>
                                    <td><span className="badge">{item.course}</span></td>
                                    <td>
                                      <button onClick={() => item.id && handleEditBibleStudy(item)} className="btn btn-small btn-outline">Edit</button>
                                      <button onClick={() => item.id && handleAdminDeleteStudy(item.id)} className="btn btn-small btn-outline">Delete</button>
                                    </td>
                                  </tr>
                                )
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Prayers List */}
                  {activeAdminTab === 'admin-prayers' && (
                    <div className="admin-tab-content active">
                      <h2>Prayer Requests Chamber Log</h2>
                      <div className="table-responsive margin-top-2">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Request</th>
                              <th>Confidential?</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {prayers.length === 0 ? (
                              <tr><td colSpan={4} className="text-center">No prayer requests submitted yet.</td></tr>
                            ) : (
                              prayers.map(item => (
                                editingPrayerId === item.id ? (
                                  <tr key={item.id}>
                                    <td><input value={prayerDrafts[item.id!]?.name ?? item.name} onChange={(e) => setPrayerDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), name: e.target.value } }))} /></td>
                                    <td><textarea value={prayerDrafts[item.id!]?.content ?? item.content} onChange={(e) => setPrayerDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), content: e.target.value } }))} rows={3} /></td>
                                    <td>
                                      <select value={(prayerDrafts[item.id!]?.confidential ?? item.confidential) ? 'true' : 'false'} onChange={(e) => setPrayerDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), confidential: e.target.value === 'true' } }))}>
                                        <option value="false">PUBLIC</option>
                                        <option value="true">CONFIDENTIAL</option>
                                      </select>
                                    </td>
                                    <td>
                                      <button onClick={() => handleAdminUpdatePrayer(item.id!)} className="btn btn-small btn-accent">Save</button>
                                      <button onClick={() => setEditingPrayerId(null)} className="btn btn-small btn-outline">Cancel</button>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={item.id}>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.content}</td>
                                    <td>{item.confidential ? <span className="badge badge-accent">CONFIDENTIAL</span> : <span className="badge">PUBLIC</span>}</td>
                                    <td>
                                      <button onClick={() => item.id && handleEditPrayer(item)} className="btn btn-small btn-outline">Edit</button>
                                      <button onClick={() => item.id && handleAdminDeletePrayer(item.id)} className="btn btn-small btn-outline">Delete</button>
                                    </td>
                                  </tr>
                                )
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Donations list */}
                  {activeAdminTab === 'admin-donations' && (
                    <div className="admin-tab-content active">
                      <h2>Donation Records</h2>
                      <div className="table-responsive margin-top-2">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Amount</th>
                              <th>Fund</th>
                              <th>Method</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {donations.length === 0 ? (
                              <tr><td colSpan={5} className="text-center">No contributions logged.</td></tr>
                            ) : (
                              donations.map(item => (
                                editingDonationId === item.id ? (
                                  <tr key={item.id}>
                                    <td><input type="number" value={String(donationDrafts[item.id!]?.amount ?? item.amount)} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), amount: Number(e.target.value) } }))} /></td>
                                    <td><input value={donationDrafts[item.id!]?.fund ?? item.fund} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), fund: e.target.value } }))} /></td>
                                    <td><input value={donationDrafts[item.id!]?.method ?? item.method} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), method: e.target.value } }))} /></td>
                                    <td><input value={donationDrafts[item.id!]?.status ?? item.status ?? ''} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), status: e.target.value } }))} /></td>
                                    <td>
                                      <button onClick={() => handleAdminUpdateDonation(item.id!)} className="btn btn-small btn-accent">Save</button>
                                      <button onClick={() => setEditingDonationId(null)} className="btn btn-small btn-outline">Cancel</button>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={item.id}>
                                    <td><strong>{item.amount.toLocaleString()} UGX</strong></td>
                                    <td>{item.fund}</td>
                                    <td>{item.method}</td>
                                    <td><span className="badge" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>{item.status || 'Success'}</span></td>
                                    <td>
                                      <button onClick={() => item.id && handleEditDonation(item)} className="btn btn-small btn-outline">Edit</button>
                                    </td>
                                  </tr>
                                )
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Manage Events */}
                  {activeAdminTab === 'admin-events' && (
                    <div className="admin-tab-content active">
                      <div className="flex justify-between items-center">
                        <h2>Events Calendar Management</h2>
                        <button onClick={() => setShowAddEventModal(true)} className="btn btn-accent btn-small">+ Add New Event</button>
                      </div>
                      <div className="table-responsive margin-top-2">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Event Name</th>
                              <th>Date</th>
                              <th>Location</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {events.map(item => (
                              <tr key={item.id}>
                                <td><strong>{item.title}</strong></td>
                                <td>{item.date}</td>
                                <td>{item.location}</td>
                                <td>
                                    <button onClick={() => openEventEditor(item)} className="btn btn-small btn-outline">Edit</button>
                                  <button onClick={() => handleAdminDeleteEvent(item.id)} className="btn btn-small btn-outline">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Manage Sermons */}
                  {activeAdminTab === 'admin-sermons' && (
                    <div className="admin-tab-content active">
                      <div className="flex justify-between items-center">
                        <h2>Sermon Archive Management</h2>
                        <button onClick={() => setShowAddSermonModal(true)} className="btn btn-accent btn-small">+ Add New Sermon</button>
                      </div>
                      <div className="table-responsive margin-top-2">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Speaker</th>
                              <th>Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sermons.map(item => (
                              <tr key={item.id}>
                                <td><strong>{item.title}</strong></td>
                                <td>{item.speaker}</td>
                                <td>{item.date}</td>
                                <td>
                                    <button onClick={() => openSermonEditor(item)} className="btn btn-small btn-outline">Edit</button>
                                  <button onClick={() => handleAdminDeleteSermon(item.id)} className="btn btn-small btn-outline">Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Manage Announcements */}
                  {activeAdminTab === 'admin-announcements' && (
                    <div className="admin-tab-content active">
                      <h2>Announcements & Notices</h2>
                      <p className="text-muted">Create announcements here and they will appear on the Notices page for viewers when published.</p>

                      <form onSubmit={handleAdminAddAnnouncement} className="card margin-top-2" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>➕ Add Announcement</h3>
                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Title</label>
                            <input
                              type="text"
                              value={addAnnouncementForm.title}
                              onChange={e => setAddAnnouncementForm(f => ({ ...f, title: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Date</label>
                            <input
                              type="date"
                              value={addAnnouncementForm.date}
                              onChange={e => setAddAnnouncementForm(f => ({ ...f, date: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-2 gap-3">
                          <div className="form-group">
                            <label>Priority</label>
                            <select
                              value={addAnnouncementForm.priority}
                              onChange={e => setAddAnnouncementForm(f => ({ ...f, priority: e.target.value as 'high' | 'normal' | 'low' }))}
                            >
                              <option value="high">High</option>
                              <option value="normal">Normal</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Icon / Emoji</label>
                            <input
                              type="text"
                              value={addAnnouncementForm.icon}
                              onChange={e => setAddAnnouncementForm(f => ({ ...f, icon: e.target.value }))}
                              placeholder="📣"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Announcement Message</label>
                          <textarea
                            value={addAnnouncementForm.body}
                            onChange={e => setAddAnnouncementForm(f => ({ ...f, body: e.target.value }))}
                            required
                            rows={4}
                          />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            id="announcement-published"
                            type="checkbox"
                            checked={addAnnouncementForm.is_published}
                            onChange={e => setAddAnnouncementForm(f => ({ ...f, is_published: e.target.checked }))}
                          />
                          <label htmlFor="announcement-published" style={{ margin: 0 }}>Publish immediately</label>
                        </div>

                        <button type="submit" className="btn btn-accent btn-block">Save Announcement</button>
                      </form>

                      <div className="margin-top-3">
                        <h3 style={{ marginBottom: '1rem' }}>Published Announcement Records ({announcements.length})</h3>
                        {announcements.length === 0 ? (
                          <p className="text-muted">No announcements available yet.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {announcements.map(item => (
                              <div key={item.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                    <strong>{item.title}</strong>
                                  </div>
                                  <p style={{ margin: '0 0 0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    {item.date} · {item.priority.toUpperCase()} · {item.is_published ? 'Published' : 'Draft'}
                                  </p>
                                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{item.body}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                  <button onClick={() => openAnnouncementEditor(item)} className="btn btn-small btn-outline">Edit</button>
                                  <button
                                    onClick={() => handleAdminDeleteAnnouncement(item.id)}
                                    className="btn btn-small"
                                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}

                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Audit Trail */}
                  {activeAdminTab === 'admin-audit' && (
                    <div className="admin-tab-content active">
                      <div className="flex justify-between items-center">
                        <h2>Admin Audit Trail</h2>
                        <button
                          onClick={() => fetchAdminAuditLogs()}
                          className="btn btn-outline btn-small"
                          disabled={adminAuditLoading}
                        >
                          {adminAuditLoading ? 'Refreshing...' : 'Refresh Logs'}
                        </button>
                      </div>
                      <p className="text-muted">Track staff actions across managed resources for accountability and troubleshooting.</p>

                      <div className="card margin-top-2" style={{ padding: '1rem' }}>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Action Filter</label>
                            <select
                              value={adminAuditActionFilter}
                              onChange={(e) => setAdminAuditActionFilter(e.target.value as AdminAuditActionFilter)}
                            >
                              <option value="all">All</option>
                              <option value="create">Create</option>
                              <option value="update">Update</option>
                              <option value="delete">Delete</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Resource Type</label>
                            <input
                              type="text"
                              value={adminAuditResourceFilter}
                              onChange={(e) => setAdminAuditResourceFilter(e.target.value)}
                              placeholder="e.g. Sermon, Project, HymnBook"
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.8rem' }}>
                          <button
                            className="btn btn-accent btn-small"
                            onClick={() => fetchAdminAuditLogs(adminAuditActionFilter, adminAuditResourceFilter)}
                            disabled={adminAuditLoading}
                          >
                            Apply Filters
                          </button>
                        </div>
                      </div>

                      {adminAuditError && (
                        <div className="alert-danger margin-top-1" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                          {adminAuditError}
                        </div>
                      )}

                      <div className="table-responsive margin-top-2">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Actor</th>
                              <th>Action</th>
                              <th>Resource</th>
                              <th>Label</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminAuditLoading ? (
                              <tr><td colSpan={5} className="text-center">Loading audit logs...</td></tr>
                            ) : adminAuditEntries.length === 0 ? (
                              <tr><td colSpan={5} className="text-center">No audit entries found for current filters.</td></tr>
                            ) : (
                              adminAuditEntries.map((entry) => (
                                <tr key={entry.id}>
                                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                                  <td>{entry.actor_username || 'System'}</td>
                                  <td><span className="badge">{entry.action.toUpperCase()}</span></td>
                                  <td>{entry.resource_type} #{entry.resource_id || '-'}</td>
                                  <td>{entry.resource_label || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
              </>
            )}
          </motion.div>
        )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      {!IS_ADMIN_ENTRY && (
      <footer className="main-footer">
        <div className="container footer-grid grid grid-3 gap-3">
          <div>
            <h3>Seattle International Church</h3>
            <p className="margin-top-1 font-size-sm">Bugema University, Gayaza-Zirobwe Road, Uganda. Fostering faith, global citizenship, and active ministry in preparation for the Second Coming.</p>
            <div className="footer-socials margin-top-2">
              <a href="https://wa.me/256700000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <button onClick={() => setCurrentRoute('watch-live')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Watch Live Link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </button>
            </div>
          </div>
          
          <div>
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><button onClick={() => setCurrentRoute('about')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Our Beliefs & Team</button></li>
              <li><button onClick={() => setCurrentRoute('ministries')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Ministries & Service</button></li>
              <li><button onClick={() => setCurrentRoute('bible-study')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Request Bible Study</button></li>
              <li><button onClick={() => setCurrentRoute('prayer-requests')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Prayer Chamber</button></li>
              <li><button onClick={() => setCurrentRoute('give')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Support Ministry</button></li>
            </ul>
          </div>

          <div>
            <h3>Daily Verse</h3>
            <div className="footer-verse">
              <p>"Commit your way to the Lord; trust in him, and he will act."</p>
              <span>- Psalm 37:5</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom text-center">
          <p>&copy; 2026 Seattle International Church, Bugema University. All rights reserved.</p>
        </div>
      </footer>
      )}

      {/* Ministry Detail Modal */}
      <AnimatePresence>
      {selectedMinistry && (
        <motion.div className="modal active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <button className="close-modal" onClick={() => setSelectedMinistry(null)}>&times;</button>
            <div className="student-icon" style={{ marginBottom: '1rem' }}>{selectedMinistry.icon}</div>
            <h2>{selectedMinistry.title}</h2>
            <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid var(--border-color)' }} />
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>{selectedMinistry.desc}</p>
            <div className="margin-top-3" style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => { 
                const routeMap: { [key: string]: string } = {
                  'youth': 'youth-ministry',
                  'campus': 'campus-ministry',
                  'music': 'music-ministry',
                  'pathfinders': 'pathfinders-ministry',
                  'women': 'women-ministry',
                  'prayer': 'prayer-ministry'
                };
                setCurrentRoute(routeMap[selectedMinistry.id] || 'ministries'); 
                setSelectedMinistry(null); 
              }} className="btn btn-primary">
                {selectedMinistry.id === 'youth' && 'Join Bible Study Group'}
                {selectedMinistry.id === 'campus' && 'Connect with Campus Ministry'}
                {selectedMinistry.id === 'music' && 'Join the Choir'}
                {selectedMinistry.id === 'pathfinders' && 'Enroll Your Child'}
                {selectedMinistry.id === 'women' && 'Join Women\'s Circle'}
                {selectedMinistry.id === 'prayer' && 'Join Prayer Warriors'}
              </button>
              <button onClick={() => { setCurrentRoute('contact'); setSelectedMinistry(null); }} className="btn btn-outline">Get in Touch</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Event Reg Modal */}
      <AnimatePresence>
      {registeringEvent && (
        <motion.div className="modal active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <motion.div className="modal-content modal-medium" initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <button className="close-modal" onClick={() => setRegisteringEvent(null)}>&times;</button>
            <h2 className="section-title text-center">Event Registration</h2>
            <p className="text-center text-muted">Registering for: {registeringEvent.title}</p>
            <form onSubmit={handleEventRegSubmit} className="margin-top-3">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={eventRegForm.name} 
                  onChange={(e) => setEventRegForm({ ...eventRegForm, name: e.target.value })} 
                  required 
                  placeholder="Enter your name" 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={eventRegForm.email} 
                  onChange={(e) => setEventRegForm({ ...eventRegForm, email: e.target.value })} 
                  required 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={eventRegForm.phone} 
                  onChange={(e) => setEventRegForm({ ...eventRegForm, phone: e.target.value })} 
                  required 
                  placeholder="e.g. +256..." 
                />
              </div>
              <div className="form-group">
                <label>Additional Notes / Dietary requirements (if applicable)</label>
                <textarea 
                  value={eventRegForm.notes} 
                  onChange={(e) => setEventRegForm({ ...eventRegForm, notes: e.target.value })} 
                  placeholder="Any optional details" 
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Confirm Registration</button>
            </form>

            {eventRegSuccess && (
              <motion.div className="alert alert-success margin-top-2" variants={fadeIn} initial="hidden" animate="visible">
                Successfully registered! We have saved your spot.
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Add Event Modal (Admin) */}
      <AnimatePresence>
      {showAddEventModal && (
        <motion.div className="modal active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <motion.div className="modal-content modal-medium" initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <button className="close-modal" onClick={() => setShowAddEventModal(false)}>&times;</button>
            <h2 className="section-title text-center">Add New Event</h2>
            <form onSubmit={handleAdminAddEventSubmit} className="margin-top-3">
              <div className="form-group">
                <label>Event Title</label>
                <input 
                  type="text" 
                  value={addEventForm.title} 
                  onChange={(e) => setAddEventForm({ ...addEventForm, title: e.target.value })} 
                  required 
                  placeholder="e.g. Bugema Camp Meeting" 
                />
              </div>
              <div className="form-group">
                <label>Event Date</label>
                <input 
                  type="date" 
                  value={addEventForm.date} 
                  onChange={(e) => setAddEventForm({ ...addEventForm, date: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Location Venue</label>
                <input 
                  type="text" 
                  value={addEventForm.location} 
                  onChange={(e) => setAddEventForm({ ...addEventForm, location: e.target.value })} 
                  required 
                  placeholder="e.g. Main Assembly Pavilion" 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={addEventForm.desc} 
                  onChange={(e) => setAddEventForm({ ...addEventForm, desc: e.target.value })} 
                  required 
                  rows={4}
                  placeholder="Provide details about the event..." 
                />
              </div>
              <button type="submit" className="btn btn-accent btn-block">Add Event</button>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Add Sermon Modal (Admin) */}
      <AnimatePresence>
      {showAddSermonModal && (
        <motion.div className="modal active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <motion.div className="modal-content modal-medium" initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <button className="close-modal" onClick={() => setShowAddSermonModal(false)}>&times;</button>
            <h2 className="section-title text-center">Add New Sermon</h2>
            <form onSubmit={handleAdminAddSermonSubmit} className="margin-top-3">
              <div className="form-group">
                <label>Sermon Title</label>
                <input 
                  type="text" 
                  value={addSermonForm.title} 
                  onChange={(e) => setAddSermonForm({ ...addSermonForm, title: e.target.value })} 
                  required 
                  placeholder="e.g. The Sanctuary & The Sanctuary Guard" 
                />
              </div>
              <div className="form-group">
                <label>Speaker Name</label>
                <input 
                  type="text" 
                  value={addSermonForm.speaker} 
                  onChange={(e) => setAddSermonForm({ ...addSermonForm, speaker: e.target.value })} 
                  required 
                  placeholder="e.g. Pastor John Mwangi" 
                />
              </div>
              <div className="form-group">
                <label>Date Preached</label>
                <input 
                  type="date" 
                  value={addSermonForm.date} 
                  onChange={(e) => setAddSermonForm({ ...addSermonForm, date: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Scripture Passage</label>
                <input 
                  type="text" 
                  value={addSermonForm.passage} 
                  onChange={(e) => setAddSermonForm({ ...addSermonForm, passage: e.target.value })} 
                  required 
                  placeholder="e.g. Hebrews 8:1-5" 
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={addSermonForm.category} 
                  onChange={(e) => setAddSermonForm({ ...addSermonForm, category: e.target.value })} 
                  required
                >
                  <option value="Sabbath Sermons">Sabbath Sermons</option>
                  <option value="Week of Prayer">Week of Prayer</option>
                  <option value="Evangelistic Series">Evangelistic Series</option>
                  <option value="Bible Studies">Bible Studies</option>
                </select>
              </div>
              <button type="submit" className="btn btn-accent btn-block">Add Sermon</button>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      </>

    </div>
  );
}
