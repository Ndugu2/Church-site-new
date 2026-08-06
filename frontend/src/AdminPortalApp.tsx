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
import { CommunityOutreach, DEFAULT_COMMUNITY_OUTREACH_CONTENT, type CommunityOutreachPageContent } from './components/CommunityOutreach';
import { DEFAULT_GO_BACK_TO_SCHOOL_CONTENT, type GoBackToSchoolPageContent, GoBackToSchool } from './components/GoBackToSchool';
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
const TESTIMONY_DRAFT_KEY = 'sic_testimony_draft';
const TESTIMONY_TITLE_MIN = 6;
const TESTIMONY_TITLE_MAX = 120;
const TESTIMONY_CONTENT_MIN = 80;
const TESTIMONY_CONTENT_MAX = 2000;

type TestimonyFormData = {
  title: string;
  content: string;
  testimony_type: 'prayer_answered' | 'spiritual_growth' | 'community_support' | 'healing_restoration' | 'outreach_impact';
  next_step: 'none' | 'mentor' | 'growth_class' | 'prayer_team' | 'service_team';
  image: string;
};

// --- Types ---
interface Sermon {
  id: number;
  title: string;
  speaker: string;
  date: string;
  passage: string;
  category: string;
  youtube_id?: string;
}

interface ChurchEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  desc: string;
  category?: string;
  capacity?: number | null;
  waitlist_enabled?: boolean;
  attendee_count?: number;
  waitlist_count?: number;
  seats_remaining?: number | null;
  is_published?: boolean;
}

interface BibleStudy {
  id?: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  course: string;
  group_name?: string;
  registration_type?: 'individual' | 'small_group';
  preferred_meeting_day?: string;
  preferred_meeting_time?: string;
  preferred_group_format?: 'in_person' | 'online' | 'hybrid' | '';
  small_group_notes?: string;
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
  is_approved?: boolean;
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
type AdminTestimonyFilter = 'all' | 'pending' | 'approved' | 'featured';

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
  is_published?: boolean;
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

interface StaffDirectoryRecord {
  id: number;
  user: number;
  name?: string;
  position: string;
  department: string;
  bio: string;
  photo: string;
  email: string;
  phone: string;
  order: number;
}

interface ForumCategoryRecord {
  id: number;
  name: string;
  description: string;
  thread_count?: number;
}

interface ForumThreadRecord {
  id: number;
  title: string;
  category: number;
  category_name?: string;
  author_name?: string;
  post_count?: number;
  pinned: boolean;
  closed: boolean;
  updated_at?: string;
}

interface HymnBookRecord {
  id: number;
  title: string;
  abbreviation: string;
  publisher: string;
  year?: number;
  hymn_count: number;
  is_featured: boolean;
}

interface HymnRecord {
  id: number;
  hymn_book: number;
  number: number;
  title: string;
  author: string;
  theme: string;
  hymn_book_abbr?: string;
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
  | 'admin-testimonies'
  | 'admin-announcements'
  | 'admin-staff'
  | 'admin-forums'
  | 'admin-hymns'
  | 'admin-community-outreach'
  | 'admin-go-back-to-school'
  | 'admin-audit'
  | 'admin-projects'
  | 'admin-gallery'
  | 'admin-lessons'
  | 'admin-blog'
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
  { id: 'admin-testimonies', label: '✨ Testimonies' },
  { id: 'admin-announcements', label: '📣 Announcements' },
  { id: 'admin-staff', label: '🧑‍💼 Staff Directory' },
  { id: 'admin-forums', label: '💬 Forums' },
  { id: 'admin-hymns', label: '🎵 Hymns Library' },
  { id: 'admin-community-outreach', label: '🤝 Community Outreach' },
  { id: 'admin-go-back-to-school', label: '🎒 Go Back To School' },
  { id: 'admin-audit', label: '🧾 Audit Trail' },
  { id: 'admin-projects', label: '🏗️ Manage Projects' },
  { id: 'admin-blog', label: '📝 Blog Posts' },
  { id: 'admin-gallery', label: '📸 Manage Gallery' },
  { id: 'admin-lessons', label: '🎬 Lesson Videos' },
  { id: 'admin-sabbath-programme', label: '🗓️ Sabbath Programme' },
];

const ACCESS_RIGHT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'blog', label: 'Blog Posts' },
  { id: 'community_outreach', label: 'Community Outreach' },
  { id: 'go_back_to_school', label: 'Go Back To School' },
  { id: 'bible_studies', label: 'Bible Study' },
  { id: 'sabbath_programme', label: 'Sabbath Programme' },
  { id: 'prayers', label: 'Prayer Requests' },
  { id: 'donations', label: 'Donations' },
  { id: 'events', label: 'Manage Events' },
  { id: 'sermons', label: 'Manage Sermons' },
  { id: 'testimonies', label: 'Testimonies' },
  { id: 'staff', label: 'Staff Directory' },
  { id: 'forums', label: 'Forums' },
  { id: 'hymns', label: 'Hymns Library' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'projects', label: 'Manage Projects' },
  { id: 'gallery', label: 'Manage Gallery' },
  { id: 'lessons', label: 'Lesson Videos' },
];

const ACCESS_RIGHT_LABELS: Record<string, string> = {
  account_registration: 'Registration Accounts',
  announcements: 'Announcements',
  blog: 'Blog Posts',
  community_outreach: 'Community Outreach',
  go_back_to_school: 'Go Back To School',
  bible_studies: 'Bible Study',
  sabbath_programme: 'Sabbath Programme',
  prayers: 'Prayer Requests',
  donations: 'Donations',
  events: 'Manage Events',
  sermons: 'Manage Sermons',
  testimonies: 'Testimonies',
  staff: 'Staff Directory',
  forums: 'Forums',
  hymns: 'Hymns Library',
  audit: 'Audit Trail',
  projects: 'Manage Projects',
  gallery: 'Manage Gallery',
  lessons: 'Lesson Videos',
};

// --- 4 Department Access Presets ---
const DEPARTMENT_PRESETS: Array<{
  role: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  sections: string[];
}> = [
  {
    role: 'church_clerk',
    label: 'Church Clerk',
    icon: '??',
    description: 'Announcements, events, Sabbath programme & Bible studies.',
    color: '#0891b2',
    sections: ['announcements', 'events', 'bible_studies', 'sabbath_programme'],
  },
  {
    role: 'communication',
    label: 'Communication Department',
    icon: '??',
    description: 'Blog posts, announcements, gallery, lesson videos, testimonies & sermons.',
    color: '#7c3aed',
    sections: ['blog', 'announcements', 'gallery', 'lessons', 'testimonies', 'sermons'],
  },
  {
    role: 'evangelistic',
    label: 'Evangelistic Department',
    icon: '??',
    description: 'Bible studies, community outreach, go back to school, prayer requests & forums.',
    color: '#059669',
    sections: ['bible_studies', 'community_outreach', 'go_back_to_school', 'prayers', 'forums'],
  },
  {
    role: 'deaconery',
    label: 'Deaconery Department',
    icon: '??',
    description: 'Events management, donations, staff directory & church projects.',
    color: '#d97706',
    sections: ['events', 'donations', 'staff', 'projects'],
  },
  {
    role: 'church_leaders',
    label: 'Church Leaders',
    icon: '?',
    description: 'Full ministry oversight � access to all departments and sections.',
    color: '#1e3a8a',
    sections: [
      'blog', 'announcements', 'gallery', 'lessons', 'testimonies', 'sermons',
      'bible_studies', 'community_outreach', 'go_back_to_school', 'prayers', 'forums',
      'events', 'donations', 'staff', 'projects',
      'sabbath_programme', 'hymns', 'audit',
    ],
  },
];

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

type CommunityOutreachForm = {
  hero_title: string;
  hero_subtitle: string;
  stats: CommunityOutreachPageContent['stats'];
};

type GoBackToSchoolForm = {
  hero_title: string;
  hero_subtitle: string;
  overall_fundraising_title: string;
  overall_fundraising_copy: string;
  overall_stats: GoBackToSchoolPageContent['overall_stats'];
};

const toCommunityOutreachForm = (content: CommunityOutreachPageContent): CommunityOutreachForm => ({
  hero_title: content.hero_title,
  hero_subtitle: content.hero_subtitle,
  stats: (content.stats.length >= 4 ? content.stats : DEFAULT_COMMUNITY_OUTREACH_CONTENT.stats).slice(0, 4),
});

const toGoBackToSchoolForm = (content: GoBackToSchoolPageContent): GoBackToSchoolForm => ({
  hero_title: content.hero_title,
  hero_subtitle: content.hero_subtitle,
  overall_fundraising_title: content.overall_fundraising_title,
  overall_fundraising_copy: content.overall_fundraising_copy,
  overall_stats: (content.overall_stats.length >= 3 ? content.overall_stats : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_stats).slice(0, 3),
});

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
  { week: 1, title: "Week 1: The Foundation of God's Kingdom", date: "2026-07-04", youtubeId: "", desc: "Understanding the eternal covenant and how the sanctuary services reflect the character of God." },
  { week: 2, title: "Week 2: The Sanctuary and the Covenant", date: "2026-07-11", youtubeId: "", desc: "A deep dive into the earthly sanctuary symbols and their fulfillment in the ministry of Jesus." },
  { week: 3, title: "Week 3: The Sanctuary Guard & The Holy Place", date: "2026-07-18", youtubeId: "", desc: "Exploring the role of the priests and the daily services in the outer court and the holy place." },
  { week: 4, title: "Week 4: Judgment and the Most Holy Place", date: "2026-07-25", youtubeId: "", desc: "Understanding the Day of Atonement, the cleansing of the sanctuary, and the work of our High Priest." },
];

const IS_ADMIN_ENTRY = true;

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



