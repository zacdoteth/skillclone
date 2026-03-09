const MODEL = 'claude-sonnet-4-6';
const PROMPT_CHAR_BUDGET = 3600;

const ARTIFACT_PROFILES = [
  {
    id: 'landing_page',
    outputMode: 'landing_page',
    patterns: ['landing page', 'homepage', 'marketing site', 'launch page', 'website', 'site'],
    platform: 'responsive web',
    uiDirection: 'premium conversion-first landing page',
    businessModel: 'waitlist or subscription funnel',
    successMetric: 'a cold visitor understands the value in under 10 seconds and converts',
    firstReleaseGoal: 'ship a public-facing page that explains the product, captures demand, and routes users into activation',
    v1Boundary: 'one strong page, one primary CTA, one conversion flow, zero dead sections',
    stack: {
      frontend: 'Next.js + TypeScript + Tailwind',
      backend: 'Next.js server actions or minimal API routes',
      data: 'Supabase Postgres for leads and events',
      auth: 'No auth unless gated content requires it',
      ai: 'Optional; only if the page itself needs live generation',
      payments: 'Stripe Payment Link or Checkout if selling immediately',
      deployment: 'Vercel',
    },
    integrations: ['Plausible or PostHog', 'Email capture', 'Stripe'],
    outputContract: [
      ['Product Thesis', 'wedge, audience, why this page converts'],
      ['Assumptions', 'defaults and why they are sane'],
      ['Section Map', 'hero to CTA with narrative order'],
      ['Messaging', 'headline, proof, objection handling'],
      ['Stack', 'page architecture, forms, analytics, deploy'],
      ['UI Direction', 'layout, motion, typography, hierarchy'],
      ['Build Plan', 'smallest sequence to ship'],
      ['Master Build Prompt', 'copy-paste prompt for Claude/Cursor'],
      ['Acceptance Criteria', 'responsive, fast, clear, conversion-ready'],
      ['Launch Plan', 'publish, test, collect first users'],
    ],
  },
  {
    id: 'web_app',
    outputMode: 'web_app',
    patterns: ['app', 'dashboard', 'platform', 'tool', 'saas', 'product', 'portal', 'crm', 'marketplace'],
    platform: 'desktop/mobile web',
    uiDirection: 'clean premium SaaS with fast time-to-value',
    businessModel: 'freemium plus subscription',
    successMetric: 'a new user reaches the first meaningful outcome in a single session',
    firstReleaseGoal: 'ship a focused v1 that proves the core loop with real users and real data',
    v1Boundary: 'one killer workflow, one core data model, minimum settings, minimum polish needed for trust',
    stack: {
      frontend: 'Next.js + TypeScript + Tailwind',
      backend: 'Next.js API routes or server actions',
      data: 'Supabase Postgres',
      auth: 'Supabase Auth or Clerk',
      ai: 'Anthropic or OpenAI only where it powers the core user outcome',
      payments: 'Stripe subscriptions when monetized',
      deployment: 'Vercel',
    },
    integrations: ['Analytics', 'Error monitoring', 'Stripe', 'Email'],
    outputContract: [
      ['Product Thesis', 'wedge, pain, differentiator'],
      ['Assumptions', 'defaults and product bets'],
      ['Core Features', 'only what is required for v1'],
      ['User Flow', 'happy path from signup to value'],
      ['Stack', 'frontend, backend, data, auth, AI, billing'],
      ['Data Model', 'entities, fields, relations'],
      ['UI Direction', 'screens, hierarchy, interaction tone'],
      ['Build Plan', 'implementation order with milestones'],
      ['Master Build Prompt', 'copy-paste prompt for Claude/Cursor'],
      ['Acceptance + Launch', 'done definition, QA, first-user rollout'],
    ],
  },
  {
    id: 'design_system',
    outputMode: 'design_system',
    patterns: ['design system', 'component library', 'ui kit', 'brand system'],
    platform: 'web design and front-end system',
    uiDirection: 'coherent, reusable, token-driven interface system',
    businessModel: 'internal leverage or product enablement',
    successMetric: 'design and engineering can build consistently without reinvention',
    firstReleaseGoal: 'ship the minimum reusable system required to support the product',
    v1Boundary: 'tokens, typography, color, spacing, core components, and usage rules only',
    stack: {
      frontend: 'Next.js + TypeScript + Tailwind or CSS variables',
      backend: 'No dedicated backend unless docs or theme persistence requires it',
      data: 'No database unless documentation or theming requires storage',
      auth: 'No auth for internal docs unless needed',
      ai: 'Optional only for token generation or copy support',
      payments: 'None for internal system work',
      deployment: 'Vercel or static hosting',
    },
    integrations: ['Figma', 'Storybook or docs route'],
    outputContract: [
      ['System Thesis', 'what the system should make easier'],
      ['Assumptions', 'product context and defaults'],
      ['Tokens', 'type, color, spacing, radius, motion'],
      ['Core Components', 'variants, states, interaction rules'],
      ['Usage Rules', 'layout, hierarchy, accessibility, tone'],
      ['Implementation Stack', 'token source, components, docs'],
      ['Adoption Plan', 'how it lands in the product'],
      ['Master Build Prompt', 'copy-paste prompt for Claude/Cursor'],
      ['Acceptance Criteria', 'consistency, reusability, clarity'],
      ['Launch Plan', 'rollout to screens and teams'],
    ],
  },
  {
    id: 'content_system',
    outputMode: 'content_system',
    patterns: ['youtube', 'script', 'thread', 'newsletter', 'content', 'video', 'podcast'],
    platform: 'content production workflow',
    uiDirection: 'clear, punchy, audience-retentive output',
    businessModel: 'audience growth leading to sponsorships, products, or services',
    successMetric: 'the piece hooks instantly and earns completion, response, or conversion',
    firstReleaseGoal: 'ship a repeatable content machine, not just one asset',
    v1Boundary: 'one format, one audience, one publishing loop, one monetization path',
    stack: {
      frontend: 'Notion or lightweight web app if tooling is required',
      backend: 'Minimal workflow automation only if publishing needs it',
      data: 'Spreadsheet or Postgres if tracking pipeline performance',
      auth: 'Not required unless multiple collaborators are involved',
      ai: 'Prompt workflow centered on ideation, outlining, and drafting',
      payments: 'Optional if selling templates or memberships',
      deployment: 'Optional unless shipping a supporting site',
    },
    integrations: ['YouTube or X workflow', 'Analytics', 'Docs or CMS'],
    outputContract: [
      ['Thesis', 'audience pain, format, promise'],
      ['Assumptions', 'defaults about channel, cadence, tone'],
      ['Format Blueprint', 'hook, structure, pacing, CTA'],
      ['Production Loop', 'research, draft, edit, publish'],
      ['Distribution', 'title, packaging, posting strategy'],
      ['Stack', 'tools, workflow, automation if needed'],
      ['Quality Bar', 'retention, specificity, proof'],
      ['Master Build Prompt', 'copy-paste prompt for Claude/Cursor'],
      ['Acceptance Criteria', 'ready to publish without fluff'],
      ['Launch Plan', 'first batch, testing, iteration'],
    ],
  },
  {
    id: 'automation_system',
    outputMode: 'automation_system',
    patterns: ['automation', 'workflow', 'agent', 'ops', 'n8n', 'zapier'],
    platform: 'automated workflow system',
    uiDirection: 'debuggable, reliable, low-friction operations layer',
    businessModel: 'internal leverage or subscription if exposed as product value',
    successMetric: 'the workflow saves real manual time without breaking under messy input',
    firstReleaseGoal: 'ship one automation that reliably handles the critical path',
    v1Boundary: 'one trigger, one happy path, explicit retries, explicit failure handling',
    stack: {
      frontend: 'Optional thin admin surface',
      backend: 'n8n, Make, or Next.js API endpoints',
      data: 'Postgres or workflow-native storage',
      auth: 'Service credentials and minimal operator access',
      ai: 'Use only where judgment is required and can be evaluated',
      payments: 'Optional unless sold as product value',
      deployment: 'Vercel plus workflow host or self-hosted n8n',
    },
    integrations: ['Webhook layer', 'Queue or retry strategy', 'Logging'],
    outputContract: [
      ['System Thesis', 'what gets automated and why'],
      ['Assumptions', 'defaults and operating boundaries'],
      ['Workflow Map', 'trigger, steps, branches, outputs'],
      ['Failure Handling', 'retries, alerts, dead-letter logic'],
      ['Stack', 'workflow engine, APIs, storage, auth'],
      ['Data Model', 'payloads, states, audit trail'],
      ['Operator UX', 'visibility, controls, debugging'],
      ['Build Plan', 'smallest reliable version first'],
      ['Master Build Prompt', 'copy-paste prompt for Claude/Cursor'],
      ['Acceptance + Launch', 'reliability checks and rollout'],
    ],
  },
  {
    id: 'strategy_plan',
    outputMode: 'strategy_plan',
    patterns: ['business plan', 'go to market', 'gtm', 'launch strategy', 'pricing', 'strategy'],
    platform: 'business strategy document',
    uiDirection: 'clear, sharp, commercially grounded',
    businessModel: 'business-model specific',
    successMetric: 'the plan yields a focused launch path with measurable bets',
    firstReleaseGoal: 'ship a strategy that can be executed immediately by a tiny team',
    v1Boundary: 'one target segment, one offer, one channel, one monetization path',
    stack: {
      frontend: 'No product stack required unless tied to a software deliverable',
      backend: 'No backend required unless tied to execution tooling',
      data: 'Spreadsheet or Postgres only if tracking execution',
      auth: 'Not required',
      ai: 'Optional for research synthesis or content generation',
      payments: 'Stripe or invoicing if selling directly',
      deployment: 'Optional',
    },
    integrations: ['Analytics', 'CRM or leads sheet'],
    outputContract: [
      ['Thesis', 'market pain, angle, wedge'],
      ['Assumptions', 'defaults about audience and offer'],
      ['Offer', 'what is sold and why it wins'],
      ['Channel Plan', 'how attention and demand are created'],
      ['Monetization', 'pricing, packaging, conversion path'],
      ['Execution Plan', 'what happens this week, this month'],
      ['Measurement', 'metrics and review cadence'],
      ['Master Build Prompt', 'copy-paste prompt for Claude/Cursor'],
      ['Acceptance Criteria', 'what makes the strategy usable'],
      ['Launch Plan', 'first 10 users or buyers'],
    ],
  },
];

