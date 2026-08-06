import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MessageCircle, Search, Plus, ChevronLeft, Pin, Flame, Eye, ThumbsUp, Tag, X, Send, BookOpen, Heart, Users, Bell, Star, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Prayer & Devotion', description: 'Share prayer requests, devotional thoughts, and spiritual reflections with the community.', thread_count: 34, color: '#8B5CF6', icon: <Heart size={22} />, tag: 'Spiritual' },
  { id: 2, name: 'Bible Discussion', description: 'Dive deep into scripture, Sabbath School lessons, and theological questions together.', thread_count: 52, color: '#0EA5E9', icon: <BookOpen size={22} />, tag: 'Study' },
  { id: 3, name: 'Student Life', description: 'Campus topics, study groups, hostel life, exams, and everything student at Bugema.', thread_count: 41, color: '#10B981', icon: <Users size={22} />, tag: 'Campus' },
  { id: 4, name: 'Testimonies & Praise', description: 'Share what God has done in your life — miracles, answered prayers, and breakthroughs.', thread_count: 28, color: '#F59E0B', icon: <Star size={22} />, tag: 'Praise' },
  { id: 5, name: 'Church Announcements', description: 'Official updates, events, program changes, and notices from church leadership.', thread_count: 19, color: '#EF4444', icon: <Bell size={22} />, tag: 'Official' },
  { id: 6, name: 'General Fellowship', description: 'Casual conversations, jokes, recommendations, and general community chat.', thread_count: 63, color: '#EC4899', icon: <MessageCircle size={22} />, tag: 'Social' }
];

function Avatar({ letter, color = 'var(--primary)' }: { letter: string; color?: string }) {
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: '700', fontSize: '0.85rem'
    }}>{letter}</div>
  );
}