export default function AdminPortalApp() {
  const routeWhitelist = IS_ADMIN_ENTRY ? ADMIN_ROUTE_WHITELIST : PUBLIC_ROUTE_WHITELIST;
  const [currentRoute, setCurrentRoute] = useState('admin');
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
  const [selectedStudyGroup] = useState<'all' | 'unassigned' | string>('all');
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
  const [galleryCloudAvailable, setGalleryCloudAvailable] = useState(true);
  const [galleryUploadForm, setGalleryUploadForm] = useState({ title: '', album: 'Sabbath Worship' });
  const [galleryUploadFile, setGalleryUploadFile] = useState<File | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [selectedLessonWeek, setSelectedLessonWeek] = useState(3);
  const [lessonVideos, setLessonVideos] = useState<any[]>(LESSON_VIDEOS);
  const [addLessonForm, setAddLessonForm] = useState({ week: '', title: '', date: '', youtube_id: '', desc: '' });
  const galleryFileRef = useRef<HTMLInputElement>(null);

  // -- Weekly Discipleship State ----------------------------------------------
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
    { id: 'sabbath', label: 'Attended Sabbath School', icon: '??' },
    { id: 'sermon', label: 'Listened to a Sermon', icon: '???' },
    { id: 'prayer', label: 'Personal Prayer Time', icon: '??' },
    { id: 'devotion', label: 'Daily Devotion (5 Days)', icon: '??' },
    { id: 'verse', label: 'Memorized a Scripture Verse', icon: '??' },
    { id: 'tithe', label: 'Returned Tithe & Offering', icon: '??' },
    { id: 'outreach', label: 'Shared Faith with Someone', icon: '??' },
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
    toast.success('Praise added to the wall! ??');
  };

  const supportPrayer = (id: number) => {
    if (prayerSupportedIds.includes(id)) return;
    const updated = { ...prayerSupport, [id]: (prayerSupport[id] || 0) + 1 };
    const updatedIds = [...prayerSupportedIds, id];
    setPrayerSupport(updated);
    setPrayerSupportedIds(updatedIds);
    localStorage.setItem('sic_prayer_support', JSON.stringify(updated));
    localStorage.setItem('sic_prayer_supported_ids', JSON.stringify(updatedIds));
    toast.success('You are praying with this person! ??');
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
  const [addEventForm, setAddEventForm] = useState({
    title: '',
    date: '',
    location: '',
    category: 'General',
    capacity: '',
    waitlist_enabled: true,
    is_published: true,
    desc: '',
  });
  const [addSermonForm, setAddSermonForm] = useState({ title: '', speaker: '', date: '', passage: '', category: 'Sabbath Sermons', youtube_id: '' });
  const [studyForm, setStudyForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    course: '',
    registration_type: 'individual' as 'individual' | 'small_group',
    preferred_meeting_day: '',
    preferred_meeting_time: '',
    preferred_group_format: '' as 'in_person' | 'online' | 'hybrid' | '',
    small_group_notes: '',
  });
  const [studyFormErrors, setStudyFormErrors] = useState<Record<string, string>>({});
  const [bibleStudySearch, setBibleStudySearch] = useState('');
  const [prayerSearch, setPrayerSearch] = useState('');
  const [prayerStatusFilter, setPrayerStatusFilter] = useState<'all' | 'received' | 'assigned' | 'contacted' | 'ongoing' | 'completed'>('all');
  const [expandedPrayerId, setExpandedPrayerId] = useState<number | null>(null);

  // Donations
  const [donationSearch, setDonationSearch] = useState('');
  const [donationFundFilter, setDonationFundFilter] = useState('all');
  const [showLogDonationForm, setShowLogDonationForm] = useState(false);
  const [logDonationForm, setLogDonationForm] = useState({ amount: '', fund: 'Tithe', method: 'Mobile Money', status: 'Completed Stewardship' });

  // Events
  const [eventSearch, setEventSearch] = useState('');
  const [eventTimeFilter, setEventTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');

  // Sermons
  const [sermonSearch, setSermonSearch] = useState('');
  const [sermonCategoryFilter, setSermonCategoryFilter] = useState('all');

  // Testimonies
  const [testimonySearch, setTestimonySearch] = useState('');

  // Bible Discussion Groups
  interface BibleDiscussionGroup {
    id?: number;
    name: string;
    topic: string;
    meeting_day: string;
    meeting_time: string;
    format: '' | 'in_person' | 'online' | 'hybrid';
    leader_name: string;
    description: string;
    max_members: number | null;
    is_active: boolean;
    member_count?: number;
    created_at?: string;
  }
  const [discussionGroups, setDiscussionGroups] = useState<BibleDiscussionGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [groupForm, setGroupForm] = useState<BibleDiscussionGroup>({
    name: '', topic: '', meeting_day: '', meeting_time: '',
    format: '', leader_name: '', description: '', max_members: null, is_active: true,
  });
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<number, BibleStudy[]>>({});
  const [studySubmitting, setStudySubmitting] = useState(false);
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
  const [prayerFormErrors, setPrayerFormErrors] = useState<Record<string, string>>({});
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);
  const [testimonyForm, setTestimonyForm] = useState<TestimonyFormData>(() => {
    const defaults: TestimonyFormData = {
      title: '',
      content: '',
      testimony_type: 'spiritual_growth',
      next_step: 'none',
      image: '',
    };
    try {
      const rawDraft = localStorage.getItem(TESTIMONY_DRAFT_KEY);
      if (!rawDraft) {
        return defaults;
      }
      const parsed = JSON.parse(rawDraft);
      return {
        ...defaults,
        ...(typeof parsed === 'object' && parsed ? parsed : {}),
      };
    } catch {
      return defaults;
    }
  });
  const [testimonyFormErrors, setTestimonyFormErrors] = useState<Record<string, string>>({});
  const [testimonySubmitting, setTestimonySubmitting] = useState(false);
  const [testimonyNotice, setTestimonyNotice] = useState('');
  const [testimonyDraftSavedAt, setTestimonyDraftSavedAt] = useState('');
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
  const [projectEditOpenIds, setProjectEditOpenIds] = useState<Set<number>>(new Set());
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('All');
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [adminAuditEntries, setAdminAuditEntries] = useState<AdminAuditEntry[]>([]);
  const [adminAuditLoading, setAdminAuditLoading] = useState(false);
  const [adminAuditError, setAdminAuditError] = useState('');
  const [adminAuditActionFilter, setAdminAuditActionFilter] = useState<AdminAuditActionFilter>('all');
  const [adminAuditResourceFilter, setAdminAuditResourceFilter] = useState('');
  const [adminTestimonyFilter, setAdminTestimonyFilter] = useState<AdminTestimonyFilter>('pending');
  const [adminTestimonyActionId, setAdminTestimonyActionId] = useState<number | null>(null);

  const [staffDirectory, setStaffDirectory] = useState<StaffDirectoryRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({
    user: '',
    position: '',
    department: '',
    bio: '',
    photo: '',
    email: '',
    phone: '',
    order: '0',
  });

  const [, setForumCategories] = useState<ForumCategoryRecord[]>([]);
  const [forumThreads, setForumThreads] = useState<ForumThreadRecord[]>([]);
  const [forumsLoading, setForumsLoading] = useState(false);
  const [forumsError, setForumsError] = useState('');
  const [newForumCategory, setNewForumCategory] = useState({ name: '', description: '' });

  const [hymnBooks, setHymnBooks] = useState<HymnBookRecord[]>([]);
  const [hymns, setHymns] = useState<HymnRecord[]>([]);
  const [selectedHymnBookId, setSelectedHymnBookId] = useState<number | 'all'>('all');
  const [hymnsLoading, setHymnsLoading] = useState(false);
  const [hymnsError, setHymnsError] = useState('');
  const [newHymnBook, setNewHymnBook] = useState({ title: '', abbreviation: '', publisher: '', year: '', hymn_count: '0', is_featured: false });
  const [newHymn, setNewHymn] = useState({ hymn_book: '', number: '', title: '', author: '', theme: '', composer: '', lyrics: '' });

  // Blog Posts
  interface BlogPostAdmin {
    id: number;
    title: string;
    slug: string;
    content: string;
    category: string;
    featured_image: string;
    is_published: boolean;
    action_required?: boolean;
    cta_text?: string;
    cta_link?: string;
    audience?: string;
    created_at: string;
    author_name?: string;
  }
  const [blogPosts, setBlogPosts] = useState<BlogPostAdmin[]>([]);
  const [blogPostsLoading, setBlogPostsLoading] = useState(false);
  const [blogPostsError, setBlogPostsError] = useState('');
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [blogDrafts, setBlogDrafts] = useState<Record<number, Partial<BlogPostAdmin>>>({});
  const [showAddBlogForm, setShowAddBlogForm] = useState(false);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCatFilter, setBlogCatFilter] = useState('all');
  const [blogStatusFilter, setBlogStatusFilter] = useState('all');
  const [addBlogForm, setAddBlogForm] = useState({
    title: '',
    content: '',
    category: 'news',
    featured_image: '',
    is_published: true,
    action_required: false,
    cta_text: '',
    cta_link: '',
    audience: '',
  });

  // Alerts
  const [studySuccess] = useState(false);
  const [prayerSuccess] = useState(false);
  const [donationSuccess] = useState(false);
  const [eventRegSuccess] = useState(false);
  const [contactSuccess] = useState(false);

  const studyNameLength = studyForm.name.trim().length;
  const studyCountryLength = studyForm.country.trim().length;
  const isStudyFormValid = studyNameLength >= 4
    && studyNameLength <= 100
    && /.+@.+\..+/.test(studyForm.email.trim())
    && studyForm.phone.trim().length >= 8
    && studyForm.phone.trim().length <= 25
    && studyCountryLength >= 2
    && studyCountryLength <= 80
    && Boolean(studyForm.course.trim())
    && (studyForm.registration_type !== 'small_group' || Boolean(studyForm.preferred_meeting_day.trim()));

  const isPrayerFormValid = prayerForm.content.trim().length >= 10
    && prayerForm.content.length <= 2000
    && (!prayerForm.name.trim() || prayerForm.name.trim().length <= 100);

  const testimonyTitleLength = testimonyForm.title.trim().length;
  const testimonyContentLength = testimonyForm.content.trim().length;
  const isTestimonyFormValid = testimonyTitleLength >= TESTIMONY_TITLE_MIN
    && testimonyTitleLength <= TESTIMONY_TITLE_MAX
    && testimonyContentLength >= TESTIMONY_CONTENT_MIN
    && testimonyContentLength <= TESTIMONY_CONTENT_MAX;

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
  const [communityOutreachForm, setCommunityOutreachForm] = useState<CommunityOutreachForm>(() =>
    toCommunityOutreachForm(DEFAULT_COMMUNITY_OUTREACH_CONTENT)
  );
  const [communityOutreachEditor, setCommunityOutreachEditor] = useState(JSON.stringify(DEFAULT_COMMUNITY_OUTREACH_CONTENT, null, 2));
  const [communityOutreachError, setCommunityOutreachError] = useState('');
  const [goBackToSchoolForm, setGoBackToSchoolForm] = useState<GoBackToSchoolForm>(() =>
    toGoBackToSchoolForm(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT)
  );
  const [goBackToSchoolEditor, setGoBackToSchoolEditor] = useState(JSON.stringify(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT, null, 2));
  const [goBackToSchoolError, setGoBackToSchoolError] = useState('');

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
    { id: 1, title: "Baptism Service � This Sabbath", body: "We will have a special baptism service this Sabbath, 19th July. All baptismal candidates should arrive by 8:30 AM for final preparation.", date: "2026-07-17", priority: "high", icon: "??" },
    { id: 2, title: "Church Choir Practice", body: "All choir members are reminded of the special combined rehearsal on Thursday evening at 6:00 PM in the main sanctuary. International Choir to attend.", date: "2026-07-16", priority: "normal", icon: "??" },
    { id: 3, title: "Mid-Year Thanksgiving Offering", body: "The 2nd quarter special project offering will be received this Sabbath. You can also give via mobile money or bank transfer. God bless your stewardship.", date: "2026-07-15", priority: "high", icon: "??" },
    { id: 4, title: "Campus Outreach � Luwero District", body: "Youth volunteers needed for our community health outreach this coming Sunday. Contact Brother Timothy Omondi to register. Transport will be provided.", date: "2026-07-14", priority: "normal", icon: "??" },
    { id: 5, title: "Pathfinder Club Investiture", body: "Pathfinder and Adventurer Club Investiture ceremony is scheduled for Saturday afternoon at 3:00 PM. Parents and guardians are invited to attend.", date: "2026-07-13", priority: "normal", icon: "?" },
    { id: 6, title: "New Member Orientation", body: "Welcome to all new members! A special orientation session will be held next Sabbath after the afternoon service. Light refreshments will be served.", date: "2026-07-12", priority: "low", icon: "??" },
  ]);
  const [addAnnouncementForm, setAddAnnouncementForm] = useState({
    title: '',
    body: '',
    date: '',
    priority: 'normal',
    icon: '??',
    is_published: true,
  });
  const getRouteFromHash = (): string | null => {
    const raw = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (!raw) return null;
    return routeWhitelist.has(raw) ? raw : null;
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

  // --- API Sync on Load (public endpoints only) ---
  useEffect(() => {
    fetchSermons();
    fetchEvents();
    fetchPrayers();
    fetchTestimonies();
    fetchProjects();
    fetchGallery();
    fetchLessonVideos();
    fetchSabbathProgrammes();
    fetchCommunityOutreachPage();
    fetchGoBackToSchoolPage();
    fetchAnnouncements();
    fetchStaffDirectory();
    fetchForumsAdmin();
    fetchHymnsAdmin();
  }, []);

  // --- Admin-only API Sync (requires authentication) ---
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    fetchBibleStudies();
    fetchDonations();
    fetchBlogPosts();
    fetchDiscussionGroups();
  }, [isAdminAuthenticated]);

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

  const uploadProjectImage = async (file: File): Promise<string> => {
    const adminToken = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/upload/image/`, {
      method: 'POST',
      headers: adminToken ? { Authorization: `Token ${adminToken}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Upload failed');
    }
    const data = await res.json();
    return (data as { url: string }).url;
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
    category: normalizeEditorialText(item.category || 'General'),
    capacity: item.capacity ?? null,
    waitlist_enabled: item.waitlist_enabled !== false,
    is_published: item.is_published !== false,
  });

  const openEventEditor = (item: ChurchEvent) => {
    setEditingEventId(item.id);
    setAddEventForm({
      title: item.title,
      date: item.date,
      location: item.location,
      category: item.category || 'General',
      capacity: item.capacity === null || item.capacity === undefined ? '' : String(item.capacity),
      waitlist_enabled: item.waitlist_enabled !== false,
      is_published: item.is_published !== false,
      desc: item.desc,
    });
    setShowAddEventModal(true);
  };

  const openSermonEditor = (item: Sermon) => {
    setEditingSermonId(item.id);
    setAddSermonForm({ title: item.title, speaker: item.speaker, date: item.date, passage: item.passage, category: item.category, youtube_id: item.youtube_id || '' });
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

  const fetchEvents = async (adminMode = false) => {
    try {
      const res = await fetch(`${API_URL}/events/`, {
        headers: adminMode ? getAdminAuthHeaders() : undefined,
      });
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
      const res = await fetch(`${API_URL}/bible-studies/`, {
        headers: getAdminAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setBibleStudies(list);
      }
    } catch {
      // Local fallback
    }
  };

  const fetchDiscussionGroups = async () => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      const res = await fetch(`${API_URL}/bible-study-groups/`, { headers: getAdminAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDiscussionGroups(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setGroupsError('Unable to load discussion groups.');
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: number, _groupName: string) => {
    try {
      const res = await fetch(`${API_URL}/bible-study-groups/${groupId}/members/`, { headers: getAdminAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroupMembers(prev => ({ ...prev, [groupId]: Array.isArray(data) ? data : [] }));
    } catch {
      setGroupMembers(prev => ({ ...prev, [groupId]: [] }));
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) { toast.error('Group name is required.'); return; }
    const url = editingGroupId ? `${API_URL}/bible-study-groups/${editingGroupId}/` : `${API_URL}/bible-study-groups/`;
    const method = editingGroupId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method, headers: getAdminAuthHeaders(),
      body: JSON.stringify({ ...groupForm, max_members: groupForm.max_members || null }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d?.name?.[0] || d?.detail || 'Could not save group.'); return;
    }
    setGroupForm({ name: '', topic: '', meeting_day: '', meeting_time: '', format: '', leader_name: '', description: '', max_members: null, is_active: true });
    setEditingGroupId(null);
    setShowGroupForm(false);
    await fetchDiscussionGroups();
    toast.success(editingGroupId ? 'Group updated.' : 'Discussion group created.');
  };

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('Delete this discussion group?')) return;
    const res = await fetch(`${API_URL}/bible-study-groups/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
    if (!res.ok) { toast.error('Could not delete group.'); return; }
    await fetchDiscussionGroups();
    toast.success('Group deleted.');
  };

  const handleRemoveMemberFromGroup = async (groupId: number, memberId: number) => {
    const res = await fetch(`${API_URL}/bible-study-groups/${groupId}/remove_member/`, {
      method: 'POST', headers: getAdminAuthHeaders(),
      body: JSON.stringify({ member_id: memberId }),
    });
    if (!res.ok) { toast.error('Could not remove member.'); return; }
    await fetchGroupMembers(groupId, '');
    await fetchBibleStudies();
    toast.success('Member removed from group.');
  };

  const handleAssignMemberToGroup = async (groupId: number, memberId: number) => {
    const res = await fetch(`${API_URL}/bible-study-groups/${groupId}/assign_member/`, {
      method: 'POST', headers: getAdminAuthHeaders(),
      body: JSON.stringify({ member_id: memberId }),
    });
    if (!res.ok) { toast.error('Could not assign member.'); return; }
    await fetchGroupMembers(groupId, '');
    await fetchBibleStudies();
    toast.success('Member assigned to group.');
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
      icon: item.featured_image || '??',
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

  const fetchStaffDirectory = async (adminMode = false) => {
    setStaffLoading(true);
    setStaffError('');
    try {
      const res = await fetch(`${API_URL}/staff/`, {
        headers: adminMode ? getAdminAuthHeaders() : undefined,
      });
      if (!res.ok) {
        throw new Error('Could not load staff directory.');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setStaffDirectory(list);
    } catch {
      setStaffError('Unable to load staff directory records.');
    } finally {
      setStaffLoading(false);
    }
  };

  const saveStaffRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.user.trim() || !staffForm.position.trim() || !staffForm.department.trim() || !staffForm.bio.trim() || !staffForm.email.trim()) {
      toast.error('User ID, position, department, bio, photo, and email are required.');
      return;
    }

    const payload = {
      user: Number(staffForm.user),
      position: staffForm.position,
      department: staffForm.department,
      bio: staffForm.bio,
      photo: staffForm.photo,
      email: staffForm.email,
      phone: staffForm.phone,
      order: Number(staffForm.order || 0),
    };

    const url = editingStaffId ? `${API_URL}/staff/${editingStaffId}/` : `${API_URL}/staff/`;
    const method = editingStaffId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.detail || data?.error || 'Could not save staff record.');
      return;
    }

    setStaffForm({ user: '', position: '', department: '', bio: '', photo: '', email: '', phone: '', order: '0' });
    setEditingStaffId(null);
    await fetchStaffDirectory(true);
    toast.success('Staff record saved.');
  };

  const removeStaffRecord = async (id: number) => {
    if (!window.confirm('Delete this staff profile?')) return;
    const res = await fetch(`${API_URL}/staff/${id}/`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      toast.error('Could not delete staff profile.');
      return;
    }
    await fetchStaffDirectory(true);
    toast.success('Staff profile removed.');
  };

  const fetchForumsAdmin = async () => {
    setForumsLoading(true);
    setForumsError('');
    try {
      const [catRes, threadRes] = await Promise.all([
        fetch(`${API_URL}/forum-categories/`),
        fetch(`${API_URL}/forum-threads/`),
      ]);

      if (!catRes.ok || !threadRes.ok) {
        throw new Error('Could not load forum data.');
      }

      const catData = await catRes.json();
      const threadData = await threadRes.json();
      const catList = Array.isArray(catData) ? catData : (catData.results ?? []);
      const threadList = Array.isArray(threadData) ? threadData : (threadData.results ?? []);
      const catMap = new globalThis.Map<number, string>(catList.map((item: ForumCategoryRecord) => [item.id, item.name]));

      setForumCategories(catList);
      setForumThreads(threadList.map((item: any) => ({
        ...item,
        category_name: catMap.get(item.category) || 'Unknown',
      })));
    } catch {
      setForumsError('Unable to load forums data.');
    } finally {
      setForumsLoading(false);
    }
  };

  const createForumCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForumCategory.name.trim() || !newForumCategory.description.trim()) {
      toast.error('Forum category name and description are required.');
      return;
    }
    const res = await fetch(`${API_URL}/forum-categories/`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(newForumCategory),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.detail || data?.error || 'Could not create forum category.');
      return;
    }
    setNewForumCategory({ name: '', description: '' });
    await fetchForumsAdmin();
    toast.success('Forum category created.');
  };

  const updateForumThreadState = async (thread: ForumThreadRecord, patch: Partial<Pick<ForumThreadRecord, 'pinned' | 'closed'>>) => {
    const res = await fetch(`${API_URL}/forum-threads/${thread.id}/`, {
      method: 'PATCH',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error('Could not update forum thread.');
      return;
    }
    await fetchForumsAdmin();
  };

  const removeForumThread = async (threadId: number) => {
    if (!window.confirm('Delete this thread?')) return;
    const res = await fetch(`${API_URL}/forum-threads/${threadId}/`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      toast.error('Could not delete thread.');
      return;
    }
    await fetchForumsAdmin();
  };

  const fetchHymnsAdmin = async () => {
    setHymnsLoading(true);
    setHymnsError('');
    try {
      const [bookRes, hymnRes] = await Promise.all([
        fetch(`${API_URL}/hymn-books/`),
        fetch(`${API_URL}/hymns/`),
      ]);

      if (!bookRes.ok || !hymnRes.ok) {
        throw new Error('Could not load hymn data.');
      }

      const bookData = await bookRes.json();
      const hymnData = await hymnRes.json();
      const books = Array.isArray(bookData) ? bookData : (bookData.results ?? []);
      const hymnList = Array.isArray(hymnData) ? hymnData : (hymnData.results ?? []);
      setHymnBooks(books);
      setHymns(hymnList);
    } catch {
      setHymnsError('Unable to load hymns library data.');
    } finally {
      setHymnsLoading(false);
    }
  };

  const createHymnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHymnBook.title.trim() || !newHymnBook.abbreviation.trim()) {
      toast.error('Book title and abbreviation are required.');
      return;
    }

    const payload = {
      title: newHymnBook.title,
      abbreviation: newHymnBook.abbreviation,
      publisher: newHymnBook.publisher,
      year: newHymnBook.year ? Number(newHymnBook.year) : null,
      hymn_count: Number(newHymnBook.hymn_count || 0),
      is_featured: newHymnBook.is_featured,
      description: '',
    };

    const res = await fetch(`${API_URL}/hymn-books/`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.detail || data?.error || 'Could not create hymn book.');
      return;
    }

    setNewHymnBook({ title: '', abbreviation: '', publisher: '', year: '', hymn_count: '0', is_featured: false });
    await fetchHymnsAdmin();
    toast.success('Hymn book created.');
  };

  const createHymn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHymn.hymn_book || !newHymn.number || !newHymn.title.trim() || !newHymn.lyrics.trim()) {
      toast.error('Book, number, title, and lyrics are required to create a hymn.');
      return;
    }

    const payload = {
      hymn_book: Number(newHymn.hymn_book),
      number: Number(newHymn.number),
      title: newHymn.title,
      author: newHymn.author,
      composer: newHymn.composer,
      lyrics: newHymn.lyrics,
      theme: newHymn.theme,
      tune_name: '',
      audio_url: '',
    };

    const res = await fetch(`${API_URL}/hymns/`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.detail || data?.error || 'Could not create hymn.');
      return;
    }

    setNewHymn({ hymn_book: '', number: '', title: '', author: '', theme: '', composer: '', lyrics: '' });
    await fetchHymnsAdmin();
    toast.success('Hymn created.');
  };

  const removeHymn = async (id: number) => {
    if (!window.confirm('Delete this hymn?')) return;
    const res = await fetch(`${API_URL}/hymns/${id}/`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      toast.error('Could not delete hymn.');
      return;
    }
    await fetchHymnsAdmin();
    toast.success('Hymn deleted.');
  };

  // --- Blog Posts Admin CRUD ---
  const fetchBlogPosts = async () => {
    setBlogPostsLoading(true);
    setBlogPostsError('');
    try {
      const res = await fetch(`${API_URL}/blog/`, { headers: getAdminAuthHeaders() });
      if (!res.ok) throw new Error('Could not load blog posts.');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setBlogPosts(list);
    } catch {
      setBlogPostsError('Unable to load blog posts.');
    } finally {
      setBlogPostsLoading(false);
    }
  };

  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBlogForm.title.trim() || !addBlogForm.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    const res = await fetch(`${API_URL}/blog/`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(addBlogForm),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || data?.detail || 'Could not create blog post.');
      return;
    }
    setAddBlogForm({ title: '', content: '', category: 'news', featured_image: '', is_published: true, action_required: false, cta_text: '', cta_link: '', audience: '' });
    await fetchBlogPosts();
    toast.success('Blog post created.');
  };

  const handleUpdateBlogPost = async (id: number) => {
    const draft = blogDrafts[id];
    if (!draft) return;
    const res = await fetch(`${API_URL}/blog/${id}/`, {
      method: 'PATCH',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      toast.error('Could not update blog post.');
      return;
    }
    setEditingBlogId(null);
    setBlogDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    await fetchBlogPosts();
    toast.success('Blog post updated.');
  };

  const handleDeleteBlogPost = async (id: number) => {
    if (!window.confirm('Delete this blog post?')) return;
    const res = await fetch(`${API_URL}/blog/${id}/`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      toast.error('Could not delete blog post.');
      return;
    }
    await fetchBlogPosts();
    toast.success('Blog post deleted.');
  };

  const handleToggleBlogPublished = async (post: { id: number; is_published: boolean }) => {
    const res = await fetch(`${API_URL}/blog/${post.id}/`, {
      method: 'PATCH',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ is_published: !post.is_published }),
    });
    if (!res.ok) {
      toast.error('Could not update publish status.');
      return;
    }
    await fetchBlogPosts();
    toast.success(post.is_published ? 'Post unpublished.' : 'Post published.');
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

  const normalizeCommunityOutreachPage = (item: any): CommunityOutreachPageContent | null => {
    if (!item || typeof item !== 'object') {
      return null;
    }

    return {
      page_key: typeof item.page_key === 'string' ? item.page_key : DEFAULT_COMMUNITY_OUTREACH_CONTENT.page_key,
      hero_title: typeof item.hero_title === 'string' ? item.hero_title : DEFAULT_COMMUNITY_OUTREACH_CONTENT.hero_title,
      hero_subtitle: typeof item.hero_subtitle === 'string' ? item.hero_subtitle : DEFAULT_COMMUNITY_OUTREACH_CONTENT.hero_subtitle,
      stats: Array.isArray(item.stats) && item.stats.length > 0 ? item.stats : DEFAULT_COMMUNITY_OUTREACH_CONTENT.stats,
      programs: Array.isArray(item.programs) && item.programs.length > 0 ? item.programs : DEFAULT_COMMUNITY_OUTREACH_CONTENT.programs,
      upcoming_visits: Array.isArray(item.upcoming_visits) && item.upcoming_visits.length > 0 ? item.upcoming_visits : DEFAULT_COMMUNITY_OUTREACH_CONTENT.upcoming_visits,
      testimonials: Array.isArray(item.testimonials) && item.testimonials.length > 0 ? item.testimonials : DEFAULT_COMMUNITY_OUTREACH_CONTENT.testimonials,
      contact_points: Array.isArray(item.contact_points) && item.contact_points.length > 0 ? item.contact_points : DEFAULT_COMMUNITY_OUTREACH_CONTENT.contact_points,
    };
  };

  const saveCommunityOutreachPageToBackend = async (pageContent: CommunityOutreachPageContent) => {
    const listRes = await fetch(`${API_URL}/community-outreach/`);
    if (!listRes.ok) {
      throw new Error('Failed to load existing community outreach page.');
    }

    const existing = await listRes.json();
    const existingList: any[] = Array.isArray(existing) ? existing : (existing.results ?? []);
    const existingItem = existingList[0];
    const payload = {
      page_key: pageContent.page_key || 'community-outreach',
      hero_title: pageContent.hero_title,
      hero_subtitle: pageContent.hero_subtitle,
      stats: pageContent.stats,
      programs: pageContent.programs,
      upcoming_visits: pageContent.upcoming_visits,
      testimonials: pageContent.testimonials,
      contact_points: pageContent.contact_points,
      is_published: true,
    };

    const url = existingItem ? `${API_URL}/community-outreach/${existingItem.id}/` : `${API_URL}/community-outreach/`;
    const method = existingItem ? 'PUT' : 'POST';
    const saveRes = await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!saveRes.ok) {
      throw new Error('Failed to save community outreach page.');
    }
  };

  const normalizeGoBackToSchoolPage = (item: any): GoBackToSchoolPageContent | null => {
    if (!item || typeof item !== 'object') {
      return null;
    }

    return {
      hero_title: typeof item.hero_title === 'string' ? item.hero_title : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.hero_title,
      hero_subtitle: typeof item.hero_subtitle === 'string' ? item.hero_subtitle : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.hero_subtitle,
      overall_fundraising_title: typeof item.overall_fundraising_title === 'string' ? item.overall_fundraising_title : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_fundraising_title,
      overall_fundraising_copy: typeof item.overall_fundraising_copy === 'string' ? item.overall_fundraising_copy : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_fundraising_copy,
      overall_stats: Array.isArray(item.overall_stats) && item.overall_stats.length > 0 ? item.overall_stats : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_stats,
      student_cases: Array.isArray(item.student_cases) && item.student_cases.length > 0 ? item.student_cases : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.student_cases,
      ways_to_give: Array.isArray(item.ways_to_give) && item.ways_to_give.length > 0 ? item.ways_to_give : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.ways_to_give,
      impact_levels: Array.isArray(item.impact_levels) && item.impact_levels.length > 0 ? item.impact_levels : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.impact_levels,
      contact_points: Array.isArray(item.contact_points) && item.contact_points.length > 0 ? item.contact_points : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.contact_points,
    };
  };

  const saveGoBackToSchoolPageToBackend = async (pageContent: GoBackToSchoolPageContent) => {
    const listRes = await fetch(`${API_URL}/go-back-to-school/`);
    if (!listRes.ok) {
      throw new Error('Failed to load existing Go Back To School page.');
    }

    const existing = await listRes.json();
    const existingList: any[] = Array.isArray(existing) ? existing : (existing.results ?? []);
    const existingItem = existingList[0];
    const payload = {
      page_key: 'go-back-to-school',
      hero_title: pageContent.hero_title,
      hero_subtitle: pageContent.hero_subtitle,
      overall_fundraising_title: pageContent.overall_fundraising_title,
      overall_fundraising_copy: pageContent.overall_fundraising_copy,
      overall_stats: pageContent.overall_stats,
      student_cases: pageContent.student_cases,
      ways_to_give: pageContent.ways_to_give,
      impact_levels: pageContent.impact_levels,
      contact_points: pageContent.contact_points,
      is_published: true,
    };

    const url = existingItem ? `${API_URL}/go-back-to-school/${existingItem.id}/` : `${API_URL}/go-back-to-school/`;
    const method = existingItem ? 'PUT' : 'POST';
    const saveRes = await fetch(url, {
      method,
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!saveRes.ok) {
      throw new Error('Failed to save Go Back To School page.');
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

  const fetchCommunityOutreachPage = async () => {
    try {
      const res = await fetch(`${API_URL}/community-outreach/`);
      if (!res.ok) {
        throw new Error('Failed to fetch community outreach page.');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      const mapped = normalizeCommunityOutreachPage(list[0]);
      if (mapped) {
        setCommunityOutreachForm(toCommunityOutreachForm(mapped));
        setCommunityOutreachEditor(JSON.stringify(list[0] ?? mapped, null, 2));
        return;
      }

      setCommunityOutreachForm(toCommunityOutreachForm(DEFAULT_COMMUNITY_OUTREACH_CONTENT));
      setCommunityOutreachEditor(JSON.stringify(DEFAULT_COMMUNITY_OUTREACH_CONTENT, null, 2));
    } catch {
      setCommunityOutreachForm(toCommunityOutreachForm(DEFAULT_COMMUNITY_OUTREACH_CONTENT));
      setCommunityOutreachEditor(JSON.stringify(DEFAULT_COMMUNITY_OUTREACH_CONTENT, null, 2));
    }
  };

  const fetchGoBackToSchoolPage = async () => {
    try {
      const res = await fetch(`${API_URL}/go-back-to-school/`);
      if (!res.ok) {
        throw new Error('Failed to fetch Go Back To School page.');
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      const mapped = normalizeGoBackToSchoolPage(list[0]);
      if (mapped) {
        setGoBackToSchoolForm(toGoBackToSchoolForm(mapped));
        setGoBackToSchoolEditor(JSON.stringify(list[0] ?? mapped, null, 2));
        return;
      }

      setGoBackToSchoolForm(toGoBackToSchoolForm(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT));
      setGoBackToSchoolEditor(JSON.stringify(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT, null, 2));
    } catch {
      setGoBackToSchoolForm(toGoBackToSchoolForm(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT));
      setGoBackToSchoolEditor(JSON.stringify(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT, null, 2));
    }
  };

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_URL}/gallery/`);
      if (!res.ok) {
        throw new Error('Failed to fetch gallery images.');
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setGalleryCloudAvailable(true);
      setGallery(list);
    } catch {
      setGalleryCloudAvailable(false);
      setGallery([]);
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
      toast.error('Gallery storage is not configured. Add Supabase keys in frontend .env.');
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

      const res = await fetch(`${API_URL}/gallery/`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ album: galleryUploadForm.album, title: galleryUploadForm.title, img_url: publicUrl, is_published: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to save gallery image.');
      }

      toast.success('Image added to gallery successfully! ??');
      setGalleryUploadForm({ title: '', album: 'Sabbath Worship' });
      setGalleryUploadFile(null);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
      fetchGallery();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gallery save failed.';
      toast.error(message);
    } finally {
      setGalleryUploading(false);
    }
  };

  // --- Submissions handlers ---

  const validateStudyForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (studyNameLength < 4) {
      errors.name = 'Please enter your full name (at least 4 characters).';
    } else if (studyNameLength > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    if (!/.+@.+\..+/.test(studyForm.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (studyForm.phone.trim().length < 8) {
      errors.phone = 'Please enter a valid phone number.';
    } else if (studyForm.phone.trim().length > 25) {
      errors.phone = 'Phone number cannot exceed 25 characters.';
    }

    if (studyCountryLength < 2) {
      errors.country = 'Please enter your country of origin.';
    } else if (studyCountryLength > 80) {
      errors.country = 'Country cannot exceed 80 characters.';
    }

    if (!studyForm.course.trim()) {
      errors.course = 'Please select a study topic.';
    }

    if (studyForm.registration_type === 'small_group' && !studyForm.preferred_meeting_day.trim()) {
      errors.preferred_meeting_day = 'Please choose a preferred meeting day for your small group.';
    }

    setStudyFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateStudyField = (field: keyof typeof studyForm, value: string) => {
    setStudyForm((prev) => ({ ...prev, [field]: value }));
    if (studyFormErrors[field]) {
      setStudyFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBibleStudySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStudyForm()) {
      toast.error('Please fix the Bible study form errors.');
      return;
    }

    setStudySubmitting(true);
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
    setStudyForm({
      name: '',
      email: '',
      phone: '',
      country: '',
      course: '',
      registration_type: 'individual',
      preferred_meeting_day: '',
      preferred_meeting_time: '',
      preferred_group_format: '',
      small_group_notes: '',
    });
    setStudyFormErrors({});
    setStudySubmitting(false);
  };

  const validatePrayerForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!prayerForm.content.trim()) {
      errors.content = 'Please share your prayer request or praise report.';
    } else if (prayerForm.content.trim().length < 10) {
      errors.content = 'Your request should be at least 10 characters long.';
    } else if (prayerForm.content.length > 2000) {
      errors.content = 'Your request cannot exceed 2000 characters.';
    }

    if (prayerForm.name.trim() && prayerForm.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    setPrayerFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePrayerRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePrayerForm()) {
      toast.error('Please fix the errors in your form.');
      return;
    }

    setPrayerSubmitting(true);
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
    setPrayerFormErrors({});
    setPrayerSubmitting(false);
  };

  async function fetchTestimonies(adminMode = false) {
    try {
      const res = await fetch(`${API_URL}/testimonies/`, {
        headers: adminMode ? getAdminAuthHeaders() : undefined,
      });
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || [];
      setTestimonies(items);
    } catch {
      setTestimonies([]);
    }
  }

  const validateTestimonyForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (testimonyTitleLength < TESTIMONY_TITLE_MIN) {
      errors.title = `Title should be at least ${TESTIMONY_TITLE_MIN} characters.`;
    } else if (testimonyTitleLength > TESTIMONY_TITLE_MAX) {
      errors.title = `Title should be ${TESTIMONY_TITLE_MAX} characters or fewer.`;
    }

    if (testimonyContentLength < TESTIMONY_CONTENT_MIN) {
      errors.content = `Please share a little more detail (minimum ${TESTIMONY_CONTENT_MIN} characters).`;
    } else if (testimonyContentLength > TESTIMONY_CONTENT_MAX) {
      errors.content = `Your testimony cannot exceed ${TESTIMONY_CONTENT_MAX} characters.`;
    }

    setTestimonyFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateTestimonyField = <K extends keyof TestimonyFormData>(
    field: K,
    value: TestimonyFormData[K]
  ) => {
    setTestimonyForm(prev => ({ ...prev, [field]: value }));
    setTestimonyNotice('');
    if (testimonyFormErrors[field]) {
      setTestimonyFormErrors(prev => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const saveTestimonyDraft = () => {
    localStorage.setItem(TESTIMONY_DRAFT_KEY, JSON.stringify(testimonyForm));
    setTestimonyDraftSavedAt(new Date().toLocaleTimeString());
    toast.success('Draft saved on this device.');
  };

  const handleTestimonySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateTestimonyForm()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const token = localStorage.getItem('user_token');
    if (!token) {
      setShowAuthModal(true);
      toast.error('Please log in to share a testimony.');
      return;
    }

    setTestimonySubmitting(true);
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
        const errorData = await res.json().catch(() => null);
        const message = errorData?.detail || errorData?.error || 'Unable to submit testimony at the moment.';
        throw new Error(message);
      }
      toast.success('Testimony submitted for pastoral review. Thank you for sharing.');
      setTestimonyNotice('Submission received. Our pastoral team reviews testimonies within 48 hours before publishing.');
      triggerLog(`Testimony submitted: ${testimonyForm.title}`);
      setTestimonyForm({
        title: '',
        content: '',
        testimony_type: 'spiritual_growth',
        next_step: 'none',
        image: '',
      });
      setTestimonyFormErrors({});
      setTestimonyDraftSavedAt('');
      localStorage.removeItem(TESTIMONY_DRAFT_KEY);
      fetchTestimonies();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      toast.error(message);
      setTestimonyNotice('We could not submit right now. Your draft is still available on this device.');
    } finally {
      setTestimonySubmitting(false);
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          name: eventRegForm.name.trim(),
          email: eventRegForm.email.trim(),
          phone: eventRegForm.phone.trim(),
          notes: eventRegForm.notes.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not register for the event.');
      }

      const data = await res.json();
      const reference = data?.id ? `EVR-${String(data.id).padStart(4, '0')}` : `EVR-${Date.now()}`;
      const alreadyRegistered = data?.already_registered === true;
      const waitlisted = data?.waitlisted === true;
      const waitlistPosition = typeof data?.waitlist_position === 'number' ? data.waitlist_position : null;

      triggerLog(`Registration received from ${eventRegForm.name} for event: ${registeringEvent.title}`);
      if (alreadyRegistered) {
        toast.success(`You are already registered. Ref: ${reference}`);
      } else if (waitlisted) {
        const suffix = waitlistPosition ? ` Position #${waitlistPosition}.` : '';
        toast.success(`Event is currently full. You have been added to the waitlist.${suffix} Ref: ${reference}`);
      } else {
        toast.success(`Successfully registered. Ref: ${reference}`);
      }
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
    const { title, date, location, category, capacity, waitlist_enabled, is_published, desc } = addEventForm;
    const parsedCapacity = capacity.trim() === '' ? null : Number(capacity);
    if (parsedCapacity !== null && (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0)) {
      toast.error('Event capacity must be empty or a positive number.');
      return;
    }

    try {
      const url = editingEventId ? `${API_URL}/events/${editingEventId}/` : `${API_URL}/events/`;
      const res = await fetch(url, {
        method: editingEventId ? 'PATCH' : 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          title,
          date,
          location,
          category: category.trim() || 'General',
          capacity: parsedCapacity,
          waitlist_enabled,
          is_published,
          desc,
        })
      });
      if (res.ok) {
        fetchEvents(true);
      } else {
        throw new Error();
      }
    } catch {
      const nextId = events.length > 0 ? Math.max(...events.map(ev => ev.id)) + 1 : 1;
      setEvents(prev => [...prev, {
        id: nextId,
        title,
        date,
        location,
        category: category.trim() || 'General',
        capacity: parsedCapacity,
        waitlist_enabled,
        is_published,
        desc,
      }]);
    }
    triggerLog(`Event "${title}" added to calendar.`);
    toast.success("Event added successfully!");
    setAddEventForm({
      title: '',
      date: '',
      location: '',
      category: 'General',
      capacity: '',
      waitlist_enabled: true,
      is_published: true,
      desc: '',
    });
    setEditingEventId(null);
    setShowAddEventModal(false);
  };

  // Add Sermon Action (Admin)
  const handleAdminAddSermonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, speaker, date, passage, category, youtube_id } = addSermonForm;
    try {
      const url = editingSermonId ? `${API_URL}/sermons/${editingSermonId}/` : `${API_URL}/sermons/`;
      const res = await fetch(url, {
        method: editingSermonId ? 'PATCH' : 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ title, speaker, date, passage, category, youtube_id: youtube_id || '' })
      });
      if (res.ok) {
        fetchSermons();
      } else {
        throw new Error();
      }
    } catch {
      const nextId = sermons.length > 0 ? Math.max(...sermons.map(s => s.id)) + 1 : 1;
      setSermons(prev => [{ id: nextId, title, speaker, date, passage, category, youtube_id: youtube_id || '' }, ...prev]);
    }
    triggerLog(`Sermon "${title}" added to archive.`);
    toast.success("Sermon added successfully!");
    setAddSermonForm({ title: '', speaker: '', date: '', passage: '', category: 'Sabbath Sermons', youtube_id: '' });
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
          group_name: draft.group_name?.trim() || '',
          registration_type: draft.registration_type,
          preferred_meeting_day: draft.preferred_meeting_day,
          preferred_meeting_time: draft.preferred_meeting_time,
          preferred_group_format: draft.preferred_group_format,
          small_group_notes: draft.small_group_notes,
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

  const handleAdminModerateTestimony = async (
    item: TestimonyItem,
    updates: Partial<Pick<TestimonyItem, 'is_approved' | 'is_featured'>>,
    successMessage: string
  ) => {
    setAdminTestimonyActionId(item.id);
    try {
      const res = await fetch(`${API_URL}/testimonies/${item.id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        throw new Error();
      }
      await fetchTestimonies(true);
      triggerLog(`Testimony moderated: ID ${item.id}`);
      toast.success(successMessage);
    } catch {
      setTestimonies((prev) => prev.map((entry) => (
        entry.id === item.id ? { ...entry, ...updates } : entry
      )));
      triggerLog(`Testimony moderated locally: ID ${item.id}`);
      toast.success(`${successMessage} (local)`);
    } finally {
      setAdminTestimonyActionId(null);
    }
  };

  const handleAdminDeleteTestimony = async (item: TestimonyItem) => {
    setAdminTestimonyActionId(item.id);
    try {
      const res = await fetch(`${API_URL}/testimonies/${item.id}/`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error();
      }
      await fetchTestimonies(true);
      triggerLog(`Testimony deleted: ID ${item.id}`);
      toast.success('Testimony removed.');
    } catch {
      setTestimonies((prev) => prev.filter((entry) => entry.id !== item.id));
      triggerLog(`Testimony deleted locally: ID ${item.id}`);
      toast.success('Testimony removed locally.');
    } finally {
      setAdminTestimonyActionId(null);
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

  const handleLogDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(logDonationForm.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount.'); return; }
    try {
      const res = await fetch(`${API_URL}/donations/`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ ...logDonationForm, amount }),
      });
      if (!res.ok) throw new Error();
      setLogDonationForm({ amount: '', fund: 'Tithe', method: 'Mobile Money', status: 'Completed Stewardship' });
      setShowLogDonationForm(false);
      await fetchDonations();
      toast.success('Donation logged.');
      triggerLog(`Donation logged: ${amount.toLocaleString()} UGX � ${logDonationForm.fund}`);
    } catch {
      toast.error('Could not log donation.');
    }
  };

  const handleDeleteDonation = async (id: number) => {
    if (!window.confirm('Delete this donation record?')) return;
    try {
      await fetch(`${API_URL}/donations/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      await fetchDonations();
      toast.success('Donation deleted.');
    } catch {
      setDonations(prev => prev.filter(d => d.id !== id));
    }
  };

  // Delete Handlers
  const handleAdminToggleEventPublish = async (item: ChurchEvent) => {
    const nextPublished = !(item.is_published !== false);

    try {
      const res = await fetch(`${API_URL}/events/${item.id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ is_published: nextPublished }),
      });
      if (!res.ok) throw new Error();

      await fetchEvents(true);
      triggerLog(`${nextPublished ? 'Published' : 'Hidden'} event: ${item.title}`);
      toast.success(nextPublished ? 'Event is now visible on the public site.' : 'Event hidden from the public site.');
    } catch {
      toast.error('Could not update event visibility right now.');
    }
  };

  const handleAdminDeleteEvent = async (id: number) => {
    try {
      await fetch(`${API_URL}/events/${id}/`, { method: 'DELETE', headers: getAdminAuthHeaders() });
      fetchEvents(true);
    } catch {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
    triggerLog(`Removed event ID: ${id}`);
  };

  const handleAdminExportEventAttendees = async (eventId?: number) => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      toast.error('Admin session is required to export attendees.');
      return;
    }

    const query = eventId ? `?event_id=${eventId}` : '';
    try {
      const res = await fetch(`${API_URL}/events/attendees_export/${query}`, {
        headers: { Authorization: `Token ${adminToken}` },
      });
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const suffix = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = eventId ? `event_${eventId}_attendees_${suffix}.csv` : `event_attendees_${suffix}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success(eventId ? 'Event attendees export downloaded.' : 'All event attendees export downloaded.');
    } catch {
      toast.error('Could not export attendees right now.');
    }
  };
  void handleAdminExportEventAttendees;

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

  const handlePrayerStatusUpdate = async (id: number, follow_up_status: string) => {
    try {
      const res = await fetch(`${API_URL}/prayers/${id}/`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ follow_up_status }),
      });
      if (res.ok) {
        setPrayers(prev => prev.map(p => p.id === id ? { ...p, follow_up_status: follow_up_status as PrayerRequest['follow_up_status'] } : p));
        toast.success('Follow-up status updated.');
      }
    } catch {
      toast.error('Could not update status.');
    }
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
      setAddAnnouncementForm({ title: '', body: '', date: '', priority: 'normal', icon: '??', is_published: true });
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

  const handleSaveCommunityOutreach = () => {
    setCommunityOutreachError('');
    try {
      const parsed = JSON.parse(communityOutreachEditor);
      const normalized = normalizeCommunityOutreachPage(parsed);
      if (!normalized) {
        setCommunityOutreachError('Community Outreach data must be a valid JSON object.');
        return;
      }

      void (async () => {
        try {
          const merged = { ...normalized, ...communityOutreachForm };
          await saveCommunityOutreachPageToBackend(merged);
          await fetchCommunityOutreachPage();
          triggerLog('Community Outreach page updated.');
          toast.success('Community Outreach page updated successfully.');
        } catch {
          setCommunityOutreachError('Could not save Community Outreach page to backend.');
        }
      })();
    } catch {
      setCommunityOutreachError('Invalid JSON format. Please fix syntax and try again.');
    }
  };

  const handleResetCommunityOutreach = () => {
    setCommunityOutreachError('');
    setCommunityOutreachForm(toCommunityOutreachForm(DEFAULT_COMMUNITY_OUTREACH_CONTENT));
    setCommunityOutreachEditor(JSON.stringify(DEFAULT_COMMUNITY_OUTREACH_CONTENT, null, 2));

    void (async () => {
      try {
        await saveCommunityOutreachPageToBackend(DEFAULT_COMMUNITY_OUTREACH_CONTENT);
        await fetchCommunityOutreachPage();
        triggerLog('Community Outreach page reset to default template.');
        toast('Community Outreach page reset to default.');
      } catch {
        setCommunityOutreachError('Could not reset Community Outreach page in backend.');
      }
    })();
  };

  const handleSaveGoBackToSchool = () => {
    setGoBackToSchoolError('');
    try {
      const parsed = JSON.parse(goBackToSchoolEditor);
      const normalized = normalizeGoBackToSchoolPage(parsed);
      if (!normalized) {
        setGoBackToSchoolError('Go Back To School data must be a valid JSON object.');
        return;
      }

      void (async () => {
        try {
          const merged = { ...normalized, ...goBackToSchoolForm };
          await saveGoBackToSchoolPageToBackend(merged);
          await fetchGoBackToSchoolPage();
          triggerLog('Go Back To School page updated.');
          toast.success('Go Back To School page updated successfully.');
        } catch {
          setGoBackToSchoolError('Could not save Go Back To School page to backend.');
        }
      })();
    } catch {
      setGoBackToSchoolError('Invalid JSON format. Please fix syntax and try again.');
    }
  };

  const handleResetGoBackToSchool = () => {
    setGoBackToSchoolError('');
    setGoBackToSchoolForm(toGoBackToSchoolForm(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT));
    setGoBackToSchoolEditor(JSON.stringify(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT, null, 2));

    void (async () => {
      try {
        await saveGoBackToSchoolPageToBackend(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT);
        await fetchGoBackToSchoolPage();
        triggerLog('Go Back To School page reset to default template.');
        toast('Go Back To School page reset to default.');
      } catch {
        setGoBackToSchoolError('Could not reset Go Back To School page in backend.');
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
  const filteredAdminTestimonies = testimonies.filter((item) => {
    if (adminTestimonyFilter === 'pending') {
      return item.is_approved !== true;
    }
    if (adminTestimonyFilter === 'approved') {
      return item.is_approved === true;
    }
    if (adminTestimonyFilter === 'featured') {
      return item.is_featured === true;
    }
    return true;
  });
  void filteredAdminTestimonies;

  const totalDonations = donations.reduce((sum, item) => sum + item.amount, 0);
  const studyGroupOptions = Array.from(new Set(
    bibleStudies
      .map((item) => item.group_name?.trim())
      .filter((value): value is string => Boolean(value))
  )).sort((left, right) => left.localeCompare(right));
  const filteredBibleStudies = bibleStudies.filter((item) => {
    const groupName = item.group_name?.trim() || '';
    if (selectedStudyGroup === 'all') return true;
    if (selectedStudyGroup === 'unassigned') return !groupName;
    return groupName === selectedStudyGroup;
  });
  void filteredBibleStudies;
  const bibleStudyGroupSummary = studyGroupOptions.map((groupName) => ({
    groupName,
    count: bibleStudies.filter((item) => (item.group_name?.trim() || '') === groupName).length,
  }));
  void bibleStudyGroupSummary;
  const unassignedBibleStudyCount = bibleStudies.filter((item) => !(item.group_name?.trim())).length;
  void unassignedBibleStudyCount;
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
        fetchEvents(true);
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
        if (nextTabs.includes('admin-events')) {
          fetchEvents(true);
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

  useEffect(() => {
    if (!isAdminAuthenticated) {
      return;
    }
    if (activeAdminTab === 'admin-testimonies') {
      void fetchTestimonies(true);
    }
    if (activeAdminTab === 'admin-events') {
      void fetchEvents(true);
    }
    if (activeAdminTab === 'admin-staff') {
      void fetchStaffDirectory(true);
    }
    if (activeAdminTab === 'admin-forums') {
      void fetchForumsAdmin();
    }
    if (activeAdminTab === 'admin-hymns') {
      void fetchHymnsAdmin();
    }
  }, [activeAdminTab, isAdminAuthenticated]);

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
      {!IS_ADMIN_ENTRY && <>
      {/* Top Bar with Tagline & Social / Admin Link */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <span className="tagline">Growing in Christ � Serving the World � Sharing Hope</span>
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
      </>}

      {/* Content wrapper */}
      <main id="main-content" className="content-wrapper">
        {eventReceipt && currentRoute === 'events' && (
          <div className="container" style={{ marginTop: '1rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #16a34a', padding: '0.9rem 1rem' }}>
              <strong>Registration confirmed:</strong> {eventReceipt.eventTitle} � Reference {eventReceipt.reference}
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
                  <span>Sabbath Worship � Every Saturday</span>
                </motion.div>
                <motion.h1 className="hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>Seattle International Church</motion.h1>
                <motion.p className="hero-location" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>Bugema University, Uganda</motion.p>
                <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}>Welcome to a Christ-Centered International Family of Faith � Growing in Grace, Serving the World, Sharing Hope.</motion.p>
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
                { value: '4+', label: 'Years of Ministry' },
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
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>{thisSabbathEvent.date} � {thisSabbathEvent.location}</p>
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
                            {weeklyEssentialsProgress[item.id] ? '?' : '?'}
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
                  <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>Track your discipleship journey this week � reset every Sabbath</p>
                </motion.div>

                <div className="grid grid-3 gap-3 margin-top-3">

                  {/* Discipleship Checklist */}
                  <motion.div className="card dark-card" variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>? Weekly Checklist</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {CHECKLIST_ITEMS.map(item => (
                        <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} onClick={() => toggleChecklistItem(item.id)}>
                          <span style={{ fontSize: '1rem', width: '24px', height: '24px', borderRadius: '6px', background: checklist[item.id] ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', flexShrink: 0, color: '#fff' }}>
                            {checklist[item.id] ? '?' : ''}
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
                      <h3 style={{ color: '#D4AF37', marginBottom: '0.75rem' }}>?? Lesson Poll</h3>
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
                      <h3 style={{ color: '#D4AF37', marginBottom: '0.75rem' }}>?? Community Praise Wall</h3>
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
                        <button type="submit" className="btn btn-accent btn-small">Post Praise ??</button>
                      </form>
                    </div>
                  </motion.div>

                  {/* Weekly Bible Quiz */}
                  <motion.div className="card dark-card" variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>?? Weekly Bible Quiz</h3>
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
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{quizScore === QUIZ_QUESTIONS.length ? '??' : quizScore >= 2 ? '?' : '??'}</div>
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
                    <p className="sermon-featured-meta" style={{ color: 'var(--text-muted)', marginBottom: '0.65rem' }}>Speaker: <strong>{featuredSermon.speaker}</strong> � {featuredSermon.passage} � {featuredSermon.date}</p>
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
                          <p className="text-muted" style={{ marginBottom: '0.35rem' }}>{e.date} � {e.location}</p>
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
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
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
                
                <form onSubmit={handleBibleStudySubmit} className="margin-top-3" noValidate>
                  <div className="form-group">
                    <label htmlFor="study-name">Full Name</label>
                    <input 
                      id="study-name"
                      type="text" 
                      value={studyForm.name} 
                      onChange={(e) => updateStudyField('name', e.target.value)} 
                      required 
                      aria-describedby="study-name-help"
                      placeholder="Enter your full name" 
                    />
                    <p id="study-name-help" className="form-help">Use your full name so our elders can follow up accurately.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="study-email">Email Address</label>
                    <input 
                      id="study-email"
                      type="email" 
                      value={studyForm.email} 
                      onChange={(e) => updateStudyField('email', e.target.value)} 
                      required 
                      aria-describedby="study-email-help"
                      placeholder="Enter your email" 
                    />
                    <p id="study-email-help" className="form-help">We send class materials and reminders here.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="study-phone">Phone Number</label>
                    <input 
                      id="study-phone"
                      type="tel" 
                      value={studyForm.phone} 
                      onChange={(e) => updateStudyField('phone', e.target.value)} 
                      required 
                      aria-describedby="study-phone-help"
                      placeholder="e.g. +256 701 234567" 
                    />
                    <p id="study-phone-help" className="form-help">Include country code so we can reach you quickly.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="study-country">Country of Origin</label>
                    <input 
                      id="study-country"
                      type="text" 
                      value={studyForm.country} 
                      onChange={(e) => updateStudyField('country', e.target.value)} 
                      required 
                      aria-describedby="study-country-help"
                      placeholder="e.g. Uganda, Kenya, Rwanda, USA" 
                    />
                    <p id="study-country-help" className="form-help">Helps us connect you to nearby fellowship groups.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="study-course">Select Study Topic / Level</label>
                    <select 
                      id="study-course"
                      value={studyForm.course} 
                      onChange={(e) => updateStudyField('course', e.target.value)} 
                      aria-describedby="study-course-help"
                      required
                    >
                      <option value="" disabled>Select a study guide...</option>
                      <option value="Discover Bible Lessons (Introduction)">Discover Bible Lessons (Introduction)</option>
                      <option value="Daniel and Revelation (Prophecy Focus)">Daniel & Revelation (Prophecy Focus)</option>
                      <option value="SDA Baptism Preparation Study">Baptism Preparation Study</option>
                      <option value="Christ-Centered Living (Discipleship)">Christ-Centered Living (Discipleship)</option>
                    </select>
                    <p id="study-course-help" className="form-help">Choose the track you want to begin with.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="study-registration-type">How would you like to join?</label>
                    <select
                      id="study-registration-type"
                      value={studyForm.registration_type}
                      onChange={(e) => updateStudyField('registration_type', e.target.value)}
                      aria-describedby="study-registration-type-help"
                    >
                      <option value="individual">Individual Study Track</option>
                      <option value="small_group">Small Group Track</option>
                    </select>
                    <p id="study-registration-type-help" className="form-help">Choose small group if you want weekly circle-style study with peers.</p>
                  </div>
                  {studyForm.registration_type === 'small_group' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="study-preferred-day">Preferred Meeting Day</label>
                        <select
                          id="study-preferred-day"
                          value={studyForm.preferred_meeting_day}
                          onChange={(e) => updateStudyField('preferred_meeting_day', e.target.value)}
                          aria-describedby="study-preferred-day-help"
                          required
                        >
                          <option value="">Select preferred day...</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                        <p id="study-preferred-day-help" className="form-help">We match you with a group that meets near this day.</p>
                      </div>
                      <div className="form-group">
                        <label htmlFor="study-preferred-time">Preferred Time Window</label>
                        <select
                          id="study-preferred-time"
                          value={studyForm.preferred_meeting_time}
                          onChange={(e) => updateStudyField('preferred_meeting_time', e.target.value)}
                          aria-describedby="study-preferred-time-help"
                        >
                          <option value="">No preference</option>
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                        </select>
                        <p id="study-preferred-time-help" className="form-help">Optional, but helps us place you faster.</p>
                      </div>
                      <div className="form-group">
                        <label htmlFor="study-group-format">Preferred Group Format</label>
                        <select
                          id="study-group-format"
                          value={studyForm.preferred_group_format}
                          onChange={(e) => updateStudyField('preferred_group_format', e.target.value)}
                          aria-describedby="study-group-format-help"
                        >
                          <option value="">No preference</option>
                          <option value="in_person">In person</option>
                          <option value="online">Online</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                        <p id="study-group-format-help" className="form-help">Choose how you would like to attend.</p>
                      </div>
                      <div className="form-group">
                        <label htmlFor="study-group-notes">Small Group Notes (optional)</label>
                        <textarea
                          id="study-group-notes"
                          rows={3}
                          value={studyForm.small_group_notes}
                          onChange={(e) => updateStudyField('small_group_notes', e.target.value)}
                          placeholder="Any location notes, language preferences, or accessibility needs"
                        />
                      </div>
                    </>
                  )}
                  <button type="submit" className="btn btn-primary btn-block" disabled={!isStudyFormValid || studySubmitting}>
                    {studySubmitting ? 'Submitting Registration...' : 'Submit Registration'}
                  </button>
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
                  <h2 className="section-title text-center">?? Sabbath School Lesson Discussion</h2>
                  <p className="section-subtitle text-center">Join the weekly SDA Adult lesson � study, discuss, and grow together</p>
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
                      <h3 style={{ marginBottom: '1rem', color: 'var(--primary-dark)' }}>?? Weekly Discussion Broadcast</h3>
                      {(() => {
                        const currentVideo = lessonVideos.find(v => v.week === selectedLessonWeek) || lessonVideos[0];
                        return (
                          <div>
                            <div className="video-container shadow">
                              {currentVideo.youtubeId ? (
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={`https://www.youtube.com/embed/${currentVideo.youtubeId}`}
                                  title={currentVideo.title}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.25rem', background: '#0f172a', color: '#e2e8f0' }}>
                                  <strong style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>Lesson video pending upload</strong>
                                  <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '420px', lineHeight: 1.5 }}>
                                    This week is prepared, but the discussion broadcast link has not been published yet.
                                  </p>
                                </div>
                              )}
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
                    { title: 'Official Adult Lesson', desc: "Download this quarter's official Sabbath School lesson booklet and study daily.", link: 'https://www.sabbath.school/', icon: '??', cta: 'Get Lesson' },
                    { title: 'SSNET Discussion Guides', desc: 'Deep-dive commentary and teacher guides for each weekly lesson from ssnet.org.', link: 'https://ssnet.org/lessons/', icon: '???', cta: 'Read Commentary' },
                    { title: 'Hope Channel Video', desc: 'Watch video presentations for each lesson from Hope Channel International.', link: 'https://www.hopechannel.com/', icon: '??', cta: 'Watch Lesson' },
                    { title: 'SDA Church Quarterly', desc: 'Access the global SDA Sabbath School quarterly archives and resources.', link: 'https://sspm.adventist.org/', icon: '??', cta: 'View Quarterly' },
                    { title: 'WhatsApp Study Group', desc: "Join our SIC Bugema WhatsApp group where members discuss each day's lesson.", link: 'https://wa.me/256700000000', icon: '??', cta: 'Join Group' },
                    { title: 'Audio Bible Study', desc: "Listen to this week's lesson discussion podcast from various SDA ministries.", link: 'https://www.sabbath.school/', icon: '??', cta: 'Listen Now' },
                  ].map((res, i) => (
                    <motion.div key={i} className="card student-card" variants={staggerItem} whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)' }}>
                      <div className="student-icon" style={{ fontSize: '1.6rem' }}>{res.icon}</div>
                      <h3>{res.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flexGrow: 1 }}>{res.desc}</p>
                      <a href={res.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-small margin-top-2">{res.cta} ?</a>
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
                    <label htmlFor="prayer-name">Your Name (Optional)</label>
                    <input 
                      id="prayer-name"
                      type="text" 
                      value={prayerForm.name} 
                      onChange={(e) => {
                        setPrayerForm({ ...prayerForm, name: e.target.value });
                        if (prayerFormErrors.name) {
                          setPrayerFormErrors({ ...prayerFormErrors, name: '' });
                        }
                      }} 
                      onBlur={validatePrayerForm}
                      aria-invalid={Boolean(prayerFormErrors.name)}
                      aria-describedby="prayer-name-error"
                      placeholder="Leave blank to submit anonymously" 
                    />
                    {prayerFormErrors.name && <p id="prayer-name-error" className="form-error">{prayerFormErrors.name}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="prayer-content">Prayer Request</label>
                    <textarea 
                      id="prayer-content"
                      value={prayerForm.content} 
                      onChange={(e) => {
                        setPrayerForm({ ...prayerForm, content: e.target.value });
                        if (prayerFormErrors.content) {
                          setPrayerFormErrors({ ...prayerFormErrors, content: '' });
                        }
                      }} 
                      onBlur={validatePrayerForm}
                      required 
                      aria-invalid={Boolean(prayerFormErrors.content)}
                      aria-describedby="prayer-content-help prayer-content-error"
                      rows={6} 
                      placeholder="Write your petition or praise report here..."
                    />
                    <p id="prayer-content-help" className="form-help">Please share at least 10 characters. Your request is handled with pastoral care.</p>
                    {prayerFormErrors.content && <p id="prayer-content-error" className="form-error">{prayerFormErrors.content}</p>}
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
                  <button type="submit" className="btn btn-primary btn-block" disabled={!isPrayerFormValid || prayerSubmitting}>
                    {prayerSubmitting ? 'Submitting Request...' : 'Submit Request'}
                  </button>
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
                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>� <strong>{pr.name || 'Anonymous'}</strong></p>
                        <p style={{ marginTop: '0.4rem', marginBottom: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Follow-up: <strong>{FOLLOW_UP_STATUS_LABELS[pr.follow_up_status || 'received']}</strong>
                          {pr.care_request_type && pr.care_request_type !== 'none' ? ` � Care: ${CARE_REQUEST_LABELS[pr.care_request_type]}` : ''}
                        </p>
                        <button
                          onClick={() => pr.id !== undefined && supportPrayer(pr.id)}
                          className="btn btn-small btn-outline margin-top-1"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          disabled={pr.id !== undefined && prayerSupportedIds.includes(pr.id)}
                        >
                          ?? {pr.id !== undefined && prayerSupportedIds.includes(pr.id) ? 'Praying!' : 'Pray With Them'}
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
                <p style={{ color: 'rgba(255,255,255,0.75)' }}>Active church initiatives � construction, community development, and outreach</p>
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
                            ?? Support This Project
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
                                {notice.priority === 'high' ? '?? Urgent' : notice.priority === 'low' ? '?? Info' : '?? Notice'}
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
                  <h3 style={{ color: '#D4AF37' }}>?? Submit an Announcement</h3>
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
                ?
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
            <div className="page-header testimony-page-header">
              <div className="container text-center">
                <h1>Testimonies of Grace</h1>
                <p>{CORE_MISSION_STATEMENT}</p>
              </div>
            </div>

            <div className="section-padding testimony-section">
              <div className="container grid grid-2 gap-3 testimony-layout">
                <motion.div className="card" variants={fadeUp} initial="hidden" animate="visible">
                  <h2 className="section-title">Share Your Testimony</h2>
                  <p className="text-muted">Your story can strengthen someone else and guide them to prayer, growth, and service.</p>
                  <form onSubmit={handleTestimonySubmit} className="margin-top-2" noValidate aria-describedby="testimony-form-assurance">
                    <div className="form-group">
                      <label htmlFor="testimony-title">Title</label>
                      <input
                        id="testimony-title"
                        type="text"
                        value={testimonyForm.title}
                        onChange={(e) => updateTestimonyField('title', e.target.value)}
                        required
                        aria-describedby="testimony-title-help"
                        placeholder="God opened a door when we prayed"
                      />
                      <p id="testimony-title-help" className="form-help">Use 6-120 characters so readers understand your story quickly.</p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="testimony-type">Testimony Type</label>
                      <select
                        id="testimony-type"
                        value={testimonyForm.testimony_type}
                        onChange={(e) => updateTestimonyField('testimony_type', e.target.value as TestimonyFormData['testimony_type'])}
                      >
                        <option value="prayer_answered">Prayer Answered</option>
                        <option value="spiritual_growth">Spiritual Growth</option>
                        <option value="community_support">Community Support</option>
                        <option value="healing_restoration">Healing and Restoration</option>
                        <option value="outreach_impact">Outreach Impact</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="testimony-content">Your Testimony</label>
                      <textarea
                        id="testimony-content"
                        rows={6}
                        value={testimonyForm.content}
                        onChange={(e) => updateTestimonyField('content', e.target.value)}
                        required
                        aria-describedby="testimony-content-help testimony-content-counter"
                        placeholder="Share what happened, how God led you, and what changed in your walk with Christ."
                      />
                      <div className="form-help-row">
                        <p id="testimony-content-help" className="form-help">Target 80-300 characters: challenge, prayer, outcome.</p>
                        <p id="testimony-content-counter" className={`form-counter ${testimonyContentLength > TESTIMONY_CONTENT_MAX ? 'is-limit' : ''}`}>
                          {testimonyContentLength}/{TESTIMONY_CONTENT_MAX}
                        </p>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="testimony-next-step">Would you like follow-up from a pastor or ministry leader?</label>
                      <select
                        id="testimony-next-step"
                        value={testimonyForm.next_step}
                        onChange={(e) => updateTestimonyField('next_step', e.target.value as TestimonyFormData['next_step'])}
                      >
                        <option value="none">No follow-up needed</option>
                        <option value="mentor">Connect to Mentor</option>
                        <option value="growth_class">Invite to Growth Class</option>
                        <option value="prayer_team">Connect to Prayer Team</option>
                        <option value="service_team">Connect to Service Team</option>
                      </select>
                      <p className="form-help">Optional and confidential follow-up.</p>
                    </div>
                    <p id="testimony-form-assurance" className="testimony-assurance">
                      Pastoral review happens before publishing. Sensitive details may be anonymized.
                    </p>
                    <div className="testimony-form-actions">
                      <button type="button" className="btn btn-outline" onClick={saveTestimonyDraft}>Save Draft</button>
                      <button type="submit" className="btn btn-primary btn-block" disabled={!isTestimonyFormValid || testimonySubmitting}>
                        {testimonySubmitting ? 'Submitting...' : 'Submit Testimony'}
                      </button>
                    </div>
                    {testimonyDraftSavedAt && <p className="form-help">Draft saved at {testimonyDraftSavedAt}.</p>}
                    {testimonyNotice && (
                      <p className="alert alert-success margin-top-1" role="status" aria-live="polite">
                        {testimonyNotice}
                      </p>
                    )}
                  </form>
                </motion.div>

                <motion.aside className="card testimony-side-panel" variants={fadeUp} initial="hidden" animate="visible">
                  <h3>How We Steward Testimonies</h3>
                  <p className="text-muted testimony-side-intro">
                    Prayerful review keeps stories faith-building and safe.
                  </p>
                  <ol className="testimony-workflow-list">
                    <li><strong>Submit:</strong> Share your story and follow-up preference.</li>
                    <li><strong>Review:</strong> Pastoral leaders check clarity and safety.</li>
                    <li><strong>Publish:</strong> Approved testimonies are posted, with edits if needed.</li>
                    <li><strong>Follow-up:</strong> Requested contact happens within 48 hours.</li>
                  </ol>

                  <details className="testimony-details">
                    <summary>Privacy and safety</summary>
                    <p>Private details may be removed before publishing. Urgent care concerns are escalated immediately.</p>
                  </details>

                  <details className="testimony-details">
                    <summary>Quick writing tip</summary>
                    <p>Use three parts: challenge, prayer/Scripture, and what changed.</p>
                  </details>

                  <details className="testimony-details">
                    <summary>Example testimony</summary>
                    <p>"During exams I felt overwhelmed. After prayer with the youth team and meditating on Psalm 46, I found peace and passed with renewed faith."</p>
                  </details>

                  <div className="testimony-secondary-actions" aria-label="Related ministry paths">
                    <button className="tertiary-action" onClick={() => setCurrentRoute('prayer-requests')}>Need Prayer Support</button>
                    <button className="tertiary-action" onClick={() => setCurrentRoute('bible-study')}>Join Growth Class</button>
                    <button className="tertiary-action" onClick={() => setCurrentRoute('community-outreach')}>Serve Through Outreach</button>
                  </div>
                </motion.aside>
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
                          {item.author_name || 'Anonymous'} � {new Date(item.created_at).toLocaleDateString()}
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
                    <p>Auditions are open year-round. Come express your faith through music�from traditional hymns to contemporary worship. We practice weekly and perform during our main services and special events.</p>
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
                {/* Full-page login layout */}
                <div style={{
                  minHeight: '100vh',
                  background: 'linear-gradient(150deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative background circles */}
                  <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '-120px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                  <motion.div
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    style={{
                      width: '100%',
                      maxWidth: '460px',
                      background: '#fff',
                      borderRadius: '16px',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {/* Card top banner */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
                      padding: '2rem 2rem 1.5rem',
                      textAlign: 'center',
                    }}>
                      {/* Church crest / shield icon */}
                      <div style={{
                        width: '88px', height: '88px',
                        background: 'rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem',
                        border: '2px solid rgba(255,255,255,0.25)',
                        overflow: 'hidden',
                      }}>
                        <svg width="72" height="72" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="85" cy="85" r="85" fill="rgba(255,255,255,0.1)" />
                          <g transform="translate(17, 17) scale(0.8)">
                            <g transform="translate(-20.5, -20.6)" fill="#D4AF37">
                              <path d="m 128.7,161.7 c -11.5,-1.9 -17.7,3.5 -19.6,8.6 -0.2,0.5 -0.7,0.4 -0.7,0 v -1.6 c 0,-5.7 5.1,-10.9 11.1,-17 l 10,-10 26.6,4.6 c 0,0 7.6,7.6 14.1,14.1 12.5,-14.8 20.1,-34 20.1,-54.9 0,-46.9 -38,-84.9 -84.9,-84.9 -46.9,0 -84.9,38 -84.9,84.9 0,20.9 7.6,40.1 20.1,54.9 6.5,-6.5 14.1,-14.1 14.1,-14.1 l 30.2,-5.2 c 14,-2.4 17.5,0.7 17.5,5.4 0,0.2 -0.2,0.4 -0.4,0.4 h -8.5 c -0.2,0 -0.2,0.2 -0.2,0.4 v 5.2 c 0,0.2 -0.2,0.2 0,0.2 h 8.7 c 0.2,0 0.4,0.2 0.4,0.4 0,0 0,16.9 0,17.3 0,0.4 -0.5,0.5 -0.7,0.1 -1.9,-5.1 -8.1,-10.5 -19.6,-8.6 0,0 -19.9,3.4 -34.7,6 15.2,14.1 35.5,22.8 57.9,22.8 22.4,0 42.7,-8.6 57.9,-22.8 -14.6,-2.8 -34.5,-6.2 -34.5,-6.2 z m -19.5,0.2 c -0.1,0.5 -0.7,0.5 -0.7,0 V 153 c 0,-0.2 0.1,-0.4 0.3,-0.4 h 4.4 c -1.9,2.7 -3.2,5.3 -4,9.3 z m 31.5,-55.5 c 2.1,6.9 0.7,17.4 -9.2,27.4 l -12,11.8 c -0.3,0.3 -0.7,0.8 -1,0.8 h -8.2 c 2,-3 5.4,-6.8 9.2,-10.6 l 8.3,-8.3 C 138.3,117 140,112 140,106.2 c 0.1,-0.4 0.6,-0.4 0.7,0.2 z m -16.3,-6.5 c 6.8,-6.8 8.5,-14.7 3,-19.4 -0.5,-0.4 -0.2,-0.9 0.4,-0.6 6.8,3.1 12.1,14.3 0.5,25.9 l -8.8,8.8 c -6,6 -8.8,8.8 -10.3,16.1 -0.1,0.5 -0.7,0.5 -0.7,0 v -8.9 c 0,-5.7 5,-10.9 11.1,-17 z m -54.1,8 C 68.2,101 69.6,90.5 79.5,80.5 l 26.4,-26.4 c 6,-6 9.1,-8.9 10.6,-16.1 0.1,-0.5 1,-0.5 1,0 v 8.9 c 0,5.7 -5.3,10.9 -11.4,17 L 83.3,86.6 C 72.7,97.2 71,102.1 71,107.9 c 0,0.6 -0.5,0.6 -0.7,0 z m 4,15.7 c -5.9,-7.2 -3.9,-18.4 7.7,-30 l 23.9,-23.9 c 6,-6 9.1,-8.9 10.6,-16.2 0.1,-0.5 1,-0.5 1,0 v 9 c 0,5.7 -5.3,10.9 -11.4,17 l -21.2,21.1 c -4.4,4.4 -13.9,13.8 -10,22.6 0.3,0.6 -0.2,0.9 -0.6,0.4 z m 12.3,-9.2 c -6.8,6.8 -8.5,14.7 -3,19.4 0.5,0.4 0.2,0.9 -0.4,0.6 -6.8,-3.1 -12.1,-14.3 -0.5,-25.9 l 23.2,-23.2 c 6,-6 9.1,-8.8 10.6,-16.1 0.1,-0.5 1,-0.5 1,0 v 8.9 c 0,5.7 -5.3,10.9 -11.4,17 z m 21.9,23 c 0,-5.7 5,-10.9 11.1,-17 l 6.7,-6.7 c 4.4,-4.4 13.8,-13.8 9.9,-22.6 -0.3,-0.6 0.2,-0.9 0.6,-0.4 5.9,7.2 3.9,18.4 -7.7,30 l -9.5,9.5 c -6,6 -8.8,8.9 -10.3,16.2 -0.1,0.5 -0.7,0.5 -0.7,0 v -9 z" />
                            </g>
                          </g>
                        </svg>
                      </div>
                      <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Admin Portal</h2>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                        Seattle International Church � Staff Access
                      </p>
                    </div>

                    {/* Form area */}
                    <div style={{ padding: '2rem' }}>
                      <form onSubmit={handleAdminLogin}>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151' }}>Username</label>
                          <input
                            type="text"
                            value={adminLoginForm.username}
                            onChange={e => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
                            required
                            placeholder="Enter your username"
                            autoComplete="username"
                            autoFocus
                            style={{ fontSize: '0.95rem' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151' }}>Password</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showAdminPassword ? 'text' : 'password'}
                              value={adminLoginForm.password}
                              onChange={e => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                              required
                              placeholder="Enter your password"
                              autoComplete="current-password"
                              style={{ paddingRight: '3rem', fontSize: '0.95rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowAdminPassword((v) => !v)}
                              aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                              aria-pressed={showAdminPassword}
                              style={{
                                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                                border: 'none', background: 'transparent', color: '#6b7280',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem',
                              }}
                            >
                              {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        {adminLoginError && (
                          <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.88rem', borderRadius: '8px' }}>
                            {adminLoginError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-primary btn-block"
                          disabled={adminLoginLoading}
                          style={{
                            padding: '0.85rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            marginTop: '0.5rem',
                            background: adminLoginLoading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {adminLoginLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              Signing in...
                            </span>
                          ) : 'Sign In to Admin Portal'}
                        </button>
                      </form>

                      {/* Footer trust line */}
                      <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.8rem' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Authorized church staff only
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            ) : (
              /* ---- Authenticated Admin Dashboard ---- */
              <>
            {/* Slim admin top-bar */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
              padding: '0.65rem 0',
              borderBottom: '1px solid rgba(212,175,55,0.3)',
            }}>
              <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Church logo � white circle background for clarity */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#fff', border: '2px solid rgba(212,175,55,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                    boxShadow: '0 0 0 3px rgba(212,175,55,0.15)',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="85" cy="85" r="85" fill="#1E3A8A" />
                      <g transform="translate(17,17) scale(0.8)"><g transform="translate(-20.5,-20.6)" fill="#D4AF37">
                        <path d="m 128.7,161.7 c -11.5,-1.9 -17.7,3.5 -19.6,8.6 -0.2,0.5 -0.7,0.4 -0.7,0 v -1.6 c 0,-5.7 5.1,-10.9 11.1,-17 l 10,-10 26.6,4.6 c 0,0 7.6,7.6 14.1,14.1 12.5,-14.8 20.1,-34 20.1,-54.9 0,-46.9 -38,-84.9 -84.9,-84.9 -46.9,0 -84.9,38 -84.9,84.9 0,20.9 7.6,40.1 20.1,54.9 6.5,-6.5 14.1,-14.1 14.1,-14.1 l 30.2,-5.2 c 14,-2.4 17.5,0.7 17.5,5.4 0,0.2 -0.2,0.4 -0.4,0.4 h -8.5 c -0.2,0 -0.2,0.2 -0.2,0.4 v 5.2 c 0,0.2 -0.2,0.2 0,0.2 h 8.7 c 0.2,0 0.4,0.2 0.4,0.4 0,0 0,16.9 0,17.3 0,0.4 -0.5,0.5 -0.7,0.1 -1.9,-5.1 -8.1,-10.5 -19.6,-8.6 0,0 -19.9,3.4 -34.7,6 15.2,14.1 35.5,22.8 57.9,22.8 22.4,0 42.7,-8.6 57.9,-22.8 -14.6,-2.8 -34.5,-6.2 -34.5,-6.2 z" />
                      </g></g>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>Admin Dashboard</div>
                    <div style={{ color: 'rgba(212,175,55,0.9)', fontSize: '0.75rem' }}>Seattle International Church</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(212,175,55,0.25)', border: '1px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37' }}>
                      {(localStorage.getItem('admin_username') || 'A')[0].toUpperCase()}
                    </div>
                    <span>{localStorage.getItem('admin_username') || 'Admin'}</span>
                  </div>
                  <button onClick={handleAdminLogout} style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)', color: '#fca5a5', padding: '0.35rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            <div className="section-padding" style={{ paddingTop: '1.5rem' }}>
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
                    <li style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.25)' }}>
                      <button onClick={handleAdminLogout} className="admin-tab-btn" style={{ color: '#fca5a5' }}>
                        🚪 Sign Out
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="admin-main-panel card">
                  {/* Account Registration Tab */}
                  {activeAdminTab === 'admin-accounts' && (
                    <div className="admin-tab-content active">
                      <h2>Staff Accounts</h2>
                      <p className="text-muted">Create department staff accounts. Each account gets access based on their department role.</p>

                      <form onSubmit={handleCreateAdminAccount} className="card margin-top-2" style={{ padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ marginBottom: '0.25rem' }}>New Staff Account</h3>
                        <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '1.25rem' }}>Select a department first � access sections will be filled automatically.</p>

                        {/* Step 1: Department selector cards */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151', display: 'block', marginBottom: '0.75rem' }}>
                            1. Select Department *
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
                            {DEPARTMENT_PRESETS.map((dept) => {
                              const isSelected = adminAccountForm.department_role === dept.role;
                              return (
                                <button
                                  key={dept.role}
                                  type="button"
                                  onClick={() => setAdminAccountForm((prev) => ({
                                    ...prev,
                                    department_role: dept.role,
                                    access_sections: dept.sections,
                                    sabbath_programme_scope: dept.sections.includes('sabbath_programme') ? 'full' : prev.sabbath_programme_scope,
                                  }))}
                                  style={{
                                    textAlign: 'left',
                                    padding: '0.85rem 0.75rem',
                                    borderRadius: '10px',
                                    border: `2px solid ${isSelected ? dept.color : '#e5e7eb'}`,
                                    background: isSelected ? `${dept.color}10` : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: isSelected ? `0 0 0 3px ${dept.color}30` : 'none',
                                  }}
                                >
                                  <div style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>{dept.icon}</div>
                                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? dept.color : '#111827', marginBottom: '0.2rem', lineHeight: 1.3 }}>{dept.label}</div>
                                  <div style={{ fontSize: '0.73rem', color: '#6b7280', lineHeight: 1.35 }}>{dept.description}</div>
                                  {isSelected && (
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: 600, color: dept.color }}>? Selected</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Step 2: Account details */}
                        {adminAccountForm.department_role && (
                          <>
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', marginBottom: '1rem' }}>
                              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151', display: 'block', marginBottom: '0.75rem' }}>
                                2. Account Details
                              </label>
                              <div className="grid grid-2 gap-2">
                                <div className="form-group">
                                  <label>Full Name</label>
                                  <input type="text" value={adminAccountForm.full_name} onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, full_name: e.target.value }))} placeholder="e.g. Jane Doe" />
                                </div>
                                <div className="form-group">
                                  <label>Username *</label>
                                  <input type="text" value={adminAccountForm.username} onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, username: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                  <label>Email *</label>
                                  <input type="email" value={adminAccountForm.email} onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, email: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                  <label>Temporary Password *</label>
                                  <input type="text" value={adminAccountForm.password} onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, password: e.target.value }))} required />
                                </div>
                              </div>
                            </div>

                            {/* Step 3: Section fine-tuning */}
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                                3. Fine-tune Access Sections
                              </label>
                              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                                Pre-filled based on department. Adjust as needed.
                              </p>
                              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                {ACCESS_RIGHT_OPTIONS.map((section) => {
                                  const checked = adminAccountForm.access_sections.includes(section.id);
                                  const preset = DEPARTMENT_PRESETS.find(d => d.role === adminAccountForm.department_role);
                                  const isDefault = preset?.sections.includes(section.id);
                                  return (
                                    <label key={section.id} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                      fontSize: '0.82rem', padding: '0.3rem 0.6rem',
                                      borderRadius: '20px', border: `1px solid ${checked ? (isDefault ? '#1e3a8a' : '#7c3aed') : '#e5e7eb'}`,
                                      background: checked ? (isDefault ? '#eff6ff' : '#f5f3ff') : '#fff',
                                      cursor: 'pointer',
                                    }}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                          setAdminAccountForm((prev) => {
                                            const next = new Set(prev.access_sections);
                                            if (e.target.checked) next.add(section.id); else next.delete(section.id);
                                            return { ...prev, access_sections: Array.from(next) };
                                          });
                                        }}
                                        style={{ display: 'none' }}
                                      />
                                      {checked ? '? ' : ''}{section.label}
                                    </label>
                                  );
                                })}
                              </div>
                              {adminAccountForm.access_sections.includes('sabbath_programme') && (
                                <div className="form-group" style={{ marginTop: '0.75rem', maxWidth: '300px' }}>
                                  <label>Sabbath Programme Scope</label>
                                  <select value={adminAccountForm.sabbath_programme_scope} onChange={(e) => setAdminAccountForm((prev) => ({ ...prev, sabbath_programme_scope: e.target.value as SabbathProgrammeScope }))}>
                                    <option value="full">Full Sabbath Programme Access</option>
                                    <option value="sabbath_school_only">Sabbath School Fields Only</option>
                                  </select>
                                </div>
                              )}
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={creatingAdminAccount} style={{ minWidth: '200px' }}>
                              {creatingAdminAccount ? 'Creating...' : `Create ${DEPARTMENT_PRESETS.find(d => d.role === adminAccountForm.department_role)?.label ?? ''} Account`}
                            </button>
                          </>
                        )}

                        {!adminAccountForm.department_role && (
                          <p style={{ color: '#9ca3af', fontSize: '0.88rem', fontStyle: 'italic' }}>
                            ? Select a department above to continue.
                          </p>
                        )}
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
                      <p className="text-muted">Upload church photos to storage, then save the gallery record in the backend so the public page and admin stay in sync.</p>
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
                          {galleryUploading ? '? Uploading...' : '?? Add to Gallery'}
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
                      <h2>?? Lesson Videos</h2>
                      <p className="text-muted">Upload the YouTube discussion video for each Sabbath School lesson week. Paste any YouTube URL or just the video ID. Changes will appear immediately on the Bible Study page for all members.</p>

                      {/* Add Video Form */}
                      <form onSubmit={handleAdminAddLessonVideo} className="card margin-top-3" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent)' }}>
                        <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>? Add Weekly Lesson Video</h3>
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
                            Paste the full YouTube link � the video ID will be extracted automatically.
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
                          ?? Upload Lesson Video
                        </button>
                      </form>

                      {/* Current Lessons List */}
                      <div className="margin-top-3">
                        <h3 style={{ marginBottom: '1rem' }}>?? Currently Uploaded Lesson Videos ({lessonVideos.length})</h3>
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
                                    ?? {v.date} &nbsp;|&nbsp; ?? youtube.com/watch?v={v.youtubeId}
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
                                    ?? Preview
                                  </a>
                                  <button
                                    onClick={() => handleAdminDeleteLessonVideo(v.id, v.week)}
                                    className="btn btn-small"
                                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer' }}
                                  >
                                    ??? Remove
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
                      <h2>??? Sabbath Programme Management</h2>
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
                  {activeAdminTab === 'admin-projects' && (() => {
                    const totalRaised = projects.reduce((s, p) => s + p.raised_amount, 0);
                    const totalGoal = projects.reduce((s, p) => s + p.goal_amount, 0);
                    const activeCount = projects.filter(p => p.status === 'Active').length;
                    const publishedCount = projects.filter(p => p.is_published !== false).length;
                    const allCategories = ['All', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))];
                    const allStatuses = ['All', 'Active', 'Almost Complete', 'Completed', 'Paused'];
                    const visibleProjects = projects.filter(proj => {
                      const q = projectSearch.toLowerCase();
                      const matchQ = !q || proj.title.toLowerCase().includes(q) || proj.desc?.toLowerCase().includes(q) || proj.category?.toLowerCase().includes(q);
                      const matchCat = projectCategoryFilter === 'All' || proj.category === projectCategoryFilter;
                      const matchSt = projectStatusFilter === 'All' || proj.status === projectStatusFilter;
                      return matchQ && matchCat && matchSt;
                    });
                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Manage Projects</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Create, update fundraising progress, and remove church projects.</p>
                        </div>
                        <button onClick={() => setShowAddEventModal(v => !v)} className="btn btn-primary btn-small">
                          {showAddEventModal ? '? Cancel' : '+ New Project'}
                        </button>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total Projects', value: projects.length, color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'Active', value: activeCount, color: '#059669', bg: '#ecfdf5' },
                          { label: 'Published', value: publishedCount, color: '#0891b2', bg: '#ecfeff' },
                          { label: 'Total Raised', value: `${totalRaised.toLocaleString()} UGX`, color: '#d97706', bg: '#fffbeb' },
                          { label: 'Total Goal', value: `${totalGoal.toLocaleString()} UGX`, color: '#7c3aed', bg: '#f5f3ff' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, flex: 1, minWidth: '120px' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Add Project Form */}
                      {showAddEventModal && (
                      <form onSubmit={handleAdminAddProject} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.95rem' }}>??? New Project</h3>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group">
                            <label>Project Title *</label>
                            <input type="text" value={addProjectForm.title} onChange={(e) => setAddProjectForm((f) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Church Sanctuary Construction" />
                          </div>
                          <div className="form-group">
                            <label>Category</label>
                            <select value={addProjectForm.category} onChange={(e) => setAddProjectForm((f) => ({ ...f, category: e.target.value }))}>
                              {['Construction', 'Community', 'Outreach', 'Education', 'Media', 'Operations'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Description *</label>
                            <textarea rows={3} value={addProjectForm.desc} onChange={(e) => setAddProjectForm((f) => ({ ...f, desc: e.target.value }))} required placeholder="Describe the project�" />
                          </div>
                          <div className="form-group">
                            <label>Goal Amount (UGX) *</label>
                            <input type="number" min="1" value={addProjectForm.goal_amount} onChange={(e) => setAddProjectForm((f) => ({ ...f, goal_amount: e.target.value }))} required />
                          </div>
                          <div className="form-group">
                            <label>Raised Amount (UGX)</label>
                            <input type="number" min="0" value={addProjectForm.raised_amount} onChange={(e) => setAddProjectForm((f) => ({ ...f, raised_amount: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select value={addProjectForm.status} onChange={(e) => setAddProjectForm((f) => ({ ...f, status: e.target.value }))}>
                              {['Active', 'Almost Complete', 'Completed', 'Paused'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Image</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <input
                                  type="url"
                                  value={addProjectForm.image_url}
                                  onChange={(e) => setAddProjectForm((f) => ({ ...f, image_url: e.target.value }))}
                                  placeholder="Paste URL or upload below�"
                                  style={{ flex: 1 }}
                                />
                                {addProjectForm.image_url && (
                                  <img src={addProjectForm.image_url} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #e2e8f0', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                                )}
                              </div>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.3rem 0.7rem', width: 'fit-content' }}>
                                ?? Choose File
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  style={{ display: 'none' }}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const url = await uploadProjectImage(file);
                                      setAddProjectForm(f => ({ ...f, image_url: url }));
                                      toast.success('Image uploaded.');
                                    } catch (err: any) {
                                      toast.error(err.message || 'Upload failed.');
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input id="proj-pub" type="checkbox" checked={addProjectForm.is_published} onChange={(e) => setAddProjectForm((f) => ({ ...f, is_published: e.target.checked }))} />
                            <label htmlFor="proj-pub" style={{ margin: 0, fontWeight: 500 }}>Publish to viewers</label>
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Save Project</button>
                      </form>
                      )}

                      {/* Search & Filters */}
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="?? Search projects�"
                          value={projectSearch}
                          onChange={e => setProjectSearch(e.target.value)}
                          style={{ flex: 1, minWidth: '180px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}
                        />
                        <select
                          value={projectCategoryFilter}
                          onChange={e => setProjectCategoryFilter(e.target.value)}
                          style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff' }}
                        >
                          {allCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                        </select>
                        <select
                          value={projectStatusFilter}
                          onChange={e => setProjectStatusFilter(e.target.value)}
                          style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff' }}
                        >
                          {allStatuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                        </select>
                        {(projectSearch || projectCategoryFilter !== 'All' || projectStatusFilter !== 'All') && (
                          <button
                            onClick={() => { setProjectSearch(''); setProjectCategoryFilter('All'); setProjectStatusFilter('All'); }}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer' }}
                          >
                            ? Clear
                          </button>
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#6b7280', marginLeft: 'auto' }}>
                          {visibleProjects.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Project Cards */}
                      {visibleProjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>???</div>
                          <p style={{ margin: 0 }}>{projects.length === 0 ? 'No projects yet. Add one above.' : 'No projects match your filters.'}</p>
                        </div>
                      ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {visibleProjects.map(proj => {
                          const pct = proj.goal_amount > 0 ? Math.min(100, Math.round((proj.raised_amount / proj.goal_amount) * 100)) : 0;
                          const isEditOpen = projectEditOpenIds.has(proj.id);
                          const isHistoryOpen = openProjectHistoryId === proj.id;
                          const statusColors: Record<string, { bg: string; color: string }> = {
                            'Active':          { bg: '#d1fae5', color: '#065f46' },
                            'Almost Complete': { bg: '#fef3c7', color: '#92400e' },
                            'Completed':       { bg: '#dcfce7', color: '#166534' },
                            'Paused':          { bg: '#f1f5f9', color: '#475569' },
                          };
                          const sc = statusColors[proj.status] ?? { bg: '#f1f5f9', color: '#475569' };
                          const allHistoryEntries = projectHistoryById[proj.id] ?? [];
                          const filteredHistoryEntries = projectHistoryFilter === 'all'
                            ? allHistoryEntries
                            : allHistoryEntries.filter((entry) => entry.action === projectHistoryFilter);
                          const draft = projectDrafts[proj.id] ?? {
                            title: proj.title,
                            category: proj.category,
                            desc: proj.desc,
                            goal_amount: String(proj.goal_amount),
                            raised_amount: String(proj.raised_amount),
                            image_url: proj.image_url || '',
                            status: proj.status,
                            is_published: proj.is_published !== false,
                          };
                          return (
                            <div key={proj.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                              {/* View Row */}
                              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', alignItems: 'flex-start' }}>
                                {/* Thumbnail */}
                                <div style={{ width: '72px', height: '72px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {proj.image_url ? (
                                    <img src={proj.image_url} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                  ) : (
                                    <span style={{ fontSize: '1.75rem' }}>???</span>
                                  )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', background: '#eff6ff', padding: '0.15rem 0.55rem', borderRadius: '20px' }}>{proj.category}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px', background: sc.bg, color: sc.color }}>{proj.status}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px', background: proj.is_published !== false ? '#dcfce7' : '#fee2e2', color: proj.is_published !== false ? '#166534' : '#991b1b' }}>
                                      {proj.is_published !== false ? '? Published' : '? Hidden'}
                                    </span>
                                  </div>
                                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.97rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.title}</h4>
                                  <p style={{ margin: '0 0 0.45rem', fontSize: '0.82rem', color: '#6b7280', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'] }}>{proj.desc}</p>
                                  {/* Progress */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: pct + '%', background: pct >= 100 ? '#16a34a' : 'var(--primary)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
                                    </div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{pct}%</span>
                                    <span style={{ fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>UGX {proj.raised_amount.toLocaleString()} / {proj.goal_amount.toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Action buttons � horizontal row */}
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => setProjectEditOpenIds(prev => {
                                      const next = new Set(prev);
                                      if (next.has(proj.id)) next.delete(proj.id); else next.add(proj.id);
                                      return next;
                                    })}
                                    className="btn btn-small btn-outline"
                                    style={{ minWidth: '58px' }}
                                  >
                                    {isEditOpen ? '? Close' : '?? Edit'}
                                  </button>
                                  <button
                                    onClick={() => handleToggleProjectHistory(proj.id)}
                                    className="btn btn-small btn-outline"
                                    style={{ minWidth: '72px' }}
                                  >
                                    {isHistoryOpen ? 'Hide Log' : '?? History'}
                                  </button>
                                  <button
                                    onClick={() => handleAdminQuickToggleProjectPublish(proj.id)}
                                    className="btn btn-small btn-outline"
                                    style={{ minWidth: '80px' }}
                                  >
                                    {proj.is_published !== false ? '?? Hide' : '?? Publish'}
                                  </button>
                                  <button
                                    onClick={() => handleAdminDeleteProject(proj.id)}
                                    className="btn btn-small"
                                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', minWidth: '58px' }}
                                  >
                                    ?? Delete
                                  </button>
                                </div>
                              </div>

                              {/* Inline Edit Form */}
                              {isEditOpen && (
                                <div style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.25rem', background: '#f8fafc' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Title</label>
                                      <input type="text" value={draft.title} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, title: e.target.value } }))} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Category</label>
                                      <select value={draft.category} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, category: e.target.value } }))}>
                                        {['Construction', 'Community', 'Outreach', 'Education', 'Media', 'Operations'].map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Goal Amount (UGX)</label>
                                      <input type="number" min="1" value={draft.goal_amount} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, goal_amount: e.target.value } }))} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Raised Amount (UGX)</label>
                                      <input type="number" min="0" value={draft.raised_amount} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, raised_amount: e.target.value } }))} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Status</label>
                                      <select value={draft.status} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, status: e.target.value } }))}>
                                        {['Active', 'Almost Complete', 'Completed', 'Paused'].map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Image URL</label>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                          <input type="url" value={draft.image_url} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, image_url: e.target.value } }))} placeholder="Paste URL or upload�" style={{ flex: 1 }} />
                                          {draft.image_url && (
                                            <img src={draft.image_url} alt="preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #e2e8f0', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                                          )}
                                        </div>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.25rem 0.6rem', width: 'fit-content' }}>
                                          ?? Choose File
                                          <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            style={{ display: 'none' }}
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              try {
                                                const url = await uploadProjectImage(file);
                                                setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, image_url: url } }));
                                                toast.success('Image uploaded.');
                                              } catch (err: any) {
                                                toast.error(err.message || 'Upload failed.');
                                              }
                                              e.target.value = '';
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem' }}>Description</label>
                                      <textarea rows={2} value={draft.desc} onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, desc: e.target.value } }))} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                                      <input
                                        id={`project-published-${proj.id}`}
                                        type="checkbox"
                                        checked={draft.is_published}
                                        onChange={e => setProjectDrafts(prev => ({ ...prev, [proj.id]: { ...draft, is_published: e.target.checked } }))}
                                      />
                                      <label htmlFor={`project-published-${proj.id}`} style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500 }}>Published to viewers</label>
                                    </div>
                                  </div>
                                  <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => {
                                        handleAdminUpdateProject(proj.id);
                                        setProjectEditOpenIds(prev => { const next = new Set(prev); next.delete(proj.id); return next; });
                                      }}
                                      className="btn btn-primary btn-small"
                                    >
                                      ?? Save Changes
                                    </button>
                                    <button
                                      onClick={() => {
                                        setProjectDrafts(prev => { const next = { ...prev }; delete next[proj.id]; return next; });
                                        setProjectEditOpenIds(prev => { const next = new Set(prev); next.delete(proj.id); return next; });
                                      }}
                                      className="btn btn-small btn-outline"
                                    >
                                      Discard
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Change History Panel */}
                              {isHistoryOpen && (
                                <div style={{ borderTop: '1px solid #e2e8f0', padding: '0.85rem 1.25rem', background: '#f8fafc' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                    <h5 style={{ margin: 0, fontSize: '0.88rem' }}>Change History</h5>
                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                      {([
                                        { value: 'all', label: 'All' },
                                        { value: 'update', label: 'Updates' },
                                        { value: 'create', label: 'Creates' },
                                        { value: 'delete', label: 'Deletes' },
                                      ] as Array<{ value: ProjectHistoryActionFilter; label: string }>).map(fo => (
                                        <button
                                          key={fo.value}
                                          type="button"
                                          onClick={() => setProjectHistoryFilter(fo.value)}
                                          className="btn btn-small"
                                          style={{ padding: '0.2rem 0.55rem', border: '1px solid #cbd5e1', background: projectHistoryFilter === fo.value ? '#e2e8f0' : '#fff', color: '#334155' }}
                                        >
                                          {fo.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  {allHistoryEntries.length === 0 ? (
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem' }}>No history entries yet.</p>
                                  ) : filteredHistoryEntries.length === 0 ? (
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem' }}>No entries match this filter.</p>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      {filteredHistoryEntries.map((entry) => {
                                        const actionStyles = getHistoryActionStyles(entry.action);
                                        return (
                                          <div key={entry.id} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                              <span style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', background: actionStyles.background, color: actionStyles.color, fontSize: '0.68rem', letterSpacing: '0.02em' }}>
                                                {entry.action.toUpperCase()}
                                              </span>
                                              <span>{new Date(entry.created_at).toLocaleString()} � {entry.updated_by_username || 'System'}</span>
                                            </p>
                                            <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                              {Object.entries(entry.changed_fields || {}).map(([field, rawValue], index) => {
                                                if (field === 'new' || field === 'old') {
                                                  const snapshot = rawValue && typeof rawValue === 'object' ? Object.entries(rawValue as Record<string, unknown>) : [];
                                                  return (
                                                    <div key={`${entry.id}-${field}-${index}`}>
                                                      <p style={{ margin: '0 0 0.2rem', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                                                        {field === 'new' ? 'Snapshot After Change' : 'Snapshot Before Change'}
                                                      </p>
                                                      {snapshot.length === 0 ? (
                                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>No snapshot details.</p>
                                                      ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                          {snapshot.map(([sf, sv]) => (
                                                            <p key={`${entry.id}-${field}-${sf}`} style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
                                                              <strong>{formatProjectHistoryField(sf)}:</strong> {formatProjectHistoryValue(sv)}
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
                                                        <span style={{ color: '#0f172a' }}>?</span>
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
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                  );
                })()}

                  {/* Dashboard Stats */}
                  {activeAdminTab === 'admin-stats' && (
                    <div className="admin-tab-content active">
                      {/* Welcome banner */}
                      <div style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 80%, #1d4ed8 100%)',
                        borderRadius: '12px',
                        padding: '1.5rem 1.75rem',
                        marginBottom: '1.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}>
                        <div>
                          <div style={{ color: 'rgba(212,175,55,0.9)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                            Welcome back
                          </div>
                          <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>
                            {localStorage.getItem('admin_username') || 'Administrator'}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                        <svg width="64" height="64" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35, flexShrink: 0 }}>
                          <circle cx="85" cy="85" r="85" fill="white" />
                          <g transform="translate(17,17) scale(0.8)"><g transform="translate(-20.5,-20.6)" fill="#D4AF37">
                            <path d="m 128.7,161.7 c -11.5,-1.9 -17.7,3.5 -19.6,8.6 -0.2,0.5 -0.7,0.4 -0.7,0 v -1.6 c 0,-5.7 5.1,-10.9 11.1,-17 l 10,-10 26.6,4.6 c 0,0 7.6,7.6 14.1,14.1 12.5,-14.8 20.1,-34 20.1,-54.9 0,-46.9 -38,-84.9 -84.9,-84.9 -46.9,0 -84.9,38 -84.9,84.9 0,20.9 7.6,40.1 20.1,54.9 6.5,-6.5 14.1,-14.1 14.1,-14.1 l 30.2,-5.2 c 14,-2.4 17.5,0.7 17.5,5.4 0,0.2 -0.2,0.4 -0.4,0.4 h -8.5 c -0.2,0 -0.2,0.2 -0.2,0.4 v 5.2 c 0,0.2 -0.2,0.2 0,0.2 h 8.7 c 0.2,0 0.4,0.2 0.4,0.4 0,0 0,16.9 0,17.3 0,0.4 -0.5,0.5 -0.7,0.1 -1.9,-5.1 -8.1,-10.5 -19.6,-8.6 0,0 -19.9,3.4 -34.7,6 15.2,14.1 35.5,22.8 57.9,22.8 22.4,0 42.7,-8.6 57.9,-22.8 -14.6,-2.8 -34.5,-6.2 -34.5,-6.2 z" />
                          </g></g>
                        </svg>
                      </div>

                      {/* Stats grid */}
                      <h3 style={{ marginBottom: '0.85rem', color: '#1e3a8a', fontWeight: 700 }}>Ministry Overview</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.75rem' }}>
                        {[
                          { label: 'Prayer Requests', value: prayers.length, icon: '??', color: '#7c3aed', bg: '#f5f3ff' },
                          { label: 'Bible Studies', value: bibleStudies.length, icon: '??', color: '#059669', bg: '#ecfdf5' },
                          { label: 'Events', value: events.length, icon: '??', color: '#0891b2', bg: '#ecfeff' },
                          { label: 'Sermons', value: sermons.length, icon: '???', color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'Testimonies', value: testimonies.length, icon: '?', color: '#d97706', bg: '#fffbeb' },
                          { label: 'Blog Posts', value: blogPosts.length, icon: '??', color: '#dc2626', bg: '#fef2f2' },
                          { label: 'Announcements', value: announcements.length, icon: '??', color: '#0f766e', bg: '#f0fdfa' },
                          { label: 'Total Donations', value: `${totalDonations.toLocaleString()} UGX`, icon: '??', color: '#b45309', bg: '#fefce8' },
                        ].map(({ label, value, icon, color, bg }) => (
                          <div key={label} style={{
                            background: bg,
                            borderRadius: '12px',
                            padding: '1rem 1.1rem',
                            border: `1px solid ${color}20`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}>
                            <div style={{ fontSize: '1.35rem' }}>{icon}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                            <div style={{ fontSize: '0.76rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Quick actions */}
                      <h3 style={{ marginBottom: '0.85rem', color: '#1e3a8a', fontWeight: 700 }}>Quick Actions</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.75rem' }}>
                        {[
                          { label: '+ New Announcement', tab: 'admin-announcements' as AdminTabId, color: '#0f766e' },
                          { label: '+ New Event', tab: 'admin-events' as AdminTabId, color: '#0891b2' },
                          { label: '+ New Blog Post', tab: 'admin-blog' as AdminTabId, color: '#7c3aed' },
                          { label: '+ New Sermon', tab: 'admin-sermons' as AdminTabId, color: '#1e3a8a' },
                          { label: '?? Manage Accounts', tab: 'admin-accounts' as AdminTabId, color: '#d97706' },
                          { label: '🧾 Audit Trail', tab: 'admin-audit' as AdminTabId, color: '#6b7280' },
                        ].filter(a => visibleAdminTabs.some(t => t.id === a.tab)).map(({ label, tab, color }) => (
                          <button
                            key={tab}
                            onClick={() => setActiveAdminTab(tab)}
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              border: `1px solid ${color}40`,
                              background: `${color}10`,
                              color,
                              fontWeight: 600,
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Activity log */}
                      <h3 style={{ marginBottom: '0.65rem', color: '#1e3a8a', fontWeight: 700 }}>Recent Activity</h3>
                      <div className="activity-log-table">
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
                  {activeAdminTab === 'admin-studies' && (() => {
                    const filtered = bibleStudies.filter(s => {
                      const q = bibleStudySearch.toLowerCase();
                      if (!q) return true;
                      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.country.toLowerCase().includes(q) || s.course.toLowerCase().includes(q);
                    });
                    const total = bibleStudies.length;
                    const individual = bibleStudies.filter(s => s.registration_type !== 'small_group').length;
                    const smallGroup = bibleStudies.filter(s => s.registration_type === 'small_group').length;
                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Bible Study Registrations</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>All participants who registered for Bible study courses.</p>
                        </div>
                        <button onClick={fetchBibleStudies} className="btn btn-outline btn-small">? Refresh</button>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total Signups', value: total, color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'Individual', value: individual, color: '#059669', bg: '#ecfdf5' },
                          { label: 'Small Groups', value: smallGroup, color: '#7c3aed', bg: '#f5f3ff' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, minWidth: '120px' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Search */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input
                            type="text"
                            placeholder="Search by name, email, country, topic�"
                            value={bibleStudySearch}
                            onChange={e => setBibleStudySearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.88rem' }}
                          />
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Table */}
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Contact</th>
                              <th>Country</th>
                              <th>Course / Topic</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr><td colSpan={8} className="text-center" style={{ padding: '2rem', color: '#9ca3af' }}>
                                {bibleStudies.length === 0 ? 'No registrations yet.' : 'No results for that search.'}
                              </td></tr>
                            ) : (
                              filtered.map((item, idx) => (
                                editingStudyId === item.id ? (
                                  <tr key={item.id}>
                                    <td>{idx + 1}</td>
                                    <td><input value={studyDrafts[item.id!]?.name ?? item.name} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), name: e.target.value } }))} /></td>
                                    <td>
                                      <input value={studyDrafts[item.id!]?.email ?? item.email} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), email: e.target.value } }))} placeholder="Email" />
                                      <input value={studyDrafts[item.id!]?.phone ?? item.phone} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), phone: e.target.value } }))} placeholder="Phone" style={{ marginTop: '0.35rem' }} />
                                    </td>
                                    <td><input value={studyDrafts[item.id!]?.country ?? item.country} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), country: e.target.value } }))} /></td>
                                    <td><input value={studyDrafts[item.id!]?.course ?? item.course} onChange={(e) => setStudyDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), course: e.target.value } }))} /></td>
                                    <td>�</td>
                                    <td>�</td>
                                    <td>
                                      <button onClick={() => handleAdminUpdateStudy(item.id!)} className="btn btn-small btn-accent">Save</button>
                                      <button onClick={() => setEditingStudyId(null)} className="btn btn-small btn-outline">Cancel</button>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={item.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{idx + 1}</td>
                                    <td><strong>{item.name}</strong></td>
                                    <td style={{ fontSize: '0.84rem' }}>
                                      <div>{item.email}</div>
                                      <div style={{ color: '#9ca3af' }}>{item.phone}</div>
                                    </td>
                                    <td>{item.country}</td>
                                    <td><span className="badge">{item.course}</span></td>
                                    <td>
                                      <span style={{
                                        padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: item.registration_type === 'small_group' ? '#f5f3ff' : '#ecfdf5',
                                        color: item.registration_type === 'small_group' ? '#7c3aed' : '#059669',
                                      }}>
                                        {item.registration_type === 'small_group' ? '?? Group' : '?? Individual'}
                                      </span>
                                    </td>
                                    <td>
                                      <span style={{
                                        padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                                        background: '#eff6ff', color: '#1e3a8a',
                                      }}>
                                        {item.status || 'Active'}
                                      </span>
                                    </td>
                                    <td>
                                      <button onClick={() => item.id && handleEditBibleStudy(item)} className="btn btn-small btn-outline">Edit</button>
                                      <button onClick={() => item.id && handleAdminDeleteStudy(item.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626' }}>Delete</button>
                                    </td>
                                  </tr>
                                )
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* -- Discussion Groups Section -- */}
                      <div style={{ marginTop: '2rem', borderTop: '2px solid #e5e7eb', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ marginBottom: '0.15rem', color: '#1e3a8a' }}>?? Bible Discussion Groups</h3>
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.84rem' }}>Create and manage study groups. Assign registered participants to groups.</p>
                          </div>
                          <button
                            onClick={() => { setShowGroupForm(v => !v); setEditingGroupId(null); setGroupForm({ name: '', topic: '', meeting_day: '', meeting_time: '', format: '', leader_name: '', description: '', max_members: null, is_active: true }); }}
                            className="btn btn-primary btn-small"
                          >
                            {showGroupForm ? '? Cancel' : '+ New Group'}
                          </button>
                        </div>

                        {/* Create / Edit form */}
                        {showGroupForm && (
                          <form onSubmit={handleSaveGroup} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: '#1e3a8a' }}>{editingGroupId ? 'Edit Group' : 'Create New Discussion Group'}</h4>
                            <div className="grid grid-2 gap-2">
                              <div className="form-group">
                                <label>Group Name *</label>
                                <input type="text" value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Morning Glory Group" required />
                              </div>
                              <div className="form-group">
                                <label>Study Topic</label>
                                <input type="text" value={groupForm.topic} onChange={e => setGroupForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. The Book of Daniel" />
                              </div>
                              <div className="form-group">
                                <label>Meeting Day</label>
                                <select value={groupForm.meeting_day} onChange={e => setGroupForm(p => ({ ...p, meeting_day: e.target.value }))}>
                                  <option value="">� Select day �</option>
                                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Meeting Time</label>
                                <input type="text" value={groupForm.meeting_time} onChange={e => setGroupForm(p => ({ ...p, meeting_time: e.target.value }))} placeholder="e.g. 6:00 PM" />
                              </div>
                              <div className="form-group">
                                <label>Format</label>
                                <select value={groupForm.format} onChange={e => setGroupForm(p => ({ ...p, format: e.target.value as BibleDiscussionGroup['format'] }))}>
                                  <option value="">� Select format �</option>
                                  <option value="in_person">In Person</option>
                                  <option value="online">Online</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Group Leader</label>
                                <input type="text" value={groupForm.leader_name} onChange={e => setGroupForm(p => ({ ...p, leader_name: e.target.value }))} placeholder="e.g. Elder Samuel" />
                              </div>
                              <div className="form-group">
                                <label>Max Members</label>
                                <input type="number" value={groupForm.max_members ?? ''} onChange={e => setGroupForm(p => ({ ...p, max_members: e.target.value ? Number(e.target.value) : null }))} placeholder="Leave blank for unlimited" min={1} />
                              </div>
                              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                                <input type="checkbox" id="grp-active" checked={groupForm.is_active} onChange={e => setGroupForm(p => ({ ...p, is_active: e.target.checked }))} />
                                <label htmlFor="grp-active" style={{ margin: 0, fontWeight: 500 }}>Group is active</label>
                              </div>
                              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Description / Notes</label>
                                <textarea rows={2} value={groupForm.description} onChange={e => setGroupForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional notes about this group�" />
                              </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                              {editingGroupId ? 'Save Changes' : 'Create Group'}
                            </button>
                          </form>
                        )}

                        {groupsError && <div className="alert-danger" style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>{groupsError}</div>}

                        {groupsLoading ? (
                          <p className="text-muted">Loading groups�</p>
                        ) : discussionGroups.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
                            <div style={{ fontWeight: 600 }}>No discussion groups yet</div>
                            <div style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>Click "+ New Group" to create the first one.</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {discussionGroups.map(group => (
                              <div key={group.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                                {/* Group header row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: group.is_active ? '#fff' : '#f9fafb', gap: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>??</div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{group.name}</div>
                                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.1rem' }}>
                                        {[group.topic, group.meeting_day && `${group.meeting_day} ${group.meeting_time}`.trim(), group.leader_name && `Leader: ${group.leader_name}`].filter(Boolean).join(' � ')}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                    {group.format && (
                                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 600, background: '#eff6ff', color: '#1e3a8a' }}>
                                        {group.format === 'in_person' ? '?? In Person' : group.format === 'online' ? '?? Online' : '?? Hybrid'}
                                      </span>
                                    )}
                                    <span style={{ padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 600, background: group.is_active ? '#ecfdf5' : '#f3f4f6', color: group.is_active ? '#059669' : '#9ca3af' }}>
                                      {group.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span style={{ padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.73rem', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed' }}>
                                      ?? {group.member_count ?? 0}{group.max_members ? `/${group.max_members}` : ''}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const id = group.id!;
                                        if (expandedGroupId === id) { setExpandedGroupId(null); } else {
                                          setExpandedGroupId(id);
                                          fetchGroupMembers(id, group.name);
                                        }
                                      }}
                                      className="btn btn-small btn-outline"
                                    >
                                      {expandedGroupId === group.id ? 'Hide' : 'Members'}
                                    </button>
                                    <button onClick={() => { setEditingGroupId(group.id!); setGroupForm({ name: group.name, topic: group.topic, meeting_day: group.meeting_day, meeting_time: group.meeting_time, format: group.format as BibleDiscussionGroup['format'], leader_name: group.leader_name, description: group.description, max_members: group.max_members, is_active: group.is_active }); setShowGroupForm(true); }} className="btn btn-small btn-outline">Edit</button>
                                    <button onClick={() => handleDeleteGroup(group.id!)} className="btn btn-small btn-outline" style={{ color: '#dc2626' }}>Delete</button>
                                  </div>
                                </div>

                                {/* Expanded members panel */}
                                {expandedGroupId === group.id && (
                                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '0.85rem 1rem', background: '#f8fafc' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.65rem' }}>Group Members</div>
                                    {(groupMembers[group.id!] ?? []).length === 0 ? (
                                      <p style={{ color: '#9ca3af', fontSize: '0.84rem', margin: 0 }}>No members assigned yet.</p>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {(groupMembers[group.id!] ?? []).map(m => (
                                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.65rem', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                                            <div>
                                              <strong>{m.name}</strong>
                                              <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>{m.email} � {m.country}</span>
                                            </div>
                                            <button onClick={() => handleRemoveMemberFromGroup(group.id!, m.id!)} className="btn btn-small btn-outline" style={{ color: '#dc2626', padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}>Remove</button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Assign unassigned members */}
                                    {bibleStudies.filter(s => !s.group_name).length > 0 && (
                                      <div style={{ marginTop: '0.85rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#374151', marginBottom: '0.4rem' }}>Assign a participant</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                          {bibleStudies.filter(s => !s.group_name).map(s => (
                                            <button key={s.id} onClick={() => handleAssignMemberToGroup(group.id!, s.id!)} style={{ padding: '0.3rem 0.65rem', borderRadius: '20px', border: '1px dashed #1e3a8a', background: '#eff6ff', color: '#1e3a8a', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}>
                                              + {s.name}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })()}

                  {/* Prayers Panel */}
                  {activeAdminTab === 'admin-prayers' && (() => {
                    const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
                      received:  { label: 'Received',        color: '#6b7280', bg: '#f3f4f6' },
                      assigned:  { label: 'Assigned',        color: '#0891b2', bg: '#ecfeff' },
                      contacted: { label: 'Contacted',       color: '#7c3aed', bg: '#f5f3ff' },
                      ongoing:   { label: 'Ongoing Support', color: '#d97706', bg: '#fffbeb' },
                      completed: { label: 'Completed',       color: '#059669', bg: '#ecfdf5' },
                    };
                    const CARE_META: Record<string, string> = {
                      none: '�', pastoral_call: '?? Pastoral Call',
                      elder_visit: '?? Elder Visit', counseling: '?? Counseling',
                      prayer_partner: '?? Prayer Partner',
                    };
                    const filtered = prayers.filter(p => {
                      const q = prayerSearch.toLowerCase();
                      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
                      const matchesStatus = prayerStatusFilter === 'all' || p.follow_up_status === prayerStatusFilter;
                      return matchesQ && matchesStatus;
                    });
                    const needsFollowUp = prayers.filter(p => p.follow_up_status && !['completed'].includes(p.follow_up_status)).length;
                    const confidentialCount = prayers.filter(p => p.confidential).length;

                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Prayer Requests</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Manage and follow up on prayer requests from the congregation.</p>
                        </div>
                        <button onClick={fetchPrayers} className="btn btn-outline btn-small">? Refresh</button>
                      </div>

                      {/* Stat cards */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total Requests', value: prayers.length, color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'Needs Follow-up', value: needsFollowUp, color: '#d97706', bg: '#fffbeb' },
                          { label: 'Confidential', value: confidentialCount, color: '#7c3aed', bg: '#f5f3ff' },
                          { label: 'Completed', value: prayers.filter(p => p.follow_up_status === 'completed').length, color: '#059669', bg: '#ecfdf5' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, minWidth: '120px' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Filter tabs + search */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {(['all', 'received', 'assigned', 'contacted', 'ongoing', 'completed'] as const).map(s => (
                            <button key={s} onClick={() => setPrayerStatusFilter(s)} style={{
                              padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${prayerStatusFilter === s ? '#1e3a8a' : '#e5e7eb'}`,
                              background: prayerStatusFilter === s ? '#1e3a8a' : '#fff',
                              color: prayerStatusFilter === s ? '#fff' : '#374151',
                            }}>
                              {s === 'all' ? 'All' : STATUS_META[s]?.label ?? s}
                              {s !== 'all' && <span style={{ marginLeft: '0.35rem', opacity: 0.75 }}>({prayers.filter(p => p.follow_up_status === s).length})</span>}
                            </button>
                          ))}
                        </div>
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input type="text" placeholder="Search name or request�" value={prayerSearch} onChange={e => setPrayerSearch(e.target.value)}
                            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', height: '34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', width: '220px' }} />
                        </div>
                      </div>

                      {/* Requests list */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
                          <div style={{ fontWeight: 600 }}>{prayers.length === 0 ? 'No prayer requests yet.' : 'No results for current filters.'}</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {filtered.map(item => {
                            const isExpanded = expandedPrayerId === item.id;
                            const isEditing = editingPrayerId === item.id;
                            const statusMeta = STATUS_META[item.follow_up_status ?? 'received'] ?? STATUS_META.received;
                            return (
                              <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                                {/* Main row */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.9rem 1rem' }}>
                                  {/* Avatar */}
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: item.confidential ? '#f5f3ff' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, fontWeight: 700, color: item.confidential ? '#7c3aed' : '#1e3a8a' }}>
                                    {item.name[0]?.toUpperCase() ?? '?'}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                      <strong style={{ fontSize: '0.92rem' }}>{item.name}</strong>
                                      {item.confidential && (
                                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: '#f5f3ff', color: '#7c3aed' }}>?? CONFIDENTIAL</span>
                                      )}
                                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: statusMeta.bg, color: statusMeta.color }}>
                                        {statusMeta.label}
                                      </span>
                                      {item.care_request_type && item.care_request_type !== 'none' && (
                                        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{CARE_META[item.care_request_type]}</span>
                                      )}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 2, WebkitBoxOrient: 'vertical' as const }}>
                                      {item.content}
                                    </p>
                                  </div>
                                  {/* Actions */}
                                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
                                    <select
                                      value={item.follow_up_status ?? 'received'}
                                      onChange={e => item.id && handlePrayerStatusUpdate(item.id, e.target.value)}
                                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.4rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f9fafb', color: '#374151', cursor: 'pointer' }}
                                    >
                                      <option value="received">Received</option>
                                      <option value="assigned">Assigned</option>
                                      <option value="contacted">Contacted</option>
                                      <option value="ongoing">Ongoing</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                    <button onClick={() => setExpandedPrayerId(isExpanded ? null : item.id!)} className="btn btn-small btn-outline" style={{ fontSize: '0.78rem' }}>
                                      {isExpanded ? '?' : '?'}
                                    </button>
                                    <button onClick={() => item.id && handleEditPrayer(item)} className="btn btn-small btn-outline" style={{ fontSize: '0.78rem' }}>Edit</button>
                                    <button onClick={() => item.id && handleAdminDeletePrayer(item.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>Delete</button>
                                  </div>
                                </div>

                                {/* Expanded panel */}
                                {isExpanded && !isEditing && (
                                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '0.85rem 1rem', background: '#f8fafc', fontSize: '0.85rem' }}>
                                    <div style={{ marginBottom: '0.6rem' }}>
                                      <span style={{ fontWeight: 600, color: '#374151' }}>Full Request: </span>
                                      <span style={{ color: '#4b5563' }}>{item.content}</span>
                                    </div>
                                    {item.follow_up_notes && (
                                      <div style={{ marginBottom: '0.6rem' }}>
                                        <span style={{ fontWeight: 600, color: '#374151' }}>Follow-up Notes: </span>
                                        <span style={{ color: '#4b5563' }}>{item.follow_up_notes}</span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '1.5rem', color: '#6b7280', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                                      <span>Care Type: <strong>{CARE_META[item.care_request_type ?? 'none']}</strong></span>
                                      <span>Visibility: <strong>{item.confidential ? '?? Confidential' : '?? Public'}</strong></span>
                                      <span>Status: <strong style={{ color: statusMeta.color }}>{statusMeta.label}</strong></span>
                                    </div>
                                  </div>
                                )}

                                {/* Edit row */}
                                {isEditing && (
                                  <div style={{ borderTop: '1px solid #e5e7eb', padding: '0.85rem 1rem', background: '#f8fafc' }}>
                                    <div className="grid grid-2 gap-2" style={{ marginBottom: '0.75rem' }}>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Name</label>
                                        <input value={prayerDrafts[item.id!]?.name ?? item.name} onChange={(e) => setPrayerDrafts(p => ({ ...p, [item.id!]: { ...(p[item.id!] ?? item), name: e.target.value } }))} />
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Visibility</label>
                                        <select value={(prayerDrafts[item.id!]?.confidential ?? item.confidential) ? 'true' : 'false'} onChange={(e) => setPrayerDrafts(p => ({ ...p, [item.id!]: { ...(p[item.id!] ?? item), confidential: e.target.value === 'true' } }))}>
                                          <option value="false">Public</option>
                                          <option value="true">Confidential</option>
                                        </select>
                                      </div>
                                      <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                        <label>Request</label>
                                        <textarea rows={3} value={prayerDrafts[item.id!]?.content ?? item.content} onChange={(e) => setPrayerDrafts(p => ({ ...p, [item.id!]: { ...(p[item.id!] ?? item), content: e.target.value } }))} />
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button onClick={() => handleAdminUpdatePrayer(item.id!)} className="btn btn-small btn-accent">Save</button>
                                      <button onClick={() => setEditingPrayerId(null)} className="btn btn-small btn-outline">Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Donations Dashboard */}
                  {activeAdminTab === 'admin-donations' && (() => {
                    const FUNDS = ['Tithe', 'Building Fund', 'Offering', 'Go Back To School', 'Outreach', 'Other'];
                    const METHODS = ['Mobile Money', 'Bank Transfer', 'Cash', 'Card', 'Other'];
                    const FUND_COLORS: Record<string, string> = {
                      'Tithe': '#1e3a8a', 'Building Fund': '#059669', 'Offering': '#d97706',
                      'Go Back To School': '#7c3aed', 'Outreach': '#0891b2', 'Other': '#6b7280',
                    };
                    const filtered = donations.filter(d => {
                      const q = donationSearch.toLowerCase();
                      const matchesQ = !q || d.fund.toLowerCase().includes(q) || d.method.toLowerCase().includes(q);
                      const matchesFund = donationFundFilter === 'all' || d.fund === donationFundFilter;
                      return matchesQ && matchesFund;
                    });
                    const totalAll = donations.reduce((s, d) => s + d.amount, 0);
                    const fundTotals = FUNDS.map(f => ({
                      fund: f,
                      total: donations.filter(d => d.fund === f).reduce((s, d) => s + d.amount, 0),
                      count: donations.filter(d => d.fund === f).length,
                    })).filter(f => f.count > 0);
                    const maxFundTotal = Math.max(...fundTotals.map(f => f.total), 1);

                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Donations</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Track tithes, offerings, and all financial contributions to the church.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={fetchDonations} className="btn btn-outline btn-small">? Refresh</button>
                          <button onClick={() => setShowLogDonationForm(v => !v)} className="btn btn-primary btn-small">
                            {showLogDonationForm ? '? Cancel' : '+ Log Donation'}
                          </button>
                        </div>
                      </div>

                      {/* Log donation form */}
                      {showLogDonationForm && (
                        <form onSubmit={handleLogDonation} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                          <h4 style={{ marginBottom: '1rem', color: '#1e3a8a' }}>Log New Donation</h4>
                          <div className="grid grid-2 gap-2">
                            <div className="form-group">
                              <label>Amount (UGX) *</label>
                              <input type="number" value={logDonationForm.amount} onChange={e => setLogDonationForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 50000" min={1} required />
                            </div>
                            <div className="form-group">
                              <label>Fund *</label>
                              <select value={logDonationForm.fund} onChange={e => setLogDonationForm(p => ({ ...p, fund: e.target.value }))}>
                                {FUNDS.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Method *</label>
                              <select value={logDonationForm.method} onChange={e => setLogDonationForm(p => ({ ...p, method: e.target.value }))}>
                                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <input type="text" value={logDonationForm.status} onChange={e => setLogDonationForm(p => ({ ...p, status: e.target.value }))} placeholder="e.g. Completed" />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Log Donation</button>
                        </form>
                      )}

                      {/* Top stat cards */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total Collected', value: `${totalAll.toLocaleString()} UGX`, color: '#1e3a8a', bg: '#eff6ff', icon: '??' },
                          { label: 'Transactions', value: donations.length, color: '#059669', bg: '#ecfdf5', icon: '??' },
                          { label: 'This Month', value: `${donations.reduce((sum, item) => sum + item.amount, 0).toLocaleString()} UGX`, color: '#d97706', bg: '#fffbeb', icon: '??' },
                          { label: 'Fund Types', value: new Set(donations.map(d => d.fund)).size, color: '#7c3aed', bg: '#f5f3ff', icon: '??' },
                        ].map(({ label, value, color, bg, icon }) => (
                          <div key={label} style={{ padding: '0.85rem 1.1rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, flex: '1', minWidth: '130px' }}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{icon}</div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                            <div style={{ fontSize: '0.73rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Fund breakdown bars */}
                      {fundTotals.length > 0 && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.1rem', marginBottom: '1.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '0.85rem', fontSize: '0.9rem' }}>By Fund</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {fundTotals.map(({ fund, total, count }) => (
                              <div key={fund}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 600, color: '#374151' }}>{fund} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({count})</span></span>
                                  <span style={{ fontWeight: 700, color: FUND_COLORS[fund] ?? '#6b7280' }}>{total.toLocaleString()} UGX</span>
                                </div>
                                <div style={{ height: '7px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${(total / maxFundTotal) * 100}%`, background: FUND_COLORS[fund] ?? '#6b7280', borderRadius: '4px', transition: 'width 0.4s' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Search + fund filter */}
                      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {['all', ...FUNDS].map(f => (
                            <button key={f} onClick={() => setDonationFundFilter(f)} style={{
                              padding: '0.28rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${donationFundFilter === f ? '#1e3a8a' : '#e5e7eb'}`,
                              background: donationFundFilter === f ? '#1e3a8a' : '#fff',
                              color: donationFundFilter === f ? '#fff' : '#374151',
                            }}>
                              {f === 'all' ? 'All' : f}
                              {f !== 'all' && donations.filter(d => d.fund === f).length > 0 && (
                                <span style={{ marginLeft: '0.3rem', opacity: 0.75 }}>({donations.filter(d => d.fund === f).length})</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input type="text" placeholder="Search fund or method�" value={donationSearch} onChange={e => setDonationSearch(e.target.value)}
                            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', height: '34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', width: '200px' }} />
                        </div>
                      </div>

                      {/* Table */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
                          <div style={{ fontWeight: 600 }}>{donations.length === 0 ? 'No contributions logged yet.' : 'No results for current filters.'}</div>
                          {donations.length === 0 && <div style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>Click "+ Log Donation" to record the first entry.</div>}
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Amount</th>
                                <th>Fund</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((item, idx) => (
                                editingDonationId === item.id ? (
                                  <tr key={item.id}>
                                    <td>{idx + 1}</td>
                                    <td><input type="number" value={String(donationDrafts[item.id!]?.amount ?? item.amount)} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), amount: Number(e.target.value) } }))} /></td>
                                    <td>
                                      <select value={donationDrafts[item.id!]?.fund ?? item.fund} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), fund: e.target.value } }))}>
                                        {FUNDS.map(f => <option key={f} value={f}>{f}</option>)}
                                      </select>
                                    </td>
                                    <td>
                                      <select value={donationDrafts[item.id!]?.method ?? item.method} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), method: e.target.value } }))}>
                                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                    </td>
                                    <td><input value={donationDrafts[item.id!]?.status ?? item.status ?? ''} onChange={(e) => setDonationDrafts((prev) => ({ ...prev, [item.id!]: { ...(prev[item.id!] ?? item), status: e.target.value } }))} /></td>
                                    <td>
                                      <button onClick={() => handleAdminUpdateDonation(item.id!)} className="btn btn-small btn-accent">Save</button>
                                      <button onClick={() => setEditingDonationId(null)} className="btn btn-small btn-outline">Cancel</button>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={item.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{idx + 1}</td>
                                    <td><strong style={{ color: '#1e3a8a' }}>{item.amount.toLocaleString()} UGX</strong></td>
                                    <td>
                                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: `${FUND_COLORS[item.fund] ?? '#6b7280'}15`, color: FUND_COLORS[item.fund] ?? '#6b7280' }}>
                                        {item.fund}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{item.method}</td>
                                    <td><span className="badge" style={{ background: '#ecfdf5', color: '#059669' }}>{item.status || 'Completed'}</span></td>
                                    <td>
                                      <button onClick={() => item.id && handleEditDonation(item)} className="btn btn-small btn-outline">Edit</button>
                                      <button onClick={() => item.id && handleDeleteDonation(item.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626' }}>Delete</button>
                                    </td>
                                  </tr>
                                )
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Manage Events */}
                  {activeAdminTab === 'admin-events' && (() => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const categories = ['all', ...Array.from(new Set(events.map(e => e.category || 'General')))];
                    const filtered = events.filter(e => {
                      const eDate = new Date(e.date); eDate.setHours(0,0,0,0);
                      const isUpcoming = eDate >= today;
                      const q = eventSearch.toLowerCase();
                      const matchesQ = !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
                      const matchesTime = eventTimeFilter === 'all' || (eventTimeFilter === 'upcoming' ? isUpcoming : !isUpcoming);
                      const matchesCat = eventCategoryFilter === 'all' || (e.category || 'General') === eventCategoryFilter;
                      return matchesQ && matchesTime && matchesCat;
                    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    const upcomingCount = events.filter(e => new Date(e.date) >= today).length;
                    const publishedCount = events.filter(e => e.is_published !== false).length;
                    const totalAttendees = events.reduce((s, e) => s + (e.attendee_count || 0), 0);
                    const totalWaitlist = events.reduce((s, e) => s + (e.waitlist_count || 0), 0);

                    const CAT_COLORS: Record<string, string> = {
                      'Camp Meeting': '#7c3aed', 'Youth': '#059669', 'Choir': '#0891b2',
                      'Outreach': '#d97706', 'General': '#1e3a8a', 'Worship': '#dc2626',
                    };

                    const getDateLabel = (dateStr: string) => {
                      const d = new Date(dateStr); d.setHours(0,0,0,0);
                      const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
                      if (diff === 0) return { text: 'TODAY', color: '#dc2626' };
                      if (diff === 1) return { text: 'TOMORROW', color: '#d97706' };
                      if (diff > 0 && diff <= 7) return { text: `IN ${diff} DAYS`, color: '#059669' };
                      if (diff < 0) return { text: 'PAST', color: '#9ca3af' };
                      return null;
                    };

                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Events</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Manage church events, track attendance and waitlists.</p>
                        </div>
                        <button onClick={() => setShowAddEventModal(true)} className="btn btn-primary btn-small">+ Add New Event</button>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total Events', value: events.length, color: '#1e3a8a', bg: '#eff6ff', icon: '??' },
                          { label: 'Upcoming', value: upcomingCount, color: '#059669', bg: '#ecfdf5', icon: '??' },
                          { label: 'Published', value: publishedCount, color: '#0891b2', bg: '#ecfeff', icon: '?' },
                          { label: 'Registered', value: totalAttendees, color: '#7c3aed', bg: '#f5f3ff', icon: '??' },
                          { label: 'On Waitlist', value: totalWaitlist, color: '#d97706', bg: '#fffbeb', icon: '?' },
                        ].map(({ label, value, color, bg, icon }) => (
                          <div key={label} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, flex: 1, minWidth: '100px' }}>
                            <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{icon}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Filters */}
                      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {(['all', 'upcoming', 'past'] as const).map(t => (
                            <button key={t} onClick={() => setEventTimeFilter(t)} style={{
                              padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${eventTimeFilter === t ? '#1e3a8a' : '#e5e7eb'}`,
                              background: eventTimeFilter === t ? '#1e3a8a' : '#fff',
                              color: eventTimeFilter === t ? '#fff' : '#374151',
                            }}>
                              {t === 'all' ? `All (${events.length})` : t === 'upcoming' ? `Upcoming (${upcomingCount})` : `Past (${events.length - upcomingCount})`}
                            </button>
                          ))}
                        </div>
                        <select value={eventCategoryFilter} onChange={e => setEventCategoryFilter(e.target.value)}
                          style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem', background: '#fff' }}>
                          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                        </select>
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input type="text" placeholder="Search events�" value={eventSearch} onChange={e => setEventSearch(e.target.value)}
                            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', height: '34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', width: '200px' }} />
                        </div>
                      </div>

                      {/* Event cards */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
                          <div style={{ fontWeight: 600 }}>{events.length === 0 ? 'No events yet.' : 'No events match your filters.'}</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {filtered.map(item => {
                            const eDate = new Date(item.date);
                            const isPast = eDate < today;
                            const label = getDateLabel(item.date);
                            const catColor = CAT_COLORS[item.category || 'General'] ?? '#1e3a8a';
                            const seatsUsed = item.attendee_count || 0;
                            const seatsTotal = item.capacity;
                            const pct = seatsTotal ? Math.min(100, Math.round((seatsUsed / seatsTotal) * 100)) : null;

                            return (
                              <div key={item.id} style={{
                                border: '1px solid #e5e7eb',
                                borderLeft: `4px solid ${isPast ? '#d1d5db' : catColor}`,
                                borderRadius: '10px', background: isPast ? '#fafafa' : '#fff',
                                display: 'flex', gap: '1rem', padding: '0.9rem 1rem', alignItems: 'flex-start',
                                opacity: isPast ? 0.75 : 1,
                              }}>
                                {/* Date badge */}
                                <div style={{ flexShrink: 0, textAlign: 'center', width: '52px' }}>
                                  <div style={{ background: isPast ? '#f3f4f6' : catColor, color: isPast ? '#9ca3af' : '#fff', borderRadius: '8px', padding: '0.4rem 0.3rem' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      {eDate.toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                                      {eDate.getDate()}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>
                                      {eDate.getFullYear()}
                                    </div>
                                  </div>
                                  {label && (
                                    <div style={{ marginTop: '0.3rem', fontSize: '0.62rem', fontWeight: 700, color: label.color, textTransform: 'uppercase' }}>
                                      {label.text}
                                    </div>
                                  )}
                                </div>

                                {/* Main content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                    <strong style={{ fontSize: '0.95rem', color: '#111827' }}>{item.title}</strong>
                                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: `${catColor}15`, color: catColor }}>
                                      {item.category || 'General'}
                                    </span>
                                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: item.is_published !== false ? '#ecfdf5' : '#fef9c3', color: item.is_published !== false ? '#059669' : '#854d0e' }}>
                                      {item.is_published !== false ? '? Published' : '?? Draft'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                                    ?? {item.location}
                                  </div>
                                  {item.desc && (
                                    <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
                                      {item.desc}
                                    </p>
                                  )}
                                  {/* Capacity bar */}
                                  {seatsTotal != null && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.2rem' }}>
                                        <span>?? {seatsUsed} registered{item.waitlist_count ? ` � ? ${item.waitlist_count} waitlist` : ''}</span>
                                        <span>{item.seats_remaining != null ? `${item.seats_remaining} seats left` : `${seatsTotal} capacity`}</span>
                                      </div>
                                      <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct ?? 0}%`, background: pct != null && pct >= 90 ? '#dc2626' : pct != null && pct >= 70 ? '#d97706' : catColor, borderRadius: '3px' }} />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0, alignItems: 'flex-end' }}>
                                  <button onClick={() => openEventEditor(item)} className="btn btn-small btn-outline" style={{ fontSize: '0.78rem' }}>?? Edit</button>
                                  <button
                                    onClick={() => handleAdminToggleEventPublish(item)}
                                    className="btn btn-small btn-outline"
                                    style={{ fontSize: '0.78rem', color: item.is_published !== false ? '#d97706' : '#059669' }}
                                  >
                                    {item.is_published !== false ? 'Unpublish' : 'Publish'}
                                  </button>
                                  <button onClick={() => handleAdminDeleteEvent(item.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>?? Remove</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Manage Sermons */}
                  {activeAdminTab === 'admin-sermons' && (() => {
                    const CAT_COLORS: Record<string, string> = {
                      'Sabbath Sermons': '#1e3a8a',
                      'Week of Prayer': '#7c3aed',
                      'Bible Studies': '#059669',
                      'Camp Meeting': '#d97706',
                      'Youth': '#0891b2',
                      'Special': '#dc2626',
                    };
                    const categories = ['all', ...Array.from(new Set(sermons.map(s => s.category || 'Sabbath Sermons')))];
                    const filtered = sermons
                      .filter(s => {
                        const q = sermonSearch.toLowerCase();
                        const matchesQ = !q || s.title.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q) || (s.passage || '').toLowerCase().includes(q);
                        const matchesCat = sermonCategoryFilter === 'all' || (s.category || 'Sabbath Sermons') === sermonCategoryFilter;
                        return matchesQ && matchesCat;
                      })
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    const catCounts = Object.fromEntries(
                      categories.filter(c => c !== 'all').map(c => [c, sermons.filter(s => (s.category || 'Sabbath Sermons') === c).length])
                    );

                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Sermon Archive</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Manage all preached sermons, speakers, and scripture references.</p>
                        </div>
                        <button onClick={() => setShowAddSermonModal(true)} className="btn btn-primary btn-small">+ Add New Sermon</button>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #1e3a8a20' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1 }}>{sermons.length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Total Sermons</div>
                        </div>
                        {Object.entries(catCounts).map(([cat, count]) => (
                          <div key={cat} style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: `${CAT_COLORS[cat] ?? '#6b7280'}10`, border: `1px solid ${CAT_COLORS[cat] ?? '#6b7280'}20` }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: CAT_COLORS[cat] ?? '#6b7280', lineHeight: 1 }}>{count}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{cat}</div>
                          </div>
                        ))}
                      </div>

                      {/* Filters + search */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {categories.map(c => (
                            <button key={c} onClick={() => setSermonCategoryFilter(c)} style={{
                              padding: '0.28rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${sermonCategoryFilter === c ? (CAT_COLORS[c] ?? '#1e3a8a') : '#e5e7eb'}`,
                              background: sermonCategoryFilter === c ? (CAT_COLORS[c] ?? '#1e3a8a') : '#fff',
                              color: sermonCategoryFilter === c ? '#fff' : '#374151',
                            }}>
                              {c === 'all' ? `All (${sermons.length})` : `${c} (${catCounts[c] ?? 0})`}
                            </button>
                          ))}
                        </div>
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input type="text" placeholder="Search title, speaker, passage�" value={sermonSearch} onChange={e => setSermonSearch(e.target.value)}
                            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', height: '34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', width: '230px' }} />
                        </div>
                      </div>

                      {/* Sermon cards */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>???</div>
                          <div style={{ fontWeight: 600 }}>{sermons.length === 0 ? 'No sermons yet.' : 'No results match your filters.'}</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {filtered.map(item => {
                            const catColor = CAT_COLORS[item.category || 'Sabbath Sermons'] ?? '#1e3a8a';
                            const fmtDate = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return (
                              <div key={item.id} style={{
                                border: '1px solid #e5e7eb',
                                borderLeft: `4px solid ${catColor}`,
                                borderRadius: '10px', background: '#fff',
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem',
                              }}>
                                {/* Speaker avatar */}
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${catColor}15`, border: `2px solid ${catColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: catColor, flexShrink: 0 }}>
                                  {item.speaker[0]?.toUpperCase() ?? '?'}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.title}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
                                    <span>?? {item.speaker}</span>
                                    <span>?? {fmtDate}</span>
                                    {item.passage && <span style={{ color: catColor, fontWeight: 600 }}>?? {item.passage}</span>}
                                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: `${catColor}15`, color: catColor }}>
                                      {item.category || 'Sabbath Sermons'}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                  {item.youtube_id && (
                                    <a href={`https://youtube.com/watch?v=${item.youtube_id}`} target="_blank" rel="noopener noreferrer"
                                      style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #dc2626', background: '#fef2f2', color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      ? Watch
                                    </a>
                                  )}
                                  <button onClick={() => openSermonEditor(item)} className="btn btn-small btn-outline" style={{ fontSize: '0.78rem' }}>?? Edit</button>
                                  <button onClick={() => handleAdminDeleteSermon(item.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>?? Remove</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Testimonies Moderation */}
                  {activeAdminTab === 'admin-testimonies' && (() => {
                    const TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
                      prayer_answered:   { label: 'Prayer Answered',    color: '#1e3a8a', bg: '#eff6ff' },
                      spiritual_growth:  { label: 'Spiritual Growth',   color: '#059669', bg: '#ecfdf5' },
                      community_support: { label: 'Community Support',  color: '#7c3aed', bg: '#f5f3ff' },
                      healing_restoration:{ label: 'Healing & Restoration', color: '#dc2626', bg: '#fef2f2' },
                      outreach_impact:   { label: 'Outreach Impact',    color: '#d97706', bg: '#fffbeb' },
                    };
                    const filtered = testimonies.filter(t => {
                      const q = testimonySearch.toLowerCase();
                      const matchesQ = !q || t.title.toLowerCase().includes(q) || (t.author_name || '').toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
                      if (adminTestimonyFilter === 'pending') return matchesQ && !t.is_approved;
                      if (adminTestimonyFilter === 'approved') return matchesQ && t.is_approved;
                      if (adminTestimonyFilter === 'featured') return matchesQ && t.is_featured;
                      return matchesQ;
                    });
                    const pendingCount = testimonies.filter(t => !t.is_approved).length;
                    const approvedCount = testimonies.filter(t => t.is_approved).length;
                    const featuredCount = testimonies.filter(t => t.is_featured).length;

                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Testimonies</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Review, approve, feature, or remove member testimonies before they appear publicly.</p>
                        </div>
                        <button onClick={() => fetchTestimonies(true)} className="btn btn-outline btn-small">? Refresh</button>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total', value: testimonies.length, color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'Pending Review', value: pendingCount, color: '#d97706', bg: '#fffbeb' },
                          { label: 'Approved', value: approvedCount, color: '#059669', bg: '#ecfdf5' },
                          { label: 'Featured', value: featuredCount, color: '#7c3aed', bg: '#f5f3ff' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, minWidth: '110px' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Filter tabs + search */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {(['all', 'pending', 'approved', 'featured'] as const).map(f => (
                            <button key={f} onClick={() => setAdminTestimonyFilter(f)} style={{
                              padding: '0.28rem 0.65rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              border: `1px solid ${adminTestimonyFilter === f ? '#1e3a8a' : '#e5e7eb'}`,
                              background: adminTestimonyFilter === f ? '#1e3a8a' : '#fff',
                              color: adminTestimonyFilter === f ? '#fff' : '#374151',
                            }}>
                              {f === 'all' ? `All (${testimonies.length})` : f === 'pending' ? `Pending (${pendingCount})` : f === 'approved' ? `Approved (${approvedCount})` : `Featured (${featuredCount})`}
                            </button>
                          ))}
                        </div>
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input type="text" placeholder="Search testimonies�" value={testimonySearch} onChange={e => setTestimonySearch(e.target.value)}
                            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', height: '34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', width: '210px' }} />
                        </div>
                      </div>

                      {/* Cards */}
                      {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>?</div>
                          <div style={{ fontWeight: 600 }}>{testimonies.length === 0 ? 'No testimonies yet.' : 'No results for current filters.'}</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {filtered.map(item => {
                            const typeMeta = TYPE_META[item.testimony_type || 'spiritual_growth'] ?? TYPE_META.spiritual_growth;
                            const isActing = adminTestimonyActionId === item.id;
                            return (
                              <div key={item.id} style={{
                                border: '1px solid #e5e7eb',
                                borderLeft: `4px solid ${typeMeta.color}`,
                                borderRadius: '10px', background: '#fff', padding: '1rem',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Title + badges */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                                      <strong style={{ fontSize: '0.92rem' }}>{item.title}</strong>
                                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: typeMeta.bg, color: typeMeta.color }}>
                                        {typeMeta.label}
                                      </span>
                                      {item.is_featured && (
                                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed' }}>? Featured</span>
                                      )}
                                      {item.is_approved
                                        ? <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#ecfdf5', color: '#059669' }}>? Approved</span>
                                        : <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#fffbeb', color: '#d97706' }}>? Pending</span>
                                      }
                                    </div>
                                    {/* Author + date */}
                                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                                      ?? {item.author_name || 'Anonymous'} � ?? {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                    </div>
                                    {/* Content preview */}
                                    <p style={{ fontSize: '0.84rem', color: '#374151', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                                      {item.content}
                                    </p>
                                  </div>
                                  {/* Action buttons */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                                    {!item.is_approved ? (
                                      <button disabled={isActing} onClick={() => handleAdminModerateTestimony(item, { is_approved: true }, 'Testimony approved.')}
                                        className="btn btn-small" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #059669', fontSize: '0.78rem' }}>
                                        {isActing ? '�' : '? Approve'}
                                      </button>
                                    ) : (
                                      <button disabled={isActing} onClick={() => handleAdminModerateTestimony(item, { is_approved: false }, 'Approval removed.')}
                                        className="btn btn-small btn-outline" style={{ fontSize: '0.78rem', color: '#d97706' }}>
                                        {isActing ? '�' : 'Unapprove'}
                                      </button>
                                    )}
                                    {!item.is_featured ? (
                                      <button disabled={isActing} onClick={() => handleAdminModerateTestimony(item, { is_featured: true }, 'Testimony featured.')}
                                        className="btn btn-small btn-outline" style={{ fontSize: '0.78rem', color: '#7c3aed' }}>
                                        {isActing ? '�' : '? Feature'}
                                      </button>
                                    ) : (
                                      <button disabled={isActing} onClick={() => handleAdminModerateTestimony(item, { is_featured: false }, 'Removed from featured.')}
                                        className="btn btn-small btn-outline" style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                                        {isActing ? '�' : 'Unfeature'}
                                      </button>
                                    )}
                                    <button disabled={isActing} onClick={() => handleAdminDeleteTestimony(item)}
                                      className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>
                                      {isActing ? '�' : '?? Delete'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Manage Announcements */}
                  {activeAdminTab === 'admin-announcements' && (() => {
                    const PRIORITY_META = {
                      high:   { label: 'High',   color: '#dc2626', bg: '#fef2f2', dot: '??' },
                      normal: { label: 'Normal', color: '#0891b2', bg: '#ecfeff', dot: '??' },
                      low:    { label: 'Low',    color: '#6b7280', bg: '#f3f4f6', dot: '?' },
                    };
                    const highCount = announcements.filter(a => a.priority === 'high').length;
                    const publishedCount = announcements.filter(a => a.is_published !== false).length;
                    return (
                    <div className="admin-tab-content active">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Announcements</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Create notices that appear on the public Notices page when published.</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total', value: announcements.length, color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'High Priority', value: highCount, color: '#dc2626', bg: '#fef2f2' },
                          { label: 'Published', value: publishedCount, color: '#059669', bg: '#ecfdf5' },
                          { label: 'Drafts', value: announcements.length - publishedCount, color: '#6b7280', bg: '#f3f4f6' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, minWidth: '110px' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Add form */}
                      <form onSubmit={handleAdminAddAnnouncement} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.95rem' }}>?? New Announcement</h3>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group">
                            <label>Title *</label>
                            <input type="text" value={addAnnouncementForm.title} onChange={e => setAddAnnouncementForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Baptism Service � This Sabbath" required />
                          </div>
                          <div className="form-group">
                            <label>Scheduled Date *</label>
                            <input type="date" value={addAnnouncementForm.date} onChange={e => setAddAnnouncementForm(f => ({ ...f, date: e.target.value }))} required />
                          </div>
                          <div className="form-group">
                            <label>Priority</label>
                            <select value={addAnnouncementForm.priority} onChange={e => setAddAnnouncementForm(f => ({ ...f, priority: e.target.value as 'high' | 'normal' | 'low' }))}>
                              <option value="high">?? High</option>
                              <option value="normal">?? Normal</option>
                              <option value="low">? Low</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Icon / Emoji</label>
                            <input type="text" value={addAnnouncementForm.icon} onChange={e => setAddAnnouncementForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. ?? ?? ?? ??" />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Message *</label>
                            <textarea value={addAnnouncementForm.body} onChange={e => setAddAnnouncementForm(f => ({ ...f, body: e.target.value }))} required rows={3} placeholder="Write the full announcement text here�" />
                          </div>
                          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input id="ann-pub" type="checkbox" checked={addAnnouncementForm.is_published} onChange={e => setAddAnnouncementForm(f => ({ ...f, is_published: e.target.checked }))} />
                            <label htmlFor="ann-pub" style={{ margin: 0, fontWeight: 500 }}>Publish immediately</label>
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>Save Announcement</button>
                      </form>

                      {/* List */}
                      <h3 style={{ margin: '0 0 0.75rem', color: '#1e3a8a', fontSize: '0.92rem', fontWeight: 700 }}>All Announcements ({announcements.length})</h3>
                      {announcements.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
                          <div style={{ fontWeight: 600 }}>No announcements yet.</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {[...announcements]
                            .sort((a, b) => ({ high: 0, normal: 1, low: 2 }[a.priority] ?? 1) - ({ high: 0, normal: 1, low: 2 }[b.priority] ?? 1))
                            .map(item => {
                              const pm = PRIORITY_META[item.priority] ?? PRIORITY_META.normal;
                              const fmtDate = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                              return (
                                <div key={item.id} style={{ border: '1px solid #e5e7eb', borderLeft: `4px solid ${pm.color}`, borderRadius: '10px', background: '#fff', padding: '0.9rem 1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                                  <div style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: '0.1rem' }}>{item.icon}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                                      <strong style={{ fontSize: '0.92rem' }}>{item.title}</strong>
                                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: pm.bg, color: pm.color }}>{pm.dot} {pm.label}</span>
                                      <span style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: item.is_published !== false ? '#ecfdf5' : '#fef9c3', color: item.is_published !== false ? '#059669' : '#854d0e' }}>
                                        {item.is_published !== false ? '? Published' : '?? Draft'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '0.3rem' }}>?? {fmtDate}</div>
                                    <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{item.body}</p>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                                    <button onClick={() => openAnnouncementEditor(item)} className="btn btn-small btn-outline" style={{ fontSize: '0.78rem' }}>?? Edit</button>
                                    <button onClick={() => handleAdminDeleteAnnouncement(item.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>?? Remove</button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Blog Posts Management */}
                  {activeAdminTab === 'admin-blog' && (() => {
                    const BLOG_CATEGORIES = ['news', 'announcement', 'devotional', 'outreach', 'testimony', 'event_recap'];
                    const catLabel = (c: string) => c === 'event_recap' ? 'Event Recap' : c.charAt(0).toUpperCase() + c.slice(1);
                    const catColors: Record<string, { bg: string; color: string }> = {
                      news:         { bg: '#dbeafe', color: '#1e40af' },
                      announcement: { bg: '#fde68a', color: '#92400e' },
                      devotional:   { bg: '#d1fae5', color: '#065f46' },
                      outreach:     { bg: '#fce7f3', color: '#9d174d' },
                      testimony:    { bg: '#ede9fe', color: '#5b21b6' },
                      event_recap:  { bg: '#e0f2fe', color: '#0369a1' },
                    };
                    const visiblePosts = blogPosts.filter(p => {
                      const q = blogSearch.toLowerCase();
                      const matchQ = !q || p.title.toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q);
                      const matchCat = blogCatFilter === 'all' || p.category === blogCatFilter;
                      const matchSt = blogStatusFilter === 'all' || (blogStatusFilter === 'published' ? p.is_published : !p.is_published);
                      return matchQ && matchCat && matchSt;
                    });
                    const applyFormat = (tag: string, textareaId: string, setter: (v: string) => void, currentVal: string) => {
                      const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
                      if (!el) return;
                      const start = el.selectionStart;
                      const end = el.selectionEnd;
                      const selected = currentVal.slice(start, end);
                      const wrapped = selected ? `<${tag}>${selected}</${tag}>` : `<${tag}></${tag}>`;
                      const next = currentVal.slice(0, start) + wrapped + currentVal.slice(end);
                      setter(next);
                      setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + wrapped.length; }, 0);
                    };
                    return (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Blog Posts</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Create and manage news, updates, and articles published to the church website.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={fetchBlogPosts} className="btn btn-outline btn-small" disabled={blogPostsLoading}>
                            {blogPostsLoading ? 'Loading…' : '↻ Refresh'}
                          </button>
                          <button onClick={() => setShowAddBlogForm(v => !v)} className="btn btn-primary btn-small">
                            {showAddBlogForm ? '✕ Cancel' : '+ New Post'}
                          </button>
                        </div>
                      </div>

                      {/* Collapsible new post form */}
                      {showAddBlogForm && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                          <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.95rem' }}>✏️ New Blog Post</h3>
                          <form onSubmit={async (e) => { await handleCreateBlogPost(e); setShowAddBlogForm(false); }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label>Title *</label>
                                <input type="text" value={addBlogForm.title} onChange={e => setAddBlogForm(p => ({ ...p, title: e.target.value }))} placeholder="Post title" required />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Category</label>
                                <select value={addBlogForm.category} onChange={e => setAddBlogForm(p => ({ ...p, category: e.target.value }))}>
                                  {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                                </select>
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Audience</label>
                                <input type="text" value={addBlogForm.audience} onChange={e => setAddBlogForm(p => ({ ...p, audience: e.target.value }))} placeholder="e.g. Youth, All" />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Call-to-Action Text</label>
                                <input type="text" value={addBlogForm.cta_text} onChange={e => setAddBlogForm(p => ({ ...p, cta_text: e.target.value }))} placeholder="e.g. Register Now" />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Call-to-Action Link</label>
                                <input type="url" value={addBlogForm.cta_link} onChange={e => setAddBlogForm(p => ({ ...p, cta_link: e.target.value }))} placeholder="https://..." />
                              </div>
                              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label>Featured Image</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <input type="url" value={addBlogForm.featured_image} onChange={e => setAddBlogForm(p => ({ ...p, featured_image: e.target.value }))} placeholder="Paste URL or upload…" style={{ flex: 1 }} />
                                    {addBlogForm.featured_image && (
                                      <img src={addBlogForm.featured_image} alt="preview" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                                    )}
                                  </div>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.3rem 0.7rem', width: 'fit-content' }}>
                                    📁 Choose File
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={async e => {
                                      const file = e.target.files?.[0]; if (!file) return;
                                      try { const url = await uploadProjectImage(file); setAddBlogForm(p => ({ ...p, featured_image: url })); toast.success('Image uploaded.'); }
                                      catch (err: any) { toast.error(err.message || 'Upload failed.'); }
                                      e.target.value = '';
                                    }} />
                                  </label>
                                </div>
                              </div>
                              <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                <label>Content *</label>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.4rem 0.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                                    {([
                                      { label: 'B', tag: 'b', style: { fontWeight: 700 } },
                                      { label: 'I', tag: 'i', style: { fontStyle: 'italic' as const } },
                                      { label: 'H2', tag: 'h2', style: {} },
                                      { label: 'H3', tag: 'h3', style: {} },
                                      { label: '• List', tag: 'li', style: {} },
                                      { label: 'Link', tag: 'a href=""', style: { color: '#1e40af' } },
                                    ] as Array<{ label: string; tag: string; style: React.CSSProperties }>).map(({ label, tag, style }) => (
                                      <button key={tag} type="button"
                                        onClick={() => applyFormat(tag, 'new-blog-content', v => setAddBlogForm(p => ({ ...p, content: v })), addBlogForm.content)}
                                        style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', ...style }}
                                      >{label}</button>
                                    ))}
                                  </div>
                                  <textarea id="new-blog-content" rows={7} value={addBlogForm.content} onChange={e => setAddBlogForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your post content… Select text then click a toolbar button to format it." required style={{ display: 'block', width: '100%', border: 'none', outline: 'none', padding: '0.75rem', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                                </div>
                              </div>
                              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 500 }}>
                                  <input type="checkbox" checked={addBlogForm.is_published} onChange={e => setAddBlogForm(p => ({ ...p, is_published: e.target.checked }))} />
                                  Publish immediately
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 500 }}>
                                  <input type="checkbox" checked={addBlogForm.action_required} onChange={e => setAddBlogForm(p => ({ ...p, action_required: e.target.checked }))} />
                                  Action required
                                </label>
                              </div>
                            </div>
                            <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                              <button type="submit" className="btn btn-primary btn-small">📢 Publish Post</button>
                              <button type="button" className="btn btn-outline btn-small" onClick={() => setShowAddBlogForm(false)}>Cancel</button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Search & filters */}
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <input type="text" placeholder="🔍 Search posts…" value={blogSearch} onChange={e => setBlogSearch(e.target.value)}
                          style={{ flex: 1, minWidth: '180px', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }} />
                        <select value={blogCatFilter} onChange={e => setBlogCatFilter(e.target.value)}
                          style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff' }}>
                          <option value="all">All Categories</option>
                          {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                        </select>
                        <select value={blogStatusFilter} onChange={e => setBlogStatusFilter(e.target.value)}
                          style={{ padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff' }}>
                          <option value="all">All Statuses</option>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                        </select>
                        {(blogSearch || blogCatFilter !== 'all' || blogStatusFilter !== 'all') && (
                          <button onClick={() => { setBlogSearch(''); setBlogCatFilter('all'); setBlogStatusFilter('all'); }}
                            style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.82rem', color: '#6b7280', cursor: 'pointer' }}>
                            ✕ Clear
                          </button>
                        )}
                        <span style={{ fontSize: '0.82rem', color: '#6b7280', marginLeft: 'auto' }}>
                          {visiblePosts.length} of {blogPosts.length} post{blogPosts.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {blogPostsError && <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>{blogPostsError}</div>}

                      {/* Post cards */}
                      {blogPostsLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading posts…</div>
                      ) : visiblePosts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                          <p style={{ margin: 0 }}>{blogPosts.length === 0 ? 'No posts yet. Create one above.' : 'No posts match your filters.'}</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {visiblePosts.map(post => {
                            const isEditing = editingBlogId === post.id;
                            const draft = blogDrafts[post.id] ?? { ...post };
                            const cc = catColors[post.category] ?? { bg: '#f1f5f9', color: '#475569' };
                            const snippet = (post.content || '').replace(/<[^>]+>/g, '').slice(0, 120);
                            return (
                              <div key={post.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                {/* View row */}
                                <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', alignItems: 'flex-start' }}>
                                  <div style={{ width: '72px', height: '72px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {post.featured_image
                                      ? <img src={post.featured_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                      : <span style={{ fontSize: '1.75rem' }}>📰</span>}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.3rem' }}>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px', background: cc.bg, color: cc.color }}>{catLabel(post.category)}</span>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px', background: post.is_published ? '#dcfce7' : '#fef9c3', color: post.is_published ? '#166534' : '#854d0e' }}>
                                        {post.is_published ? '● Published' : '○ Draft'}
                                      </span>
                                      {post.action_required && <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '20px', background: '#fee2e2', color: '#991b1b' }}>⚠ Action Required</span>}
                                    </div>
                                    <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.97rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h4>
                                    <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#6b7280', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'] }}>{snippet}{snippet.length >= 120 ? '…' : ''}</p>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                      {post.author_name || 'Admin'} · {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <button onClick={() => { setEditingBlogId(isEditing ? null : post.id); if (!isEditing) setBlogDrafts(prev => ({ ...prev, [post.id]: { ...post } })); }}
                                      className="btn btn-small btn-outline" style={{ minWidth: '62px' }}>
                                      {isEditing ? '✕ Close' : '✏️ Edit'}
                                    </button>
                                    <button onClick={() => handleToggleBlogPublished(post)} className="btn btn-small btn-outline" style={{ minWidth: '88px' }}>
                                      {post.is_published ? '🙈 Unpublish' : '📢 Publish'}
                                    </button>
                                    <button onClick={() => handleDeleteBlogPost(post.id)} className="btn btn-small"
                                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', minWidth: '62px' }}>
                                      🗑 Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Inline edit panel */}
                                {isEditing && (
                                  <div style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.25rem', background: '#f8fafc' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                                      <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Title</label>
                                        <input type="text" value={draft.title ?? ''} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, title: e.target.value } }))} />
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Category</label>
                                        <select value={draft.category ?? 'news'} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, category: e.target.value } }))}>
                                          {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                                        </select>
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Status</label>
                                        <select value={draft.is_published ? 'published' : 'draft'} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, is_published: e.target.value === 'published' } }))}>
                                          <option value="published">Published</option>
                                          <option value="draft">Draft</option>
                                        </select>
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Audience</label>
                                        <input type="text" value={draft.audience ?? ''} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, audience: e.target.value } }))} placeholder="e.g. Youth, All" />
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>CTA Text</label>
                                        <input type="text" value={draft.cta_text ?? ''} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, cta_text: e.target.value } }))} />
                                      </div>
                                      <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>CTA Link</label>
                                        <input type="url" value={draft.cta_link ?? ''} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, cta_link: e.target.value } }))} placeholder="https://..." />
                                      </div>
                                      <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Featured Image</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <input type="url" value={draft.featured_image ?? ''} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, featured_image: e.target.value } }))} placeholder="Paste URL or upload…" style={{ flex: 1 }} />
                                            {draft.featured_image && (
                                              <img src={draft.featured_image} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #e2e8f0', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />
                                            )}
                                          </div>
                                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.25rem 0.6rem', width: 'fit-content' }}>
                                            📁 Choose File
                                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={async e => {
                                              const file = e.target.files?.[0]; if (!file) return;
                                              try { const url = await uploadProjectImage(file); setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, featured_image: url } })); toast.success('Image uploaded.'); }
                                              catch (err: any) { toast.error(err.message || 'Upload failed.'); }
                                              e.target.value = '';
                                            }} />
                                          </label>
                                        </div>
                                      </div>
                                      <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Content</label>
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.35rem 0.5rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                                            {([
                                              { label: 'B', tag: 'b', style: { fontWeight: 700 } },
                                              { label: 'I', tag: 'i', style: { fontStyle: 'italic' as const } },
                                              { label: 'H2', tag: 'h2', style: {} },
                                              { label: 'H3', tag: 'h3', style: {} },
                                              { label: '• List', tag: 'li', style: {} },
                                              { label: 'Link', tag: 'a href=""', style: { color: '#1e40af' } },
                                            ] as Array<{ label: string; tag: string; style: React.CSSProperties }>).map(({ label, tag, style }) => (
                                              <button key={tag} type="button"
                                                onClick={() => applyFormat(tag, `edit-blog-content-${post.id}`, v => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, content: v } })), draft.content ?? '')}
                                                style={{ padding: '0.18rem 0.45rem', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.75rem', ...style }}
                                              >{label}</button>
                                            ))}
                                          </div>
                                          <textarea id={`edit-blog-content-${post.id}`} rows={6} value={draft.content ?? ''} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, content: e.target.value } }))} style={{ display: 'block', width: '100%', border: 'none', outline: 'none', padding: '0.75rem', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }} />
                                        </div>
                                      </div>
                                      <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500 }}>
                                          <input type="checkbox" checked={draft.action_required ?? false} onChange={e => setBlogDrafts(prev => ({ ...prev, [post.id]: { ...draft, action_required: e.target.checked } }))} />
                                          Action required
                                        </label>
                                      </div>
                                    </div>
                                    <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                                      <button onClick={() => handleUpdateBlogPost(post.id)} className="btn btn-primary btn-small">💾 Save Changes</button>
                                      <button onClick={() => { setEditingBlogId(null); setBlogDrafts(prev => { const n = { ...prev }; delete n[post.id]; return n; }); }} className="btn btn-small btn-outline">Discard</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {activeAdminTab === 'admin-staff' && (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Staff Directory</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Manage church staff profiles displayed on the public Staff page.</p>
                        </div>
                        <button onClick={() => fetchStaffDirectory(true)} className="btn btn-outline btn-small" disabled={staffLoading}>
                          {staffLoading ? 'Loading�' : '? Refresh'}
                        </button>
                      </div>

                      {/* Add / Edit form */}
                      <form onSubmit={saveStaffRecord} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.95rem' }}>
                          {editingStaffId ? '?? Edit Staff Profile' : '? Add Staff Member'}
                        </h3>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group">
                            <label>User ID * <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.82rem' }}>(Django user ID)</span></label>
                            <input type="number" value={staffForm.user} onChange={e => setStaffForm(p => ({ ...p, user: e.target.value }))} placeholder="e.g. 1" required />
                          </div>
                          <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={staffForm.position} onChange={e => setStaffForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Lead Pastor" required />
                          </div>
                          <div className="form-group">
                            <label>Position *</label>
                            <input type="text" value={staffForm.position} onChange={e => setStaffForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Lead Pastor" required />
                          </div>
                          <div className="form-group">
                            <label>Department *</label>
                            <input type="text" value={staffForm.department} onChange={e => setStaffForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Pastoral" required />
                          </div>
                          <div className="form-group">
                            <label>Email *</label>
                            <input type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} required />
                          </div>
                          <div className="form-group">
                            <label>Phone</label>
                            <input type="text" value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. +256 700 000 000" />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Profile Photo</label>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              {/* Preview */}
                              <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                                background: staffForm.photo ? `url(${staffForm.photo}) center/cover` : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.6rem', color: 'rgba(255,255,255,0.6)',
                                border: '2px solid #e5e7eb',
                              }}>
                                {!staffForm.photo && '??'}
                              </div>
                              <div style={{ flex: 1, minWidth: '200px' }}>
                                {/* File upload */}
                                <label style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                  padding: '0.5rem 1rem', borderRadius: '8px',
                                  border: '1px dashed #1e3a8a', background: '#eff6ff',
                                  color: '#1e3a8a', fontWeight: 600, fontSize: '0.85rem',
                                  cursor: 'pointer', marginBottom: '0.5rem',
                                }}>
                                  ?? Choose Photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = ev => {
                                        setStaffForm(p => ({ ...p, photo: ev.target?.result as string }));
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                                {/* Or paste URL */}
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.35rem' }}>or paste a URL:</div>
                                <input
                                  type="text"
                                  value={staffForm.photo.startsWith('data:') ? '' : staffForm.photo}
                                  onChange={e => setStaffForm(p => ({ ...p, photo: e.target.value }))}
                                  placeholder="https://example.com/photo.jpg"
                                  style={{ width: '100%', fontSize: '0.85rem' }}
                                />
                                {staffForm.photo && (
                                  <button type="button" onClick={() => setStaffForm(p => ({ ...p, photo: '' }))}
                                    style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    ? Remove photo
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Display Order</label>
                            <input type="number" value={staffForm.order} onChange={e => setStaffForm(p => ({ ...p, order: e.target.value }))} min={0} placeholder="0" />
                          </div>
                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Bio *</label>
                            <textarea rows={3} value={staffForm.bio} onChange={e => setStaffForm(p => ({ ...p, bio: e.target.value }))} placeholder="Short biographical description�" required />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button type="submit" className="btn btn-primary">{editingStaffId ? 'Save Changes' : 'Add Staff Member'}</button>
                          {editingStaffId && (
                            <button type="button" className="btn btn-outline" onClick={() => { setEditingStaffId(null); setStaffForm({ user: '', position: '', department: '', bio: '', photo: '', email: '', phone: '', order: '0' }); }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>

                      {staffError && <div className="alert-danger" style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>{staffError}</div>}

                      {/* Staff cards grid */}
                      {staffLoading ? (
                        <p className="text-muted">Loading staff records�</p>
                      ) : staffDirectory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>?????</div>
                          <div style={{ fontWeight: 600 }}>No staff profiles yet.</div>
                          <div style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>Use the form above to add the first staff member.</div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                          {[...staffDirectory].sort((a, b) => a.order - b.order).map(member => (
                            <div key={member.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
                              {/* Photo */}
                              <div style={{ height: '120px', background: member.photo ? `url(${member.photo}) center/cover` : 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {!member.photo && (
                                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                                    {(member.name || member.position)[0]?.toUpperCase() ?? '?'}
                                  </div>
                                )}
                              </div>
                              {/* Info */}
                              <div style={{ padding: '0.85rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: '0.1rem' }}>{member.name || '�'}</div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a8a', marginBottom: '0.1rem' }}>{member.position}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem' }}>{member.department}</div>
                                {member.email && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>?? {member.email}</div>}
                                {member.phone && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>?? {member.phone}</div>}
                                <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: '0.5rem 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{member.bio}</p>
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem' }}>
                                  <button onClick={() => { setEditingStaffId(member.id); setStaffForm({ user: String(member.user), position: member.position, department: member.department, bio: member.bio, photo: member.photo, email: member.email, phone: member.phone, order: String(member.order) }); }} className="btn btn-small btn-outline" style={{ flex: 1, fontSize: '0.78rem' }}>?? Edit</button>
                                  <button onClick={() => removeStaffRecord(member.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>??</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Go Back To School Page Editor */}
                  {activeAdminTab === 'admin-go-back-to-school' && (
                    <div className="admin-tab-content active">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Go Back To School</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Edit the hero section, fundraising copy, and overall stats shown on the public Go Back To School page.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={handleResetGoBackToSchool} className="btn btn-outline btn-small">? Reset to Default</button>
                          <button onClick={handleSaveGoBackToSchool} className="btn btn-primary btn-small">?? Save Changes</button>
                        </div>
                      </div>

                      {goBackToSchoolError && (
                        <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>{goBackToSchoolError}</div>
                      )}

                      {/* Hero section */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.92rem' }}>?? Hero Section</h3>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group">
                            <label>Hero Title</label>
                            <input type="text" value={goBackToSchoolForm.hero_title} onChange={e => setGoBackToSchoolForm(p => ({ ...p, hero_title: e.target.value }))} placeholder="e.g. Go Back To School" />
                          </div>
                          <div className="form-group">
                            <label>Hero Subtitle</label>
                            <input type="text" value={goBackToSchoolForm.hero_subtitle} onChange={e => setGoBackToSchoolForm(p => ({ ...p, hero_subtitle: e.target.value }))} placeholder="e.g. Helping students return to school" />
                          </div>
                        </div>
                      </div>

                      {/* Fundraising section */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#059669', fontSize: '0.92rem' }}>?? Overall Fundraising</h3>
                        <div className="form-group">
                          <label>Fundraising Section Title</label>
                          <input type="text" value={goBackToSchoolForm.overall_fundraising_title} onChange={e => setGoBackToSchoolForm(p => ({ ...p, overall_fundraising_title: e.target.value }))} placeholder="e.g. Our Collective Impact" />
                        </div>
                        <div className="form-group">
                          <label>Fundraising Copy</label>
                          <textarea rows={3} value={goBackToSchoolForm.overall_fundraising_copy} onChange={e => setGoBackToSchoolForm(p => ({ ...p, overall_fundraising_copy: e.target.value }))} placeholder="Describe the fundraising effort�" />
                        </div>
                      </div>

                      {/* Overall stats */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#7c3aed', fontSize: '0.92rem' }}>?? Impact Stats</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                          {goBackToSchoolForm.overall_stats.map((stat, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.85rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Stat {i + 1}</div>
                              <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem' }}>Value</label>
                                <input type="text" value={stat.value} onChange={e => {
                                  const next = [...goBackToSchoolForm.overall_stats];
                                  next[i] = { ...next[i], value: e.target.value };
                                  setGoBackToSchoolForm(p => ({ ...p, overall_stats: next }));
                                }} placeholder="e.g. 150+" />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.8rem' }}>Label</label>
                                <input type="text" value={stat.label} onChange={e => {
                                  const next = [...goBackToSchoolForm.overall_stats];
                                  next[i] = { ...next[i], label: e.target.value };
                                  setGoBackToSchoolForm(p => ({ ...p, overall_stats: next }));
                                }} placeholder="e.g. Students Helped" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live preview */}
                      <div style={{ background: 'linear-gradient(135deg, #14532d, #166534)', borderRadius: '10px', padding: '1.5rem', color: '#fff' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(134,239,172,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Live Preview</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>{goBackToSchoolForm.hero_title || 'Hero Title'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: '1rem' }}>{goBackToSchoolForm.hero_subtitle || 'Hero subtitle�'}</div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                          {goBackToSchoolForm.overall_stats.map((stat, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#86efac' }}>{stat.value}</div>
                              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <button onClick={handleSaveGoBackToSchool} className="btn btn-primary">?? Save Changes</button>
                      </div>
                    </div>
                  )}

                  {/* Community Outreach Page Editor */}
                  {activeAdminTab === 'admin-community-outreach' && (
                    <div className="admin-tab-content active">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Community Outreach Page</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Edit the hero section and impact stats shown on the public Community Outreach page.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={handleResetCommunityOutreach} className="btn btn-outline btn-small">? Reset to Default</button>
                          <button onClick={handleSaveCommunityOutreach} className="btn btn-primary btn-small">?? Save Changes</button>
                        </div>
                      </div>

                      {communityOutreachError && (
                        <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>{communityOutreachError}</div>
                      )}

                      {/* Hero section editor */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.92rem' }}>?? Hero Section</h3>
                        <div className="grid grid-2 gap-2">
                          <div className="form-group">
                            <label>Hero Title</label>
                            <input type="text" value={communityOutreachForm.hero_title} onChange={e => setCommunityOutreachForm(p => ({ ...p, hero_title: e.target.value }))} placeholder="e.g. Reaching Our Community" />
                          </div>
                          <div className="form-group">
                            <label>Hero Subtitle</label>
                            <input type="text" value={communityOutreachForm.hero_subtitle} onChange={e => setCommunityOutreachForm(p => ({ ...p, hero_subtitle: e.target.value }))} placeholder="e.g. Through faith, service, and love" />
                          </div>
                        </div>
                      </div>

                      {/* Stats editor */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#1e3a8a', fontSize: '0.92rem' }}>?? Impact Stats</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                          {communityOutreachForm.stats.map((stat, i) => (
                            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.85rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Stat {i + 1}</div>
                              <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem' }}>Value</label>
                                <input type="text" value={stat.value} onChange={e => {
                                  const next = [...communityOutreachForm.stats];
                                  next[i] = { ...next[i], value: e.target.value };
                                  setCommunityOutreachForm(p => ({ ...p, stats: next }));
                                }} placeholder="e.g. 500+" />
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.8rem' }}>Label</label>
                                <input type="text" value={stat.label} onChange={e => {
                                  const next = [...communityOutreachForm.stats];
                                  next[i] = { ...next[i], label: e.target.value };
                                  setCommunityOutreachForm(p => ({ ...p, stats: next }));
                                }} placeholder="e.g. Families Served" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live preview bar */}
                      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: '10px', padding: '1.5rem', color: '#fff' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(212,175,55,0.85)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Live Preview</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', fontFamily: 'var(--font-serif)' }}>{communityOutreachForm.hero_title || 'Hero Title'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: '1rem' }}>{communityOutreachForm.hero_subtitle || 'Hero subtitle�'}</div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                          {communityOutreachForm.stats.map((stat, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D4AF37' }}>{stat.value}</div>
                              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <button onClick={handleSaveCommunityOutreach} className="btn btn-primary">?? Save Changes</button>
                      </div>
                    </div>
                  )}

                  {/* Hymns Library */}
                  {activeAdminTab === 'admin-hymns' && (
                    <div className="admin-tab-content active">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Hymns Library</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Manage hymn books and individual hymns available on the public Hymns page.</p>
                        </div>
                        <button onClick={fetchHymnsAdmin} className="btn btn-outline btn-small" disabled={hymnsLoading}>
                          {hymnsLoading ? 'Loading�' : '? Refresh'}
                        </button>
                      </div>

                      {hymnsError && <div className="alert-danger" style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>{hymnsError}</div>}

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #1e3a8a20' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1 }}>{hymnBooks.length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Hymn Books</div>
                        </div>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #05996920' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{hymns.length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Total Hymns</div>
                        </div>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#fffbeb', border: '1px solid #d9770620' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{hymnBooks.filter(b => b.is_featured).length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Featured Books</div>
                        </div>
                      </div>

                      <div className="grid grid-2 gap-3">
                        {/* Add Hymn Book */}
                        <form onSubmit={createHymnBook} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                          <h3 style={{ marginBottom: '0.75rem', color: '#1e3a8a', fontSize: '0.92rem' }}>?? New Hymn Book</h3>
                          <div className="form-group"><label>Title *</label><input type="text" value={newHymnBook.title} onChange={e => setNewHymnBook(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Seventh-day Adventist Hymnal" required /></div>
                          <div className="form-group"><label>Abbreviation *</label><input type="text" value={newHymnBook.abbreviation} onChange={e => setNewHymnBook(p => ({ ...p, abbreviation: e.target.value }))} placeholder="e.g. SDAH" required /></div>
                          <div className="form-group"><label>Publisher</label><input type="text" value={newHymnBook.publisher} onChange={e => setNewHymnBook(p => ({ ...p, publisher: e.target.value }))} placeholder="Review and Herald" /></div>
                          <div className="form-group"><label>Year</label><input type="number" value={newHymnBook.year} onChange={e => setNewHymnBook(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 1985" /></div>
                          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" id="hb-featured" checked={newHymnBook.is_featured} onChange={e => setNewHymnBook(p => ({ ...p, is_featured: e.target.checked }))} />
                            <label htmlFor="hb-featured" style={{ margin: 0, fontWeight: 500 }}>Featured book</label>
                          </div>
                          <button type="submit" className="btn btn-primary btn-small">Create Book</button>
                        </form>

                        {/* Add Hymn */}
                        <form onSubmit={createHymn} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                          <h3 style={{ marginBottom: '0.75rem', color: '#059669', fontSize: '0.92rem' }}>?? Add Hymn</h3>
                          <div className="form-group">
                            <label>Hymn Book *</label>
                            <select value={newHymn.hymn_book} onChange={e => setNewHymn(p => ({ ...p, hymn_book: e.target.value }))} required>
                              <option value="">� Select book �</option>
                              {hymnBooks.map(b => <option key={b.id} value={b.id}>{b.abbreviation} � {b.title}</option>)}
                            </select>
                          </div>
                          <div className="grid grid-2 gap-2" style={{ marginBottom: 0 }}>
                            <div className="form-group"><label>Number *</label><input type="number" value={newHymn.number} onChange={e => setNewHymn(p => ({ ...p, number: e.target.value }))} placeholder="e.g. 1" required /></div>
                            <div className="form-group"><label>Title *</label><input type="text" value={newHymn.title} onChange={e => setNewHymn(p => ({ ...p, title: e.target.value }))} placeholder="Hymn title" required /></div>
                          </div>
                          <div className="form-group"><label>Author</label><input type="text" value={newHymn.author} onChange={e => setNewHymn(p => ({ ...p, author: e.target.value }))} placeholder="e.g. Isaac Watts" /></div>
                          <div className="form-group"><label>Theme</label><input type="text" value={newHymn.theme} onChange={e => setNewHymn(p => ({ ...p, theme: e.target.value }))} placeholder="e.g. Praise, Worship" /></div>
                          <div className="form-group"><label>Lyrics *</label><textarea rows={3} value={newHymn.lyrics} onChange={e => setNewHymn(p => ({ ...p, lyrics: e.target.value }))} placeholder="Verse 1:&#10;..." required /></div>
                          <button type="submit" className="btn btn-primary btn-small" style={{ background: '#059669', borderColor: '#059669' }}>Add Hymn</button>
                        </form>
                      </div>

                      {/* Books list */}
                      {hymnBooks.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                          <h3 style={{ marginBottom: '0.75rem', color: '#1e3a8a', fontWeight: 700, fontSize: '0.92rem' }}>Hymn Books ({hymnBooks.length})</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {hymnBooks.map(book => {
                              const bookHymns = hymns.filter(h => h.hymn_book === book.id);
                              return (
                                <div key={book.id} style={{ border: '1px solid #e5e7eb', borderLeft: `4px solid #1e3a8a`, borderRadius: '10px', padding: '0.75rem 1rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                                      <strong style={{ fontSize: '0.92rem' }}>{book.title}</strong>
                                      <span style={{ padding: '0.15rem 0.45rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#eff6ff', color: '#1e3a8a' }}>{book.abbreviation}</span>
                                      {book.is_featured && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#fffbeb', color: '#d97706' }}>? Featured</span>}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                                      {book.publisher}{book.year ? ` � ${book.year}` : ''} � {bookHymns.length} hymns loaded
                                    </div>
                                  </div>
                                  <button onClick={() => setSelectedHymnBookId(book.id === selectedHymnBookId ? 'all' : book.id)} className="btn btn-small btn-outline" style={{ fontSize: '0.78rem' }}>
                                    {selectedHymnBookId === book.id ? 'Show All' : 'View Hymns'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Hymns table */}
                      {hymns.length > 0 && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <h3 style={{ marginBottom: '0.75rem', color: '#059669', fontWeight: 700, fontSize: '0.92rem' }}>
                            Hymns {selectedHymnBookId !== 'all' ? `� ${hymnBooks.find(b => b.id === selectedHymnBookId)?.abbreviation}` : '(All Books)'} ({selectedHymnBookId === 'all' ? hymns.length : hymns.filter(h => h.hymn_book === selectedHymnBookId).length})
                          </h3>
                          <div className="table-responsive">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Title</th>
                                  <th>Author</th>
                                  <th>Theme</th>
                                  <th>Book</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(selectedHymnBookId === 'all' ? hymns : hymns.filter(h => h.hymn_book === selectedHymnBookId))
                                  .sort((a, b) => a.number - b.number)
                                  .map(hymn => (
                                    <tr key={hymn.id}>
                                      <td style={{ color: '#9ca3af', fontSize: '0.82rem', fontWeight: 700 }}>{hymn.number}</td>
                                      <td><strong style={{ fontSize: '0.88rem' }}>{hymn.title}</strong></td>
                                      <td style={{ fontSize: '0.82rem' }}>{hymn.author || '�'}</td>
                                      <td style={{ fontSize: '0.82rem' }}>{hymn.theme || '�'}</td>
                                      <td><span className="badge" style={{ fontSize: '0.72rem' }}>{hymn.hymn_book_abbr || hymnBooks.find(b => b.id === hymn.hymn_book)?.abbreviation || '�'}</span></td>
                                      <td>
                                        <button onClick={() => removeHymn(hymn.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.78rem' }}>??</button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Forums Management */}
                  {activeAdminTab === 'admin-forums' && (
                    <div className="admin-tab-content active">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Forums</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Manage forum categories and moderate discussion threads.</p>
                        </div>
                        <button onClick={fetchForumsAdmin} className="btn btn-outline btn-small" disabled={forumsLoading}>
                          {forumsLoading ? 'Loading�' : '? Refresh'}
                        </button>
                      </div>

                      {forumsError && <div className="alert-danger" style={{ marginBottom: '0.75rem', fontSize: '0.88rem' }}>{forumsError}</div>}

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#eff6ff', border: '1px solid #1e3a8a20' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1 }}>{forumThreads.length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Total Threads</div>
                        </div>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#f5f3ff', border: '1px solid #7c3aed20' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>{forumThreads.filter(t => t.pinned).length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Pinned</div>
                        </div>
                        <div style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: '#fef9c3', border: '1px solid #d9770620' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{forumThreads.filter(t => t.closed).length}</div>
                          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Closed</div>
                        </div>
                      </div>

                      {/* New category form */}
                      <form onSubmit={createForumCategory} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '0.75rem', color: '#1e3a8a', fontSize: '0.92rem' }}>? New Category</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
                            <input type="text" value={newForumCategory.name} onChange={e => setNewForumCategory(p => ({ ...p, name: e.target.value }))} placeholder="Category name *" required />
                          </div>
                          <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                            <input type="text" value={newForumCategory.description} onChange={e => setNewForumCategory(p => ({ ...p, description: e.target.value }))} placeholder="Description *" required />
                          </div>
                          <button type="submit" className="btn btn-primary btn-small" style={{ alignSelf: 'flex-end' }}>Create</button>
                        </div>
                      </form>

                      {/* Threads table */}
                      <h3 style={{ marginBottom: '0.65rem', color: '#1e3a8a', fontWeight: 700, fontSize: '0.92rem' }}>Discussion Threads ({forumThreads.length})</h3>
                      {forumsLoading ? (
                        <p className="text-muted">Loading forums�</p>
                      ) : forumThreads.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '10px' }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>??</div>
                          <div style={{ fontWeight: 600 }}>No threads yet.</div>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Author</th>
                                <th>Posts</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {forumThreads.map(thread => (
                                <tr key={thread.id}>
                                  <td><strong style={{ fontSize: '0.88rem' }}>{thread.title}</strong></td>
                                  <td><span className="badge" style={{ fontSize: '0.72rem' }}>{thread.category_name || '�'}</span></td>
                                  <td style={{ fontSize: '0.84rem' }}>{thread.author_name || 'Anonymous'}</td>
                                  <td style={{ fontSize: '0.84rem' }}>{thread.post_count ?? 0}</td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                      {thread.pinned && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed' }}>?? Pinned</span>}
                                      {thread.closed && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#fef9c3', color: '#d97706' }}>?? Closed</span>}
                                      {!thread.pinned && !thread.closed && <span style={{ padding: '0.15rem 0.45rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, background: '#ecfdf5', color: '#059669' }}>Open</span>}
                                    </div>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                      <button onClick={() => updateForumThreadState(thread, { pinned: !thread.pinned })} className="btn btn-small btn-outline" style={{ fontSize: '0.75rem' }}>
                                        {thread.pinned ? 'Unpin' : '?? Pin'}
                                      </button>
                                      <button onClick={() => updateForumThreadState(thread, { closed: !thread.closed })} className="btn btn-small btn-outline" style={{ fontSize: '0.75rem', color: thread.closed ? '#059669' : '#d97706' }}>
                                        {thread.closed ? 'Reopen' : '?? Close'}
                                      </button>
                                      <button onClick={() => removeForumThread(thread.id)} className="btn btn-small btn-outline" style={{ color: '#dc2626', fontSize: '0.75rem' }}>??</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Audit Trail */}
                  {activeAdminTab === 'admin-audit' && (
                    <div className="admin-tab-content active">
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div>
                          <h2 style={{ marginBottom: '0.2rem' }}>Audit Trail</h2>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>Track all staff actions across managed resources for accountability.</p>
                        </div>
                        <button onClick={() => fetchAdminAuditLogs()} className="btn btn-outline btn-small" disabled={adminAuditLoading}>
                          {adminAuditLoading ? '? Loading�' : '? Refresh Logs'}
                        </button>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total Entries', value: adminAuditEntries.length, color: '#1e3a8a', bg: '#eff6ff' },
                          { label: 'Creates', value: adminAuditEntries.filter(e => e.action === 'create').length, color: '#059669', bg: '#ecfdf5' },
                          { label: 'Updates', value: adminAuditEntries.filter(e => e.action === 'update').length, color: '#0891b2', bg: '#ecfeff' },
                          { label: 'Deletes', value: adminAuditEntries.filter(e => e.action === 'delete').length, color: '#dc2626', bg: '#fef2f2' },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} style={{ padding: '0.75rem 1.1rem', borderRadius: '10px', background: bg, border: `1px solid ${color}20`, minWidth: '110px' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Filters */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {(['all', 'create', 'update', 'delete'] as AdminAuditActionFilter[]).map(f => (
                              <button key={f} onClick={() => setAdminAuditActionFilter(f)} style={{
                                padding: '0.3rem 0.65rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                border: `1px solid ${adminAuditActionFilter === f ? '#1e3a8a' : '#e5e7eb'}`,
                                background: adminAuditActionFilter === f ? '#1e3a8a' : '#fff',
                                color: adminAuditActionFilter === f ? '#fff' : '#374151',
                              }}>
                                {f === 'all' ? 'All Actions' : f.charAt(0).toUpperCase() + f.slice(1)}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                            <input type="text" value={adminAuditResourceFilter} onChange={e => setAdminAuditResourceFilter(e.target.value)}
                              placeholder="Filter by resource type�"
                              style={{ height: '34px', padding: '0 0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', width: '200px' }}
                            />
                            <button onClick={() => fetchAdminAuditLogs(adminAuditActionFilter, adminAuditResourceFilter)} className="btn btn-primary btn-small" disabled={adminAuditLoading}>
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>

                      {adminAuditError && (
                        <div className="alert-danger" style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>{adminAuditError}</div>
                      )}

                      {/* Table */}
                      <div className="table-responsive">
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
                              <tr><td colSpan={5} className="text-center" style={{ padding: '2rem', color: '#9ca3af' }}>Loading audit logs�</td></tr>
                            ) : adminAuditEntries.length === 0 ? (
                              <tr><td colSpan={5} className="text-center" style={{ padding: '2rem', color: '#9ca3af' }}>No audit entries found for current filters.</td></tr>
                            ) : (
                              adminAuditEntries.map(entry => {
                                const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
                                  create: { bg: '#ecfdf5', color: '#059669' },
                                  update: { bg: '#ecfeff', color: '#0891b2' },
                                  delete: { bg: '#fef2f2', color: '#dc2626' },
                                };
                                const style = ACTION_STYLE[entry.action] ?? { bg: '#f3f4f6', color: '#6b7280' };
                                return (
                                  <tr key={entry.id}>
                                    <td style={{ fontSize: '0.82rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(entry.created_at).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{entry.actor_username || 'System'}</td>
                                    <td>
                                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: style.bg, color: style.color }}>
                                        {entry.action.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.84rem' }}>{entry.resource_type} <span style={{ color: '#9ca3af' }}>#{entry.resource_id || '�'}</span></td>
                                    <td style={{ fontSize: '0.84rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.resource_label || '�'}</td>
                                  </tr>
                                );
                              })
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
              <div className="form-group">
                <label>YouTube Video ID <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.85rem' }}>(optional � for Watch Online button)</span></label>
                <input
                  type="text"
                  value={addSermonForm.youtube_id || ''}
                  onChange={(e) => setAddSermonForm({ ...addSermonForm, youtube_id: e.target.value })}
                  placeholder="e.g. dQw4w9WgXcQ (from youtube.com/watch?v=...)"
                />
                {addSermonForm.youtube_id ? (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#059669' }}>
                    Link: <a href={'https://youtube.com/watch?v=' + addSermonForm.youtube_id} target="_blank" rel="noopener noreferrer">{'https://youtube.com/watch?v=' + addSermonForm.youtube_id}</a>
                  </div>
                ) : null}
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