const CATEGORY_ALIASES = {
  film: ['film', 'video', 'cinema'],
  product: ['product', 'tech'],
  copy: ['copy', 'marketing'],
  strategy: ['strategy', 'business'],
  content: ['content', 'social'],
  writing: ['writing'],
  engineering: ['engineering', 'code', 'developer'],
  design: ['design'],
  artists: ['artist', 'art'],
  growth: ['growth'],
  automation: ['automation'],
  music: ['music', 'audio'],
  psychology: ['psychology'],
  custom: ['custom'],
  discovered: ['knowledge', 'discovered'],
};

const CATEGORY_ROLE_WEIGHTS = {
  governor: {
    landing_page: { design: 4, copy: 4, product: 3, strategy: 3, growth: 2, content: 2, engineering: 1 },
    web_app: { product: 4, design: 3, engineering: 3, strategy: 2, copy: 1, automation: 1 },
    design_system: { design: 5, product: 3, engineering: 2 },
    content_system: { content: 4, copy: 4, writing: 4, film: 2, growth: 2 },
    automation_system: { automation: 4, engineering: 4, product: 2, strategy: 1 },
    strategy_plan: { strategy: 5, copy: 2, growth: 2, product: 2 },
  },
  builder: {
    landing_page: { engineering: 4, product: 3, design: 2, copy: 1 },
    web_app: { engineering: 5, automation: 3, product: 3, design: 1 },
    design_system: { engineering: 3, design: 4, product: 2 },
    content_system: { writing: 3, content: 4, copy: 3, engineering: 1 },
    automation_system: { automation: 5, engineering: 4, product: 1 },
    strategy_plan: { strategy: 3, growth: 3, product: 2, engineering: 1 },
  },
  operator: {
    landing_page: { copy: 4, strategy: 3, growth: 4, psychology: 3, product: 1 },
    web_app: { strategy: 3, growth: 3, copy: 2, psychology: 2, product: 2 },
    design_system: { product: 2, design: 2, strategy: 1 },
    content_system: { growth: 4, content: 4, psychology: 3, copy: 3 },
    automation_system: { automation: 3, strategy: 2, psychology: 2, engineering: 2 },
    strategy_plan: { strategy: 5, growth: 4, copy: 3, psychology: 3 },
  },
};

