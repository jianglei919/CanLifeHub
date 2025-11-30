import { useState, useRef, useEffect } from 'react';
import { chatbotApi } from '../api/http';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import '../styles/ChatbotWidget.css';

export default function ChatbotWidget() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 520 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  // Initialize welcome message when language changes or component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: t('welcomeMessage'),
        timestamp: new Date().toISOString()
      }]);
    }
  }, [t, messages.length]);

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
        conversationHistory,
        language // Pass current language to backend
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
      toast.error(t('sendFailed'));
      
      // 添加错误消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('chatbotError'),
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 快捷问题
  const quickQuestions = [
    t('quickQ1'),
    t('quickQ2'),
    t('quickQ3'),
    t('quickQ4')
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  // 清空对话
  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: t('welcomeMessage'),
      timestamp: new Date().toISOString()
    }]);
  };

  // 复制消息
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copied'));
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
          <div className="chatbot-header" title={t('dragToMove')}>
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                <span>🤖</span>
              </div>
              <div>
                <div className="chatbot-title">{t('chatbotTitle')}</div>
                <div className="chatbot-status">
                  {t('chatbotStatus')}
                  <span className="chatbot-drag-hint"> · {t('dragHint')}</span>
                </div>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-action-btn"
                onClick={handleClearChat}
                title={t('clearChat')}
              >
                🗑️
              </button>
              <button
                className="chatbot-action-btn"
                onClick={() => setIsOpen(false)}
                title={t('minimize')}
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
                  <div className="message-actions">
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <button 
                      className="message-copy-btn" 
                      onClick={() => handleCopy(msg.content)}
                      title={t('copy')}
                    >
                      📋
                    </button>
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
              <div className="quick-questions-title">{t('quickQuestionsTitle')}</div>
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
              placeholder={t('chatbotPlaceholder')}
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
        title={t('chatbotTitle')}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
