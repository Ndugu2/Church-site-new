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

export const MemberDashboard: React.FC<{ userEmail: string }> = ({ userEmail: _userEmail }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/members/me/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('user_token')}`
          }
        });
        const data = await response.json();
        setDashboard({ profile: data, donations_total: 0, events_attended: 0, prayer_requests: 0 });
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
