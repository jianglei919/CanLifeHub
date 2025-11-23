import { useEffect, useMemo, useState, useCallback } from 'react';
import { commentsApi } from '../api/http';

export default function CommentsBox({ targetType = 'post', targetId, onCountChange }) {
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

  async function fetchList() {
    if (!targetId) return;
    try {
      setErr('');
      setLoading(true);
      const { data } = await commentsApi.listByTarget(q);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e.message || '加载评论失败');
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
      setErr(e.message || '发布失败（需登录）');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
      <h3 style={{ margin: '8px 0' }}>评论</h3>

      {/* 输入框 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="写下你的评论…（需登录）"
          disabled={loading}
        />
        <button onClick={onCreate} disabled={loading || !newContent.trim()}>
          发布
        </button>
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <label>排序：</label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">最新</option>
          <option value="hot">热度</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>共 {total} 条</div>
      </div>

      {err && <div style={{ color: 'crimson', marginBottom: 8 }}>{err}</div>}
      {loading ? (
        <p>加载中…</p>
      ) : (
        <div>
          {items.length === 0 ? (
            <p>暂无评论</p>
          ) : (
            items.map((c) => <CommentItem key={c._id} item={c} onAnyCommentChange={notifyDelta} />)
          )}
        </div>
      )}

      {/* 分页 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
        <span>{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
      </div>
    </div>
  );
}

function CommentItem({ item, onAnyCommentChange }) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [replyText, setReplyText] = useState('');

  async function toggleReplies() {
    if (repliesOpen) return setRepliesOpen(false);
    try {
      setErr('');
      setLoading(true);
      const { data } = await commentsApi.listReplies(item._id, { page: 1, pageSize: 20 });
      setReplies(data.items || []);
      setRepliesOpen(true);
    } catch (e) {
      setErr(e.message || '加载回复失败');
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
      setErr(e.message || '回复失败（需登录）');
    } finally {
      setLoading(false);
    }
  }

  const ts = item.createdAt ? new Date(item.createdAt) : null;

  return (
    <div style={{ borderTop: '1px solid #f2f2f2', padding: '10px 0' }}>
      <div style={{ fontSize: 13, color: '#666' }}>
        <b>{item.authorId?.name || '匿名'}</b> · {ts ? ts.toLocaleString() : ''}
      </div>
      <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{item.content}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={toggleReplies}>{repliesOpen ? '收起回复' : '查看回复'}</button>
      </div>

      {repliesOpen && (
        <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #f0f0f0' }}>
          {loading ? (
            <p>加载中…</p>
          ) : (
            <>
              {replies.length === 0 ? (
                <p>暂无回复</p>
              ) : (
                replies.map((r) => (
                  <div key={r._id} style={{ padding: '6px 0' }}>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      <b>{r.authorId?.name || '匿名'}</b> · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </div>
                    <div style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{r.content}</div>
                  </div>
                ))
              )}
              {err && <div style={{ color: 'crimson', margin: '6px 0' }}>{err}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <input
                  style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 6 }}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="写回复…（需登录）"
                  disabled={loading}
                />
                <button onClick={sendReply} disabled={loading || !replyText.trim()}>回复</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}