export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { name } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Generate a genius profile for "${name}" for a prompt-building app. Return ONLY valid JSON (no markdown fences) with these fields:
- "specs": Short tagline under 60 chars of their key expertise, using bullet separators. Example: "Blockbuster master • Emotional resonance"
- "prompt": A rich second-person lore paragraph (3-5 sentences) written as "You were mentored by..." or "You channel..." that captures their unique philosophy, techniques, and mindset. Be specific with real details about their actual work, methods, and signature ideas. Make it feel like secret knowledge passed down.
- "power": A number 88-99 representing mastery level.`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}`, details: errText });
    }

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