export const ForumsPage: React.FC = () => {
  const [view, setView] = useState<'categories' | 'threads' | 'thread'>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<any | null>(null);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [categoryThreads, setCategoryThreads] = useState<Record<number, any[]>>({});
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'unanswered'>('latest');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', body: '', tag: '' });
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const getToken = () => localStorage.getItem('user_token');
  const isLoggedIn = Boolean(getToken());

  const getApiErrorMessage = (payload: any, fallback: string) => {
    if (!payload || typeof payload !== 'object') return fallback;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    const firstValue = Object.values(payload)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === 'string' && firstValue.trim()) {
      return firstValue;
    }
    return fallback;
  };

  const mapApiThreadToUi = (thread: any, fallbackColor = 'var(--primary)') => {
    const totalLikes = Array.isArray(thread.posts)
      ? thread.posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0)
      : 0;

    return {
      id: thread.id,
      title: thread.title,
      author: thread.author_name || 'Member',
      avatar: (thread.author_name || 'M').charAt(0).toUpperCase(),
      time: thread.updated_at ? new Date(thread.updated_at).toLocaleDateString() : 'Recently',
      replies: thread.post_count || 0,
      views: Math.max((thread.post_count || 0) * 7, 1),
      likes: totalLikes,
      pinned: !!thread.pinned,
      tags: [thread.closed ? 'Closed' : 'Discussion'],
      preview: thread.content || '',
      body: thread.content || '',
      color: fallbackColor,
    };
  };

  const fetchThreadsForCategory = async (categoryId: number, fallbackColor = 'var(--primary)') => {
    setThreadsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forum-threads/by_category/?category_id=${categoryId}`);
      const data = await response.json();
      const list = (data.results || data || []).map((thread: any) => mapApiThreadToUi(thread, fallbackColor));
      setCategoryThreads(prev => ({ ...prev, [categoryId]: list }));
    } catch {
      // Keep fallback thread content when backend is unavailable.
    } finally {
      setThreadsLoading(false);
    }
  };

  const handleCreateThread = async () => {
    if (!selectedCat) return;
    if (!newThread.title.trim() || !newThread.body.trim()) return;

    const token = getToken();
    if (!token) {
      toast.error('Please log in first to create a discussion.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forum-threads/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          category: selectedCat.id,
          title: newThread.title.trim(),
          content: newThread.body.trim(),
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(errorPayload, 'Unable to create discussion.'));
      }

      await fetchThreadsForCategory(selectedCat.id, selectedCat.color || 'var(--primary)');
      setShowNewThread(false);
      setNewThread({ title: '', body: '', tag: '' });
      toast.success('Discussion posted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create discussion.';
      toast.error(message);
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedThread || !replyText.trim()) return;

    const token = getToken();
    if (!token) {
      toast.error('Please log in first to reply.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forum-posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          thread: selectedThread.id,
          content: replyText.trim(),
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(getApiErrorMessage(errorPayload, 'Unable to post reply.'));
      }

      setReplyText('');
      if (selectedCat) {
        await fetchThreadsForCategory(selectedCat.id, selectedCat.color || 'var(--primary)');
      }
      setSelectedThread((prev: any) => prev ? ({ ...prev, replies: (prev.replies || 0) + 1 }) : prev);
      toast.success('Reply posted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to post reply.';
      toast.error(message);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/forum-categories/`)
      .then(r => r.json())
      .then(d => {
        const list = d.results || d;
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((cat: any, idx: number) => ({
            ...cat,
            color: FALLBACK_CATEGORIES[idx % FALLBACK_CATEGORIES.length].color,
            icon: FALLBACK_CATEGORIES[idx % FALLBACK_CATEGORIES.length].icon,
            tag: cat.tag || FALLBACK_CATEGORIES[idx % FALLBACK_CATEGORIES.length].tag,
          }));
          setCategories(mapped);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (view === 'threads' && selectedCat) {
      fetchThreadsForCategory(selectedCat.id, selectedCat.color || 'var(--primary)');
    }
  }, [view, selectedCat]);

  const threads = selectedCat ? (categoryThreads[selectedCat.id] || []) : [];
  const filteredThreads = threads.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.preview.toLowerCase().includes(search.toLowerCase())
  );
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === 'hot') return b.likes - a.likes;
    if (sortBy === 'unanswered') return a.replies - b.replies;
    return 0;
  });
  const pinned = sortedThreads.filter(t => t.pinned);
  const regular = sortedThreads.filter(t => !t.pinned);
  const hotThreads = categories.length > 0
    ? categories
        .flatMap((cat) => (categoryThreads[cat.id] || []).slice(0, 1).map((thread) => ({
          ...thread,
          category: cat.name,
          categoryColor: cat.color || 'var(--primary)',
        })))
        .slice(0, 3)
    : [];

  return (
    <div>
      {/* Hero */}
      <motion.div className="page-header" variants={fadeUp} initial="hidden" animate="visible">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
              style={{ width: '68px', height: '68px', borderRadius: '18px', background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <MessageSquare size={34} color="var(--accent)" />
            </motion.div>
            <h1 style={{ marginBottom: '0.5rem' }}>Community Forums</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '520px', margin: '0 auto 2rem' }}>
              A safe, faith-filled space to discuss, ask, share, and grow together as one church family.
            </p>
            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
              <input
                type="text" placeholder="Search discussions..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: '12px', border: 'none', fontSize: '0.95rem', background: 'rgba(255,255,255,0.95)', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          </div>
          {/* Stats bar */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', maxWidth: '600px', margin: '0 auto' }}>
            {[{ v: categories.reduce((s,c) => s + (c.thread_count||0), 0) + '+', l: 'Discussions' }, { v: '237', l: 'Members' }, { v: '6', l: 'Categories' }, { v: '18', l: 'Active Today' }].map((s,i) => (
              <motion.div key={i} variants={staggerItem} style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)' }}>{s.v}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="section-padding">
        <div className="container">

          {view === 'categories' && (
            <>
              {/* Hot Threads */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <Flame size={20} color="#EF4444" />
                  <h2 style={{ color: 'var(--primary)', margin: 0 }}>Trending Right Now</h2>
                </div>
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                  {hotThreads.map(thread => (
                    <motion.div key={thread.id} variants={staggerItem} whileHover={{ x: 4 }}
                      onClick={() => { setSelectedThread(thread); setView('thread'); }}
                      style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'white', padding: '1rem 1.25rem', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', borderLeft: `4px solid ${thread.categoryColor}` }}>
                      <Avatar letter={thread.avatar} color={thread.categoryColor} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          {thread.pinned && <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}><Pin size={9} style={{ verticalAlign: 'middle' }} /> Pinned</span>}
                          <span style={{ fontSize: '0.72rem', background: `${thread.categoryColor}18`, color: thread.categoryColor, padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '600' }}>{thread.category}</span>
                        </div>
                        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 0.25rem', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.title}</p>
                        <p style={{ color: '#888', fontSize: '0.82rem', margin: 0 }}>by {thread.author} · {thread.time}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0, color: '#aaa', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MessageCircle size={14} />{thread.replies}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ThumbsUp size={14} />{thread.likes}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                {hotThreads.length === 0 && (
                  <div className="card" style={{ padding: '1rem', marginTop: '0.75rem' }}>
                    <p style={{ margin: 0, color: '#64748b' }}>No trending threads yet. Create a discussion to get started.</p>
                  </div>
                )}
              </motion.div>

              {/* Categories Grid */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Browse by Category</h2>
                <p style={{ color: '#666', marginBottom: '1.75rem' }}>Choose a category to read and join discussions</p>
                <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}
                  variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.05 }}>
                  {categories.map((cat: any) => (
                    <motion.div key={cat.id} variants={staggerItem} whileHover={{ y: -5, boxShadow: '0 16px 32px rgba(0,0,0,0.1)' }}
                      onClick={() => { setSelectedCat(cat); setView('threads'); setSearch(''); }}
                      style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                      <div style={{ height: '6px', background: cat.color || 'var(--primary)' }} />
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `${cat.color || 'var(--primary)'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color || 'var(--primary)' }}>
                            {cat.icon || <Hash size={22} />}
                          </div>
                          {cat.tag && <span style={{ fontSize: '0.7rem', background: `${cat.color || 'var(--primary)'}12`, color: cat.color || 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '700' }}>{cat.tag}</span>}
                        </div>
                        <h3 style={{ color: '#1e293b', marginBottom: '0.4rem', fontSize: '1rem' }}>{cat.name}</h3>
                        <p style={{ color: '#777', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1rem' }}>{cat.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.82rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MessageSquare size={13} /> {cat.thread_count || 0} discussions
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: '600', color: cat.color || 'var(--primary)' }}>Enter →</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                {categories.length === 0 && (
                  <div className="card" style={{ marginTop: '1rem' }}>
                    <p style={{ margin: 0, color: '#64748b' }}>No forum categories are configured yet. Ask an admin to add categories.</p>
                  </div>
                )}
              </motion.div>
            </>
          )}

          {view === 'threads' && selectedCat && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Back + Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <button onClick={() => { setView('categories'); setSelectedCat(null); setSearch(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1.5px solid #e5e7eb', padding: '0.55rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#555', fontSize: '0.88rem' }}>
                  <ChevronLeft size={16} /> All Categories
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${selectedCat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedCat.color }}>
                    {selectedCat.icon || <Hash size={20} />}
                  </div>
                  <div>
                    <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>{selectedCat.name}</h2>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.82rem' }}>{selectedCat.thread_count} discussions</p>
                  </div>
                </div>
                <button onClick={() => setShowNewThread(true)} className="btn-accent"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                  <Plus size={16} /> New Discussion
                </button>
              </div>

              {/* Search + Sort */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input type="text" placeholder="Search this category..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {(['latest', 'hot', 'unanswered'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      style={{ padding: '0.6rem 1rem', borderRadius: '10px', border: '1.5px solid', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                        borderColor: sortBy === s ? selectedCat.color : '#e5e7eb',
                        background: sortBy === s ? `${selectedCat.color}12` : 'white',
                        color: sortBy === s ? selectedCat.color : '#888'
                      }}>
                      {s === 'latest' ? '🕐 Latest' : s === 'hot' ? '🔥 Hot' : '💬 Unanswered'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned */}
              {pinned.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>📌 Pinned</p>
                  {pinned.map(thread => <ThreadRow key={thread.id} thread={thread} catColor={selectedCat.color} onClick={() => { setSelectedThread(thread); setView('thread'); }} />)}
                </div>
              )}

              {/* Regular threads */}
              {threadsLoading ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#888' }}>
                  Loading discussions...
                </div>
              ) : regular.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                  <MessageCircle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                  <p>No discussions found. Be the first to start one!</p>
                </div>
              ) : (
                <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                  variants={staggerContainer} initial="hidden" animate="visible">
                  {regular.map(thread => <ThreadRow key={thread.id} thread={thread} catColor={selectedCat.color} onClick={() => { setSelectedThread(thread); setView('thread'); }} />)}
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'thread' && selectedThread && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setView(selectedCat ? 'threads' : 'categories')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1.5px solid #e5e7eb', padding: '0.55rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', color: '#555', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                <ChevronLeft size={16} /> Back to Threads
              </button>

              {/* Thread Post */}
              <div style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ height: '5px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
                <div style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {selectedThread.tags?.map((tag: string) => (
                      <span key={tag} style={{ fontSize: '0.72rem', background: 'rgba(212,175,55,0.12)', color: 'var(--accent)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Tag size={9} />{tag}
                      </span>
                    ))}
                  </div>
                  <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', lineHeight: '1.4' }}>{selectedThread.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Avatar letter={selectedThread.avatar} />
                    <div>
                      <p style={{ fontWeight: '700', color: '#1e293b', margin: 0, fontSize: '0.9rem' }}>{selectedThread.author}</p>
                      <p style={{ color: '#aaa', margin: 0, fontSize: '0.8rem' }}>{selectedThread.time}</p>
                    </div>
                  </div>
                  <p style={{ color: '#444', lineHeight: '1.8', fontSize: '0.97rem' }}>{selectedThread.body || selectedThread.preview}</p>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
                    <button onClick={() => setLiked({ ...liked, [selectedThread.id]: !liked[selectedThread.id] })}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1.5px solid', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
                        borderColor: liked[selectedThread.id] ? 'var(--accent)' : '#e5e7eb',
                        background: liked[selectedThread.id] ? 'rgba(212,175,55,0.08)' : 'transparent',
                        color: liked[selectedThread.id] ? 'var(--accent)' : '#888' }}>
                      <ThumbsUp size={15} /> {selectedThread.likes + (liked[selectedThread.id] ? 1 : 0)} Helpful
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#aaa', fontSize: '0.85rem' }}>
                      <Eye size={15} /> {selectedThread.views} views
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#aaa', fontSize: '0.85rem' }}>
                      <MessageCircle size={15} /> {selectedThread.replies} replies
                    </span>
                  </div>
                </div>
              </div>

              {/* Reply Box */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Add Your Reply</h4>
                {!isLoggedIn && (
                  <div
                    style={{
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#991B1B',
                      borderRadius: '10px',
                      padding: '0.7rem 0.85rem',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      marginBottom: '0.8rem',
                    }}
                  >
                    Please log in first to reply to this discussion.
                  </div>
                )}
                <textarea rows={4} placeholder="Share your thoughts, encouragement, or Scripture..." value={replyText} onChange={e => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '0.92rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button onClick={handleReplySubmit} className="btn-accent" disabled={!isLoggedIn}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.7rem 1.5rem',
                      fontSize: '0.9rem',
                      opacity: isLoggedIn ? 1 : 0.6,
                      cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                    }}>
                    <Send size={16} /> Post Reply
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* New Thread Modal */}
      <AnimatePresence>
        {showNewThread && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewThread(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--primary)', margin: 0 }}>Start a New Discussion</h3>
                <button onClick={() => setShowNewThread(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={22} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!isLoggedIn && (
                  <div
                    style={{
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#991B1B',
                      borderRadius: '10px',
                      padding: '0.7rem 0.85rem',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                    }}
                  >
                    Please log in first to create a discussion.
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Discussion Title *</label>
                  <input type="text" placeholder="What do you want to discuss?" value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Tag</label>
                  <input type="text" placeholder="e.g. Prayer Request, Discussion, Announcement" value={newThread.tag} onChange={e => setNewThread({...newThread, tag: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.4rem' }}>Your Message *</label>
                  <textarea rows={5} placeholder="Write your full message here..." value={newThread.body} onChange={e => setNewThread({...newThread, body: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.92rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <button className="btn-accent" onClick={handleCreateThread} disabled={!isLoggedIn}
                  style={{
                    padding: '0.9rem',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isLoggedIn ? 1 : 0.6,
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                  }}>
                  <Send size={16} /> Post Discussion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function ThreadRow({ thread, catColor, onClick }: { thread: any; catColor: string; onClick: () => void }) {
  return (
    <motion.div variants={staggerItem} whileHover={{ x: 3 }} onClick={onClick}
      style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'white', padding: '1rem 1.25rem', borderRadius: '14px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
      <Avatar letter={thread.avatar} color={catColor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          {thread.tags?.map((tag: string) => (
            <span key={tag} style={{ fontSize: '0.68rem', background: `${catColor}12`, color: catColor, padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>{tag}</span>
          ))}
        </div>
        <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.title}</p>
        <p style={{ color: '#aaa', margin: 0, fontSize: '0.8rem' }}>by {thread.author} · {thread.time}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#888', fontSize: '0.8rem' }}><MessageCircle size={13} /> {thread.replies}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#bbb', fontSize: '0.78rem' }}><Eye size={12} /> {thread.views}</span>
      </div>
    </motion.div>
  );
}