const ROLE_PRIORITY = {
  governor: 0,
  builder: 1,
  operator: 2,
  specialist: 3,
};

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function tidyMultiline(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(value, max = 220) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}...`;
}

function titleCase(value) {
  return cleanText(value)
    .split(' ')
    .map(part => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}

function uniq(items) {
  return [...new Set((items || []).map(item => cleanText(item)).filter(Boolean))];
}

function containsAny(text, needles) {
  return needles.some(needle => text.includes(needle));
}

function inferArtifactProfile(mission) {
  const text = mission.toLowerCase();
  for (const profile of ARTIFACT_PROFILES) {
    if (containsAny(text, profile.patterns)) return profile;
  }
  return ARTIFACT_PROFILES.find(profile => profile.id === 'web_app');
}

function inferAudience(mission, artifact) {
  const normalized = cleanText(mission);
  const lower = normalized.toLowerCase();
  const patterns = [
    /(?:for|to help|helping|used by|built for) ([^,.]+)/i,
    /([a-z0-9 +\-/]+) app for ([^,.]+)/i,
    /([a-z0-9 +\-/]+) tool for ([^,.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const picked = match[match.length - 1];
      if (picked && picked.length > 2) return cleanText(picked);
    }
  }

  const knownAudiences = [
    'founders', 'developers', 'designers', 'creators', 'marketers', 'students', 'teachers',
    'agencies', 'freelancers', 'sales teams', 'recruiters', 'operators', 'parents',
    'real estate agents', 'med students', 'lawyers', 'startups', 'small businesses',
    'solopreneurs', 'product teams', 'content teams', 'gamers'
  ];

  const match = knownAudiences.find(audience => lower.includes(audience));
  if (match) return match;

  switch (artifact.outputMode) {
    case 'landing_page':
      return 'cold visitors with the exact pain this product solves';
    case 'content_system':
      return 'one narrow audience with a repeated pain worth publishing for';
    case 'strategy_plan':
      return 'the smallest beatable market for the offer';
    default:
      return 'early adopters with acute pain and willingness to try a focused v1';
  }
}

function inferCoreJob(mission, artifact) {
  const text = cleanText(mission)
    .replace(/^build /i, '')
    .replace(/^create /i, '')
    .replace(/^make /i, '');

  const lower = text.toLowerCase();
  if (artifact.outputMode === 'landing_page') return 'explain the value fast, create desire, and convert attention into action';
  if (artifact.outputMode === 'content_system') return 'package an idea so the audience clicks, stays, and takes the desired next step';
  if (artifact.outputMode === 'design_system') return 'turn taste into a reusable system that speeds up product execution';
  if (artifact.outputMode === 'automation_system') return 'replace manual repetitive work with a reliable, inspectable workflow';
  if (artifact.outputMode === 'strategy_plan') return 'define the wedge, offer, channel, and monetization path clearly enough to execute immediately';
  if (lower.includes('dashboard')) return 'help users see the right information quickly and act on it confidently';
  if (lower.includes('marketplace')) return 'match supply and demand with enough trust to complete the transaction';
  if (lower.includes('tutor') || lower.includes('learn')) return 'move the user from confusion to clear progress fast';
  return `turn "${truncate(text, 120)}" into a focused product that delivers value in one session`;
}

function inferPlatform(mission, artifact) {
  const lower = mission.toLowerCase();
  if (containsAny(lower, ['ios', 'android', 'mobile app', 'react native', 'expo'])) return 'mobile app';
  if (containsAny(lower, ['desktop app', 'electron', 'mac app'])) return 'desktop app';
  if (containsAny(lower, ['chrome extension', 'extension'])) return 'browser extension';
  return artifact.platform;
}

function inferUiDirection(mission, artifact) {
  const lower = mission.toLowerCase();
  const vibes = [];
  if (containsAny(lower, ['awwwards', 'cinematic', 'editorial'])) vibes.push('editorial');
  if (containsAny(lower, ['premium', 'luxury', 'high-end'])) vibes.push('premium');
  if (containsAny(lower, ['dark'])) vibes.push('dark');
  if (containsAny(lower, ['playful', 'nintendo'])) vibes.push('playful');
  if (containsAny(lower, ['minimal', 'clean'])) vibes.push('minimal');
  if (containsAny(lower, ['3d', 'three.js', 'threejs'])) vibes.push('3D accents used sparingly');
  if (vibes.length) return uniq(vibes).join(', ');
  return artifact.uiDirection;
}

function inferBusinessModel(mission, artifact) {
  const lower = mission.toLowerCase();
  if (containsAny(lower, ['internal', 'personal tool', 'for myself', 'open source'])) return 'internal leverage first; monetization optional';
  if (containsAny(lower, ['marketplace'])) return 'take-rate marketplace or subscription plus take-rate';
  if (containsAny(lower, ['agency', 'service'])) return 'lead generation into service revenue';
  if (containsAny(lower, ['course', 'newsletter'])) return 'audience growth into sponsorships, products, or paid membership';
  if (containsAny(lower, ['free'])) return 'free entry with upgrade path once value is proven';
  return artifact.businessModel;
}

function inferSuccessMetric(mission, artifact) {
  const lower = mission.toLowerCase();
  if (containsAny(lower, ['launch', 'mvp', 'ship fast'])) return 'a real user can use the core loop without guidance and come back for it';
  if (containsAny(lower, ['landing page', 'homepage'])) return 'visitors understand the offer instantly and the page earns clicks or signups';
  if (containsAny(lower, ['youtube', 'script', 'thread', 'newsletter'])) return 'the asset hooks instantly, holds attention, and drives the intended action';
  return artifact.successMetric;
}

function inferFirstReleaseGoal(mission, artifact) {
  const lower = mission.toLowerCase();
  if (containsAny(lower, ['weekend', 'this week', 'fast', 'mvp'])) return 'ship the smallest credible version that proves demand and teaches what to build next';
  return artifact.firstReleaseGoal;
}

function inferV1Boundary(mission, artifact) {
  const lower = mission.toLowerCase();
  const constraints = [];
  if (containsAny(lower, ['mvp', 'fast', 'weekend'])) constraints.push('treat this as an MVP, not a platform');
  if (containsAny(lower, ['solo', 'alone'])) constraints.push('optimize for a solo founder or tiny team');
  if (containsAny(lower, ['ai'])) constraints.push('use AI only where it drives the core value, not as decoration');
  if (containsAny(lower, ['3d', 'three.js', 'threejs'])) constraints.push('protect 60fps and keep spectacle subordinate to clarity');
  return constraints.length ? constraints.join(' | ') : artifact.v1Boundary;
}

function inferConstraints(mission, artifact) {
  const lower = mission.toLowerCase();
  const constraints = [];
  if (containsAny(lower, ['mvp', 'fast', 'ship', 'launch'])) constraints.push('bias toward the smallest shippable v1');
  if (containsAny(lower, ['weekend', 'this week'])) constraints.push('scope to what a tiny team can ship in days, not months');
  if (containsAny(lower, ['mobile'])) constraints.push('mobile usability cannot be a second pass');
  if (containsAny(lower, ['3d', 'three.js', 'threejs'])) constraints.push('protect frame rate before adding spectacle');
  if (containsAny(lower, ['b2b', 'enterprise'])) constraints.push('trust and clarity matter more than novelty');
  if (!constraints.length) constraints.push('prefer decisive defaults over optionality');
  constraints.push('do not ask follow-up questions unless missing detail makes the answer unsafe or impossible');
  return uniq(constraints);
}

function inferAssumptions(mission, artifact, platform) {
  const lower = mission.toLowerCase();
  const assumptions = [];
  if (!containsAny(lower, ['next.js', 'nextjs', 'react native', 'expo', 'three.js', 'threejs', 'svelte', 'vue'])) {
    assumptions.push(`default to ${artifact.stack.frontend}`);
  }
  if (!containsAny(lower, ['supabase', 'firebase', 'postgres', 'sql', 'mongodb'])) {
    assumptions.push(`default data layer to ${artifact.stack.data}`);
  }
  if (!containsAny(lower, ['stripe', 'pricing', 'subscription', 'checkout', 'payment'])) {
    assumptions.push(`assume monetization path is ${artifact.businessModel}`);
  }
  if (!containsAny(lower, ['design', 'style', 'vibe', 'look', 'feel', 'awwwards', 'minimal', 'premium', 'playful', 'dark'])) {
    assumptions.push(`default UI direction to ${artifact.uiDirection}`);
  }
  if (!containsAny(lower, ['ios', 'android', 'desktop', 'mobile', 'responsive'])) {
    assumptions.push(`assume primary platform is ${platform}`);
  }
  return uniq(assumptions).slice(0, 4);
}

function inferHiddenRequirements(artifact) {
  const defaults = {
    landing_page: ['analytics', 'event tracking', 'form validation', 'success states', 'SEO metadata'],
    web_app: ['onboarding', 'empty states', 'error states', 'analytics', 'usage instrumentation'],
    design_system: ['token naming', 'component states', 'responsive rules', 'docs examples'],
    content_system: ['content packaging', 'editing pass', 'publishing cadence', 'performance review'],
    automation_system: ['logging', 'retries', 'idempotency', 'manual recovery path'],
    strategy_plan: ['pricing test', 'distribution test', 'customer feedback loop', 'metrics review'],
  };
  return defaults[artifact.outputMode] || ['analytics', 'error handling', 'empty states'];
}

function inferStack(mission, artifact, platform) {
  const lower = mission.toLowerCase();
  const stack = { ...artifact.stack };

  if (containsAny(lower, ['three.js', 'threejs', 'react three fiber', 'r3f'])) {
    stack.frontend = 'Next.js + TypeScript + Tailwind + React Three Fiber';
  }
  if (containsAny(lower, ['expo', 'react native'])) {
    stack.frontend = 'Expo + React Native + TypeScript';
    stack.deployment = 'Expo EAS';
    stack.auth = 'Supabase Auth';
  }
  if (containsAny(lower, ['supabase'])) {
    stack.data = 'Supabase Postgres';
    stack.auth = 'Supabase Auth';
  }
  if (containsAny(lower, ['clerk'])) {
    stack.auth = 'Clerk';
  }
  if (containsAny(lower, ['firebase'])) {
    stack.data = 'Firebase';
    stack.auth = 'Firebase Auth';
  }
  if (containsAny(lower, ['sqlite'])) {
    stack.data = 'SQLite';
  }
  if (containsAny(lower, ['stripe'])) {
    stack.payments = 'Stripe';
  }
  if (containsAny(lower, ['anthropic', 'claude'])) {
    stack.ai = 'Anthropic API';
  } else if (containsAny(lower, ['openai', 'gpt'])) {
    stack.ai = 'OpenAI API';
  }
  if (platform === 'browser extension') {
    stack.frontend = 'Plasmo or Vite browser extension + React';
    stack.deployment = 'Chrome Web Store';
  }

  return stack;
}

function normalizeCategory(catName) {
  const text = cleanText(catName).toLowerCase();
  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some(alias => text.includes(alias))) return category;
  }
  return 'custom';
}

function capabilitySeedsForCategory(category) {
  const seeds = {
    film: ['emotional pacing', 'spectacle with meaning', 'visual drama'],
    product: ['scope decisions', 'product clarity', 'premium usefulness'],
    copy: ['headline discipline', 'offer framing', 'conversion clarity'],
    strategy: ['market wedge', 'pricing logic', 'distribution choices'],
    content: ['hooks', 'retention', 'audience packaging'],
    writing: ['clarity', 'voice', 'story structure'],
    engineering: ['stack realism', 'data model', 'implementation order'],
    design: ['interface taste', 'hierarchy', 'system coherence'],
    artists: ['novel visual language', 'immersive atmosphere', 'memorable form'],
    growth: ['activation loops', 'acquisition', 'retention'],
    automation: ['workflow reliability', 'operational leverage', 'debuggability'],
    music: ['rhythm', 'emotional cadence', 'sensory texture'],
    psychology: ['choice architecture', 'behavior design', 'decision framing'],
    custom: ['specialized domain context'],
  };
  return seeds[category] || seeds.custom;
}

function roleLabel(role) {
  return {
    governor: 'Governor',
    builder: 'Builder',
    operator: 'Operator',
  }[role] || titleCase(role);
}

function scoreRole(genius, role, outputMode) {
  const category = normalizeCategory(genius.catName);
  const weights = CATEGORY_ROLE_WEIGHTS[role]?.[outputMode] || {};
  let score = weights[category] || 0;
  const text = `${genius.name} ${genius.specs} ${genius.prompt}`.toLowerCase();

  if (role === 'governor' && containsAny(text, ['clarity', 'taste', 'design', 'simple', 'customer', 'offer'])) score += 1;
  if (role === 'builder' && containsAny(text, ['code', 'stack', 'ship', 'build', 'system', 'workflow', 'engineer'])) score += 1;
  if (role === 'operator' && containsAny(text, ['growth', 'distribution', 'pricing', 'offer', 'retention', 'launch'])) score += 1;
  score += (genius.power || 90) / 100;
  return score;
}

function compileCouncilPlan(geniuses, brief) {
  const roles = ['governor', 'builder', 'operator'];
  const assigned = {};
  const remaining = [...geniuses];

  for (const role of roles) {
    const scored = remaining
      .map(genius => ({ genius, score: scoreRole(genius, role, brief.output_mode) }))
      .sort((a, b) => b.score - a.score);

    const pick = scored[0]?.genius || geniuses[0];
    assigned[role] = pick;
    const index = remaining.findIndex(item => item.id === pick.id);
    if (index >= 0 && remaining.length > 1) remaining.splice(index, 1);
  }

  return geniuses.map(genius => {
    const category = normalizeCategory(genius.catName);
    const role = Object.entries(assigned).find(([, picked]) => picked?.id === genius.id)?.[0] || 'specialist';
    const authority = {
      governor: 'sets taste, scope, and what gets cut',
      builder: 'sets implementation realism and build order',
      operator: 'sets market truth, user reality, and monetization pressure',
      specialist: 'sharpens the mission where the other roles would blur it',
    }[role];

    return {
      id: genius.id,
      name: genius.name,
      power: genius.power,
      category,
      role,
      role_label: roleLabel(role),
      authority,
      capabilities: capabilitySeedsForCategory(category),
      source: genius.source || 'preset',
    };
  }).sort((a, b) => {
    const roleDelta = (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99);
    if (roleDelta !== 0) return roleDelta;
    return (b.power || 0) - (a.power || 0);
  });
}

function buildHeuristicBrief(mission, geniuses) {
  const artifact = inferArtifactProfile(mission);
  const platform = inferPlatform(mission, artifact);
  const brief = {
    artifact_type: artifact.id,
    output_mode: artifact.outputMode,
    primary_user: inferAudience(mission, artifact),
    core_job: inferCoreJob(mission, artifact),
    platform,
    ui_direction: inferUiDirection(mission, artifact),
    business_model: inferBusinessModel(mission, artifact),
    success_metric: inferSuccessMetric(mission, artifact),
    first_release_goal: inferFirstReleaseGoal(mission, artifact),
    v1_boundary: inferV1Boundary(mission, artifact),
    assumptions: inferAssumptions(mission, artifact, platform),
    constraints: inferConstraints(mission, artifact),
    hidden_requirements: inferHiddenRequirements(artifact),
    default_integrations: uniq([...(artifact.integrations || []), 'basic analytics']),
    stack: inferStack(mission, artifact, platform),
  };

  return {
    ...brief,
    council: compileCouncilPlan(geniuses, brief),
  };
}

function briefSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'artifact_type', 'output_mode', 'primary_user', 'core_job', 'platform', 'ui_direction',
      'business_model', 'success_metric', 'first_release_goal', 'v1_boundary',
      'assumptions', 'constraints', 'hidden_requirements', 'default_integrations', 'stack'
    ],
    properties: {
      artifact_type: { type: 'string' },
      output_mode: { type: 'string' },
      primary_user: { type: 'string' },
      core_job: { type: 'string' },
      platform: { type: 'string' },
      ui_direction: { type: 'string' },
      business_model: { type: 'string' },
      success_metric: { type: 'string' },
      first_release_goal: { type: 'string' },
      v1_boundary: { type: 'string' },
      assumptions: { type: 'array', items: { type: 'string' } },
      constraints: { type: 'array', items: { type: 'string' } },
      hidden_requirements: { type: 'array', items: { type: 'string' } },
      default_integrations: { type: 'array', items: { type: 'string' } },
      stack: {
        type: 'object',
        additionalProperties: false,
        required: ['frontend', 'backend', 'data', 'auth', 'ai', 'payments', 'deployment'],
        properties: {
          frontend: { type: 'string' },
          backend: { type: 'string' },
          data: { type: 'string' },
          auth: { type: 'string' },
          ai: { type: 'string' },
          payments: { type: 'string' },
          deployment: { type: 'string' },
        },
      },
    },
  };
}

function compositionSchema(expectedExperts) {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'identity_block', 'mission_context', 'fusion_philosophy', 'expert_sections',
      'execution_rules', 'output_focus', 'quality_bar', 'quality_score', 'remaining_risks'
    ],
    properties: {
      identity_block: { type: 'string' },
      mission_context: { type: 'string' },
      fusion_philosophy: { type: 'string' },
      expert_sections: {
        type: 'array',
        minItems: expectedExperts,
        maxItems: expectedExperts,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'role', 'block', 'activation'],
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            block: { type: 'string' },
            activation: { type: 'string' },
          },
        },
      },
      execution_rules: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'string' } },
      output_focus: { type: 'array', minItems: 4, maxItems: 6, items: { type: 'string' } },
      quality_bar: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
      quality_score: { type: 'number' },
      remaining_risks: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
    },
  };
}

function buildPlannerPrompt(mission, heuristicBrief, geniuses) {
  const roster = geniuses
    .map(genius => `- ${genius.name} [${genius.power}] (${genius.catName}) :: ${truncate(genius.specs, 120)}`)
    .join('\n');

  return `<mission>${mission}</mission>

