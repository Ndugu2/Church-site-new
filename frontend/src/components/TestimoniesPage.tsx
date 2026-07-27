import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

interface Testimony {
  id: number;
  title: string;
  content: string;
  author_name: string;
  image: string;
  created_at: string;
  is_featured: boolean;
}

export const TestimoniesPage: React.FC = () => {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/testimonies/`);
        const data = await response.json();
        setTestimonies(data.results || data);
      } catch (error) {
        console.error('Error fetching testimonies:', error);
      }
      setLoading(false);
    };
    fetchTestimonies();
  }, []);

  const featured = testimonies.filter(t => t.is_featured);
  const others = testimonies.filter(t => !t.is_featured);

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      style={{ padding: '3rem 2rem', background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Member Testimonies</h1>
        <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
          Hear how faith is transforming lives in our church community
        </p>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading testimonies...</p>
        ) : testimonies.length === 0 ? (
          <div style={{ textAlign: 'center', background: 'white', padding: '2rem', borderRadius: '10px', color: '#475569' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>No testimonies have been published yet.</p>
            <p style={{ margin: 0 }}>Check back soon as members share their stories of faith.</p>
          </div>
        ) : (
          <>
            {/* Featured Testimonies */}
            {featured.length > 0 && (
              <>
                <h2 style={{ marginBottom: '1.5rem', color: '#003d7a' }}>Featured Stories</h2>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem',
                    marginBottom: '3rem'
                  }}
                >
                  {featured.map(testimony => (
                    <motion.div
                      key={testimony.id}
                      whileHover={{ transform: 'translateY(-4px)' }}
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderLeft: '4px solid #d4a574'
                      }}
                    >
                      {testimony.image && (
                        <img
                          src={testimony.image}
                          alt={testimony.author_name}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            marginBottom: '1rem'
                          }}
                        />
                      )}
                      <h3 style={{ color: '#003d7a', marginBottom: '0.5rem' }}>{testimony.title}</h3>
                      <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {testimony.author_name}
                      </p>
                      <p style={{
                        color: '#555',
                        lineHeight: '1.6',
                        fontStyle: 'italic',
                        borderLeft: '2px solid #d4a574',
                        paddingLeft: '1rem'
                      }}>
                        "{testimony.content.substring(0, 200)}..."
                      </p>
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: '#999' }}>
                          {new Date(testimony.created_at).toLocaleDateString()}
                        </span>
                        <Heart size={18} style={{ color: '#d4a574' }} fill="#d4a574" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {/* All Testimonies */}
            <h2 style={{ marginBottom: '1.5rem', color: '#003d7a' }}>All Testimonies</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {others.map(testimony => (
                <motion.div
                  key={testimony.id}
                  whileHover={{ transform: 'scale(1.02)' }}
                  style={{
                    background: 'white',
                    borderRadius: '6px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <h4 style={{ color: '#003d7a', marginBottom: '0.5rem' }}>{testimony.title}</h4>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    {testimony.author_name}
                  </p>
                  <p style={{
                    color: '#555',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    {testimony.content.substring(0, 150)}...
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.section>
  );
};
