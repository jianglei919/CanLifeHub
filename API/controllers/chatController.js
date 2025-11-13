// API/controllers/chatController.js
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

// ===================== 获取会话列表 =====================
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // 查找用户参与的所有会话
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    // 格式化会话列表
    const formattedConversations = conversations.map(conv => {
      // 找到对方用户
      const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());

      // 检查是否被拉黑
      const isBlocked = conv.blockedBy.some(id => id.toString() === userId.toString());
      const isBlockedByOther = conv.blockedBy.some(id => id.toString() === otherUser._id.toString());

      return {
        _id: conv._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email
        },
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        isBlocked,
        isBlockedByOther
      };
    });

    res.json({ ok: true, conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
};

// ===================== 获取或创建会话 =====================
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;

    // 检查对方用户是否存在
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 查找现有会话
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] }
    })
      .populate('participants', 'name email')
      .populate('lastMessage');

    // 如果会话不存在，创建新会话
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, otherUserId],
        unreadCount: new Map([
          [userId.toString(), 0],
          [otherUserId.toString(), 0]
        ])
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email')
        .populate('lastMessage');
    }

    // 检查拉黑状态
    const isBlocked = conversation.blockedBy.some(id => id.toString() === userId.toString());
    const isBlockedByOther = conversation.blockedBy.some(id => id.toString() === otherUserId.toString());

    res.json({
      ok: true,
      conversation: {
        ...conversation.toObject(),
        isBlocked,
        isBlockedByOther
      }
    });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
};

// ===================== 获取会话消息 =====================
const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // 验证会话是否存在且用户是参与者
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 检查是否被拉黑
    const isBlocked = conversation.blockedBy.some(id => id.toString() === userId.toString());

    // 获取消息（分页）
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // 反转消息顺序（最早的在前）
    messages.reverse();

    // 获取总消息数
    const total = await Message.countDocuments({ conversationId });

    res.json({
      ok: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      isBlocked
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: '获取消息失败' });
  }
};

// ===================== 发送消息 =====================
const sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { messageType, content, imageUrl } = req.body;

    // 验证消息类型
    if (!['text', 'image'].includes(messageType)) {
      return res.status(400).json({ error: '无效的消息类型' });
    }

    // 验证消息内容
    if (messageType === 'text' && !content) {
      return res.status(400).json({ error: '文本消息内容不能为空' });
    }
    if (messageType === 'image' && !imageUrl) {
      return res.status(400).json({ error: '图片消息需要图片URL' });
    }

    // 验证会话是否存在且用户是参与者
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 找到接收者
    const receiverId = conversation.participants.find(
      id => id.toString() !== userId.toString()
    );

    // 检查是否被对方拉黑
    if (conversation.blockedBy.some(id => id.toString() === receiverId.toString())) {
      return res.status(403).json({ error: '对方已将您拉黑，无法发送消息' });
    }

    // 检查是否拉黑了对方
    if (conversation.blockedBy.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({ error: '您已拉黑对方，无法发送消息' });
    }

    // 创建消息
    const message = await Message.create({
      conversationId,
      sender: userId,
      receiver: receiverId,
      messageType,
      content: messageType === 'text' ? content : undefined,
      imageUrl: messageType === 'image' ? imageUrl : undefined
    });

    // 更新会话信息
    const receiverIdStr = receiverId.toString();
    const currentUnreadCount = conversation.unreadCount.get(receiverIdStr) || 0;
    conversation.unreadCount.set(receiverIdStr, currentUnreadCount + 1);
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = message.createdAt;
    await conversation.save();

    // 填充消息的发送者和接收者信息
    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    res.json({ ok: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
};

// ===================== 标记消息为已读 =====================
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // 验证会话是否存在且用户是参与者
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 标记该会话中接收者为当前用户的所有未读消息为已读
    const result = await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // 重置该用户的未读计数
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.json({ ok: true, markedCount: result.modifiedCount });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
};