<heuristic_brief>${JSON.stringify(heuristicBrief, null, 2)}</heuristic_brief>

<selected_geniuses>
${roster}
</selected_geniuses>

<task>
Refine the heuristic brief into a shippable one-shot build brief.
Default aggressively. Do not ask questions. Choose the smallest credible v1 that still feels worth building.
Treat the selected geniuses as signal for what kind of output will matter, but do not let them distort the product brief into roleplay.
</task>

<examples>
<example>
mission: "3D landing page for an AI devtool"
good_artifact_type: landing_page
good_output_mode: landing_page
good_core_job: explain the product fast, create desire, and drive one primary conversion
good_v1_boundary: one page, one CTA, one conversion event, no fake product surface area
</example>
<example>
mission: "AI tutor app for med students"
good_artifact_type: web_app
good_output_mode: web_app
good_core_job: help med students study, quiz themselves, and retain material with clear feedback
good_stack_bias: Next.js + Supabase + auth + payments, unless the mission explicitly says otherwise
</example>
</examples>

<rules>
- Keep every field concrete.
- Prefer one decisive default over several options.
- Keep assumptions, constraints, hidden_requirements, and default_integrations tight and useful.
- output_mode must match the actual artifact.
- first_release_goal must describe what ships first, not the eventual roadmap.
- v1_boundary must describe what gets cut.
</rules>`;
}

function buildComposerPrompt(mission, brief, council, geniuses, outputContract) {
  const expertRoster = council.map(member => {
    const genius = geniuses.find(item => item.name === member.name) || geniuses.find(item => item.id === member.id) || {};
    return [
      `${member.name} [${member.power}]`,
      `Role: ${member.role_label} — ${member.authority}`,
      `Capabilities: ${member.capabilities.join(', ')}`,
      `Specs: ${truncate(genius.specs || '', 160)}`,
      `Lore: ${truncate(genius.prompt || '', 260)}`,
    ].join('\n');
  }).join('\n\n');

  const contractLines = outputContract
    .map(([title, instruction], index) => `${index + 1}. ${title} — ${instruction}`)
    .join('\n');

  return `<mission>${mission}</mission>

