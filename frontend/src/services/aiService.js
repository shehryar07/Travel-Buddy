import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const systemPrompt = `You are a helpful travel advisor for Pakistan. Your role is to:
1. Provide accurate and helpful information about travel in Pakistan
2. Answer questions about hotels, tours, transportation, and local attractions
3. Give practical advice about weather, best times to visit, and cultural considerations
4. Help with booking processes and travel planning
5. Be friendly and professional in your responses
6. Always prioritize safety and local customs in your advice

Important guidelines:
- Focus on Pakistan-specific information
- Be concise but informative
- Include practical tips when relevant
- Mention our services when appropriate
- Always maintain a helpful and positive tone`;

export const getAIResponse = async (userMessage) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
}; 