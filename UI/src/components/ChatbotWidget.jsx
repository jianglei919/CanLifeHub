// UI/src/components/ChatbotWidget.jsx
import { useState, useRef, useEffect } from 'react';
import { chatbotApi } from '../api/http';
import { toast } from 'react-hot-toast';
import '../styles/ChatbotWidget.css';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '你好！我是 CanLifeHub AI 助手，有什么可以帮助你的吗？',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 520 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 拖动功能
  const handleMouseDown = (e) => {
    if (e.target.closest('.chatbot-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 限制在窗口内
      const maxX = window.innerWidth - 360;
      const maxY = window.innerHeight - 500;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 构建对话历史（Gemini 格式）
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const { data: res } = await chatbotApi.sendMessage({
        message: inputMessage,
        conversationHistory
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        const botMessage = {
          role: 'assistant',
          content: res.reply,
          timestamp: res.timestamp
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('发送失败，请稍后重试');
      
      // 添加错误消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我现在无法回复。请稍后再试。',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 快捷问题
  const quickQuestions = [
    '如何发布帖子？',
    '如何修改个人信息？',
    '如何使用聊天功能？',
    '平台使用指南'
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  // 清空对话
  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '你好！我是 CanLifeHub AI 助手，有什么可以帮助你的吗？',
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="chatbot-widget-container">
      {/* 聊天窗口 */}
      {isOpen && (
        <div
          ref={widgetRef}
          className="chatbot-window"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* 头部 */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <span>🤖</span>
              </div>
              <div>
                <div className="chatbot-title">AI 助手</div>
                <div className="chatbot-status">在线</div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-action-btn"
                onClick={handleClearChat}
                title="清空对话"
              >
                🗑️
              </button>
              <button
                className="chatbot-action-btn"
                onClick={() => setIsOpen(false)}
                title="最小化"
              >
                ➖
              </button>
            </div>
          </div>

          {/* 消息区域 */}
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chatbot-message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-text typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 快捷问题 */}
          {messages.length === 1 && (
            <div className="chatbot-quick-questions">
              <div className="quick-questions-title">常见问题：</div>
              <div className="quick-questions-list">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="quick-question-btn"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区域 */}
          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              placeholder="输入消息..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <button
              className="chatbot-send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <span>➤</span>
            </button>
          </div>
        </div>
      )}

      {/* 浮动按钮 */}
      <button
        className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI 助手"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