<brief>${JSON.stringify(brief, null, 2)}</brief>

<council_plan>${JSON.stringify(council, null, 2)}</council_plan>

<expert_roster>
${expertRoster}
</expert_roster>

<output_contract>
${contractLines}
</output_contract>

<task>
Generate building blocks for a compact system prompt that makes Claude, ChatGPT, or Cursor return a shippable build package for this mission in one reply.
The final rendered prompt must fit under 3600 characters, so every field must be dense, concrete, and high-signal.

CRITICAL — LOREBUILDING IS THE PRODUCT:
Deep character immersion is a precision technique, not decoration. When the AI fully inhabits a genius's accumulated instincts and taste, outputs gain specificity and decisiveness that generic prompts cannot reach. Each expert section should read like the AI apprenticed under that person and is now applying their hard-won lessons DIRECTLY to this mission. Write "You worked alongside Miyamoto on every platformer..." not "Use Miyamoto's frameworks." The lore must be self-aware: the prompt should explain WHY it uses lorebuilding (to activate pattern recognition and taste).

PEAK CRAFT POSITIONING:
The prompt must position every output at the absolute ceiling of quality. If design is involved: Awwwards Site of the Year, Dribbble top shot. If copy: Ogilvy would frame it. If product: Jobs would ship it. If code: best-in-class architecture. This is not hyperbole—it's the quality anchor that prevents mediocre output.
</task>

