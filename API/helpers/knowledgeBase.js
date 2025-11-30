// API/helpers/knowledgeBase.js
// 知识库管理模块
const fs = require('fs');
const path = require('path');

// 加载知识库
let knowledgeBase = null;

function loadKnowledgeBase() {
  if (!knowledgeBase) {
    const filePath = path.join(__dirname, '../data/knowledge-base.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    knowledgeBase = JSON.parse(data);
  }
  return knowledgeBase;
}

// 获取特定语言的知识库
function getKnowledgeBase(language = 'zh') {
  const kb = loadKnowledgeBase();
  return kb[language] || kb['zh'];
}

// 搜索知识库 - 简单的关键词匹配
function searchKnowledge(query, language = 'zh') {
  const kb = getKnowledgeBase(language);
  const results = [];
  const lowerQuery = query.toLowerCase();

  // 搜索 FAQs
  if (kb.faqs) {
    kb.faqs.forEach(faq => {
      if (faq.question.toLowerCase().includes(lowerQuery) || 
          faq.answer.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: language === 'zh' ? 'FAQ' : 'FAQ',
          question: faq.question,
          answer: faq.answer,
          relevance: calculateRelevance(lowerQuery, faq.question + ' ' + faq.answer)
        });
      }
    });
  }

  // 搜索帮助主题
  if (kb.help_topics) {
    kb.help_topics.forEach(topic => {
      if (topic.topic.toLowerCase().includes(lowerQuery) || 
          topic.content.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: language === 'zh' ? '帮助主题' : 'Help Topic',
          topic: topic.topic,
          content: topic.content,
          relevance: calculateRelevance(lowerQuery, topic.topic + ' ' + topic.content)
        });
      }
    });
  }

  // 搜索常见问题
  if (kb.common_issues) {
    kb.common_issues.forEach(issue => {
      if (issue.issue.toLowerCase().includes(lowerQuery) || 
          issue.solution.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: language === 'zh' ? '常见问题' : 'Common Issue',
          issue: issue.issue,
          solution: issue.solution,
          relevance: calculateRelevance(lowerQuery, issue.issue + ' ' + issue.solution)
        });
      }
    });
  }

  // 搜索加拿大信息
  if (kb.canada_info) {
    const canadaCategories = ['study', 'immigration', 'living', 'employment'];
    canadaCategories.forEach(category => {
      const info = kb.canada_info[category];
      if (info && (info.category?.toLowerCase().includes(lowerQuery) || 
          JSON.stringify(info).toLowerCase().includes(lowerQuery))) {
        results.push({
          type: language === 'zh' ? '加拿大信息' : 'Canada Info',
          category: info.category,
          content: info,
          relevance: calculateRelevance(lowerQuery, JSON.stringify(info))
        });
      }
    });
  }

  // 按相关性排序并返回前 3 个结果
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 3);
}

// 简单的相关性计算（基于关键词出现次数）
function calculateRelevance(query, text) {
  const queryWords = query.split(/\s+/);
  let score = 0;
  
  queryWords.forEach(word => {
    if (word.length > 1) { // 忽略单字
      const regex = new RegExp(word, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
  });
  
  return score;
}

// 构建系统提示词（包含平台信息）
function buildSystemPrompt(language = 'zh') {
  const kb = getKnowledgeBase(language);
  
  if (language === 'zh') {
    return `你是 ${kb.platform_info.name} 的 AI 助手。

## 关于平台
${kb.platform_info.description}

## 主要功能
${kb.platform_info.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 你的职责
1. 帮助用户了解和使用 CanLifeHub 平台
2. 回答关于加拿大留学、移民、生活的问题
3. 提供友好、专业、准确的建议
4. 使用中文进行交流

## 回答原则
- 如果问题与平台功能相关，优先使用知识库信息
- 如果不确定答案，诚实告知并建议用户联系管理员
- 保持友好、礼貌的语气
- 回答简洁明了，避免过于冗长`;
  } else {
    return `You are the AI Assistant for ${kb.platform_info.name}.

## About Platform
${kb.platform_info.description}

## Key Features
${kb.platform_info.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Your Responsibilities
1. Help users understand and use the CanLifeHub platform
2. Answer questions about studying, immigrating, and living in Canada
3. Provide friendly, professional, and accurate advice
4. Communicate in English

## Guidelines
- If the question is related to platform features, prioritize using knowledge base information
- If unsure of the answer, honestly inform the user and suggest contacting the administrator
- Maintain a friendly and polite tone
- Keep answers concise and clear, avoid being overly verbose`;
  }
}

// 构建增强的提示词（包含检索到的知识）
function buildEnhancedPrompt(userMessage, searchResults, language = 'zh') {
  let prompt = userMessage;
  
  if (searchResults && searchResults.length > 0) {
    if (language === 'zh') {
      prompt = `【参考知识】\n`;
      
      searchResults.forEach((result, index) => {
        prompt += `\n${index + 1}. `;
        if (result.type === 'FAQ') {
          prompt += `问：${result.question}\n   答：${result.answer}`;
        } else if (result.type === '帮助主题') {
          prompt += `${result.topic}：${result.content}`;
        } else if (result.type === '常见问题') {
          prompt += `问题：${result.issue}\n   解决方案：${result.solution}`;
        } else if (result.type === '加拿大信息') {
          prompt += `${result.category}相关信息（已为你检索到相关内容）`;
        } else {
           prompt += `${result.type}: ${JSON.stringify(result)}`;
        }
      });
      
      prompt += `\n\n【用户问题】\n${userMessage}\n\n请基于以上参考知识回答用户问题。如果参考知识中没有相关信息，可以使用你的通用知识回答。回答要简洁明了。`;
    } else {
      prompt = `[Reference Knowledge]\n`;
      
      searchResults.forEach((result, index) => {
        prompt += `\n${index + 1}. `;
        if (result.type === 'FAQ') {
          prompt += `Q: ${result.question}\n   A: ${result.answer}`;
        } else if (result.type === 'Help Topic' || result.type === '帮助主题') {
          prompt += `${result.topic}: ${result.content}`;
        } else if (result.type === 'Common Issue' || result.type === '常见问题') {
          prompt += `Issue: ${result.issue}\n   Solution: ${result.solution}`;
        } else if (result.type === 'Canada Info' || result.type === '加拿大信息') {
          prompt += `${result.category} related info (retrieved for you)`;
        } else {
           prompt += `${result.type}: ${JSON.stringify(result)}`;
        }
      });
      
      prompt += `\n\n[User Question]\n${userMessage}\n\nPlease answer the user's question based on the reference knowledge above. If there is no relevant information in the reference knowledge, you can use your general knowledge. Keep the answer concise.`;
    }
  }
  
  return prompt;
}

module.exports = {
  loadKnowledgeBase,
  getKnowledgeBase,
  searchKnowledge,
  buildSystemPrompt,
  buildEnhancedPrompt
};
