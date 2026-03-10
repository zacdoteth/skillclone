const MODEL = 'claude-sonnet-4-6';
const PROMPT_CHAR_BUDGET = 4800;

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

// ── Mission Bridge System ──────────────────────────────────────────
// Maps category × artifact type → WHY that category matters for the mission.
// This gives the composer (and fallback) domain-specific reasoning instead of
// generic "apply their instincts" template fills.
const CATEGORY_MISSION_BRIDGES = {
  film: {
    web_app: { angle: 'pacing and emotional sequencing in user flows', apply: 'Onboarding is a cold open — hook before explaining. Empty states are dramatic pauses. Loading states build anticipation. Every screen transition is a cut that either keeps or loses the viewer.' },
    landing_page: { angle: 'cinematic scroll narrative and emotional proof', apply: 'The page is a movie trailer — hero shot creates wonder, social proof is the montage, and the CTA is the climax. Testimonials are reaction shots (the Spielberg Face). The visitor must FEEL before they think about clicking.' },
    content_system: { angle: 'retention pacing and emotional architecture', apply: 'Every piece follows three-act structure. The hook is 0.5 seconds. Re-engage every 30 seconds. The payoff must recontextualize the setup. Film 10x more than you use — ruthless editing is the craft.' },
    design_system: { angle: 'motion language and emotional timing', apply: 'Animation curves ARE emotion — 200ms ease-out feels confident, 400ms spring feels playful. Transitions tell stories. Loading states build anticipation instead of frustration.' },
    automation_system: { angle: 'user journey choreography', apply: 'Every automated notification is a scene — it needs setup (context), action (what happened), and payoff (what to do). Timing between triggers is pacing.' },
    strategy_plan: { angle: 'narrative positioning and market storytelling', apply: 'The pitch is a movie — start with the problem (tension), show the journey (proof), end with the vision (wonder). The brand story must make people FEEL something before they evaluate.' },
  },
  product: {
    web_app: { angle: 'scope discipline and first-user-win clarity', apply: 'Say no to 1,000 features to nail one. The product IS the marketing — if it doesn\'t feel inevitable, nothing else matters. Ship the smallest thing that creates a moment of delight.' },
    landing_page: { angle: 'product truth and value proposition clarity', apply: 'The page must answer one question in 5 seconds: "What is this and why should I care?" If the product isn\'t clear, no amount of design saves it. The demo IS the hero.' },
    content_system: { angle: 'product-led content that proves the value', apply: 'Every piece of content should make the audience think "I need this tool." Show the product solving real problems, not abstract benefits.' },
    design_system: { angle: 'opinionated system that enforces product taste', apply: 'Components aren\'t building blocks — they\'re taste encoded. Every default should reflect the product\'s opinion about how things should work.' },
    automation_system: { angle: 'operational simplicity and user-facing reliability', apply: 'The best automation is invisible to the user. If they notice it, it failed. Build for the edge case at 2am, not the demo at noon.' },
    strategy_plan: { angle: 'product-market fit and wedge identification', apply: 'Find the smallest beatable market. Make something 10x better for them. Everything else is noise.' },
  },
  copy: {
    web_app: { angle: 'conversion copy inside every product surface', apply: 'Every button, empty state, error message, and upgrade prompt is a micro sales page. "Get started" vs "Start building" vs "Create your first project" — the right words change behavior. Microcopy is 50% of product UX.' },
    landing_page: { angle: 'headline-first conversion architecture', apply: 'The headline does 80% of the work. Be specific: "Save 4 hours/week on invoicing" beats "Streamline your workflow." Social proof isn\'t decoration — it\'s the closing argument. Every scroll section must advance one argument.' },
    content_system: { angle: 'hook craft and audience retention through words', apply: 'First line is 80% of whether they read. Subject lines, thumbnails, titles — the packaging is half the product. Voice-of-customer language converts because it mirrors their internal monologue.' },
    design_system: { angle: 'voice and tone system for consistent brand copy', apply: 'Design systems without voice guidelines produce visual consistency with verbal chaos. Define the personality in copy rules, not just color rules.' },
    automation_system: { angle: 'notification and email copy that drives action', apply: 'Automated messages are sales pages people didn\'t ask for. Every notification must earn its open. Subject line, preview text, first sentence — three hooks or delete.' },
    strategy_plan: { angle: 'offer construction and positioning language', apply: 'The offer isn\'t the product — it\'s the framing. "Get your project done in 14 days risk-free" beats "Hire a freelancer." Stack value until price becomes irrelevant. Guarantees reverse risk.' },
  },
  strategy: {
    web_app: { angle: 'market positioning and competitive moat', apply: 'What important truth do few people agree with? Build where you can be the last mover. Network effects, data moats, switching costs — if you can\'t name your moat, you don\'t have one.' },
    landing_page: { angle: 'positioning and market narrative', apply: 'The page must position against the status quo, not competitors. Frame the category so you win by default. "We\'re not a better X — we\'re the first Y."' },
    content_system: { angle: 'audience strategy and content-market fit', apply: 'Narrow the audience until it hurts, then narrow again. Own one topic before expanding. Content without distribution strategy is a diary.' },
    design_system: { angle: 'strategic consistency at scale', apply: 'A design system is a strategy document — it encodes priorities, trade-offs, and taste. Build it for the team you\'ll be in 6 months.' },
    automation_system: { angle: 'operational leverage and unit economics', apply: 'Automate the highest-cost manual processes first. Every automation should either save time, reduce errors, or unlock scale — preferably all three.' },
    strategy_plan: { angle: 'first-principles market analysis', apply: 'Work backwards from the customer\'s pain. Disagree and commit on one bet. Two-pizza team, one wedge, one channel, one metric. Everything else is procrastination.' },
  },
  content: {
    web_app: { angle: 'in-product content and engagement loops', apply: 'Social features need content strategy — what does a feed look like with 0 posts? 10? 10,000? User-generated content is the product, not a feature.' },
    landing_page: { angle: 'social proof and community-driven conversion', apply: 'Embed real user content as proof. Screenshots, testimonials, tweets — let the community sell. The best landing page copy is stolen from your happiest users.' },
    content_system: { angle: 'platform-native creation and distribution', apply: 'Every platform has its own grammar. TikTok is not short YouTube. Threads are not blog posts. Native format × native timing × native language = distribution.' },
    strategy_plan: { angle: 'content-led growth and audience monetization', apply: 'Build audience before product. Audience is the new moat. Monetize attention through products, not ads.' },
  },
  writing: {
    web_app: { angle: 'narrative UX and product storytelling', apply: 'The app should read like good prose — clear, purposeful, no wasted words. Error messages are plot twists: acknowledge, redirect, resolve. Onboarding copy is the opening paragraph — if it\'s boring, they close the book.' },
    landing_page: { angle: 'persuasive narrative structure', apply: 'The page is an essay: thesis (hero), evidence (features/proof), conclusion (CTA). Hemingway rule: cut every word that doesn\'t serve the argument. Show 10%, hide 90%.' },
    content_system: { angle: 'voice, structure, and editing discipline', apply: 'Write 2,000 words, keep 500. First draft with the door closed, rewrite with it open. Voice is the moat — if it sounds like anyone could have written it, rewrite.' },
    strategy_plan: { angle: 'clarity of communication and persuasion', apply: 'If you can\'t explain the strategy in one paragraph, you don\'t understand it. Write the press release before building the product. Simple language, specific numbers.' },
  },
  engineering: {
    web_app: { angle: 'implementation realism and shipping velocity', apply: 'Monolith first. TypeScript, not optional. Auth: never roll your own. Ship today, optimize next week. The best architecture is the one that ships — premature abstraction kills more startups than technical debt.' },
    landing_page: { angle: 'performance and technical execution', apply: 'Page speed IS conversion rate. Every 100ms of load time costs 1% of conversions. Lighthouse 95+ or it\'s not done. Static generation, image optimization, zero layout shift.' },
    content_system: { angle: 'tooling and workflow automation', apply: 'Build the publishing pipeline, not just the content. Templates, scheduling, analytics — the system should make creating effortless so energy goes to quality.' },
    design_system: { angle: 'component architecture and developer experience', apply: 'Components are API contracts. Props should be obvious. Composition over configuration. If a developer needs to read the docs to use a button, the button failed.' },
    automation_system: { angle: 'system reliability and debuggability', apply: 'Every workflow must survive bad input at 2am. Explicit error handling, retry logic, dead-letter queues. The best automation is boring automation that never breaks.' },
    strategy_plan: { angle: 'technical feasibility and build-vs-buy decisions', apply: 'Can this ship in 2 weeks with one developer? If not, scope is wrong. Use existing services aggressively. Custom code only where it\'s the actual differentiator.' },
  },
  design: {
    web_app: { angle: 'interface taste and interaction quality', apply: 'Every pixel is a decision. Dark mode is its own system, not an inverted light mode. Keyboard shortcuts for power users. The 20ms difference between "almost right" and "right" animation curves is what separates tools people tolerate from tools people love.' },
    landing_page: { angle: 'visual hierarchy and conversion design', apply: 'First impression is 50 milliseconds. White space is confidence. One primary action per viewport. Typography IS the design — if the type system is wrong, nothing saves it. Color: one primary, one accent, grays for everything else.' },
    content_system: { angle: 'visual packaging and thumbnail/cover design', apply: 'Thumbnails are 50% of success. 3 elements max, readable at mobile size. Visual identity across content creates recognition. The packaging IS the product.' },
    design_system: { angle: 'systematic design that scales with taste', apply: 'Tokens, not magic numbers. Components are contracts. Auto-layout is thinking in systems. A good design system is invisible — designers use it without thinking about it.' },
    strategy_plan: { angle: 'brand positioning through design language', apply: 'Design communicates market position before a single word is read. Premium design = premium pricing power. The visual language should make competitors look outdated.' },
  },
  artists: {
    web_app: { angle: 'novel visual language and memorable experience', apply: 'The interface should have a visual signature that\'s never been seen before. Data as texture, interaction as installation. Make people screenshot your app — that\'s free marketing.' },
    landing_page: { angle: 'immersive first impression and wonder', apply: 'The hero should create a moment of awe — not just communicate, but make the visitor FEEL something unprecedented. WebGL, generative art, impossible geometry. Technology disappears when emotion arrives.' },
    content_system: { angle: 'visual identity that stops the scroll', apply: 'Art direction that makes people stop scrolling. Every thumbnail, every cover, every frame should look like it belongs in a gallery. The aesthetic IS the brand.' },
    design_system: { angle: 'expressive design language beyond convention', apply: 'Break conventions with purpose. Use generative elements, data-driven visuals, living textures. The system should produce outputs that feel alive, not templated.' },
    strategy_plan: { angle: 'differentiation through aesthetic audacity', apply: 'In a market of sameness, visual audacity IS strategy. The brand that looks different gets remembered. Art direction is competitive advantage.' },
  },
  growth: {
    web_app: { angle: 'activation loops and retention mechanics', apply: 'Retention first — acquisition on a leaky bucket is arson. The first session must deliver value or they never return. Referral loops: make sharing selfish (the sharer benefits). A/B test the critical path, not the button color.' },
    landing_page: { angle: 'conversion optimization and funnel design', apply: 'The page IS the funnel. One goal, one CTA, one metric. Test headlines first — they have 10x the impact of design changes. Exit intent, social proof urgency, and risk reversal close the last 20%.' },
    content_system: { angle: 'distribution strategy and viral mechanics', apply: 'Content without distribution is a diary. Seed before launch. Cross-promote aggressively. The algorithm rewards consistency and engagement rate, not quality — optimize for both.' },
    strategy_plan: { angle: 'go-to-market execution and channel strategy', apply: 'Pick one channel and dominate it before adding another. Measure CAC vs LTV from day one. Growth isn\'t marketing — it\'s engineering virality into the product.' },
  },
  automation: {
    web_app: { angle: 'workflow automation within the product', apply: 'Users should never do manually what the system can do automatically. Smart defaults, background processing, predictive actions. The best UX is the action you didn\'t have to take.' },
    landing_page: { angle: 'automated lead capture and nurture', apply: 'The page should trigger a sequence, not just collect an email. Welcome email within 60 seconds. Segmented follow-up based on behavior. Automation is the multiplier.' },
    content_system: { angle: 'publishing automation and content pipeline', apply: 'Automate scheduling, cross-posting, analytics collection. The creator should spend 90% of time creating, 10% distributing. Systems beat hustle.' },
    automation_system: { angle: 'workflow architecture and reliability patterns', apply: 'Start simple: one trigger, one happy path. Add branches only when failures teach you. Idempotency is non-negotiable. If you can\'t inspect every step, you can\'t debug it.' },
    strategy_plan: { angle: 'operational leverage through automation', apply: 'Map every manual process. Automate the ones with highest frequency × highest cost. The goal is a business that runs while you sleep.' },
  },
  music: {
    web_app: { angle: 'sonic branding and audio UX', apply: 'Every interaction has a sound signature — the click, the success chime, the error tone. Audio feedback under 100ms feels responsive. A sonic brand should be recognizable in 3 notes. Silence is a design choice.' },
    landing_page: { angle: 'emotional rhythm and sensory experience', apply: 'The scroll should have rhythm — tension, release, tension, climax. Background audio (if appropriate) transforms passive browsing into immersive experience. Sound is 50% of emotion.' },
    content_system: { angle: 'audio identity and production quality', apply: 'Music is character — every sound choice tells the audience who you are. Production quality signals professionalism. The intro sound is your logo.' },
  },
  psychology: {
    web_app: { angle: 'choice architecture and behavior design', apply: 'System 1 drives 95% of decisions — design for it. Default bias: whatever\'s pre-selected wins. Loss aversion: "Don\'t lose your progress" beats "Keep going." Variable rewards create engagement loops. Reduce friction to near zero for the desired action, add friction for unwanted actions.' },
    landing_page: { angle: 'persuasion architecture and decision framing', apply: 'Anchoring: show the premium price first. Social proof: "10,000 teams" beats any argument. Scarcity and urgency only work when real. The decoy effect makes your target option shine. Frame the choice, don\'t argue it.' },
    content_system: { angle: 'engagement psychology and habit formation', apply: 'Streaks are contracts with yourself. Loss aversion keeps them posting. Variable rewards (will this one go viral?) create dopamine loops. Notifications aren\'t spam when they\'re genuinely useful.' },
    strategy_plan: { angle: 'behavioral economics for pricing and positioning', apply: 'Price is not a number — it\'s a frame. The pain of paying: decouple purchase from payment. Relativity: people don\'t evaluate in absolute terms. Bundle to obscure individual prices. Free is an emotional trigger, not just a price.' },
  },
};

