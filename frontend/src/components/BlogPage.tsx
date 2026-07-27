import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author_name: string;
  content: string;
  featured_image: string;
  category: string;
  views: number;
  created_at: string;
}

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const getSlugFromHash = () => {
    const match = window.location.hash.match(/^#\/blog\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/blog/`);
        const data = await response.json();
        setPosts(data.results || data);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = posts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [posts, selectedCategory, searchTerm]);

  useEffect(() => {
    const syncFromHash = () => {
      const slug = getSlugFromHash();
      if (!slug) {
        setSelectedPost(null);
        return;
      }
      const post = posts.find((p) => p.slug === slug) || null;
      setSelectedPost(post);
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [posts]);

  const openPost = (post: BlogPost) => {
    setSelectedPost(post);
    window.location.hash = `#/blog/${encodeURIComponent(post.slug)}`;
  };

  const closePost = () => {
    setSelectedPost(null);
    if (window.location.hash.startsWith('#/blog/')) {
      window.location.hash = '#/blog';
    }
  };

  const categories = ['all', ...new Set(posts.map(p => p.category))];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      style={{ padding: '3rem 2rem', background: 'white' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Church Blog & News</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Stay informed with articles, biblical insights, and church updates</p>

        {selectedPost ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)'
          }}>
            <button
              onClick={closePost}
              style={{
                border: 'none',
                background: '#003d7a',
                color: 'white',
                borderRadius: '8px',
                padding: '0.5rem 0.9rem',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              Back to Blog
            </button>
            <p style={{ color: '#666', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
              {selectedPost.category} • {new Date(selectedPost.created_at).toLocaleDateString()} • {selectedPost.views} views
            </p>
            <h2 style={{ marginBottom: '1rem' }}>{selectedPost.title}</h2>
            {selectedPost.featured_image && (
              <img
                src={selectedPost.featured_image}
                alt={selectedPost.title}
                style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem' }}
              />
            )}
            <p style={{ color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedPost.content}</p>
          </div>
        ) : (
          <>
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '10px', top: '12px', color: '#999' }} />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <p>Loading blog posts...</p>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '2rem', background: '#f7f9fc', borderRadius: '10px' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>No blog posts available yet.</p>
            <p style={{ margin: 0 }}>Published posts from the church office will appear here.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {filteredPosts.map(post => (
              <motion.div
                key={post.id}
                whileHover={{ transform: 'translateY(-4px)' }}
                style={{
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s'
                }}
              >
                {post.featured_image && (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <div style={{ padding: '1.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    background: '#003d7a',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem'
                  }}>
                    {post.category}
                  </span>
                  <h3 style={{ marginBottom: '0.5rem' }}>{post.title}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    By {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <p style={{
                    color: '#555',
                    lineHeight: '1.6',
                    marginBottom: '1rem',
                    maxHeight: '100px',
                    overflow: 'hidden'
                  }}>
                    {post.content.substring(0, 150)}...
                  </p>
                  <button
                    onClick={() => openPost(post)}
                    style={{
                      color: '#d4a574',
                      background: 'none',
                      border: 'none',
                      fontWeight: 'bold',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    Read More →
                  </button>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#999',
                    marginTop: '1rem'
                  }}>
                    👁 {post.views} views
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </motion.section>
  );
};
