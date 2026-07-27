import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

interface StaffMember {
  id: number;
  name: string;
  position: string;
  department: string;
  bio: string;
  photo: string;
  email: string;
  phone: string;
}

export const StaffDirectory: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/staff/`);
        const data = await response.json();
        setStaff(data.results || data);
      } catch (error) {
        console.error('Error fetching staff:', error);
      }
      setLoading(false);
    };
    fetchStaff();
  }, []);

  const departments = ['all', ...new Set(staff.map(s => s.department))];
  const filtered = selectedDepartment === 'all'
    ? staff
    : staff.filter(s => s.department === selectedDepartment);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      style={{ padding: '3rem 2rem' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Church Leadership & Staff</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Meet our dedicated team serving the church</p>

        {/* Department Filter */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedDepartment === dept ? '#003d7a' : '#f0f0f0',
                color: selectedDepartment === dept ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {dept === 'all' ? 'All' : dept}
            </button>
          ))}
        </div>

        {/* Staff Grid */}
        {loading ? (
          <p>Loading staff directory...</p>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#f7f9fc', borderRadius: '10px', padding: '1.5rem', color: '#475569' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>No staff records available yet.</p>
            <p style={{ margin: '0.45rem 0 0' }}>Add staff profiles from the admin panel to populate this page.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {filtered.map(member => (
              <motion.div
                key={member.id}
                whileHover={{ transform: 'translateY(-4px)' }}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  style={{
                    width: '100%',
                    height: '250px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ color: '#003d7a', marginBottom: '0.25rem' }}>{member.name}</h3>
                  <p style={{
                    color: '#d4a574',
                    fontWeight: 'bold',
                    marginBottom: '0.25rem'
                  }}>
                    {member.position}
                  </p>
                  <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {member.department}
                  </p>
                  <p style={{
                    color: '#555',
                    fontSize: '0.95rem',
                    lineHeight: '1.5',
                    marginBottom: '1rem'
                  }}>
                    {member.bio}
                  </p>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {member.email && (
                      <p>📧 <a href={`mailto:${member.email}`} style={{ color: '#003d7a' }}>{member.email}</a></p>
                    )}
                    {member.phone && (
                      <p>📱 {member.phone}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
};