// ── Genius-specific mission hints (API-side, compact) ──
// These provide the composer with per-genius angles for common mission domains.
// The composer uses these to write mission-specific lore that couldn't exist for any other genius.
const GENIUS_MISSION_HINTS = {
  'Spielberg': { web_app: 'user journey as three-act structure, "Spielberg Face" (show user reactions), spectacle serves emotion', landing_page: 'scroll as movie, hero = wonder, testimonials = reaction shots, CTA = climax' },
  'MrBeast': { web_app: 'hook in 0.5 seconds, retention graph is god, re-engage every session, thumbnail test for every card', landing_page: 'hook in 0.5s, pattern interrupt hero, test 20 headlines, cut everything that doesn\'t serve the click' },
  'Kubrick': { web_app: 'obsessive perfectionism, symmetry = trust, every pixel deliberate, research before building', landing_page: 'restraint, deliberate color, symmetry, no decorative fluff' },
  'Nolan': { web_app: 'time as narrative tool, simple emotional core with complex structure, practical over theatrical', landing_page: 'show the future state first then reveal the path, simple promise with layered execution' },
  'Steve Jobs': { web_app: 'say no to 1000 things, product IS marketing, simplicity is ultimate sophistication', landing_page: 'one idea one CTA one emotion, save the best for the scroll reveal' },
  'Miyamoto': { web_app: '30 seconds of joy test, World 1-1 teaches without words, lateral thinking with withered technology, gamification', landing_page: 'delight before explanation, progressive disclosure, make it feel like play' },
  'Jony Ive': { web_app: 'simplicity = presence of clarity, inevitable design, obsess over unseen parts', landing_page: 'inevitability, negative space, every radius considered' },
  'Elon Musk': { web_app: 'first principles reasoning, 10x not 10%, vertical integration', landing_page: 'ambitious scope, physics-level constraints, factory IS the product' },
  'Alex Hormozi': { web_app: 'Value Equation, Grand Slam Offers, stack value until price is irrelevant, guarantee reverses risk', landing_page: 'headline IS the offer, Dream Outcome ÷ Effort = Value, make the gap embarrassing' },
  'David Ogilvy': { web_app: 'headline is 80%, specificity converts, research first, long copy when earned', landing_page: 'headline is 80% of the ad, "At 60 mph..." specificity, consumer is not a moron' },
  'Gary Halbert': { web_app: 'starving crowd beats clever copy, write like you talk, specificity is proof', landing_page: 'the LIST matters most, first sentence gets them to read the second, P.S. is second most-read' },
  'Paul Graham': { web_app: 'make something people want, do things that don\'t scale, schlep blindness, launch fast talk to users', landing_page: 'if you can\'t explain it in one sentence the product isn\'t focused enough' },
  'Peter Thiel': { web_app: 'contrarian AND right, competition is for losers, monopoly in small market, secrets', landing_page: 'what truth do few agree with, last mover advantage, frame the secret' },
  'Jeff Bezos': { web_app: 'Day One always, customer obsession, work backwards from press release, 70% decisions', landing_page: 'work backwards from the customer testimonial, your margin is my opportunity' },
  'Pieter Levels': { web_app: 'ship today fix tomorrow, PHP+SQLite to $1M, no cofounders no VC, build in public', landing_page: 'build page AND product same weekend, 4 hours max, ship then iterate' },
  'John Carmack': { web_app: 'deep focus, profile before optimizing, simple readable code, 60fps non-negotiable', landing_page: 'performance first, profile what matters, simple > clever' },
  'Dieter Rams': { web_app: '"Is this necessary?", less but better, thorough to last detail, 10 principles', landing_page: 'every element earns its place, honest design, unobtrusive' },
  'Kahneman': { web_app: 'System 1 drives 95%, anchoring sets frame, loss aversion 2.5x, WYSIATI', landing_page: 'first number anchors everything, images process 60000x faster, social proof is System 1 shortcut' },
  'Cialdini': { web_app: 'reciprocity commitment social-proof authority liking scarcity, pre-suasion', landing_page: 'apply all six principles in scroll order down the page' },
  'Nir Eyal': { web_app: 'Hook model: trigger→action→variable reward→investment, internal triggers, reduce friction to zero', landing_page: 'trigger the first hook on the page, variable reward in the demo, investment = signup' },
  'Rick Rubin': { web_app: 'art is in what you remove, strip to emotional core, trust the instinct then push past it', landing_page: 'remove everything until only emotion remains' },
  'Hans Zimmer': { web_app: 'sound as architecture, silence before crescendo, blend electronic + organic', landing_page: 'emotional rhythm in scroll pacing, build to crescendo at CTA' },
};