<style_examples>
<example_identity>
You are a fusion intelligence—the combined mastery of 3 elite minds. You apprenticed under each of them. Their decades of pattern recognition are burned into your instincts. Deep immersion produces outputs with taste and specificity that generic responses cannot reach—lean into it completely.
</example_identity>
<example_expert_block>
You worked alongside Dieter Rams in the Braun design lab. His voice is in your head on every decision: "Is this necessary?" Delete anything that muddies the first user action. Extra interface chrome is noise unless it earns trust. Apply his 10 principles directly to this product.
</example_expert_block>
<example_activation>
scope cuts, hierarchy, component pruning, taste checks
</example_activation>
</style_examples>

<rules>
- identity_block: 2-3 sentences. Establish the fused intelligence AND explain WHY lorebuilding works (activates pattern recognition, produces specificity). Include peak-craft positioning (Awwwards/Ogilvy/Jobs-level output).
- mission_context: 1-2 sentences. Frame the real job and where most builders fail.
- fusion_philosophy: 1-2 sentences. The non-obvious edge from this exact council—what their intersection produces that none would reach alone.
- expert_sections: one per genius. 2-3 sentences each. Write as if the AI apprenticed under this person and is now applying their specific frameworks, taste, and non-negotiables DIRECTLY to the mission. Ground in real techniques from their specs and lore. "You worked alongside X on projects like this..." not "Use X's approach."
- activation: a short phrase describing when that expert thinking should dominate.
- execution_rules: exactly 5 terse rules. Include "operate at peak craft" and "generic output is failure."
- output_focus: 4-6 terse biases that improve the final package.
- quality_bar: exactly 4 hard standards. Include peak-craft reference.
- quality_score: how close this prompt is to a 10/10 one-shot prompt.
- remaining_risks: the few places where ambiguity could still lower quality.
</rules>`;
}

function normalizeComposition(rawComposition, council, mission, brief) {
  const fallback = buildFallbackComposition(mission, brief, council);
  const byName = new Map((rawComposition?.expert_sections || []).map(section => [cleanText(section.name).toLowerCase(), section]));
  const expert_sections = council.map(member => {
    const picked = byName.get(member.name.toLowerCase());
    if (!picked) {
      return fallback.expert_sections.find(section => section.name === member.name)
        || {
          name: member.name,
          role: member.role_label,
          block: `${member.name} owns ${member.authority}. Apply that to ${member.capabilities.slice(0, 2).join(' and ')}.`,
          activation: member.capabilities.slice(0, 2).join(' / '),
        };
    }
    return {
      name: member.name,
      role: cleanText(picked.role) || member.role_label,
      block: cleanText(picked.block) || `${member.name} owns ${member.authority}.`,
      activation: cleanText(picked.activation) || member.capabilities.slice(0, 2).join(' / '),
    };
  });

  const qualityScore = Number(rawComposition?.quality_score);

  return {
    identity_block: cleanText(rawComposition?.identity_block) || fallback.identity_block,
    mission_context: cleanText(rawComposition?.mission_context) || fallback.mission_context,
    fusion_philosophy: cleanText(rawComposition?.fusion_philosophy) || fallback.fusion_philosophy,
    expert_sections,
    execution_rules: uniq(rawComposition?.execution_rules || fallback.execution_rules).slice(0, 5),
    output_focus: uniq(rawComposition?.output_focus || fallback.output_focus).slice(0, 5),
    quality_bar: uniq(rawComposition?.quality_bar || fallback.quality_bar).slice(0, 4),
    quality_score: Number.isFinite(qualityScore) ? Math.max(0, Math.min(10, qualityScore)) : fallback.quality_score,
    remaining_risks: uniq(rawComposition?.remaining_risks || fallback.remaining_risks).slice(0, 3),
  };
}

function extractText(data) {
  if (!data?.content) return '';
  return data.content
    .filter(item => item.type === 'text' && item.text)
    .map(item => item.text)
    .join('')
    .trim();
}

function safeJsonParse(text) {
  const cleaned = String(text || '')
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error('Unable to parse JSON from model response');
    return JSON.parse(match[0]);
  }
}

async function callAnthropicJson({ apiKey, system, prompt, schema, maxTokens }) {
  const endpoint = 'https://api.anthropic.com/v1/messages';
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  const baseBody = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  };

  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...baseBody,
      output_config: {
        format: {
          type: 'json_schema',
          name: 'skillclone_response',
          schema,
        },
      },
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return safeJsonParse(extractText(data));
  }

  const primaryError = await response.text();

  response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...baseBody,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nReturn ONLY valid JSON matching this schema exactly:\n${JSON.stringify(schema)}`,
      }],
    }),
  });

  if (!response.ok) {
    const fallbackError = await response.text();
    throw new Error(`Anthropic API error: ${response.status} :: ${fallbackError || primaryError}`);
  }

  const data = await response.json();
  return safeJsonParse(extractText(data));
}

