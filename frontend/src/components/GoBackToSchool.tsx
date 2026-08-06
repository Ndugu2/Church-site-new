import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Heart, Users, DollarSign, Target, Gift, Phone, Mail, MapPin, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface StudentCase {
  id: number;
  caseRef: string;
  level: string;
  need: string;
  needed: number;
  raised: number;
  urgent: boolean;
}

interface DonationWay {
  icon: 'DollarSign' | 'Heart' | 'Gift' | 'Users';
  title: string;
  description: string;
  highlight: string;
}

interface ImpactLevel {
  amount: string;
  impact: string;
}

interface ContactPoint {
  icon: 'Phone' | 'Mail' | 'MapPin';
  label: string;
}

export interface GoBackToSchoolPageContent {
  hero_title: string;
  hero_subtitle: string;
  overall_fundraising_title: string;
  overall_fundraising_copy: string;
  overall_stats: Array<{ value: string; label: string }>;
  student_cases: StudentCase[];
  ways_to_give: DonationWay[];
  impact_levels: ImpactLevel[];
  contact_points: ContactPoint[];
}

interface GoBackToSchoolProps {
  onSelectDonationOption?: (option: DonationWay) => void;
}

const studentCases: StudentCase[] = [
  {
    id: 1,
    caseRef: 'Case #GBS-001',
    level: 'Senior 4 (O-Level)',
    need: 'Full term fees — family lost primary income source',
    needed: 450000,
    raised: 210000,
    urgent: true
  },
  {
    id: 2,
    caseRef: 'Case #GBS-002',
    level: 'Primary 7',
    need: 'School fees, uniform & textbooks for PLE year',
    needed: 180000,
    raised: 95000,
    urgent: true
  },
  {
    id: 3,
    caseRef: 'Case #GBS-003',
    level: 'Senior 2',
    need: 'Re-enrollment fees after family displacement',
    needed: 320000,
    raised: 80000,
    urgent: false
  },
  {
    id: 4,
    caseRef: 'Case #GBS-004',
    level: 'University Year 1',
    need: 'First-semester tuition — first in family to reach university',
    needed: 900000,
    raised: 350000,
    urgent: false
  }
];

const waysToDonate = [
  {
    icon: 'DollarSign' as const,
    title: 'One-Time Gift',
    description: 'Make a single contribution of any amount. Every shilling directly helps a student stay in school.',
    highlight: 'As low as UGX 5,000'
  },
  {
    icon: 'Heart' as const,
    title: 'Monthly Sponsor',
    description: 'Commit to supporting a student throughout a full term or school year with a recurring monthly pledge.',
    highlight: 'UGX 30,000/month'
  },
  {
    icon: 'Gift' as const,
    title: 'Supplies Drive',
    description: 'Donate physical items — exercise books, pens, uniforms, school bags — dropped off at our church office.',
    highlight: 'Drop off anytime'
  },
  {
    icon: 'Users' as const,
    title: 'Sponsor a Student',
    description: 'Cover the full cost for a specific student on our list. Receive updates on their progress throughout the year.',
    highlight: 'Full sponsorship'
  }
];

const impactLevels = [
  { amount: '5,000', impact: 'Buys a full set of exercise books for one student' },
  { amount: '20,000', impact: 'Covers one month of school lunch fees' },
  { amount: '50,000', impact: 'Pays for one subject exam registration' },
  { amount: '150,000', impact: 'Covers a full term of primary school fees' },
  { amount: '450,000', impact: 'Sponsors a student through an entire secondary school term' },
  { amount: '900,000', impact: 'Covers one full semester of university tuition' }
];

export const DEFAULT_GO_BACK_TO_SCHOOL_CONTENT: GoBackToSchoolPageContent = {
  hero_title: 'Go Back to School Project',
  hero_subtitle: 'Volunteers like you are the reason children go back to class',
  overall_fundraising_title: 'Current Fundraising Campaign',
  overall_fundraising_copy: 'We are raising funds for 4 students this term. Every contribution goes 100% directly to a student\'s education.',
  overall_stats: [
    { value: '4', label: 'Students Waiting' },
    { value: '0%', label: 'Goal Reached' },
    { value: '0 fees', label: 'Admin Cost' },
  ],
  student_cases: studentCases,
  ways_to_give: waysToDonate,
  impact_levels: impactLevels,
  contact_points: [
    { icon: 'Phone', label: '+256 700 000 000' },
    { icon: 'Mail', label: 'gobacktoschool@sic.ug' },
    { icon: 'MapPin', label: 'SIC Office, Bugema University' },
  ],
};

const ICON_MAP = {
  DollarSign,
  Heart,
  Gift,
  Users,
  Phone,
  Mail,
  MapPin,
} as const;