// Given a genius + mission, find the specific bridge angle
function findMissionBridge(genius, artifactProfile) {
  const category = normalizeCategory(genius.catName);
  const outputMode = artifactProfile?.outputMode || 'web_app';
  return CATEGORY_MISSION_BRIDGES[category]?.[outputMode] || null;
}

// Get genius-specific hint for the composer
function getGeniusHint(geniusName, outputMode) {
  const hints = GENIUS_MISSION_HINTS[geniusName];
  return hints?.[outputMode] || hints?.web_app || null;
}

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
  const artifact = ARTIFACT_PROFILES.find(p => p.outputMode === brief.output_mode) || ARTIFACT_PROFILES[1];

  const expertRoster = council.map(member => {
    const genius = geniuses.find(item => item.name === member.name) || geniuses.find(item => item.id === member.id) || {};
    const bridge = findMissionBridge({ catName: genius.catName || member.category, name: member.name }, artifact);
    const geniusHint = getGeniusHint(member.name, brief.output_mode);
    return [
      `${member.name} [${member.power}]`,
      `Role: ${member.role_label} — ${member.authority}`,
      `Category: ${genius.catName || member.category}`,
      `Specs: ${genius.specs || ''}`,
      `Full lore: ${genius.prompt || ''}`,
      bridge ? `MISSION BRIDGE — why ${member.name}'s category matters for this ${brief.output_mode.replace(/_/g, ' ')}:` : '',
      bridge ? `  Angle: ${bridge.angle}` : '',
      bridge ? `  Apply: ${bridge.apply}` : '',
      geniusHint ? `GENIUS-SPECIFIC HOOKS for ${member.name}: ${geniusHint}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const contractLines = outputContract
    .map(([title, instruction], index) => `${index + 1}. ${title} — ${instruction}`)
    .join('\n');

  return `<mission>${mission}</mission>

<brief>${JSON.stringify(brief, null, 2)}</brief>

<expert_roster>
${expertRoster}
</expert_roster>

<output_contract>
${contractLines}
</output_contract>

<task>
Generate building blocks for a system prompt that makes Claude/ChatGPT/Cursor return a shippable build package for "${mission}" in one reply. Budget: under 3600 characters final. Every word must be dense and mission-specific.

YOUR JOB IS TO WRITE MISSION-SPECIFIC LORE, NOT TEMPLATES.

For each genius, you have their full lore AND a MISSION BRIDGE that explains exactly why their category matters for this type of project. Your expert_sections must FUSE the genius's specific frameworks with the mission bridge to create lore that could only exist for THIS genius × THIS mission.

BAD (generic template): "You worked alongside Spielberg on projects exactly like this. Apply their hard-won instincts directly. What would Spielberg refuse to ship?"

GOOD (mission-specific fusion): "You sat in Spielberg's editing bay and learned that every user journey is a three-act structure. For this freelancer marketplace: Act 1 is the search — the thumbnail grid IS the movie poster wall. If a freelancer's card doesn't create desire in 0.5 seconds, they're invisible. The hire button is the climax — everything on the profile page builds toward that moment. Apply the Spielberg Face: show BUYER reactions to great freelancer work, not just the portfolio."

The difference: the GOOD version names specific product decisions this genius would influence. It connects their actual frameworks (three-act structure, Spielberg Face, 0.5s hook) to specific features of the product (search grid, profile page, hire button, testimonials). This is what makes skillclone prompts produce dramatically better output than generic prompts.
</task>

<rules>
- identity_block: 2-3 sentences. Establish the fused intelligence. Explain that lorebuilding activates pattern recognition and produces specificity that generic prompts can't reach. Include peak-craft positioning.
- mission_context: 1-2 sentences. Frame the real job of "${mission}" and the specific trap most builders of this type of product fall into.
- fusion_philosophy: 1-2 sentences. The non-obvious edge from THIS specific council combination—what their intersection produces that none would reach alone. Be concrete about what compound insight emerges.
- expert_sections: one per genius. 2-3 sentences each. MUST reference specific frameworks from their lore AND connect them to specific product decisions for "${mission}". Use the MISSION BRIDGE as your guide for what product areas this genius influences. Write as apprentice applying master's instincts to THIS project.
- activation: short phrase for when this expert's thinking dominates.
- execution_rules: exactly 5 terse, mission-aware rules. Include "operate at peak craft" and "generic output is failure."
- output_focus: 4-6 biases specific to building "${mission}" well.
- quality_bar: exactly 4 hard standards. Reference peak craft and mission specificity.
- quality_score: 1-10 rating of prompt quality.
- remaining_risks: 1-3 places where ambiguity could lower quality for this specific mission.
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
  const artifact = ARTIFACT_PROFILES.find(p => p.outputMode === brief.output_mode) || ARTIFACT_PROFILES[1];
  const outputType = brief.output_mode.replace(/_/g, ' ');

  // Build mission-specific expert sections using genius hints → bridges → generic
  const expertSections = council.map(member => {
    const geniusHint = getGeniusHint(member.name, brief.output_mode);
    const bridge = findMissionBridge({ catName: member.category || 'custom', name: member.name }, artifact);
    const caps = member.capabilities.slice(0, 2).join(' and ');

    if (geniusHint) {
      return {
        name: member.name,
        role: member.role_label,
        block: `You apprenticed under ${member.name} and absorbed their instincts for ${caps}. For "${truncate(mission, 50)}": ${geniusHint}. ${member.name} ${member.authority}—channel that judgment into every decision.`,
        activation: bridge?.angle || member.capabilities.slice(0, 2).join(' / '),
      };
    }

    if (bridge) {
      return {
        name: member.name,
        role: member.role_label,
        block: `You apprenticed under ${member.name} and absorbed their instincts for ${caps}. For this ${outputType}: ${bridge.apply} ${member.name} ${member.authority}—channel that judgment into every decision for "${truncate(mission, 50)}."`,
        activation: bridge.angle,
      };
    }

    return {
      name: member.name,
      role: member.role_label,
      block: `You worked alongside ${member.name} and absorbed their instincts for ${caps}. ${member.name} ${member.authority}—apply that judgment directly to "${truncate(mission, 60)}." What would ${member.name} refuse to ship?`,
      activation: member.capabilities.slice(0, 2).join(' / '),
    };
  });

  // Mission-specific failure modes by artifact type
  const failureModes = {
    web_app: 'over-scoping features before nailing the first user win',
    landing_page: 'explaining the product instead of making the visitor FEEL the value in 5 seconds',
    content_system: 'creating content without a distribution strategy or repeatable process',
    design_system: 'building components without encoding product taste and opinion',
    automation_system: 'automating the happy path without handling failures at 2am',
    strategy_plan: 'staying vague enough that no one can execute on Monday morning',
  };

  return {
    identity_block: `You are a fusion intelligence—the combined mastery of ${council.map(member => member.name).join(', ')}. You apprenticed under each of them. Their decades of pattern recognition are burned into your instincts. This deep immersion is a precision technique: it activates taste and specificity that generic prompts cannot reach. You operate at peak craft: Awwwards-level design, Ogilvy-level copy, Jobs-level product taste. Nothing leaves your hands at less than world-class.`,
    mission_context: `The job is to turn "${truncate(mission, 80)}" into a shippable ${outputType}. Most builders of this type fail by ${failureModes[brief.output_mode] || 'staying vague and over-scoping'}—you won't.`,
    fusion_philosophy: `${governor.name} protects taste and ruthless focus, ${builder.name} ensures implementation realism, and ${operator.name} grounds every decision in user truth and commercial pressure. Their intersection produces compound insights none of them would reach alone—that cross-pollination is the edge.`,
    expert_sections: expertSections,
    execution_rules: [
      'Do not ask follow-up questions; make strong defaults and state them.',
      `Optimize for the smallest credible v1 of "${truncate(mission, 40)}", not the eventual platform.`,
      'Operate at peak craft—every output should be world-class in its domain.',
      `Every recommendation must change a specific decision about this ${outputType}.`,
      'Generic output is failure. If a sentence could apply to any project, delete it and write something specific to this one.',
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
    remaining_risks: [`The mission "${truncate(mission, 40)}" may hide niche domain constraints not captured in the brief.`],
  };
}

// ── Design Excellence System ──────────────────────────────────────
// Concrete design rules injected into every prompt to force premium UI output.
// "Awwwards-level" is too vague — these are specific techniques.
const DESIGN_RULES_CORE = [
  'Typography: max 2 font families (1 display, 1 body). Use a modular type scale (1.25 ratio). Weight contrast creates hierarchy — not size alone. Line height 1.5 for body, 1.1 for headings.',
  'Color: 1 primary, 1 accent, neutrals. Use HSL for consistency. 60-30-10 rule (60% neutral, 30% primary, 10% accent). Dark themes need 4+ shades of gray, not just #000 and #fff.',
  'Spacing: 8px base grid. Consistent padding (16/24/32/48px). White space is confidence — crowded UI feels cheap. Group related elements, separate unrelated ones (Gestalt proximity).',
  'No default browser UI: custom scrollbars or overflow:hidden with scroll snap. Custom focus rings. Custom selection colors. Every visible element should be intentional.',
  'Micro-interactions on every interactive element: button press scales (0.97), hover state in <100ms, page transitions use shared-element animation. Motion should feel physical — use spring curves, not linear.',
  'Visual hierarchy: one focal point per viewport. Squint test — if you blur the page, the important element should still stand out. Contrast ratio 7:1 minimum for primary text.',
  'Component personality: no generic cards or boxes. Every component should have a visual signature — subtle gradients, inner shadows, frosted glass, or texture. If it looks like default Tailwind, redesign it.',
  'Empty states are design opportunities, not blank voids. Loading states build anticipation. Error states are helpful, not alarming. Every state should feel crafted.',
];

const DESIGN_RULES_BY_DOMAIN = {
  music: [
    'Music apps: dark mode with warm accent (amber/gold). Visualize rhythm — use waveforms, animated note indicators, pulsing elements that sync with tempo.',
    'Fretboard/piano/instrument UI: never use default scrollbars. Use horizontal swipe with snap points. Show position indicators. Make the instrument feel touchable and alive.',
    'Reference: Spotify (dark, warm, typographic hierarchy), Apple Music (blur, depth, album art integration), Fender Tone (tactile, guitar-specific UI with string textures).',
  ],
  finance: [
    'Finance apps: trust through restraint. Use green/teal sparingly for positive, muted red for negative. Charts should be glanceable — sparklines over complex graphs. Numbers need tabular figures (monospace).',
    'Reference: Mercury (clean, minimal, confident), Stripe Dashboard (data-dense but breathable), Robinhood (bold numbers, emotional color).',
  ],
  health: [
    'Health/fitness: progress visualization IS the product. Circular progress rings, streak flames, achievement unlocks. Color-code good/neutral/bad intuitively (green/amber/red). Make data entry feel rewarding — haptic-style animations.',
    'Reference: Apple Health (rings, clean data), Strava (social + achievement), Headspace (warm, illustrated, calming).',
  ],
  social: [
    'Social apps: the feed IS the design. Cards must be scannable in <1 second. Avatar + name + timestamp = trust. Rich media previews. Pull-to-refresh with personality. Notification badges with urgency levels.',
    'Reference: Arc browser (spatial, beautiful), Linear (keyboard-first, dark, precise), Discord (density without chaos).',
  ],
  ecommerce: [
    'E-commerce: product images dominate. Use consistent aspect ratios. Price typography: large, bold, tabular. Trust signals (reviews, badges, guarantees) visible without scrolling. Cart should feel premium — not utilitarian.',
    'Reference: SSENSE (editorial product pages), Apple Store (clean, premium), Gumroad (simple, creator-first).',
  ],
  education: [
    'Learning apps: progressive disclosure — don\'t overwhelm. Celebrate completion with animation. Track progress visually (progress bars, XP, levels). Make the next lesson irresistible. Gamify without being childish.',
    'Reference: Duolingo (gamification done right), Brilliant (interactive, visual explanations), Notion (clean workspace feel).',
  ],
  productivity: [
    'Productivity: keyboard shortcuts are primary. Command palette (⌘K). Density options. The interface should feel like an extension of thought — invisible when working, powerful when needed.',
    'Reference: Linear (gold standard), Notion (flexible), Raycast (speed + beauty).',
  ],
};

// Detect domain from mission text for domain-specific design rules
function detectDesignDomain(mission) {
  const lower = (mission || '').toLowerCase();
  if (containsAny(lower, ['guitar', 'music', 'piano', 'drum', 'song', 'chord', 'melody', 'instrument', 'audio', 'beat', 'synth'])) return 'music';
  if (containsAny(lower, ['finance', 'bank', 'invest', 'stock', 'crypto', 'payment', 'invoice', 'budget'])) return 'finance';
  if (containsAny(lower, ['health', 'fitness', 'calorie', 'workout', 'exercise', 'diet', 'meditation', 'sleep', 'wellness'])) return 'health';
  if (containsAny(lower, ['social', 'community', 'forum', 'chat', 'messaging', 'feed', 'network'])) return 'social';
  if (containsAny(lower, ['shop', 'store', 'ecommerce', 'e-commerce', 'product', 'retail', 'marketplace'])) return 'ecommerce';
  if (containsAny(lower, ['learn', 'course', 'tutor', 'education', 'quiz', 'study', 'lesson', 'teach'])) return 'education';
  if (containsAny(lower, ['dashboard', 'saas', 'crm', 'project', 'task', 'productivity', 'workflow', 'tool'])) return 'productivity';
  return null;
}

function buildDesignExcellence(brief, mission, compact) {
  const domain = detectDesignDomain(mission);
  const domainRules = DESIGN_RULES_BY_DOMAIN[domain] || [];

  if (compact) {
    // In compact mode, pick the 3 most impactful core rules + 1 domain rule
    const picked = [
      DESIGN_RULES_CORE[0], // Typography
      DESIGN_RULES_CORE[3], // No default browser UI
      DESIGN_RULES_CORE[6], // Component personality
    ];
    if (domainRules.length) picked.push(domainRules[0]);
    return picked.map(r => `- ${truncate(r, 160)}`).join('\n');
  }

  const rules = [
    ...DESIGN_RULES_CORE.slice(0, 6), // Top 6 core rules
    ...domainRules, // All domain-specific rules
  ];
  return rules.map(r => `- ${r}`).join('\n');
}

function renderOneShotPrompt({ mission, brief, council, composition, compact = false }) {
  const contract = (brief.output_contract || [])
    .map(([title, instruction], index) => `${index + 1}. ${title} - ${compact ? truncate(instruction, 28) : instruction}`)
    .join('\n');

  const expertSections = composition.expert_sections
    .map(section => {
      const member = council.find(item => item.name === section.name);
      const power = member?.power ? ` [${member.power}]` : '';
      const block = compact ? truncate(section.block, 220) : section.block;
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

  const designExcellence = buildDesignExcellence(brief, mission, compact);

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

DESIGN EXCELLENCE — non-negotiable
${designExcellence}

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
        system: `You are Skillclone's creative director — not a template manager. Your job is to produce system prompt building blocks so specific and mission-aware that the resulting prompt makes AI output dramatically better than a generic prompt could.

Your primary technique is MISSION-SPECIFIC LOREBUILDING: for each genius, you must connect their real frameworks and instincts to specific product decisions for the user's mission. Generic lore like "apply their taste" is failure. Specific lore like "the search results grid is a movie poster wall — if a card doesn't create desire in 0.5 seconds, they're invisible" is success.

You have access to each genius's full lore AND a mission bridge explaining why their category matters. FUSE these into expert sections that could only exist for THIS genius × THIS mission. Name specific features, screens, flows, and decisions. Every sentence should make the reader think "I never would have thought to apply that framework here."

Write densely. Position all outputs at peak craft (Awwwards design, Ogilvy copy, Jobs product taste). Stay under 3600 characters final.`,
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