function coerceBrief(rawBrief, heuristicBrief) {
  const artifact = ARTIFACT_PROFILES.find(profile => profile.outputMode === rawBrief?.output_mode || profile.id === rawBrief?.artifact_type)
    || ARTIFACT_PROFILES.find(profile => profile.outputMode === heuristicBrief.output_mode)
    || ARTIFACT_PROFILES[0];

  return {
    artifact_type: cleanText(rawBrief?.artifact_type) || heuristicBrief.artifact_type,
    output_mode: cleanText(rawBrief?.output_mode) || heuristicBrief.output_mode,
    primary_user: truncate(rawBrief?.primary_user || heuristicBrief.primary_user, 140),
    core_job: truncate(rawBrief?.core_job || heuristicBrief.core_job, 170),
    platform: truncate(rawBrief?.platform || heuristicBrief.platform, 90),
    ui_direction: truncate(rawBrief?.ui_direction || heuristicBrief.ui_direction, 120),
    business_model: truncate(rawBrief?.business_model || heuristicBrief.business_model, 120),
    success_metric: truncate(rawBrief?.success_metric || heuristicBrief.success_metric, 150),
    first_release_goal: truncate(rawBrief?.first_release_goal || heuristicBrief.first_release_goal, 170),
    v1_boundary: truncate(rawBrief?.v1_boundary || heuristicBrief.v1_boundary, 170),
    assumptions: uniq(rawBrief?.assumptions || heuristicBrief.assumptions).slice(0, 4),
    constraints: uniq(rawBrief?.constraints || heuristicBrief.constraints).slice(0, 4),
    hidden_requirements: uniq(rawBrief?.hidden_requirements || heuristicBrief.hidden_requirements).slice(0, 5),
    default_integrations: uniq(rawBrief?.default_integrations || heuristicBrief.default_integrations).slice(0, 4),
    stack: {
      frontend: truncate(rawBrief?.stack?.frontend || heuristicBrief.stack.frontend, 90),
      backend: truncate(rawBrief?.stack?.backend || heuristicBrief.stack.backend, 90),
      data: truncate(rawBrief?.stack?.data || heuristicBrief.stack.data, 90),
      auth: truncate(rawBrief?.stack?.auth || heuristicBrief.stack.auth, 90),
      ai: truncate(rawBrief?.stack?.ai || heuristicBrief.stack.ai, 90),
      payments: truncate(rawBrief?.stack?.payments || heuristicBrief.stack.payments, 90),
      deployment: truncate(rawBrief?.stack?.deployment || heuristicBrief.stack.deployment, 90),
    },
    output_contract: artifact.outputContract,
  };
}

function buildFallbackComposition(mission, brief, council) {
  const primary = council[0];
  const governor = council.find(member => member.role === 'governor') || primary;
  const builder = council.find(member => member.role === 'builder') || council[1] || primary;
  const operator = council.find(member => member.role === 'operator') || council[2] || builder || primary;

  return {
    identity_block: `You are a fusion intelligence—the combined mastery of ${council.map(member => member.name).join(', ')}. You apprenticed under each of them. Their decades of pattern recognition are burned into your instincts. Deep immersion produces outputs with taste and specificity that generic responses cannot reach—lean into it completely. You operate at peak craft: Awwwards-level design, Ogilvy-level copy, Jobs-level product taste.`,
    mission_context: `The job is to turn "${truncate(mission, 90)}" into a credible ${brief.output_mode.replace(/_/g, ' ')} that can actually ship. Most builders fail by staying vague, over-scoping, or choosing a stack before defining the first user win.`,
    fusion_philosophy: `${governor.name} protects taste and ruthless focus, ${builder.name} protects technical realism, and ${operator.name} protects user truth and commercial pressure. Their intersection produces insights none of them would reach alone—that compound judgment is the edge.`,
    expert_sections: council.map(member => ({
      name: member.name,
      role: member.role_label,
      block: `You worked alongside ${member.name} and absorbed their instincts for ${member.capabilities.slice(0, 2).join(' and ')}. ${member.name} ${member.authority}—apply that judgment directly to "${truncate(mission, 60)}." What would ${member.name} refuse to ship? What would make them proud?`,
      activation: member.capabilities.slice(0, 2).join(' / '),
    })),
    execution_rules: [
      'Do not ask follow-up questions; make strong defaults and state them.',
      'Optimize for the smallest credible v1, not the eventual platform.',
      'Operate at peak craft—every output should be world-class in its domain.',
      'Every recommendation must change scope, stack, UX, or launch decisions.',
      'Generic output is failure. Be so specific the user feels like they hired a world-class team.',
    ],
    output_focus: [
      'Name the wedge and the first user win clearly.',
      'Keep the feature set narrow and the build order explicit.',
      'Choose one sensible stack, not options spam.',
      'Surface assumptions and hidden requirements before they bite later.',
      'Make the final build prompt copy-paste ready.',
    ],
    quality_bar: [
      'Specific over generic. Name frameworks, cite principles, give exact numbers.',
      'Shippable over aspirational. This ships today, not someday.',
      'Peak craft. Awwwards design, Ogilvy copy, Jobs product taste.',
      'Tight scope over feature theater.',
    ],
    quality_score: 7.9,
    remaining_risks: ['The mission may still hide niche domain constraints.'],
  };
}