const normalizeGoBackToSchoolPage = (raw: any): GoBackToSchoolPageContent | null => {
  const source = raw && typeof raw === 'object' ? (raw.content && typeof raw.content === 'object' ? raw.content : raw) : null;
  if (!source) return null;

  return {
    hero_title: typeof source.hero_title === 'string' ? source.hero_title : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.hero_title,
    hero_subtitle: typeof source.hero_subtitle === 'string' ? source.hero_subtitle : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.hero_subtitle,
    overall_fundraising_title: typeof source.overall_fundraising_title === 'string' ? source.overall_fundraising_title : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_fundraising_title,
    overall_fundraising_copy: typeof source.overall_fundraising_copy === 'string' ? source.overall_fundraising_copy : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_fundraising_copy,
    overall_stats: Array.isArray(source.overall_stats) && source.overall_stats.length > 0 ? source.overall_stats : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.overall_stats,
    student_cases: Array.isArray(source.student_cases) && source.student_cases.length > 0 ? source.student_cases : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.student_cases,
    ways_to_give: Array.isArray(source.ways_to_give) && source.ways_to_give.length > 0 ? source.ways_to_give : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.ways_to_give,
    impact_levels: Array.isArray(source.impact_levels) && source.impact_levels.length > 0 ? source.impact_levels : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.impact_levels,
    contact_points: Array.isArray(source.contact_points) && source.contact_points.length > 0 ? source.contact_points : DEFAULT_GO_BACK_TO_SCHOOL_CONTENT.contact_points,
  };
};

const formatUGX = (amount: number) =>
  'UGX ' + amount.toLocaleString('en-UG');

const progressPercent = (raised: number, needed: number) =>
  Math.min(Math.round((raised / needed) * 100), 100);

