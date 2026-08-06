import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music, Download } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Hymn {
  id: number;
  hymn_book: number;
  number: number;
  title: string;
  author: string;
  composer: string;
  lyrics: string;
  theme: string;
  hymn_book_title: string;
  hymn_book_abbr: string;
}

interface HymnBook {
  id: number;
  title: string;
  abbreviation: string;
  description: string;
  publisher: string;
  year: number;
  hymn_count: number;
  is_featured: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const HymnsPage: React.FC = () => {
  const [hymnBooks, setHymnBooks] = useState<HymnBook[]>([]);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [selectedBook, setSelectedBook] = useState<HymnBook | null>(null);
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTheme, setFilterTheme] = useState('');
  const [view, setView] = useState<'books' | 'hymns' | 'detail'>('books');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [booksRes, hymnsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/hymn-books/`),
          fetch(`${API_BASE_URL}/hymns/`),
        ]);

        if (!booksRes.ok || !hymnsRes.ok) {
          throw new Error('Could not load hymn data.');
        }

        const booksData = await booksRes.json();
        const hymnsData = await hymnsRes.json();
        const booksList = Array.isArray(booksData) ? booksData : (booksData.results ?? []);
        const hymnsList = Array.isArray(hymnsData) ? hymnsData : (hymnsData.results ?? []);

        setHymnBooks(booksList);
        setHymns(hymnsList);
        setSelectedBook(booksList[0] || null);
      } catch {
        setError('Unable to load hymns library right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const themes = useMemo(() => Array.from(new Set(hymns.map((h) => h.theme))).filter(Boolean), [hymns]);

  const filteredHymns = useMemo(() => {
    return hymns.filter((h) => {
      const matchesBook = !selectedBook || h.hymn_book === selectedBook.id;
      const matchesSearch = !searchQuery
        || h.title.toLowerCase().includes(searchQuery.toLowerCase())
        || String(h.number).includes(searchQuery)
        || h.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTheme = !filterTheme || h.theme === filterTheme;
      return matchesBook && matchesSearch && matchesTheme;
    });
  }, [hymns, selectedBook, searchQuery, filterTheme]);

  const downloadHymnAsPDF = (hymn: Hymn) => {
    alert(`Download PDF for: ${hymn.title} (${hymn.hymn_book_abbr} #${hymn.number})`);
  };

  return (
    <div>
      <motion.div className="page-header" variants={fadeUp} initial="hidden" animate="visible">
        <div className="container text-center">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Music size={40} color="var(--accent)" />
            <h1>Hymn Books</h1>
          </div>
          <p>Explore our collection of hymns for worship, prayer, and devotion</p>
        </div>
      </motion.div>

      <div className="section-padding">
        <div className="container">
          {loading && <p className="text-muted">Loading hymns library...</p>}
          {!loading && error && <div className="alert-danger">{error}</div>}

          {!loading && !error && hymnBooks.length === 0 && (
            <div className="card text-center">
              <h3 style={{ marginBottom: '0.5rem' }}>No hymn books published yet</h3>
              <p className="text-muted" style={{ margin: 0 }}>Add hymn books and hymns from the admin portal.</p>
            </div>
          )}

          {!loading && !error && hymnBooks.length > 0 && view === 'books' && (
            <>
              <div style={{ marginBottom: '1.5rem', maxWidth: '500px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                  <input
                    type="text"
                    placeholder="Search hymns by title, number, author"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.4rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="grid grid-3 gap-3">
                {hymnBooks.map((book) => (
                  <div
                    key={book.id}
                    className={`card hymn-book-card ${book.is_featured ? 'featured' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedBook(book);
                      setView('hymns');
                    }}
                  >
                    <h3 style={{ marginBottom: '0.5rem' }}>{book.title}</h3>
                    <p className="text-muted" style={{ marginBottom: '0.75rem' }}>{book.description}</p>
                    <p style={{ margin: 0 }}><strong>{book.hymn_count}</strong> hymns</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && view === 'hymns' && selectedBook && (
            <>
              <button className="btn btn-outline btn-small" onClick={() => setView('books')}>Back to Books</button>
              <h2 style={{ marginTop: '1rem' }}>{selectedBook.title}</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search title/number/author"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <select
                  value={filterTheme}
                  onChange={(e) => setFilterTheme(e.target.value)}
                  style={{ padding: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                >
                  <option value="">All Themes</option>
                  {themes.map((theme) => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-2 gap-2">
                {filteredHymns.map((hymn) => (
                  <div key={hymn.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedHymn(hymn); setView('detail'); }}>
                    <h4>{selectedBook.abbreviation} #{hymn.number}: {hymn.title}</h4>
                    <p className="text-muted" style={{ marginBottom: 0 }}>{hymn.author || 'Unknown author'} • {hymn.theme || 'General'}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && view === 'detail' && selectedHymn && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn btn-outline btn-small" onClick={() => setView('hymns')}>Back to Hymns</button>
                <button className="btn btn-accent btn-small" onClick={() => downloadHymnAsPDF(selectedHymn)}>
                  <Download size={14} style={{ marginRight: '0.35rem' }} />Download
                </button>
              </div>
              <h2 style={{ marginTop: '1rem' }}>{selectedHymn.hymn_book_abbr} #{selectedHymn.number}: {selectedHymn.title}</h2>
              <p className="text-muted">{selectedHymn.author || 'Unknown'} {selectedHymn.composer ? `• ${selectedHymn.composer}` : ''}</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7 }}>{selectedHymn.lyrics}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
