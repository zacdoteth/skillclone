export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { intent, geniusList } = req.body;

    if (!intent?.trim() || !geniusList?.length) {
      return res.status(400).json({ error: 'intent and geniusList are required' });
    }

    const roster = geniusList.map(g => `${g.id}: ${g.name} (${g.catName}) — ${g.specs}`).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are the SkillClone genius picker. The user wants to build: "${intent}"

Pick exactly 3 geniuses from this roster that would create the BEST fusion for their goal. Choose for maximum synergy — pick complementary experts, not redundant ones. Prioritize relevance and cross-domain power.

ROSTER:
${roster}

Return ONLY a JSON array of exactly 3 genius IDs, e.g. ["steve-jobs", "david-ogilvy", "john-carmack"]
No explanation. Just the JSON array.`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}`, details: errText });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();
    const picks = JSON.parse(text);

    return res.status(200).json({ picks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