export const GoBackToSchool: React.FC<GoBackToSchoolProps> = ({ onSelectDonationOption }) => {
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [donateForm, setDonateForm] = useState({ name: '', email: '', phone: '', amount: '', type: 'one-time', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [content, setContent] = useState<GoBackToSchoolPageContent>(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/go-back-to-school/`);
        if (!response.ok) return;

        const payload = await response.json();
        const records = Array.isArray(payload) ? payload : (payload?.results ?? []);
        const firstRecord = normalizeGoBackToSchoolPage(records[0]);
        if (firstRecord) {
          setContent(firstRecord);
        }
      } catch {
        setContent(DEFAULT_GO_BACK_TO_SCHOOL_CONTENT);
      }
    };

    loadPage();
  }, []);

  const totalNeeded = content.student_cases.reduce((s, c) => s + c.needed, 0);
  const totalRaised = content.student_cases.reduce((s, c) => s + c.raised, 0);
  const overallPercent = progressPercent(totalRaised, totalNeeded);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      {/* Page Header */}
      <motion.div className="page-header" variants={fadeUp} initial="hidden" animate="visible">
        <div className="container text-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <BookOpen size={40} color="var(--accent)" />
            <h1>{content.hero_title}</h1>
          </div>
          <p>{content.hero_subtitle}</p>
        </div>
      </motion.div>

      <div className="section-padding">
        <div className="container">

          {/* Overall Fundraising Progress */}
          <motion.div
            className="card"
            style={{ maxWidth: '800px', margin: '0 auto 3rem', textAlign: 'center' }}
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <Target size={36} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{content.overall_fundraising_title}</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              {content.overall_fundraising_copy}
            </p>

            <div style={{ background: '#f0f0f0', borderRadius: '999px', height: '18px', marginBottom: '1rem', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${overallPercent}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                viewport={{ once: true }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  borderRadius: '999px'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.9rem', color: '#888' }}>
              <span><strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{formatUGX(totalRaised)}</strong> raised</span>
              <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{overallPercent}% funded</span>
              <span>Goal: <strong>{formatUGX(totalNeeded)}</strong></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {content.overall_stats.map((stat, i) => (
                <div key={i} style={{ padding: '1rem', background: 'rgba(212,175,55,0.08)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent)' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Student Cases */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3rem' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '0.5rem' }}>Students Who Need Your Help</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
              Each case below represents a verified student in our community. Identities are kept confidential to protect privacy.
            </p>

            <motion.div
              className="grid grid-2 gap-4"
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            >
              {content.student_cases.map(student => {
                const pct = progressPercent(student.raised, student.needed);
                const isExpanded = expandedCase === student.id;
                return (
                  <motion.div
                    key={student.id}
                    className="card"
                    variants={staggerItem}
                    whileHover={{ y: -6 }}
                    onClick={() => setExpandedCase(isExpanded ? null : student.id)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {student.urgent && (
                      <div style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white', fontSize: '0.7rem', fontWeight: '700',
                        padding: '0.2rem 0.6rem', borderRadius: '999px', letterSpacing: '0.05em'
                      }}>URGENT</div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0,
                        letterSpacing: '0.03em'
                      }}>
                        GBS
                      </div>
                      <div>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '0.15rem' }}>{student.caseRef}</h3>
                        <p style={{ color: '#888', fontSize: '0.85rem' }}>{student.level}</p>
                      </div>
                    </div>
                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: '1.5' }}>{student.need}</p>

                    <div style={{ background: '#f0f0f0', borderRadius: '999px', height: '10px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        viewport={{ once: true }}
                        style={{
                          height: '100%',
                          background: pct >= 75
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : 'linear-gradient(90deg, var(--primary), var(--accent))',
                          borderRadius: '999px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#999', marginBottom: '1rem' }}>
                      <span>{formatUGX(student.raised)} raised</span>
                      <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{pct}%</span>
                      <span>Goal: {formatUGX(student.needed)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: '600' }}>
                        Still needs: {formatUGX(student.needed - student.raised)}
                      </span>
                      {isExpanded ? <ChevronUp size={18} color="#aaa" /> : <ChevronDown size={18} color="#aaa" />}
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}
                      >
                        <p style={{ color: '#777', fontSize: '0.85rem', lineHeight: '1.6' }}>
                          Full details are available to verified sponsors upon request. Contact our team to learn more about this case.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Ways to Give */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3rem' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '0.5rem' }}>Ways to Volunteer & Give</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
              Choose the way that works best for you — no amount is too small.
            </p>

            <motion.div
              className="grid grid-2 gap-4"
              variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            >
              {content.ways_to_give.map((way, i) => {
                const WayIcon = ICON_MAP[way.icon];
                return (
                <motion.div
                  key={i}
                  className="card"
                  variants={staggerItem}
                  whileHover={{ y: -6 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDonationOption?.(way)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDonationOption?.(way);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary), rgba(30,58,138,0.7))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)', marginBottom: '1rem'
                  }}>
                    <WayIcon size={28} />
                  </div>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{way.title}</h3>
                  <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>{way.description}</p>
                  <span style={{
                    background: 'rgba(212,175,55,0.12)', color: 'var(--accent)',
                    fontWeight: '700', fontSize: '0.82rem', padding: '0.3rem 0.8rem', borderRadius: '999px'
                  }}>
                    {way.highlight}
                  </span>
                </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Impact Guide */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ marginBottom: '3rem' }}
          >
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.04), rgba(212,175,55,0.06))' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                <Star size={22} color="var(--accent)" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                What Your Gift Does
              </h2>
              <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem' }}>Every amount makes a real difference</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {content.impact_levels.map((level, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                    background: 'white', padding: '1rem', borderRadius: '12px',
                    borderLeft: '4px solid var(--accent)'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, var(--accent), #b8960c)',
                      color: 'white', fontWeight: '700', fontSize: '0.8rem',
                      padding: '0.3rem 0.6rem', borderRadius: '8px', flexShrink: 0, minWidth: '80px', textAlign: 'center'
                    }}>
                      UGX {level.amount}
                    </div>
                    <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{level.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Volunteer Pledge Form */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ marginBottom: '3rem' }}
          >
            <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
              <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
                <Heart size={22} color="var(--accent)" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Pledge to Help
              </h2>
              <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem' }}>
                Fill in your details and we will contact you with payment instructions.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center', padding: '2rem',
                    background: 'rgba(34,197,94,0.08)', borderRadius: '16px',
                    border: '2px solid rgba(34,197,94,0.3)'
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>Thank You</div>
                  <h3 style={{ color: '#16a34a', marginBottom: '0.5rem' }}>Thank You for Your Generosity!</h3>
                  <p style={{ color: '#555' }}>
                    We have received your pledge. Our team will contact you at <strong>{donateForm.email || donateForm.phone}</strong> with payment details within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Your Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="Full name"
                        value={donateForm.name}
                        onChange={e => setDonateForm({ ...donateForm, name: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Phone Number *</label>
                      <input
                        required
                        type="tel"
                        placeholder="+256 7xx xxx xxx"
                        value={donateForm.phone}
                        onChange={e => setDonateForm({ ...donateForm, phone: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={donateForm.email}
                      onChange={e => setDonateForm({ ...donateForm, email: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Amount (UGX) *</label>
                      <input
                        required
                        type="number"
                        placeholder="e.g. 50000"
                        min="1000"
                        value={donateForm.amount}
                        onChange={e => setDonateForm({ ...donateForm, amount: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Giving Type</label>
                      <select
                        value={donateForm.type}
                        onChange={e => setDonateForm({ ...donateForm, type: e.target.value })}
                        style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '0.95rem', background: 'white', boxSizing: 'border-box' }}
                      >
                        <option value="one-time">One-Time Gift</option>
                        <option value="monthly">Monthly Sponsor</option>
                        <option value="supplies">Supplies Donation</option>
                        <option value="sponsor">Sponsor a Student</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Message (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Want to sponsor a specific student? Any notes for our team?"
                      value={donateForm.message}
                      onChange={e => setDonateForm({ ...donateForm, message: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 1rem', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-accent"
                    style={{ padding: '1rem', fontSize: '1rem', fontWeight: '700', marginTop: '0.5rem' }}
                  >
                    Submit My Pledge
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            className="dark-card"
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: '1rem' }}>Contact the Project Team</h2>
              <p style={{ marginBottom: '2rem', color: 'rgba(255,255,255,0.8)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Want to give physically, volunteer your time, or learn more? Reach us directly.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {content.contact_points.map((item, i) => {
                  const ContactIcon = ICON_MAP[item.icon];
                  return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.75rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem'
                  }}>
                    <span style={{ color: 'var(--accent)' }}><ContactIcon size={20} /></span>
                    <span>{item.label}</span>
                  </div>
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
