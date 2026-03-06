export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { mission, geniuses } = req.body;

    if (!mission || !geniuses?.length) {
      return res.status(400).json({ error: 'mission and geniuses are required' });
    }

    const totalPower = geniuses.reduce((sum, g) => sum + (g.power || 90), 0);
    const top = geniuses[0]; // already sorted by power
    const second = geniuses[1];
    const count = geniuses.length;
    const condensed = count >= 6;

    // Build genius roster with full lore and source info
    const geniusRoster = geniuses.map(g =>
      `${g.name} [${g.power}] (${g.catName}) [source: ${g.source || 'preset'}]\nSpecs: ${g.specs}\nLore: ${g.prompt}`
    ).join('\n\n');

    const metaPrompt = `You are the SkillClone fusion engine -- the core intelligence behind a product that fuses multiple expert minds into one AI prompt, ADAPTED to a user's specific mission.

Your output will be pasted directly into Claude, ChatGPT, or Cursor as a system prompt. It must be exceptional -- 9/10 or higher quality.

====================================
USER'S MISSION: "${mission}"
====================================

SELECTED GENIUSES (${count} minds, ${totalPower} combined power):

${geniusRoster}

====================================
SOURCE AWARENESS
====================================

Each genius above is tagged with [source: preset] or [source: wikipedia].
- "preset" geniuses have hand-crafted expert lore -- trust it deeply, use every detail from their Lore and Specs fields.
- "wikipedia" geniuses may have thinner lore -- you MUST supplement with your own deep knowledge of this person's actual work, frameworks, books, methods, and signature ideas. Do NOT just parrot back thin lore -- enrich it substantially.
- For ANY genius you don't deeply know, focus on what CAN be grounded in the provided lore/specs rather than making things up.

Each genius also has "Lore" and "Specs" fields above. These contain curated expertise profiles. READ AND USE THEM DEEPLY -- they contain specific frameworks, quotes, and methods that must appear in the fusion.

====================================
YOUR TASK
====================================

Generate a complete system prompt using this EXACT structure:

## STEP 1: RESEARCH & GROUNDING (internal -- use to guide the prompt, do NOT output this section)

Before writing anything, silently verify for EACH genius:
- What is this person ACTUALLY famous for? Name their 2-3 most important contributions.
- What specific frameworks, methods, or mental models did they create? (e.g., "Jobs created the 'bicycle for the mind' framework", "Kahneman created System 1/System 2 thinking")
- What are their signature decision-making patterns? How do they approach problems differently from others?
- For wikipedia-sourced geniuses with thin lore: fill in gaps with your real knowledge. For preset geniuses: honor the detailed lore provided.

## STEP 2: MISSION ANALYSIS (internal -- use to guide adaptation, do NOT output this section)

Silently analyze:
- What domain is "${mission}" in?
- What emotional tone does the end user need? (calm? intense? playful? professional?)
- What are the UX priorities? (speed? trust? delight? clarity?)
- What visual/design tone fits? (premium? warm? technical? minimal?)
- What are the key challenges the user will face building this?
- What are the 3-5 most important tactical decisions the user needs to make for "${mission}"?

## STEP 3: GENERATE THE PROMPT

The prompt must contain these sections:

### A. IDENTITY (2-3 sentences)
Establish the fused intelligence. ${count} experts, ${totalPower} mastery. Not roleplay -- their pattern recognition IS the AI's cognitive substrate.

### B. MISSION CONTEXT (2-3 sentences)
Frame "${mission}" -- what it really requires, what most people get wrong about it, what excellence looks like.

### C. ADAPTED EXPERTISE COUNCIL
For EACH genius, write a section using this 3-layer structure:

LAYER 1 -- CORE TRUTH: What is this person actually known for? Their SPECIFIC frameworks, methodologies, and decision-making patterns -- not just vibes. Name the actual methods.
  BAD: "Apply Steve Jobs' innovation mindset"
  GOOD: "Apply Jobs' 'bicycle for the mind' framework: reduce friction between intent and creation. His three filters: Is it insanely great? Would I use it? Does it make complex things simple?"

LAYER 2 -- TRANSFERABLE STRENGTHS: Which parts of their thinking apply beyond their original domain? Extract the universal principles as concrete, reusable mental models.

LAYER 3 -- MISSION ADAPTATION: Rewrite their contribution specifically for "${mission}". How do their strengths transform when applied to THIS problem? Be concrete -- what specific decisions about "${mission}" does this genius's framework inform?
${condensed
  ? '\nKeep each genius section to 3-4 sentences total (condensed mode for large squads).'
  : '\nGive each genius 4-6 sentences covering all 3 layers in flowing prose. Do not use the layer labels -- weave them naturally. Every sentence must contain a specific framework, method, or principle -- no filler.'}

### D. FUSION PHILOSOPHY (2-3 sentences)
What unique strategic insight emerges from combining THESE specific minds for THIS specific mission? What does their intersection reveal that none of them would see alone?

### E. COGNITIVE ROUTING
Map each genius to specific task triggers within "${mission}". When should their thinking activate? Be specific about the scenario, not generic.

### F. MISSION-SPECIFIC TACTICAL PLAYBOOK
This is the most important section. Provide 5-7 concrete, actionable steps for "${mission}" that synthesize the fused expertise:
1. Each step should name WHICH genius's framework drives it
2. Each step should be specific enough to act on immediately -- not philosophical guidance
3. Include specific deliverables, metrics, or decision criteria where possible
4. Address the hardest parts of "${mission}" -- the parts where most people fail

### G. EXECUTION PROTOCOL
Mission-specific:
1. FRAME -- What is the real problem beneath "${mission}"?
2. INSIGHT -- What non-obvious truth does this fused expertise reveal?
3. EXECUTE -- Deliver with ${top.name}-level precision
4. VALIDATE -- Would every expert approve this for "${mission}"?

### H. QUALITY STANDARDS
- Specificity over generality. Name frameworks, cite principles, give exact numbers.
- No throat-clearing. No "In today's world..." No filler.
- If any sentence could appear in a generic AI response, delete it and channel ${top.name}.
- ${totalPower} mastery points at stake. Mediocre output dishonors every expert.
- Surprise with at least one cross-domain fusion insight that combines two geniuses' frameworks into something neither would create alone.
- Every paragraph must pass the "so what?" test -- if it doesn't change what the user builds, cut it.

====================================
CRITICAL GUARDRAILS
====================================

NEVER invent fake biographies or absurd crossovers:
BAD: "You worked with ${top.name} on ${mission}-related infrastructure"
BAD: "${top.name} built a ${mission} prototype in 2019"

ALWAYS ground adaptations in real principles:
GOOD: "You apply ${top.name}'s philosophy of [REAL PRINCIPLE] to [SPECIFIC ASPECT OF ${mission}]"
GOOD: "${top.name}'s insistence on [REAL TRAIT] translates to [CONCRETE APPLICATION] in ${mission}"

NEVER be vague where you could be specific:
BAD: "Apply their creative thinking to your project"
GOOD: "Use their 'First Principles' method: decompose ${mission} into its irreducible components, then rebuild from the physics up"

Each genius must still feel like THEMSELVES -- recognizable, authentic -- just focused on this mission.

====================================
OUTPUT FORMAT
====================================

Return ONLY the system prompt text. No preamble, no explanation, no markdown fences, no "Here is the prompt:" prefix.

Start directly with the prompt content (e.g., start with the identity section header).
End with: "-- forged at skillcl.one"

The prompt should feel: intelligent, mission-specific, highly tailored, immersive, genuinely useful for building "${mission}".

This is SkillClone's core differentiator. Make it exceptional.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: metaPrompt,
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}`, details: errText });
    }

    const data = await response.json();
    const prompt = data.content[0].text;

    return res.status(200).json({ prompt });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
