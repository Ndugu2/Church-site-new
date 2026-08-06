import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

interface MemberProfile {
  id: number;
  user: { username: string; email: string; first_name: string; last_name: string };
  role: string;
  ministry: string;
  phone: string;
  country: string;
  joined_date: string;
  total_tithe: number;
  attendance_count: number;
  bio: string;
}

interface DashboardData {
  profile: MemberProfile | null;
  donations_total: number;
  events_attended: number;
  prayer_requests: number;
}

interface EventRegistrationRecord {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  event_location: string;
  registered_at: string;
  attended: boolean;
  is_waitlisted: boolean;
  rsvp_status: 'registered' | 'waitlisted' | 'attended' | 'completed';
}

export const MemberDashboard: React.FC<{ userEmail: string }> = ({ userEmail: _userEmail }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistrationRecord[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('user_token');
        const headers = {
          'Authorization': `Token ${token}`
        };

        const [profileResponse, eventResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/members/me/`, { headers }),
          fetch(`${API_BASE_URL}/members/my_event_registrations/`, { headers }),
        ]);

        const profileData = await profileResponse.json();
        const eventData = eventResponse.ok ? await eventResponse.json() : [];

        const registrations = Array.isArray(eventData) ? eventData : [];
        setEventRegistrations(registrations);
        setDashboard({
          profile: profileData,
          donations_total: 0,
          events_attended: registrations.filter((item) => item.rsvp_status === 'attended').length,
          prayer_requests: 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  if (!dashboard) return <div style={{ padding: '2rem' }}>No data found</div>;

  const profile = dashboard.profile;
  const statusPalette: Record<EventRegistrationRecord['rsvp_status'], { bg: string; color: string; label: string }> = {
    registered: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Registered' },
    waitlisted: { bg: '#FEF3C7', color: '#92400E', label: 'Waitlisted' },
    attended: { bg: '#DCFCE7', color: '#166534', label: 'Attended' },
    completed: { bg: '#E2E8F0', color: '#334155', label: 'Completed' },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{ padding: '2rem' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Member Dashboard</h1>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #003d7a 0%, #004da6 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Role</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile?.role || 'Member'}</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #d4a574 0%, #e8ba8a 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Total Tithe</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>UGX {profile?.total_tithe || 0}</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Events Attended</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile?.attendance_count || 0}</p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Ministry</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile?.ministry || 'Not assigned'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['overview', 'donations', 'activity', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #003d7a' : 'none',
                  color: activeTab === tab ? '#003d7a' : '#666',
                  fontSize: '1rem',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>Member Information</h2>
            <div style={{ marginTop: '1rem' }}>
              <p><strong>Name:</strong> {profile?.user.first_name} {profile?.user.last_name}</p>
              <p><strong>Email:</strong> {profile?.user.email}</p>
              <p><strong>Phone:</strong> {profile?.phone || 'Not provided'}</p>
              <p><strong>Country:</strong> {profile?.country || 'Not provided'}</p>
              <p><strong>Joined:</strong> {new Date(profile?.joined_date || '').toLocaleDateString()}</p>
              <p><strong>Bio:</strong> {profile?.bio || 'No bio added'}</p>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '0.75rem', color: '#003d7a' }}>Your Next Steps This Week</h3>
              <ul style={{ margin: 0, paddingLeft: '1rem', color: '#475569' }}>
                <li>Register for an upcoming church event.</li>
                <li>Join one Bible study discussion in the forums.</li>
                <li>Share one prayer or testimony with the community.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>Giving History</h2>
            <p style={{ marginTop: '1rem', color: '#666' }}>Total Tithe: UGX {profile?.total_tithe || 0}</p>
            <p style={{ marginTop: '0.5rem', color: '#666' }}>View detailed giving history in your account settings</p>
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>Activity Summary</h2>
            <p style={{ marginTop: '1rem', color: '#475569' }}>Your engagement this month:</p>
            <ul style={{ marginTop: '0.75rem', paddingLeft: '1rem', color: '#475569' }}>
              <li>Events attended: {profile?.attendance_count || 0}</li>
              <li>Prayer requests shared: {dashboard.prayer_requests}</li>
              <li>Giving actions recorded: {dashboard.donations_total > 0 ? 1 : 0}</li>
            </ul>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '0.75rem', color: '#003d7a' }}>Your Event RSVPs</h3>
              {eventRegistrations.length === 0 ? (
                <p style={{ color: '#64748b', margin: 0 }}>No event registrations yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {eventRegistrations.map((item) => {
                    const style = statusPalette[item.rsvp_status] || statusPalette.registered;
                    return (
                      <div key={item.id} style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{item.event_title}</p>
                          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.92rem' }}>
                            {new Date(item.event_date).toLocaleDateString()} • {item.event_location}
                          </p>
                        </div>
                        <span style={{
                          background: style.bg,
                          color: style.color,
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.3rem 0.7rem'
                        }}>{style.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>Account Settings</h2>
            <div style={{ marginTop: '1.5rem' }}>
              <button style={{
                padding: '0.75rem 1.5rem',
                background: '#003d7a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}>
                Edit Profile
              </button>
              <button style={{
                padding: '0.75rem 1.5rem',
                background: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
