import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Users, TrendingUp, PieChart } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

interface AnalyticsDashboard {
  total_members: number;
  total_donations: number;
  events_this_month: number;
  active_prayers: number;
  blog_views: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics/dashboard/`, {
          headers: {
            'Authorization': `Token ${localStorage.getItem('user_token')}`
          }
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading analytics...</div>;
  if (!data) return <div style={{ padding: '2rem' }}>No data available</div>;

  const stats = [
    {
      label: 'Total Members',
      value: data.total_members,
      icon: Users,
      color: '#003d7a'
    },
    {
      label: 'Total Donations',
      value: `UGX ${(data.total_donations / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: '#d4a574'
    },
    {
      label: 'Events This Month',
      value: data.events_this_month,
      icon: BarChart,
      color: '#28a745'
    },
    {
      label: 'Active Prayer Requests',
      value: data.active_prayers,
      icon: PieChart,
      color: '#ff6b6b'
    }
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      style={{ padding: '2rem' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem' }}>Analytics Dashboard</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ transform: 'translateY(-4px)' }}
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${stat.color}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {stat.label}
                    </p>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: stat.color
                    }}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon size={40} style={{ color: stat.color, opacity: 0.2 }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Blog Activity</h2>
          <p style={{ color: '#666' }}>
            Total views across all blog posts: <strong>{data.blog_views}</strong>
          </p>
          <div style={{
            marginTop: '1.5rem',
            background: 'linear-gradient(90deg, #003d7a 0%, #d4a574 100%)',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min((data.blog_views / 10000) * 100, 100)}%`,
              height: '100%',
              background: '#28a745'
            }} />
          </div>
        </div>
      </div>
    </motion.section>
  );
};