// ===================== 拉黑/取消拉黑用户 =====================
const toggleBlock = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // 验证会话是否存在且用户是参与者
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 检查当前是否已拉黑
    const isBlocked = conversation.blockedBy.some(id => id.toString() === userId.toString());

    if (isBlocked) {
      // 取消拉黑
      conversation.blockedBy = conversation.blockedBy.filter(
        id => id.toString() !== userId.toString()
      );
    } else {
      // 拉黑
      conversation.blockedBy.push(userId);
    }

    await conversation.save();

    res.json({
      ok: true,
      isBlocked: !isBlocked,
      message: isBlocked ? '已取消拉黑' : '已拉黑该用户'
    });
  } catch (error) {
    console.error('Toggle block error:', error);
    res.status(500).json({ error: '操作失败' });
  }
};

// ===================== 搜索用户（用于发起新会话） =====================
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      return res.json({ ok: true, users: [] });
    }

    // 搜索用户（排除自己）
    const users = await User.find({
      _id: { $ne: userId },
      verified: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name email')
      .limit(10);

    res.json({ ok: true, users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: '搜索用户失败' });
  }
};

// ===================== 获取新消息（轮询） =====================
const getNewMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { since } = req.query; // 获取这个时间之后的消息

    // 验证会话是否存在且用户是参与者
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 构建查询条件
    const query = { conversationId };
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    // 获取新消息
    const newMessages = await Message.find(query)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: 1 });

    // 如果有新消息，自动标记为已读
    if (newMessages.length > 0) {
      const unreadMessages = newMessages.filter(msg =>
        msg.receiver._id.toString() === userId.toString() && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        await Message.updateMany(
          {
            _id: { $in: unreadMessages.map(m => m._id) },
            receiver: userId,
            isRead: false
          },
          {
            isRead: true,
            readAt: new Date()
          }
        );

        // 更新未读计数
        const currentUnread = conversation.unreadCount.get(userId.toString()) || 0;
        const newUnread = Math.max(0, currentUnread - unreadMessages.length);
        conversation.unreadCount.set(userId.toString(), newUnread);
        await conversation.save();
      }
    }

    res.json({ ok: true, messages: newMessages });
  } catch (error) {
    console.error('Get new messages error:', error);
    res.status(500).json({ error: '获取新消息失败' });
  }
};

// ===================== 获取会话列表更新（轮询） =====================
const getConversationsUpdate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { since } = req.query;

    // 构建查询条件
    const query = { participants: userId };
    if (since) {
      query.lastMessageTime = { $gt: new Date(since) };
    }

    // 查找有更新的会话
    const conversations = await Conversation.find(query)
      .populate('participants', 'name email')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    // 格式化会话列表
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
      const isBlocked = conv.blockedBy.some(id => id.toString() === userId.toString());
      const isBlockedByOther = conv.blockedBy.some(id => id.toString() === otherUser._id.toString());

      return {
        _id: conv._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email
        },
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        isBlocked,
        isBlockedByOther
      };
    });

    res.json({ ok: true, conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations update error:', error);
    res.status(500).json({ error: '获取会话更新失败' });
  }
};

// ===================== 获取消息已读状态更新（轮询） =====================
const getReadStatusUpdates = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { messageIds } = req.query; // 逗号分隔的消息ID列表

    if (!messageIds) {
      return res.json({ ok: true, updates: [] });
    }

    // 验证会话是否存在且用户是参与者
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 将消息ID字符串转换为数组
    const messageIdArray = messageIds.split(',').filter(id => id.trim());

    // 查询这些消息的已读状态
    const messages = await Message.find({
      _id: { $in: messageIdArray },
      conversationId,
      sender: userId // 只查询当前用户发送的消息
    })
      .select('_id isRead readAt')
      .lean();

    // 返回已读状态更新
    const updates = messages.map(msg => ({
      messageId: msg._id,
      isRead: msg.isRead,
      readAt: msg.readAt
    }));

    res.json({ ok: true, updates });
  } catch (error) {
    console.error('Get read status updates error:', error);
    res.status(500).json({ error: '获取已读状态失败' });
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  toggleBlock,
  searchUsers,
  getNewMessages,
  getConversationsUpdate,
  getReadStatusUpdates
};

