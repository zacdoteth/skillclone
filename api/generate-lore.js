export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { name, wikiContext, mission } = req.body;

    const missionContext = mission
      ? `\n\nThe user is building: "${mission}"\nTailor the lore to emphasize the aspects of ${name}'s expertise most relevant to this mission. Do NOT invent fake history (e.g., "${name} built dashboards for ${mission}"). Instead, adapt their REAL principles to this domain (e.g., "Apply ${name}'s philosophy of [real principle] to [mission-specific application]").`
      : '';

    const wikiInfo = wikiContext
      ? `\n\nReal context about this person:\nDescription: ${wikiContext.description || 'N/A'}\nSummary: ${(wikiContext.summary || '').slice(0, 800)}\n\nUse these REAL details to make the lore specific and accurate. Ground everything in their actual work and philosophy.`
      : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Generate a genius profile for "${name}" for SkillClone, a deck-builder for superhuman AI prompts.${wikiInfo}${missionContext}

Research this person deeply. What are their 2-3 most transferable mental models? What specific techniques or frameworks did they create or popularize? Be extremely concrete — name the actual methods, books, speeches, products, or ideas.

Return ONLY valid JSON (no markdown fences) with these fields:
- "specs": Short tagline under 60 chars of their key expertise, using bullet separators. Example: "Blockbuster master \u2022 Emotional resonance"
- "prompt": A rich second-person lore paragraph (4-6 sentences) written as "You channel ${name}..." that captures their unique philosophy, techniques, and mindset. Extract their REAL frameworks, methodologies, and signature concepts — not just "they are known for X" but "their framework is: step 1, step 2, step 3" level detail. Name specific books, methods, frameworks, or products they created. Write it like the user has absorbed decades of this person's hard-won expertise. Include at least one direct quote or signature concept. Make it feel like secret knowledge passed down.${mission ? ` End with one sentence connecting their expertise to "${mission}".` : ''}
- "power": A number 88-99 representing mastery level (higher = more famous/impactful).`
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
