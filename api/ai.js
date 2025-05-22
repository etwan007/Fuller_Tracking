export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Use your OpenRouter API key (set this in your environment variables)
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not set' });
  }

  try {
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324', // You can change to another free model if you want
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await openRouterRes.json();

    // Log the response for debugging
    console.log('OpenRouter response:', data);

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'OpenRouter error' });
    }

    const aiResponse = data.choices?.[0]?.message?.content || 'No response from AI.';
    res.status(200).json({ response: aiResponse });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from OpenRouter' });
  }
}