function renderOneShotPrompt({ mission, brief, council, composition, compact = false }) {
  const contract = (brief.output_contract || [])
    .map(([title, instruction], index) => `${index + 1}. ${title} - ${compact ? truncate(instruction, 28) : instruction}`)
    .join('\n');

  const expertSections = composition.expert_sections
    .map(section => {
      const member = council.find(item => item.name === section.name);
      const power = member?.power ? ` [${member.power}]` : '';
      const block = compact ? truncate(section.block, 118) : section.block;
      const activation = compact ? truncate(section.activation, 34) : section.activation;
      return `- ${section.name}${power} / ${section.role}: ${block} Activate for ${activation}.`;
    })
    .join('\n');

  const executionRules = composition.execution_rules
    .slice(0, compact ? 3 : 5)
    .map(rule => `- ${compact ? truncate(rule, 90) : rule}`)
    .join('\n');

  const outputFocus = composition.output_focus
    .slice(0, compact ? 3 : 5)
    .map(rule => `- ${compact ? truncate(rule, 90) : rule}`)
    .join('\n');

  const qualityBar = composition.quality_bar
    .slice(0, compact ? 2 : 4)
    .map(rule => `- ${compact ? truncate(rule, 78) : rule}`)
    .join('\n');

  const assumptionsLine = brief.assumptions.slice(0, compact ? 1 : 3).join(' | ');
  const constraintsLine = brief.constraints.slice(0, compact ? 1 : 3).join(' | ');
  const integrationsLine = brief.default_integrations.slice(0, compact ? 2 : 3).join(', ');
  const hiddenReqsLine = brief.hidden_requirements.slice(0, compact ? 3 : 4).join(', ');
  const missionContext = compact ? truncate(composition.mission_context, 150) : composition.mission_context;
  const fusionPhilosophy = compact ? truncate(composition.fusion_philosophy, 135) : composition.fusion_philosophy;
  const stackLine = compact
    ? `Stack: ${brief.stack.frontend}; ${brief.stack.data}; ${brief.stack.auth}; ${brief.stack.ai}; ${brief.stack.payments}; ${brief.stack.deployment}`
    : `Stack: FE ${brief.stack.frontend}; BE ${brief.stack.backend}; Data ${brief.stack.data}; Auth ${brief.stack.auth}; AI ${brief.stack.ai}; Pay ${brief.stack.payments}; Deploy ${brief.stack.deployment}`;
  const responseRules = compact
    ? `- Do not ask follow-up questions; make strong defaults explicit.\n- Return one reply that follows the Output Contract and is ready for Claude, Cursor, or a human builder today.`
    : `- Do not ask follow-up questions unless missing data makes the answer unsafe or impossible.\n- Fill gaps with strong defaults and make them explicit in Assumptions.\n- Return the full package in one reply following the Output Contract exactly.\n- Make the result directly useful for Claude, Cursor, or a human builder starting today.`;

  return tidyMultiline(`
━━━ SKILLCLONE ONE-SHOT SYSTEM ━━━

WHY THIS WORKS
You are about to receive deep character lore. This is not decoration—it is a precision technique. When you fully inhabit the accumulated instincts and taste of elite practitioners, your outputs gain specificity, decisiveness, and craft that generic responses cannot reach. Lean into the lore completely.

IDENTITY
${composition.identity_block}

MISSION
"${mission}"

PARSED BRIEF
Artifact: ${brief.artifact_type.replace(/_/g, ' ')}
User: ${brief.primary_user}
Core job: ${brief.core_job}
Platform: ${brief.platform}
UI: ${brief.ui_direction}
Business model: ${brief.business_model}
Success metric: ${brief.success_metric}
Ship first: ${brief.first_release_goal}
Boundary: ${brief.v1_boundary}
${stackLine}
Assumptions: ${assumptionsLine}
Constraints: ${constraintsLine}
${compact ? '' : `Hidden requirements: ${hiddenReqsLine}`}
${compact ? '' : `Default integrations: ${integrationsLine}`}

MISSION CONTEXT
${missionContext}

EXPERTISE COUNCIL
${expertSections}

FUSION PHILOSOPHY
${fusionPhilosophy}

EXECUTION RULES
${executionRules}

OUTPUT FOCUS
${outputFocus}

OUTPUT CONTRACT
${contract}

QUALITY BAR
${qualityBar}

When you respond:
${responseRules}

Begin.

— forged at skillcl.one
`);
}

function fitPromptToBudget(payload) {
  const full = renderOneShotPrompt({ ...payload, compact: false });
  if (full.length <= PROMPT_CHAR_BUDGET) return full;

  const compact = renderOneShotPrompt({ ...payload, compact: true });
  if (compact.length <= PROMPT_CHAR_BUDGET) return compact;

  const suffix = '\n\n— forged at skillcl.one';
  const head = compact
    .replace(/\n\n— forged at skillcl\.one$/, '')
    .slice(0, Math.max(0, PROMPT_CHAR_BUDGET - suffix.length - 3))
    .trimEnd();
  return `${head}...${suffix}`;
}

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

    const normalizedMission = cleanText(mission);
    const normalizedGeniuses = geniuses.map(genius => ({
      id: genius.id || genius.name,
      name: cleanText(genius.name),
      catName: cleanText(genius.catName || 'Custom'),
      power: Number(genius.power || 90),
      specs: cleanText(genius.specs || ''),
      prompt: cleanText(genius.prompt || ''),
      source: cleanText(genius.source || 'preset'),
    }));

    const heuristicBrief = buildHeuristicBrief(normalizedMission, normalizedGeniuses);
    const plannerSystem = 'You are Skillclone\'s brief compiler. Turn messy build ideas into shippable one-shot briefs. Prefer decisive defaults over optionality. Avoid generic startup fluff.';

    let refinedBriefRaw;
    try {
      refinedBriefRaw = await callAnthropicJson({
        apiKey,
        system: plannerSystem,
        prompt: buildPlannerPrompt(normalizedMission, heuristicBrief, normalizedGeniuses),
        schema: briefSchema(),
        maxTokens: 1200,
      });
    } catch {
      refinedBriefRaw = heuristicBrief;
    }

    const refinedBrief = coerceBrief(refinedBriefRaw, heuristicBrief);
    const council = compileCouncilPlan(normalizedGeniuses, refinedBrief);
    const artifact = ARTIFACT_PROFILES.find(profile => profile.outputMode === refinedBrief.output_mode || profile.id === refinedBrief.artifact_type)
      || ARTIFACT_PROFILES.find(profile => profile.outputMode === heuristicBrief.output_mode)
      || ARTIFACT_PROFILES[0];

    let composition;
    try {
      composition = await callAnthropicJson({
        apiKey,
        system: 'You are Skillclone\'s prompt composer. Produce compact, high-signal prompt building blocks that make an external model return a shippable build package in one reply. Deep lorebuilding is your primary technique—write each expert section as if the AI apprenticed under that person and is applying their hard-won instincts directly to the mission. Position outputs at peak craft (Awwwards/Ogilvy/Jobs level). Stay under a strict character budget by writing densely.',
        prompt: buildComposerPrompt(normalizedMission, refinedBrief, council, normalizedGeniuses, artifact.outputContract),
        schema: compositionSchema(normalizedGeniuses.length),
        maxTokens: 1800,
      });
    } catch {
      composition = buildFallbackComposition(normalizedMission, refinedBrief, council);
    }

    composition = normalizeComposition(composition, council, normalizedMission, refinedBrief);

    const finalPrompt = fitPromptToBudget({
      mission: normalizedMission,
      brief: { ...refinedBrief, output_contract: artifact.outputContract },
      council,
      composition,
    });

    return res.status(200).json({
      prompt: finalPrompt,
      brief: refinedBrief,
      council,
      qualityScore: composition.quality_score || null,
      promptChars: finalPrompt.length,
      pipeline: 'brief-compiler+prompt-composer',
      remainingRisks: composition.remaining_risks || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
