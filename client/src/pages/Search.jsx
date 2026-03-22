import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import './Search.css';

const VerifiedBadge = () => (
  <span className="verified-badge" title="Verified">✓</span>
);

const Search = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] });
  const [trending, setTrending] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    api.get('/search/trending').then(({ data }) => setTrending(data.trending));
    // Load current user's following list
    api.get(`/follow/${user._id}/following`).then(({ data }) => {
      const map = {};
      data.following.forEach(u => { map[u._id] = true; });
      setFollowing(map);
    }).catch(() => {});
  }, [user._id]);

  const handleSearch = useCallback(async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}&type=${tab}`);
      setResults(data);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, tab]);

  useEffect(() => {
    if (query.trim().length > 1) {
      const timeout = setTimeout(() => handleSearch(), 400);
      return () => clearTimeout(timeout);
    } else {
      setResults({ users: [], posts: [], hashtags: [] });
    }
  }, [query, tab, handleSearch]);

  const handleFollow = async (userId) => {
    try {
      const { data } = await api.put(`/follow/${userId}`);
      setFollowing(prev => ({ ...prev, [userId]: data.following }));
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    } catch {
      toast.error('Failed to follow');
    }
  };

  const handleMessage = async (recipientId) => {
    try {
      const { data } = await api.post('/conversations', { recipientId });
      navigate(`/messages?c=${data.conversation._id}`);
    } catch {
      toast.error('Could not open conversation');
    }
  };

  const hasResults = results.users.length > 0 || results.posts.length > 0;

  return (
    <>
    
      <div className="search-page fade-in">
        <div className="container">
          <div className="search-hero">
            <h1 className="search-title">Discover</h1>
            <p className="search-sub">Find athletes, sponsors, opportunities and more</p>
            <div className="search-bar-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-bar"
                placeholder="Search athletes, sponsors, posts, hashtags..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button className="search-clear" onClick={() => setQuery('')}>✕</button>
              )}
            </div>

            <div className="search-tabs">
              {['all', 'users', 'posts'].map(t => (
                <button key={t} className={`search-tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Trending hashtags */}
          {!query && trending.length > 0 && (
            <div className="trending-section">
              <h2 className="section-label">Trending</h2>
              <div className="trending-tags">
                {trending.map(({ tag, count }) => (
                  <button key={tag} className="trending-tag"
                    onClick={() => setQuery(tag)}>
                    <span className="tag-name">#{tag}</span>
                    <span className="tag-count">{count} posts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="search-loader"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
          )}

          {!loading && query && !hasResults && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No results for "{query}"</h3>
              <p>Try a different search term</p>
            </div>
          )}

          {/* User results */}
          {results.users.length > 0 && (
            <div className="results-section">
              <h2 className="section-label">People</h2>
              <div className="user-results">
                {results.users.map(u => {
                  const initials = u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isFollowing = following[u._id];
                  return (
                    <div key={u._id} className="user-result-card card">
                      <div className="urc-left">
                        <div className="avatar avatar-md">{initials}</div>
                        <div>
                          <div className="urc-name">
                            {u.name}
                            {u.isVerified && <VerifiedBadge />}
                          </div>
                          <span className={`badge badge-${u.role}`}>{u.role}</span>
                          {u.sport && <div className="urc-meta">{u.sport}</div>}
                          {u.company && <div className="urc-meta">{u.company}</div>}
                          <div className="urc-followers">{u.followers?.length || 0} followers</div>
                        </div>
                      </div>
                      <div className="urc-actions">
                        <button
                          className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleFollow(u._id)}
                        >
                          {isFollowing ? 'Following' : '+ Follow'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleMessage(u._id)}>
                          💬
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hashtag results */}
          {results.hashtags.length > 0 && (
            <div className="results-section">
              <h2 className="section-label">Hashtags</h2>
              <div className="trending-tags">
                {results.hashtags.map(({ tag, count }) => (
                  <button key={tag} className="trending-tag" onClick={() => setQuery(tag)}>
                    <span className="tag-name">#{tag}</span>
                    <span className="tag-count">{count} posts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Post results */}
          {results.posts.length > 0 && (
            <div className="results-section">
              <h2 className="section-label">Posts</h2>
              <div className="post-results">
                {results.posts.map(post => {
                  const initials = post.author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div key={post._id} className="post-result card" onClick={() => navigate('/feed')}>
                      <div className="pr-header">
                        <div className="avatar avatar-sm">{initials}</div>
                        <div>
                          <span className="pr-author">
                            {post.author?.name}
                            {post.author?.isVerified && <VerifiedBadge />}
                          </span>
                          <span className={`badge badge-${post.author?.role}`} style={{ marginLeft: 6 }}>
                            {post.author?.role}
                          </span>
                        </div>
                        <span className="pr-time">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="pr-content">{post.content.slice(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
                      {post.tags?.length > 0 && (
                        <div className="pr-tags">
                          {post.tags.map((tag, i) => <span key={i} className="post-tag">#{tag}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;