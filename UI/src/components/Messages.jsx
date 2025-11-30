import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { chatApi, authApi } from "../api/http";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";
import "../styles/Messages.css";

export default function Messages() {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [avatarsMap, setAvatarsMap] = useState({}); // userId -> latest avatar
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const conversationPollingRef = useRef(null);
  const readStatusPollingRef = useRef(null);
  const lastMessageTimeRef = useRef(null);
  const lastConversationUpdateRef = useRef(null);

  // Emoji列表
  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪",
    "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
    "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
    "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕",
    "🤢", "🤮", "🤧", "🥵", "🥶", "😵", "🤯", "🤠",
    "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮",
    "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰",
    "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
    "👏", "🙌", "👐", "🤲", "🙏", "💪", "❤️", "🧡",
    "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘",
    "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️"
  ];

  // 加载会话列表
  const loadConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      if (response.data.ok) {
        const convs = response.data.conversations || [];
        setConversations(convs);
        // Refresh avatars for other users in conversations
        const ids = Array.from(new Set(convs
          .map(c => c.otherUser?._id)
          .filter(Boolean)));
        if (ids.length > 0) {
          try {
            const entries = await Promise.all(ids.map(async (uid) => {
              try {
                const res = await authApi.getUserById(uid);
                const avatar = res?.data?.user?.avatar || res?.data?.avatar || '👤';
                return [uid, avatar];
              } catch {
                return [uid, avatarsMap[uid] || '👤'];
              }
            }));
            setAvatarsMap(prev => {
              const next = { ...prev };
              entries.forEach(([uid, av]) => { next[uid] = av; });
              return next;
            });
          } catch {}
        }
      }
    } catch (error) {
      console.error("加载会话列表失败:", error);
      toast.error(error.message || t('loadConversationsFailed'));
    }
  };

  // 加载消息 - 优化：减少初始加载数量
  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      // 只加载最近20条消息，加快首次加载
      const response = await chatApi.getMessages(conversationId, { page: 1, limit: 20 });
      if (response.data.ok) {
        setMessages(response.data.messages);
        setLoading(false); // 立即结束加载状态

        // 使用requestAnimationFrame优化滚动性能
        requestAnimationFrame(() => {
          scrollToBottom();
        });

        // 后台异步操作，不阻塞UI
        Promise.all([
          chatApi.markAsRead(conversationId),
          loadConversations()
        ]).catch(err => {
          console.error("后台更新失败:", err);
        });
      }
    } catch (error) {
      console.error("加载消息失败:", error);
      toast.error(error.message || t('loadMessagesFailed'));
      setLoading(false);
    }
  };

  // 发送文本消息
  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedConversation) {
      // 检查是否被拉黑
      if (selectedConversation.isBlockedByOther) {
        toast.error(t('blockedByOther'));
        return;
      }
      if (selectedConversation.isBlocked) {
        toast.error(t('blockedByUser'));
        return;
      }

      try {
        const response = await chatApi.sendMessage(selectedConversation._id, {
          messageType: "text",
          content: messageInput
        });

        if (response.data.ok) {
          setMessages([...messages, response.data.message]);
          setMessageInput("");
          // 更新会话列表
          await loadConversations();
          // 滚动到底部
          scrollToBottom();
        }
      } catch (error) {
        console.error("发送消息失败:", error);
        toast.error(error.message || t('sendMessageFailed'));
      }
    }
  };

  // 处理图片上传
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查是否被拉黑
    if (selectedConversation.isBlockedByOther) {
      toast.error(t('blockedByOther'));
      return;
    }
    if (selectedConversation.isBlocked) {
      toast.error(t('blockedByUser'));
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      toast.error(t('selectImage'));
      return;
    }

    // 检查文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('imageSizeLimit'));
      return;
    }

    try {
      setUploading(true);

      // 转换图片为Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;

          // 发送Base64图片消息
          const response = await chatApi.sendMessage(selectedConversation._id, {
            messageType: "image",
            imageUrl: base64String
          });

          if (response.data.ok) {
            setMessages([...messages, response.data.message]);
            await loadConversations();
            scrollToBottom();
            toast.success(t('imageSent'));
          }
        } catch (error) {
          console.error("发送图片失败:", error);
          toast.error(error.message || t('sendImageFailed'));
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      };

      reader.onerror = () => {
        toast.error(t('readImageFailed'));
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("处理图片失败:", error);
      toast.error(error.message || t('processImageFailed'));
      setUploading(false);
    }
  };

  // 拉黑/取消拉黑
  const handleToggleBlock = async () => {
    if (!selectedConversation) return;

    const isCurrentlyBlocked = selectedConversation.isBlocked;
    const userName = selectedConversation.otherUser?.name || "该用户";

    // 拉黑前需要确认
    if (!isCurrentlyBlocked) {
      const confirmed = window.confirm(
        `${t('confirmBlock')} ${userName} ?\n\n${t('blockWarning')}`
      );
      if (!confirmed) return;
    }

    try {
      const response = await chatApi.toggleBlock(selectedConversation._id);
      if (response.data.ok) {
        // 显示操作成功提示
        const successMessage = response.data.isBlocked
          ? `${t('blocked')} ${userName}`
          : `${t('unblocked')} ${userName}`;
        toast.success(successMessage);

        // 更新当前会话状态
        setSelectedConversation({
          ...selectedConversation,
          isBlocked: response.data.isBlocked
        });
        // 更新会话列表
        await loadConversations();
      }
    } catch (error) {
      console.error("操作失败:", error);
      toast.error(error.message || t('operationFailed'));
    }
  };

  // 搜索用户
  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await chatApi.searchUsers(query);
      if (response.data.ok) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("搜索用户失败:", error);
      toast.error(error.message || t('searchFailed'));
    }
  };

  // 创建新会话
  const handleStartNewChat = async (userId) => {
    try {
      const response = await chatApi.getOrCreateConversation(userId);
      if (response.data.ok) {
        const conv = response.data.conversation;
        const otherUser = conv.participants.find(p => p._id !== userId);

        setSelectedConversation({
          _id: conv._id,
          otherUser: otherUser || conv.participants[0],
          isBlocked: conv.isBlocked,
          isBlockedByOther: conv.isBlockedByOther
        });

        await loadMessages(conv._id);
        setShowNewChat(false);
        setShowMessages(true);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("创建会话失败:", error);
      toast.error(error.message || t('createChatFailed'));
    }
  };

  // 格式化时间 - 使用useCallback优化
  const formatTime = useCallback((date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }, []);

  // Helper to render avatar
  const renderAvatar = (user, size = 40) => {
    const uid = user?._id || user?.id;
    const avatar = (uid && avatarsMap[uid]) || user?.avatar;
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('data:'))) {
      return (
        <img 
          src={avatar} 
          alt={user.name} 
          style={{
            width: `${size}px`, 
            height: `${size}px`, 
            borderRadius: '50%', 
            objectFit: 'cover',
            marginRight: '12px',
            border: '1px solid #eee'
          }} 
        />
      );
    }
    return <span className="conv-avatar" style={{width: `${size}px`, height: `${size}px`, fontSize: `${size/2}px`, lineHeight: `${size}px`}}>{avatar || "👤"}</span>;
  };

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 缓存消息渲染结果，避免不必要的重渲染
  const renderedMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return messages.map((msg) => ({
      ...msg,
      isOwn: msg.sender._id !== selectedConversation.otherUser._id
    }));
  }, [messages, selectedConversation]);

  // 轮询获取新消息
  const pollNewMessages = async () => {
    if (!selectedConversation || !showMessages) return;

    try {
      const since = lastMessageTimeRef.current;
      const response = await chatApi.getNewMessages(selectedConversation._id, since);

      if (response.data.ok && response.data.messages.length > 0) {
        const newMessages = response.data.messages;

        // 添加新消息到列表
        setMessages(prevMessages => {
          // 去重：检查是否已存在
          const existingIds = new Set(prevMessages.map(m => m._id));
          const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m._id));
          return [...prevMessages, ...uniqueNewMessages];
        });

        // 更新最后消息时间
        const lastMsg = newMessages[newMessages.length - 1];
        lastMessageTimeRef.current = lastMsg.createdAt;

        // 更新会话列表
        await loadConversations();

        // 滚动到底部
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      // 静默失败，不显示错误
      console.error("轮询新消息失败:", error);
    }
  };

  // 轮询会话列表更新
  const pollConversationsUpdate = async () => {
    if (showMessages || showNewChat) return; // 只在会话列表页面轮询

    try {
      const since = lastConversationUpdateRef.current;
      const response = await chatApi.getConversationsUpdate(since);

      if (response.data.ok && response.data.conversations.length > 0) {
        // 更新会话列表
        await loadConversations();

        // 更新最后更新时间
        lastConversationUpdateRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error("轮询会话更新失败:", error);
    }
  };

  // 启动消息轮询
  const startMessagePolling = () => {
    stopMessagePolling(); // 先停止之前的轮询

    // 设置最后消息时间为当前最新消息的时间
    if (messages.length > 0) {
      lastMessageTimeRef.current = messages[messages.length - 1].createdAt;
    }

    // 优化：降低轮询频率从1秒到2秒
    pollingIntervalRef.current = setInterval(pollNewMessages, 2000);
  };

  // 停止消息轮询
  const stopMessagePolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // 启动会话列表轮询 - 优化：降低频率
  const startConversationPolling = () => {
    stopConversationPolling();

    lastConversationUpdateRef.current = new Date().toISOString();
    conversationPollingRef.current = setInterval(pollConversationsUpdate, 3000); // 从2秒改为3秒
  };

  // 停止会话列表轮询
  const stopConversationPolling = () => {
    if (conversationPollingRef.current) {
      clearInterval(conversationPollingRef.current);
      conversationPollingRef.current = null;
    }
  };

  // 轮询已读状态更新
  const pollReadStatusUpdates = async () => {
    if (!selectedConversation || !showMessages || messages.length === 0) return;

    try {
      // 获取当前用户发送的未读消息ID
      const myUnreadMessages = messages.filter(msg =>
        msg.sender._id !== selectedConversation.otherUser._id && !msg.isRead
      );

      if (myUnreadMessages.length === 0) return; // 没有未读消息，不需要轮询

      const messageIds = myUnreadMessages.map(msg => msg._id);
      const response = await chatApi.getReadStatusUpdates(selectedConversation._id, messageIds);

      if (response.data.ok && response.data.updates.length > 0) {
        // 更新消息的已读状态
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            const update = response.data.updates.find(u => u.messageId === msg._id);
            if (update && update.isRead && !msg.isRead) {
              // 消息状态从未读变为已读
              return {
                ...msg,
                isRead: update.isRead,
                readAt: update.readAt
              };
            }
            return msg;
          });
        });
      }
    } catch (error) {
      console.error("轮询已读状态失败:", error);
    }
  };

  // 启动已读状态轮询
  const startReadStatusPolling = () => {
    stopReadStatusPolling();
    // 每2秒轮询一次已读状态
    readStatusPollingRef.current = setInterval(pollReadStatusUpdates, 2000);
  };

  // 停止已读状态轮询
  const stopReadStatusPolling = () => {
    if (readStatusPollingRef.current) {
      clearInterval(readStatusPollingRef.current);
      readStatusPollingRef.current = null;
    }
  };

  // 插入Emoji
  const insertEmoji = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 打开图片预览
  const openImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
  };

  // 关闭图片预览
  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  // 初始加载
  useEffect(() => {
    loadConversations();
    startConversationPolling();

    // 组件卸载时清理
    return () => {
      stopMessagePolling();
      stopConversationPolling();
      stopReadStatusPolling();
    };
  }, []);

  // 消息更新时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 当进入聊天界面时启动消息轮询，离开时停止
  useEffect(() => {
    if (showMessages && selectedConversation) {
      startMessagePolling();
      startReadStatusPolling(); // 同时启动已读状态轮询
    } else {
      stopMessagePolling();
      stopReadStatusPolling();
    }

    return () => {
      stopMessagePolling();
      stopReadStatusPolling();
    };
  }, [showMessages, selectedConversation, messages]);

  // 当显示会话列表时启动会话轮询
  useEffect(() => {
    if (!showMessages && !showNewChat) {
      startConversationPolling();
    } else {
      stopConversationPolling();
    }

    return () => {
      stopConversationPolling();
    };
  }, [showMessages, showNewChat]);

  // 新会话对话框
  if (showNewChat) {
    return (
      <div className="messages-module">
        <div className="messages-title">
          <button onClick={() => { setShowNewChat(false); setSearchQuery(""); setSearchResults([]); }}>
            ← {t('back')}
          </button>
          <h3>{t('newChat')}</h3>
        </div>

        <div className="search-users">
          <input
            type="text"
            placeholder={t('searchUserPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchUsers(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="search-results">
          {searchResults.length === 0 && searchQuery.trim().length > 0 && (
            <div className="no-results">{t('userNotFound')}</div>
          )}
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="user-item"
              onClick={() => handleStartNewChat(user._id)}
            >
              {renderAvatar(user)}
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 消息详情视图
  if (showMessages && selectedConversation) {
    const isBlocked = selectedConversation.isBlocked;
    const isBlockedByOther = selectedConversation.isBlockedByOther;
    const canSendMessage = !isBlocked && !isBlockedByOther;

    return (
      <div className="messages-view">
        <div className="messages-header">
          <button onClick={() => { setShowMessages(false); setMessages([]); }}>{t('back')}</button>
          <h3>{selectedConversation.otherUser?.name}</h3>
          <button
            onClick={handleToggleBlock}
            className={isBlocked ? "unblock-btn" : "block-btn"}
            title={isBlocked ? t('clickToUnblock') : t('clickToBlock')}
          >
            {isBlocked ? t('unblock') : t('block')}
          </button>
        </div>

        {(isBlocked || isBlockedByOther) && (
          <div className="block-notice">
            {isBlocked && (
              <div className="block-notice-item">
                <p className="block-notice-title">⚠️ {t('youBlockedUser')}</p>
                <p className="block-notice-desc">{t('blockDesc')}</p>
              </div>
            )}
            {isBlockedByOther && (
              <div className="block-notice-item">
                <p className="block-notice-title">⚠️ {t('userBlockedYou')}</p>
                <p className="block-notice-desc">{t('cannotMessage')}</p>
              </div>
            )}
          </div>
        )}

        <div className="messages-container">
          {loading ? (
            <div className="loading">{t('loading')}</div>
          ) : renderedMessages.length === 0 ? (
            <div className="no-messages">{t('noMessagesStart')}</div>
          ) : (
            renderedMessages.map((msg) => (
              <div
                key={msg._id}
                className={`message ${msg.isOwn ? "own" : "other"}`}
              >
                <div className="message-bubble">
                  {msg.messageType === "text" ? (
                    <p>{msg.content}</p>
                  ) : (
                    <img
                      src={msg.imageUrl}
                      alt={t('imageMessage')}
                      className="message-image"
                      loading="lazy"
                      onClick={() => openImagePreview(msg.imageUrl)}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E" + t('loadFailed') + "%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  )}
                  <div className="message-meta">
                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                    {msg.isOwn && msg.isRead && (
                      <span className="read-status" title="已读">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-input-area">
          <button
            className="emoji-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!canSendMessage}
            title={t('selectEmoji')}
          />
          <input
            type="text"
            placeholder={canSendMessage ? t('typeMessage') : t('cannotSend')}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && canSendMessage && handleSendMessage()}
            className="message-input"
            disabled={!canSendMessage}
          />
          <button
            onClick={handleSendMessage}
            className="send-btn"
            disabled={!canSendMessage || !messageInput.trim()}
          >
            {t('send')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
          <button
            className="image-btn"
            onClick={() => canSendMessage && fileInputRef.current?.click()}
            disabled={!canSendMessage || uploading}
            title={t('sendImage')}
          />

          {/* Emoji选择器 */}
          {showEmojiPicker && (
            <div className="emoji-picker">
              <div className="emoji-picker-header">
                <span className="emoji-picker-title">{t('selectEmoji')}</span>
                <button
                  className="emoji-picker-close"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  ✕
                </button>
              </div>
              <div className="emoji-grid">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    className="emoji-item"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 图片预览模态框 */}
        {previewImage && (
          <div className="image-preview-modal" onClick={closeImagePreview}>
            <button className="image-preview-close" onClick={closeImagePreview}>
              ✕
            </button>
            <img src={previewImage} alt={t('preview')} onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    );
  }

  // 会话列表视图
  return (
    <div className="messages-module">
      <div className="messages-title">
        <h3>{t('messages')}</h3>
        <button className="new-message-btn" onClick={() => setShowNewChat(true)} title={t('startNewChat')}></button>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            {t('noConversations')}
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              className="conversation-item"
              onClick={() => {
                setSelectedConversation(conv);
                loadMessages(conv._id);
                setShowMessages(true);
              }}
            >
              {renderAvatar(conv.otherUser)}
              <div className="conv-info">
                <div className="conv-name">
                  {conv.otherUser?.name}
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge-inline">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</span>
                  )}
                  {conv.isBlocked && <span className="blocked-badge">{t('blocked')}</span>}
                  {conv.isBlockedByOther && <span className="blocked-badge">{t('blockedBy')}</span>}
                </div>
                <div className="conv-message">
                  {conv.lastMessage?.messageType === "image"
                    ? t('imageLabel')
                    : conv.lastMessage?.content || t('noMessageContent')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
