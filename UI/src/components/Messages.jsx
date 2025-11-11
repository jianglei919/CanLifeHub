import { useState } from "react";

const mockConversations = [
  {
    id: 1,
    name: "张三",
    avatar: "👨",
    lastMessage: "好的，周末见",
    unread: 0,
    messages: [
      { id: 1, sender: "张三", text: "你好，最近怎么样？", time: "10:30" },
      { id: 2, sender: "You", text: "不错啊，你呢？", time: "10:31" },
      { id: 3, sender: "张三", text: "我也不错，周末要不要一起吃饭？", time: "10:32" },
      { id: 4, sender: "You", text: "可以啊，什么时间？", time: "10:33" },
      { id: 5, sender: "张三", text: "好的，周末见", time: "10:34" },
    ],
  },
  {
    id: 2,
    name: "李四",
    avatar: "👩",
    lastMessage: "谢谢你的建议",
    unread: 2,
    messages: [
      { id: 1, sender: "李四", text: "请问有没有好的房源推荐？", time: "14:20" },
      { id: 2, sender: "You", text: "有的，我给你发一些链接", time: "14:21" },
      { id: 3, sender: "李四", text: "谢谢你的建议", time: "14:22" },
    ],
  },
];

export default function Messages() {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [showMessages, setShowMessages] = useState(false);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      const newMessage = {
        id: selectedConversation.messages.length + 1,
        sender: "You",
        text: messageInput,
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      
      const updatedConversations = conversations.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, messages: [...conv.messages, newMessage], lastMessage: messageInput }
          : conv
      );
      
      setConversations(updatedConversations);
      setSelectedConversation({
        ...selectedConversation,
        messages: [...selectedConversation.messages, newMessage],
      });
      setMessageInput("");
    }
  };

  if (showMessages && selectedConversation) {
    return (
      <div className="messages-view">
        <div className="messages-header">
          <button onClick={() => setShowMessages(false)}>返回</button>
          <h3>{selectedConversation.name}</h3>
        </div>

        <div className="messages-container">
          {selectedConversation.messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender === "You" ? "own" : "other"}`}>
              <div className="message-bubble">
                <p>{msg.text}</p>
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="message-input-area">
          <input
            type="text"
            placeholder="输入消息..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="message-input"
          />
          <button onClick={handleSendMessage} className="send-btn">发送</button>
          <button className="image-btn">📸</button>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-module">
      <div className="messages-title">
        <h3>私信</h3>
        <button className="new-message-btn">➕</button>
      </div>

      <div className="conversations-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="conversation-item"
            onClick={() => {
              setSelectedConversation(conv);
              setShowMessages(true);
            }}
          >
            <span className="conv-avatar">{conv.avatar}</span>
            <div className="conv-info">
              <div className="conv-name">{conv.name}</div>
              <div className="conv-message">{conv.lastMessage}</div>
            </div>
            {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
