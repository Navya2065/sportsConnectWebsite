import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Shared/Navbar';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import './Feed.css';

// ─── Create Post Modal ───────────────────────────────────────────────
const CreatePostModal = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    content: '',
    type: user?.role === 'athlete' ? 'achievement' : 'opportunity',
    tags: '',
    opportunity: { sport: '', budget: '', requirements: '' },
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return toast.error('Write something first!');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', form.content);
      formData.append('type', form.type);
      formData.append('tags', form.tags);
      if (form.type === 'opportunity') {
        formData.append('opportunity', JSON.stringify(form.opportunity));
      }
      images.forEach(img => formData.append('images', img));

      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(data.post);
      toast.success('Post created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = user?.role === 'athlete'
    ? [{ value: 'achievement', label: '🏅 Achievement' }, { value: 'general', label: '💬 General' }]
    : [{ value: 'opportunity', label: '💼 Opportunity' }, { value: 'general', label: '💬 General' }];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Post</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Post type</label>
            <div className="type-selector">
              {typeOptions.map(t => (
                <button key={t.value} type="button"
                  className={`type-btn ${form.type === t.value ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <textarea
              className="form-input post-textarea"
              placeholder={
                form.type === 'achievement' ? "Share your latest achievement..."
                : form.type === 'opportunity' ? "Describe the sponsorship opportunity..."
                : "What's on your mind?"
              }
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
            />
          </div>

          {form.type === 'opportunity' && (
            <div className="opportunity-fields">
              <div className="form-group">
                <label className="form-label">Sport</label>
                <input className="form-input" placeholder="e.g. Football, Swimming"
                  value={form.opportunity.sport}
                  onChange={e => setForm(f => ({ ...f, opportunity: { ...f.opportunity, sport: e.target.value } }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Budget</label>
                <input className="form-input" placeholder="e.g. $5,000 - $10,000"
                  value={form.opportunity.budget}
                  onChange={e => setForm(f => ({ ...f, opportunity: { ...f.opportunity, budget: e.target.value } }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Requirements</label>
                <input className="form-input" placeholder="e.g. Min 10k followers"
                  value={form.opportunity.requirements}
                  onChange={e => setForm(f => ({ ...f, opportunity: { ...f.opportunity, requirements: e.target.value } }))} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="football, sponsorship, training"
              value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>

          {previews.length > 0 && (
            <div className="image-previews">
              {previews.map((p, i) => <img key={i} src={p} alt="" className="preview-img" />)}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              📷 Add Images
            </button>
            <input type="file" ref={fileRef} multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" />Posting...</> : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Post Card ───────────────────────────────────────────────────────
const PostCard = ({ post, currentUser, onLike, onComment, onShare, onApply, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLiked = post.likes?.includes(currentUser?._id);
  const isApplied = post.applicants?.some(a => (a._id || a) === currentUser?._id);
  const isOwner = post.author?._id === currentUser?._id;
  const initials = post.author?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    await onComment(post._id, comment);
    setComment('');
    setSubmitting(false);
  };

  const typeConfig = {
    achievement: { label: '🏅 Achievement', cls: 'type-achievement' },
    opportunity: { label: '💼 Opportunity', cls: 'type-opportunity' },
    general: { label: '💬 Post', cls: 'type-general' },
  };

  return (
    <div className="post-card card fade-in">
      {/* Header */}
      <div className="post-header">
        <div className="post-author">
          <div className="avatar avatar-md">{initials}</div>
          <div>
            <div className="post-author-name">{post.author?.name}</div>
            <div className="post-author-meta">
              <span className={`badge badge-${post.author?.role}`}>{post.author?.role}</span>
              <span className="post-time">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="post-header-right">
          <span className={`post-type-badge ${typeConfig[post.type]?.cls}`}>
            {typeConfig[post.type]?.label}
          </span>
          {isOwner && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(post._id)}>🗑</button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="post-content">{post.content}</p>

      {/* Opportunity details */}
      {post.type === 'opportunity' && post.opportunity?.sport && (
        <div className="opportunity-card">
          {post.opportunity.sport && <div className="opp-detail"><span>🏅</span>{post.opportunity.sport}</div>}
          {post.opportunity.budget && <div className="opp-detail"><span>💰</span>{post.opportunity.budget}</div>}
          {post.opportunity.requirements && <div className="opp-detail"><span>📋</span>{post.opportunity.requirements}</div>}
        </div>
      )}

      {/* Images */}
      {post.images?.length > 0 && (
        <div className={`post-images count-${Math.min(post.images.length, 3)}`}>
          {post.images.map((img, i) => (
            <img key={i} src={`http://localhost:5000${img}`} alt="" className="post-img" />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => <span key={i} className="post-tag">#{tag}</span>)}
        </div>
      )}

      {/* Stats */}
      <div className="post-stats">
        <span>{post.likes?.length || 0} likes</span>
        <span>{post.comments?.length || 0} comments</span>
        <span>{post.shares || 0} shares</span>
        {post.type === 'opportunity' && <span>{post.applicants?.length || 0} applicants</span>}
      </div>

      <div className="divider" />

      {/* Actions */}
      <div className="post-actions">
        <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={() => onLike(post._id)}>
          {isLiked ? '❤️' : '🤍'} Like
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          💬 Comment
        </button>
        <button className="action-btn" onClick={() => onShare(post._id)}>
          🔁 Share
        </button>
        {post.type === 'opportunity' && currentUser?.role === 'athlete' && (
          <button
            className={`action-btn apply-btn ${isApplied ? 'applied' : ''}`}
            onClick={() => !isApplied && onApply(post._id)}
            disabled={isApplied}
          >
            {isApplied ? '✅ Applied' : '🤝 Apply'}
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleComment} className="comment-form">
            <div className="avatar avatar-sm">
              {currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <input
              className="form-input comment-input"
              placeholder="Write a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !comment.trim()}>
              {submitting ? <div className="spinner" /> : '↑'}
            </button>
          </form>

          <div className="comments-list">
            {post.comments?.map(c => {
              const cInitials = c.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div key={c._id} className="comment-item">
                  <div className="avatar avatar-sm">{cInitials}</div>
                  <div className="comment-body">
                    <span className="comment-author">{c.user?.name}</span>
                    <span className="comment-text">{c.content}</span>
                    <span className="comment-time">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Feed Page ───────────────────────────────────────────────────────
const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async (p = 1, type = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 10 });
      if (type) params.append('type', type);
      const { data } = await api.get(`/posts?${params}`);
      setPosts(p === 1 ? data.posts : prev => [...prev, ...data.posts]);
      setTotalPages(data.pages);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(1, filter); setPage(1); }, [filter]);

  const handleCreated = (post) => setPosts(prev => [post, ...prev]);

  const handleLike = async (postId) => {
    try {
      const { data } = await api.put(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.likes } : p));
    } catch { toast.error('Failed to like post'); }
  };

  const handleComment = async (postId, content) => {
    try {
      const { data } = await api.post(`/posts/${postId}/comment`, { content });
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: data.comments } : p));
    } catch { toast.error('Failed to add comment'); }
  };

  const handleShare = async (postId) => {
    try {
      const { data } = await api.put(`/posts/${postId}/share`);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, shares: data.shares } : p));
      toast.success('Post shared!');
    } catch { toast.error('Failed to share'); }
  };

  const handleApply = async (postId) => {
    try {
      await api.put(`/posts/${postId}/apply`);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, applicants: [...(p.applicants || []), user._id] } : p
      ));
      toast.success('Applied successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
  };

  const handleDelete = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, filter);
  };

  return (
    <>
      <Navbar />
      <div className="feed fade-in">
        <div className="feed-inner">

          {/* Left sidebar */}
          <div className="feed-sidebar">
            <div className="card sidebar-profile">
              <div className="avatar avatar-lg" style={{ margin: '0 auto 12px' }}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="sidebar-name">{user?.name}</div>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              {user?.sport && <div className="sidebar-meta">{user.sport}</div>}
              {user?.company && <div className="sidebar-meta">{user.company}</div>}
            </div>

            <div className="card">
              <div className="sidebar-section-title">Filter feed</div>
              {[
                { value: '', label: '🌐 All posts' },
                { value: 'achievement', label: '🏅 Achievements' },
                { value: 'opportunity', label: '💼 Opportunities' },
                { value: 'general', label: '💬 General' },
              ].map(f => (
                <button key={f.value}
                  className={`filter-btn ${filter === f.value ? 'active' : ''}`}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main feed */}
          <div className="feed-main">
            {/* Create post button */}
            <div className="card create-post-bar" onClick={() => setShowCreate(true)}>
              <div className="avatar avatar-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="create-post-placeholder">
                {user?.role === 'athlete' ? "Share an achievement..." : "Post an opportunity..."}
              </div>
              <button className="btn btn-primary btn-sm">Post</button>
            </div>

            {/* Posts */}
            {loading && page === 1 ? (
              <div className="feed-loader"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No posts yet</h3>
                <p>Be the first to post something!</p>
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onApply={handleApply}
                    onDelete={handleDelete}
                  />
                ))}
                {page < totalPages && (
                  <button className="btn btn-ghost w-full" onClick={loadMore} disabled={loading}>
                    {loading ? <div className="spinner" /> : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </>
  );
};

export default Feed;