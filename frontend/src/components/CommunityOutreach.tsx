import { useEffect, useState, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Hand, Smile, Phone, Mail, MapPin, Calendar, Clock, ChevronRight, CheckCircle, Star, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export type OutreachProgramIconName = 'heart' | 'users' | 'hand' | 'smile' | 'star' | 'calendar';

export interface CommunityOutreachProgram {
  id: number;
  icon: OutreachProgramIconName;
  color: string;
  gradient: string;
  title: string;
  tagline: string;
  description: string;
  activities: string[];
  schedule: string;
}

export interface CommunityOutreachStat {
  value: string;
  label: string;
}

export interface CommunityOutreachVisit {
  date: string;
  program: string;
  location: string;
  time: string;
  spots: number;
}

export interface CommunityOutreachTestimonial {
  quote: string;
  name: string;
  tag: string;
}

export interface CommunityOutreachContactPoint {
  icon: 'phone' | 'mail' | 'map-pin';
  label: string;
  href: string;
}

export interface CommunityOutreachPageContent {
  page_key?: string;
  hero_title: string;
  hero_subtitle: string;
  stats: CommunityOutreachStat[];
  programs: CommunityOutreachProgram[];
  upcoming_visits: CommunityOutreachVisit[];
  testimonials: CommunityOutreachTestimonial[];
  contact_points: CommunityOutreachContactPoint[];
}

const PROGRAM_ICON_MAP: Record<OutreachProgramIconName, ComponentType<{ size?: number }>> = {
  heart: Heart,
  users: Users,
  hand: Hand,
  smile: Smile,
  star: Star,
  calendar: Calendar,
};

const CONTACT_ICON_MAP: Record<CommunityOutreachContactPoint['icon'], ComponentType<{ size?: number }>> = {
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
};

export const DEFAULT_COMMUNITY_OUTREACH_CONTENT: CommunityOutreachPageContent = {
  hero_title: 'Community Outreach',
  hero_subtitle: 'We visit the sick, comfort the grieving, and stand beside those in crisis — because love is not just a feeling, it is an action.',
  stats: [
    { value: '120+', label: 'Hospital Visits / Year' },
    { value: '6', label: 'Active Programs' },
    { value: '80+', label: 'Volunteers' },
    { value: '7 days', label: 'Response Time' },
  ],
  programs: [
    {
      id: 1,
      icon: 'heart',
      color: '#EF4444',
      gradient: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
      title: 'Hospital Visitation',
      tagline: 'No one should face illness alone',
      description: 'Our dedicated teams visit patients in local hospitals and clinics every week, bringing prayer, fellowship, and comfort packages to those who need encouragement most.',
      activities: [
        'Weekly ward visits with the pastoral team',
        'Prayer and one-on-one spiritual counsel',
        'Care packages — fruit, devotional books, hygiene kits',
        'Updates and follow-up for long-term patients',
        'Coordination with hospital chaplaincy',
      ],
      schedule: 'Every Tuesday & Thursday',
    },
    {
      id: 2,
      icon: 'users',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
      title: 'Grief & Bereavement Support',
      tagline: 'Walking beside the mourning',
      description: 'Loss is one of life\'s hardest experiences. Our grief team stands with families through the darkest moments — from the first news of death to the long road of healing.',
      activities: [
        'Funeral preparation and coordination support',
        'Memorial service assistance and logistics',
        'Grief counseling and referrals to professionals',
        'Meal trains and household support during mourning',
        'Long-term follow-up pastoral care',
      ],
      schedule: 'As needed — 24/7 availability',
    },
    {
      id: 3,
      icon: 'hand',
      color: '#0EA5E9',
      gradient: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
      title: 'Home Care Assistance',
      tagline: 'Practical love at your doorstep',
      description: 'For the elderly, recovering, or homebound members of our community, we show up with practical help. Our volunteers provide personal assistance, meals, and meaningful companionship.',
      activities: [
        'Meal preparation and home delivery',
        'Household chores and errands',
        'Medication reminders and transport to appointments',
        'Weekly companionship visits',
        'Technology assistance for elderly members',
      ],
      schedule: 'Wednesdays & Saturdays',
    },
    {
      id: 4,
      icon: 'smile',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
      title: 'Crisis & Community Aid',
      tagline: 'A lifeline in times of crisis',
      description: 'Life can change in an instant. Whether it is job loss, eviction, or a sudden family emergency — our crisis team mobilizes quickly to provide both spiritual and material support.',
      activities: [
        'Emergency financial aid referrals',
        'Food and essential supplies distribution',
        'Job placement and CV writing workshops',
        'Mental health first aid and referrals',
        'School fees assistance for affected children',
      ],
      schedule: 'Ongoing — apply anytime',
    },
    {
      id: 5,
      icon: 'star',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
      title: 'Prison & Rehabilitation Ministry',
      tagline: 'Grace reaches behind every wall',
      description: 'Every person deserves to hear the message of redemption. Our team conducts regular visits to correctional facilities, sharing the Word and offering skills training programs.',
      activities: [
        'Monthly worship services inside facilities',
        'Bible study groups and devotional materials',
        'Skills workshops — carpentry, tailoring, computing',
        'Reintegration mentoring upon release',
        'Family reunion and reconciliation support',
      ],
      schedule: 'First Saturday of every month',
    },
    {
      id: 6,
      icon: 'calendar',
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
      title: 'Youth & Widows Welfare',
      tagline: 'Honoring the forgotten and the young',
      description: 'We run dedicated programs for widows and orphaned or vulnerable youth in our community — ensuring they feel seen, valued, and supported with practical and spiritual care.',
      activities: [
        'Monthly welfare packages for widows',
        'School fees assistance for orphaned children',
        'Skills training and income-generation workshops',
        'Holiday programs and youth mentoring',
        'Social connections and community integration',
      ],
      schedule: 'Every last Friday of the month',
    },
  ],
  upcoming_visits: [
    { date: 'Tue, Jul 22', program: 'Hospital Visitation', location: 'Kampala International Hospital', time: '10:00 AM', spots: 4 },
    { date: 'Wed, Jul 23', program: 'Home Care Assistance', location: 'Gayaza Road Area', time: '2:00 PM', spots: 2 },
    { date: 'Sat, Jul 26', program: 'Crisis Aid Distribution', location: 'SIC Church Grounds', time: '9:00 AM', spots: 8 },
    { date: 'Sat, Aug 2', program: 'Prison Ministry', location: 'Luzira Correctional Facility', time: '10:00 AM', spots: 6 },
  ],
  testimonials: [
    {
      quote: 'When my husband passed, I didn\'t know how to cope. The church team came every day for two weeks. I have never felt so supported in my life.',
      name: 'Community Member',
      tag: 'Grief Support Recipient',
    },
    {
      quote: 'After my surgery, volunteers brought me food and company every Wednesday. It meant the world to me. I didn\'t feel like a burden anymore.',
      name: 'Church Family Member',
      tag: 'Home Care Recipient',
    },
    {
      quote: 'The team visited our ward and prayed with us. That prayer gave me strength I cannot explain. I was discharged three days later.',
      name: 'Hospital Patient',
      tag: 'Hospital Visitation Recipient',
    },
  ],
  contact_points: [
    { icon: 'phone', label: '+256 700 000 000', href: 'tel:+256700000000' },
    { icon: 'mail', label: 'outreach@sic.ug', href: 'mailto:outreach@sic.ug' },
    { icon: 'map-pin', label: 'SIC Chapel, Bugema University', href: '#' },
  ],
};

const normalizeCommunityOutreachPage = (raw: any): CommunityOutreachPageContent | null => {
  const source = raw && typeof raw === 'object' ? (raw.content && typeof raw.content === 'object' ? raw.content : raw) : null;
  if (!source) {
    return null;
  }

  return {
    page_key: typeof source.page_key === 'string' ? source.page_key : DEFAULT_COMMUNITY_OUTREACH_CONTENT.page_key,
    hero_title: typeof source.hero_title === 'string' ? source.hero_title : DEFAULT_COMMUNITY_OUTREACH_CONTENT.hero_title,
    hero_subtitle: typeof source.hero_subtitle === 'string' ? source.hero_subtitle : DEFAULT_COMMUNITY_OUTREACH_CONTENT.hero_subtitle,
    stats: Array.isArray(source.stats) && source.stats.length > 0 ? source.stats : DEFAULT_COMMUNITY_OUTREACH_CONTENT.stats,
    programs: Array.isArray(source.programs) && source.programs.length > 0 ? source.programs : DEFAULT_COMMUNITY_OUTREACH_CONTENT.programs,
    upcoming_visits: Array.isArray(source.upcoming_visits) && source.upcoming_visits.length > 0 ? source.upcoming_visits : DEFAULT_COMMUNITY_OUTREACH_CONTENT.upcoming_visits,
    testimonials: Array.isArray(source.testimonials) && source.testimonials.length > 0 ? source.testimonials : DEFAULT_COMMUNITY_OUTREACH_CONTENT.testimonials,
    contact_points: Array.isArray(source.contact_points) && source.contact_points.length > 0 ? source.contact_points : DEFAULT_COMMUNITY_OUTREACH_CONTENT.contact_points,
  };
};

export const CommunityOutreach: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'volunteer' | 'help'>('volunteer');
  const [volunteerForm, setVolunteerForm] = useState({ name: '', email: '', phone: '', program: '', availability: '', message: '' });
  const [helpForm, setHelpForm] = useState({ name: '', phone: '', need: '', urgency: 'normal', details: '' });
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false);
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const [content, setContent] = useState<CommunityOutreachPageContent>(DEFAULT_COMMUNITY_OUTREACH_CONTENT);

  useEffect(() => {
    const loadCommunityOutreach = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/community-outreach/`);
        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : (payload?.results ?? []);
        const nextContent = normalizeCommunityOutreachPage(items[0]);
        if (nextContent) {
          setContent(nextContent);
        }
      } catch {
        setContent(DEFAULT_COMMUNITY_OUTREACH_CONTENT);
      }
    };

    loadCommunityOutreach();
  }, []);

  return (
    <div>
      {/* Hero */}
      <motion.div className="page-header" variants={fadeUp} initial="hidden" animate="visible"
        style={{ paddingBottom: '3rem' }}>
        <div className="container text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              width: '72px', height: '72px', borderRadius: '20px',
              background: 'rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
            <Hand size={38} color="var(--accent)" />
          </motion.div>
          <h1 style={{ marginBottom: '0.75rem' }}>{content.hero_title}</h1>
          <p style={{ fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 2.5rem', color: 'rgba(255,255,255,0.85)' }}>
            {content.hero_subtitle}
          </p>

          {/* Impact Stats */}
          <motion.div
            variants={staggerContainer} initial="hidden" animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '700px', margin: '0 auto' }}>
            {content.stats.map((s, i) => (
              <motion.div key={i} variants={staggerItem}
                style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '14px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' }}>{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="section-padding">
        <div className="container">

          {/* Programs */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3.5rem' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '0.5rem' }}>Our 6 Outreach Programs</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '2.5rem' }}>Click any program to see what we do</p>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }}
            >
              {content.programs.map(prog => {
                const ProgramIcon = PROGRAM_ICON_MAP[prog.icon] ?? Hand;
                return (
                <motion.div key={prog.id} variants={staggerItem} whileHover={{ y: -6 }}
                  onClick={() => setExpandedId(expandedId === prog.id ? null : prog.id)}
                  style={{ cursor: 'pointer', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', background: 'white' }}>

                  {/* Colored Header Band */}
                  <div style={{
                    background: prog.gradient, padding: '1.5rem 1.5rem 1rem',
                    borderBottom: `3px solid ${prog.color}30`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: prog.color, boxShadow: `0 4px 12px ${prog.color}30`
                      }}>
                        <ProgramIcon size={30} />
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: '700', color: prog.color,
                        background: 'white', padding: '0.25rem 0.7rem', borderRadius: '999px',
                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <Clock size={11} /> {prog.schedule}
                      </span>
                    </div>
                    <h3 style={{ color: '#1e293b', marginTop: '0.75rem', marginBottom: '0.25rem', fontSize: '1.05rem' }}>{prog.title}</h3>
                    <p style={{ color: prog.color, fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>{prog.tagline}</p>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    <p style={{ color: '#555', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>{prog.description}</p>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: prog.color, fontWeight: '600', fontSize: '0.88rem', padding: 0
                    }}>
                      {expandedId === prog.id ? 'Hide details' : 'See what we do'}
                      <ChevronRight size={16} style={{ transform: expandedId === prog.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    <AnimatePresence>
                      {expandedId === prog.id && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ listStyle: 'none', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}
                        >
                          {prog.activities.map((act, i) => (
                            <li key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.6rem', alignItems: 'flex-start' }}>
                              <CheckCircle size={16} color={prog.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span style={{ color: '#444', fontSize: '0.9rem' }}>{act}</span>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );})}
            </motion.div>
          </motion.div>

          {/* Upcoming Visits */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3.5rem' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.03), rgba(212,175,55,0.05))' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                <Calendar size={22} color="var(--accent)" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Upcoming Outreach Visits
              </h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Join us on one of these scheduled visits — sign up below</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {content.upcoming_visits.map((visit, i) => (
                  <motion.div key={i}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '110px 1fr auto',
                      alignItems: 'center', gap: '1rem',
                      background: 'white', padding: '1rem 1.5rem',
                      borderRadius: '12px', borderLeft: '4px solid var(--accent)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{visit.date}</div>
                      <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.2rem' }}>{visit.time}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.95rem' }}>{visit.program}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#888', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        <MapPin size={12} /> {visit.location}
                      </div>
                    </div>
                    <div style={{
                      background: visit.spots <= 3 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      color: visit.spots <= 3 ? '#DC2626' : '#16A34A',
                      fontWeight: '700', fontSize: '0.78rem',
                      padding: '0.3rem 0.75rem', borderRadius: '999px', textAlign: 'center', minWidth: '70px'
                    }}>
                      {visit.spots} spots
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3.5rem' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '0.5rem' }}>What People Say</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>Stories from those we have served</p>

            <motion.div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            >
              {content.testimonials.map((t, i) => (
                <motion.div key={i} variants={staggerItem}
                  style={{
                    padding: '1.75rem', background: 'white', borderRadius: '18px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                    borderTop: '4px solid var(--accent)', position: 'relative'
                  }}>
                  <div style={{ fontSize: '2.5rem', color: 'var(--accent)', lineHeight: 1, marginBottom: '0.5rem', fontFamily: 'Georgia, serif' }}>"</div>
                  <p style={{ color: '#444', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                    {t.quote}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.9rem', fontWeight: '700', flexShrink: 0
                    }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem' }}>{t.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: '600' }}>{t.tag}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Action Forms */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3rem' }}>
            <div className="card" style={{ maxWidth: '720px', margin: '0 auto' }}>
              <h2 style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '0.5rem' }}>Get Involved</h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>Volunteer your time or request support from our team</p>

              {/* Tab Toggle */}
              <div style={{ display: 'flex', background: '#f8f8f8', borderRadius: '12px', padding: '4px', marginBottom: '2rem' }}>
                {(['volunteer', 'help'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '0.65rem', border: 'none', cursor: 'pointer',
                      borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
                      background: activeTab === tab ? 'white' : 'transparent',
                      color: activeTab === tab ? 'var(--primary)' : '#888',
                      boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}>
                    {tab === 'volunteer' ? 'Volunteer With Us' : 'Request Help'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'volunteer' ? (
                  <motion.div key="volunteer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {volunteerSubmitted ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center', padding: '2rem', background: 'rgba(34,197,94,0.08)', borderRadius: '14px', border: '2px solid rgba(34,197,94,0.25)' }}>
                        <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <h3 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Thank You for Volunteering!</h3>
                        <p style={{ color: '#555' }}>Our outreach coordinator will contact you at <strong>{volunteerForm.phone}</strong> within 48 hours to get you started.</p>
                      </motion.div>
                    ) : (
                      <form onSubmit={e => { e.preventDefault(); setVolunteerSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Full Name *</label>
                            <input required type="text" placeholder="Your name" value={volunteerForm.name}
                              onChange={e => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Phone *</label>
                            <input required type="tel" placeholder="+256 7xx xxx xxx" value={volunteerForm.phone}
                              onChange={e => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Email</label>
                          <input type="email" placeholder="your@email.com" value={volunteerForm.email}
                            onChange={e => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                            style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Preferred Program *</label>
                            <select required value={volunteerForm.program} onChange={e => setVolunteerForm({ ...volunteerForm, program: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', background: 'white', boxSizing: 'border-box' }}>
                              <option value="">Select a program</option>
                              {content.programs.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                              <option value="Any">Any / Open to All</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Availability *</label>
                            <select required value={volunteerForm.availability} onChange={e => setVolunteerForm({ ...volunteerForm, availability: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', background: 'white', boxSizing: 'border-box' }}>
                              <option value="">Select days</option>
                              <option>Weekdays only</option>
                              <option>Weekends only</option>
                              <option>Any day</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Why do you want to serve?</label>
                          <textarea rows={3} placeholder="Tell us about yourself and your motivation..." value={volunteerForm.message}
                            onChange={e => setVolunteerForm({ ...volunteerForm, message: e.target.value })}
                            style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                        <button type="submit" className="btn-accent" style={{ padding: '1rem', fontWeight: '700', fontSize: '1rem', marginTop: '0.25rem' }}>
                          Sign Up as Volunteer
                        </button>
                      </form>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="help" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {helpSubmitted ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center', padding: '2rem', background: 'rgba(139,92,246,0.07)', borderRadius: '14px', border: '2px solid rgba(139,92,246,0.2)' }}>
                        <Heart size={48} color="#8B5CF6" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <h3 style={{ color: '#7C3AED', marginBottom: '0.5rem' }}>Your Request Has Been Received</h3>
                        <p style={{ color: '#555' }}>A member of our pastoral team will reach out to you within <strong>24 hours</strong>. You are not alone.</p>
                      </motion.div>
                    ) : (
                      <form onSubmit={e => { e.preventDefault(); setHelpSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                          background: 'rgba(239,68,68,0.06)', padding: '0.9rem 1rem',
                          borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                          <p style={{ color: '#555', fontSize: '0.85rem', margin: 0 }}>
                            Your identity and request are kept strictly confidential. Only the pastoral team will see this information.
                          </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Your Name *</label>
                            <input required type="text" placeholder="Your name" value={helpForm.name}
                              onChange={e => setHelpForm({ ...helpForm, name: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Phone *</label>
                            <input required type="tel" placeholder="+256 7xx xxx xxx" value={helpForm.phone}
                              onChange={e => setHelpForm({ ...helpForm, phone: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Type of Need *</label>
                            <select required value={helpForm.need} onChange={e => setHelpForm({ ...helpForm, need: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', background: 'white', boxSizing: 'border-box' }}>
                              <option value="">Select type</option>
                              <option>Hospital Visitation</option>
                              <option>Grief Support</option>
                              <option>Home Care Assistance</option>
                              <option>Crisis Aid</option>
                              <option>Youth or Widow Welfare</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Urgency</label>
                            <select value={helpForm.urgency} onChange={e => setHelpForm({ ...helpForm, urgency: e.target.value })}
                              style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', background: 'white', boxSizing: 'border-box' }}>
                              <option value="normal">Normal — within a week</option>
                              <option value="soon">Soon — within 2-3 days</option>
                              <option value="urgent">Urgent — today or tomorrow</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Tell us more *</label>
                          <textarea required rows={4} placeholder="Please describe the situation so we can send the right team..." value={helpForm.details}
                            onChange={e => setHelpForm({ ...helpForm, details: e.target.value })}
                            style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                        <button type="submit" style={{
                          padding: '1rem', fontWeight: '700', fontSize: '1rem', marginTop: '0.25rem',
                          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                          color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer'
                        }}>
                          Submit Help Request
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Emergency Banner */}
          <motion.div className="dark-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>24/7 Emergency Pastoral Line</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                If someone is critically ill, in immediate crisis, or has just suffered a bereavement — do not wait. Call us now.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
                {content.contact_points.map((c, i) => {
                  const ContactIcon = CONTACT_ICON_MAP[c.icon] ?? MapPin;
                  return (
                  <a key={i} href={c.href}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.6rem', color: 'white', textDecoration: 'none', fontSize: '0.9rem',
                      padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px', transition: 'background 0.2s'
                    }}>
                    <span style={{ color: 'var(--accent)' }}><ContactIcon size={20} /></span>
                    {c.label}
                  </a>
                  );
                })}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
