// API/controllers/chatbotController.js
// Gemini AI Chatbot 控制器
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { searchKnowledge, buildSystemPrompt, buildEnhancedPrompt } = require('../helpers/knowledgeBase');

// 初始化 Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===================== Chatbot 对话接口 /chat =====================
const chatWithBot = async (req, res) => {
  try {
    const { message, conversationHistory, language = 'zh' } = req.body;
    
    console.log(`[Chatbot] Received message (${language}):`, message);
    
    if (!message) {
      return res.json({ error: language === 'zh' ? '请输入消息' : 'Please enter a message' });
    }

    // 搜索知识库
    const searchResults = searchKnowledge(message, language);
    console.log('[Chatbot] Found', searchResults.length, 'relevant knowledge items');

    // 使用 gemini-2.0-flash 模型（最新稳定版本）
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: buildSystemPrompt(language) // 添加系统提示词
    });

    // 构建增强的用户消息（包含检索到的知识）
    const enhancedMessage = buildEnhancedPrompt(message, searchResults, language);
    console.log('[Chatbot] Enhanced prompt length:', enhancedMessage.length);

    // 简化方案：不使用对话历史，每次都是新对话
    // Gemini 对话历史格式要求严格，需要 user/model 交替出现
    const chat = model.startChat({
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // 发送消息并获取响应
    console.log('[Chatbot] Sending message to Gemini...');
    const result = await chat.sendMessage(enhancedMessage);
    const response = await result.response;
    const text = response.text();
    
    console.log('[Chatbot] Got response from Gemini');

    return res.json({ 
      ok: true, 
      reply: text,
      timestamp: new Date().toISOString(),
      knowledgeUsed: searchResults.length > 0 // 标记是否使用了知识库
    });

  } catch (error) {
    console.error('[Chatbot] ERROR:', error.message);
    console.error('[Chatbot] Full error:', error);
    const { language = 'zh' } = req.body;
    return res.status(500).json({ 
      error: language === 'zh' ? '抱歉，我现在无法回复。请稍后再试。' : 'Sorry, I cannot reply right now. Please try again later.',
      details: error.message 
    });
  }
};

module.exports = {
  chatWithBot,
};
