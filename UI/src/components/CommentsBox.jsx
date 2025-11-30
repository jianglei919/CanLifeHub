import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { commentsApi } from '../api/http';
import { useLanguage } from "../../context/LanguageContext";

export default function CommentsBox({ targetType = 'post', targetId, onCountChange }) {
  const { t } = useLanguage();
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [newContent, setNewContent] = useState('');

  const q = useMemo(() => ({ targetType, targetId, sort, page, pageSize }), [targetType, targetId, sort, page]);

  const notifyDelta = useCallback((delta) => {
    if (typeof onCountChange === 'function') onCountChange(delta);
  }, [onCountChange]);

  const isUnauthorized = typeof err === 'string'
    && (err.includes('未授权') || err.includes('未登录') || err.toLowerCase().includes('unauthorized'));

  async function fetchList() {
    if (!targetId) return;
    try {
      setErr('');
      setLoading(true);
      const { data } = await commentsApi.listByTarget(q);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message || t('loadCommentsFailed'));
    } finally {
      setLoading(false);
    }
  }

  // 目标或排序切换时重置到第 1 页
  useEffect(() => {
    setPage(1);
  }, [targetId, sort]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, sort, page]);

  async function onCreate() {
    const text = newContent.trim();
    if (!text) return;
    try {
      setErr('');
      setLoading(true);
      await commentsApi.create({
        targetType,
        targetId,
        content: text,
      });
      setNewContent('');
      // 成功后本地+1并刷新列表
      notifyDelta(1);
      setPage(1);
      await fetchList();
    } catch (e) {
      setErr(e.message || t('postCommentFailed'));
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="comments-box">
      <h3 className="comments-title">💬 {t('commentsSection')}</h3>

      {/* 输入框 */}
      <div className="comment-input-wrapper">
        <input
          className="comment-input"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={t('commentPlaceholder')}
          disabled={loading || isUnauthorized}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onCreate()}
        />
        <button className="comment-submit-btn" onClick={onCreate} disabled={loading || !newContent.trim() || isUnauthorized}>
          {loading ? t('publishing') : t('publish')}
        </button>
      </div>

      {/* 工具栏 */}
      <div className="comments-toolbar">
        <div className="sort-selector">
          <label>📊 {t('sortBy')}：</label>
          <select className="sort-dropdown" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">🕒 {t('latest')}</option>
            <option value="hot">🔥 {t('hottest')}</option>
          </select>
        </div>
        <div className="comments-count">{t('totalComments')} {total}</div>
      </div>

      {err && (
        <div className="comments-error">
          {isUnauthorized ? (
            <>{t('unauthorized')} <Link to="/login" className="login-link">{t('pleaseLogin')}</Link></>
          ) : (
            err
          )}
        </div>
      )}

      {loading ? (
        <div className="comments-loading">⏳ {t('loading')}</div>
      ) : (
        <div className="comments-list">
          {items.length === 0 ? (
            <div className="comments-empty">💭 {t('noCommentsYet')}</div>
          ) : (
            items.map((c) => <CommentItem key={c._id} item={c} onAnyCommentChange={notifyDelta} />)
          )}
        </div>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="comments-pagination">
          <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← {t('prevPage')}
          </button>
          <span className="pagination-info">{t('pageInfo')} {page} / {t('totalComments')} {totalPages}</span>
          <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t('nextPage')} →
          </button>
        </div>
      )}
    </div>
  );
}

function CommentItem({ item, onAnyCommentChange }) {
  const { t } = useLanguage();
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [replyText, setReplyText] = useState('');

  const unauthorized = typeof err === 'string'
    && (err.includes('未授权') || err.includes('未登录') || err.toLowerCase().includes('unauthorized'));

  async function toggleReplies() {
    if (repliesOpen) return setRepliesOpen(false);
    try {
      setErr('');
      setLoading(true);
      const { data } = await commentsApi.listReplies(item._id, { page: 1, pageSize: 20 });
      setReplies(data.items || []);
      setRepliesOpen(true);
    } catch (e) {
      setErr(e.message || t('loadRepliesFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    const text = replyText.trim();
    if (!text) return;
    try {
      setErr('');
      setLoading(true);
      await commentsApi.create({ targetType: 'comment', targetId: item._id, parentId: item._id, content: text });
      setReplyText('');
      // 成功后刷新回复 & 通知外层评论数+1（后端对回复也会累计到 Post.commentsCount）
      if (typeof onAnyCommentChange === 'function') onAnyCommentChange(1);
      const { data } = await commentsApi.listReplies(item._id, { page: 1, pageSize: 20 });
      setReplies(data.items || []);
      setRepliesOpen(true);
    } catch (e) {
      setErr(e.message || t('replyFailed'));
    } finally {
      setLoading(false);
    }
  }

  const ts = item.createdAt ? new Date(item.createdAt) : null;

  return (
    <div className="comment-item-card">
      <div className="comment-header">
        <span className="comment-avatar">👤</span>
        <div className="comment-meta">
          <span className="comment-author">{item.authorId?.name || t('anonymousUser')}</span>
          <span className="comment-time">{ts ? ts.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
      <div className="comment-content">{item.content}</div>
      <div className="comment-actions">
        <button className="reply-btn" onClick={toggleReplies}>
          {repliesOpen ? `▲ ${t('hideReplies')}` : `▼ ${t('viewReplies')}`}
        </button>
      </div>

      {repliesOpen && (
        <div className="replies-section">
          {loading ? (
            <div className="replies-loading">{t('loading')}</div>
          ) : (
            <>
              {replies.length === 0 ? (
                <div className="replies-empty">{t('noReplies')}</div>
              ) : (
                <div className="replies-list">
                  {replies.map((r) => (
                    <div key={r._id} className="reply-item">
                      <span className="reply-avatar">💬</span>
                      <div className="reply-content-wrapper">
                        <div className="reply-meta">
                          <span className="reply-author">{r.authorId?.name || t('anonymousUser')}</span>
                          <span className="reply-time">{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div className="reply-text">{r.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {err && (
                <div className="reply-error">
                  {unauthorized ? (
                    <>{t('unauthorized')} <Link to="/login" className="login-link">{t('pleaseLogin')}</Link></>
                  ) : (
                    err
                  )}
                </div>
              )}
              <div className="reply-input-wrapper">
                <input
                  className="reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('replyPlaceholder')}
                  disabled={loading || unauthorized}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                />
                <button className="reply-submit-btn" onClick={sendReply} disabled={loading || !replyText.trim() || unauthorized}>
                  {loading ? '...' : t('reply')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}