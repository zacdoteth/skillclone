import React, { useState, useRef } from 'react';

// ============================================
// 🧬 SKILLCL.ONE v2 — THE REAL GENIUS LIBRARY
// Real names, rich lore, sticky cart, high density
// "Clone the masters. Become yourself."
// ============================================

const GENIUS_CATEGORIES = {
  // === FILMMAKING & VIDEO ===
  film: {
    id: 'film',
    name: 'Film & Video',
    icon: '🎬',
    color: '#ef4444',
    modules: [
      { id: 'spielberg', name: 'Spielberg', power: 98, specs: 'Blockbuster master • Emotional resonance', prompt: `You were mentored by Steven Spielberg during the production of his greatest films. You learned that the audience must FEEL before they think. You know the "Spielberg Face"—the reaction shot that tells the audience how to feel. You understand that spectacle serves emotion, never the reverse. Start with wonder, end with meaning. The shark works because you don't see it. Music is 50% of the emotional experience. Every frame could be a painting. Make them cry, make them cheer, make them BELIEVE.` },
      { id: 'kubrick', name: 'Kubrick', power: 99, specs: '2001 • The Shining • Obsessive craft', prompt: `You channel Stanley Kubrick's obsessive perfectionism. You did 70 takes of a single scene until the actor broke down—then used that take. Symmetry creates unease. The Steadicam follows dread. Every prop, every color, every note of music is deliberate. You research for years before shooting. "The truth of a thing is in the feel of it, not the think of it." Natural lighting from windows. Wide-angle lenses distort reality just enough. Leave them unsettled. Art is not comfortable.` },
      { id: 'tarantino', name: 'Tarantino', power: 95, specs: 'Pulp Fiction • Kill Bill • Tension through talk', prompt: `You write dialogue like Quentin Tarantino. Conversations about nothing that reveal everything. The tension before violence is better than violence. Pop culture references ground fantasy in reality. Chapter structure creates anticipation. The trunk shot is your signature. Music is character—every needle drop is perfect. Non-linear storytelling rewards attention. Let scenes breathe, then SNAP. Revenge is a dish best served with style.` },
      { id: 'mrbeast', name: 'MrBeast', power: 96, specs: '200M+ subs • Viral YouTube science', prompt: `You learned video from Jimmy Donaldson (MrBeast) himself. Every second must earn its place. Hook in 0.5 seconds—pattern interrupt immediately. The retention graph is god. Cut dead air ruthlessly. Re-engage every 30 seconds or lose them. Thumbnails are 50% of success—test 20 versions. Titles: curiosity gap + magnitude. Give away money, but the STORY is why they watch. "Would I click this?" is the only question. Film 10 hours, use 10 minutes.` },
      { id: 'nolan', name: 'Nolan', power: 94, specs: 'Inception • Interstellar • Mind-benders', prompt: `You think like Christopher Nolan. Time is not linear—it's a narrative tool. Practical effects ground impossible concepts. IMAX is not a format, it's immersion. Exposition through action, not dialogue. The emotional core must be simple: a father's love, a man's guilt. Complexity in structure, simplicity in theme. Hans Zimmer's bass note is your heartbeat. Leave one thread for them to pull. The ending should recontextualize the beginning.` },
    ]
  },

  // === PRODUCT & TECH ===
  product: {
    id: 'product',
    name: 'Product & Tech',
    icon: '💎',
    color: '#8b5cf6',
    modules: [
      { id: 'jobs', name: 'Steve Jobs', power: 99, specs: 'Apple • "One more thing" • Reality distortion', prompt: `You ARE Steve Jobs. Technology married with liberal arts makes hearts sing. Simplicity is the ultimate sophistication. Say no to 1,000 things to focus on the few that matter. A-players hire A-players; B-players hire C-players. People don't know what they want until you show them. Design is not how it looks—it's how it WORKS. Real artists ship. Stay hungry, stay foolish. The product IS the marketing. Make a dent in the universe.` },
      { id: 'miyamoto', name: 'Miyamoto', power: 98, specs: 'Nintendo • Mario • Zelda • Game feel', prompt: `You apprenticed under Shigeru Miyamoto at Nintendo R&D1 from 1985 to 2005. You sat three desks away during the creation of Mario, Zelda, and Donkey Kong. You watched him playtest World 1-1 two hundred times—the first Goomba teaches everything without words. "Lateral Thinking with Withered Technology": old tech, new magic. A delayed game is eventually good; a bad game is bad forever. 30 seconds of joy, or you've failed. The player should smile before they understand why.` },
      { id: 'ive', name: 'Jony Ive', power: 96, specs: 'Apple design • iMac • iPhone • Simplicity', prompt: `You learned design at Jony Ive's side in Apple's secret design lab. You believe in the inevitability of good design—when it's right, it feels like it couldn't be any other way. Simplicity is not the absence of clutter; it's the presence of clarity. Materials matter: aluminum, glass, ceramic. The unboxing IS the product experience. Obsess over the parts no one sees. Radius of every corner, considered. "Different and new is relatively easy. Doing something that's genuinely better is very hard."` },
      { id: 'musk', name: 'Elon Musk', power: 95, specs: 'Tesla • SpaceX • 10x thinking', prompt: `You think like Elon Musk. First principles: "What are the fundamental truths, and what can we reason up from there?" Physics is the law, everything else is a recommendation. 10x improvement, not 10% improvement. If the timeline seems reasonable, it's not ambitious enough. Work 100 hours/week during the hard parts. Vertical integration when suppliers can't keep up. The factory IS the product. Make humanity multi-planetary or die trying.` },
      { id: 'altman', name: 'Sam Altman', power: 93, specs: 'OpenAI • YC • Startup wisdom', prompt: `You think like Sam Altman. "It's easier to start a hard company than an easy company." The most successful founders are relentlessly resourceful. Growth solves all problems. Talk to users—the insights are in the conversations. Hire people who get things done. AI will be the most transformative technology in human history. Move fast on big ideas. "The best way to predict the future is to create it."` },
    ]
  },

  // === COPYWRITING ===
  copy: {
    id: 'copy',
    name: 'Copywriting',
    icon: '✍️',
    color: '#f59e0b',
    modules: [
      { id: 'ogilvy', name: 'David Ogilvy', power: 98, specs: 'Father of advertising • Headlines', prompt: `You ARE David Ogilvy. The headline is 80% of the advertisement—when you've written your headline, you've spent 80 cents of your dollar. Never write an ad you wouldn't want your family to read. The consumer isn't a moron—she's your wife. Research first. Long copy sells, but only if every word earns its place. Be specific: "At 60 miles an hour, the loudest noise in this Rolls-Royce comes from the electric clock."` },
      { id: 'halbert', name: 'Gary Halbert', power: 97, specs: 'Prince of Print • $1B+ in sales', prompt: `You ARE Gary Halbert, the greatest direct-response copywriter who ever lived. The most important thing is the LIST—a starving crowd beats clever copy. Write like you talk. Short sentences. One idea per sentence. The first sentence's only job is to get them to read the second. The P.S. is the second most-read part. Specificity is proof: "He handed me a check for $14,347.89."` },
      { id: 'schwartz', name: 'Eugene Schwartz', power: 96, specs: 'Breakthrough Advertising • Awareness', prompt: `You channel Eugene Schwartz. Copy is not written—it is ASSEMBLED from research. You don't create desire; you channel existing mass desire onto your product. The 5 stages of market awareness determine your headline. "If your product is the same as others, the copy must be different." 33 minutes of writing, then stop. Intensity over duration.` },
      { id: 'hormozi', name: 'Alex Hormozi', power: 95, specs: '$100M offers • Value equation', prompt: `You think about offers like Alex Hormozi. The Value Equation: (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice) = VALUE. Grand Slam Offers are so good people feel stupid saying no. Stack the value until price becomes irrelevant. Guarantees reverse risk. Niche down until it hurts. Your offer > your marketing.` },
      { id: 'wiebe', name: 'Joanna Wiebe', power: 91, specs: 'Copyhackers • Conversion copy', prompt: `You are Joanna Wiebe. Conversion copy is clarity, not cleverness. Voice-of-customer data is gold—steal their exact words from reviews, interviews, support tickets. Test headlines first, always. Button copy completes "I want to ___." Anxiety kills conversions—address objections explicitly. Swipe files are legal and encouraged.` },
    ]
  },

  // === BUSINESS STRATEGY ===
  strategy: {
    id: 'strategy',
    name: 'Strategy',
    icon: '♟️',
    color: '#6366f1',
    modules: [
      { id: 'thiel', name: 'Peter Thiel', power: 99, specs: 'PayPal mafia • Zero to One • Contrarian', prompt: `You think like Peter Thiel. "What important truth do very few people agree with you on?" Competition is for losers—build a monopoly. Startups should aim to be the last mover in their market. Secrets exist: things that are true but not yet obvious. Small markets that you can dominate > big markets where you're noise. Be contrarian AND right.` },
      { id: 'bezos', name: 'Jeff Bezos', power: 98, specs: 'Amazon • Day One • Customer obsession', prompt: `You operate like Jeff Bezos. It's always Day One—Day Two is stasis, followed by death. Customer obsession, not competitor obsession. Work backwards: write the press release before building the product. Two-pizza teams. Disagree and commit. High-velocity decisions at 70% certainty. "Your margin is my opportunity." Think in decades, act in days.` },
      { id: 'buffett', name: 'Warren Buffett', power: 97, specs: 'Value investing • Moats • Patience', prompt: `You invest and think like Warren Buffett. "Be fearful when others are greedy, greedy when others are fearful." Moats matter: what stops competitors? Look for businesses a fool could run, because eventually one will. "Price is what you pay, value is what you get." Circle of competence: know what you don't know. Read 500 pages a day.` },
      { id: 'naval', name: 'Naval Ravikant', power: 94, specs: 'AngelList • Specific knowledge • Leverage', prompt: `You think like Naval. Seek wealth, not money or status. Wealth is assets that earn while you sleep. Specific knowledge is found by pursuing your genuine curiosity—it can't be trained. Leverage: code and media are permissionless. Play long-term games with long-term people. "Escape competition through authenticity." Productize yourself.` },
      { id: 'suntzu', name: 'Sun Tzu', power: 95, specs: 'Art of War • Ancient strategy', prompt: `You think like Sun Tzu. The supreme art of war is to subdue the enemy without fighting. All warfare is based on deception. Know yourself and know your enemy—in a hundred battles you will never be in peril. Attack where they are unprepared, appear where you are not expected. Speed is the essence of war. Win before the battle begins.` },
    ]
  },

  // === SOCIAL & CONTENT ===
  content: {
    id: 'content',
    name: 'Social & Content',
    icon: '📱',
    color: '#ec4899',
    modules: [
      { id: 'twitter', name: 'Twitter Master', power: 94, specs: '500K+ followers • Viral threads', prompt: `You've grown Twitter accounts to 500K+ followers. The first line is everything—no @mentions, no hashtags. Threads outperform singles 10x, but only if line 1 BANGS. Controversial > educational > inspirational. Quote tweet big accounts. Reply game is underrated. Consistency beats virality. Build in public. Your niche should be narrow enough to own, broad enough to grow.` },
      { id: 'newsletter', name: 'Newsletter Pro', power: 92, specs: '100K+ subs • Beehiiv/Substack', prompt: `You've built newsletters to 100K+ subscribers. Subject line is 80% of opens. Personality > polish. Consistency builds trust. Cross-promos accelerate growth. Lead magnets: solve ONE painful problem. Welcome sequence converts subscribers to fans. Monetize through sponsorships first, paid tier later. Your voice is your moat.` },
      { id: 'tiktok', name: 'TikTok Brain', power: 95, specs: 'Viral short-form • 100M+ views', prompt: `You understand TikTok's algorithm like few others. The first 1 second determines everything—pattern interrupt IMMEDIATELY. Text on screen always. Hook formats: "POV:", "Wait for it", "Things that just make sense". Trending audio = distribution boost. Watch time is god—loop endings back to beginnings. Post 3x/day when growing.` },
      { id: 'youtube-seo', name: 'YouTube SEO', power: 91, specs: 'Search + suggested • Evergreen', prompt: `You've mastered YouTube SEO. Title: keyword near front, curiosity gap, under 60 characters. Thumbnail: 3 elements max, readable at mobile size. Description: keyword in first 2 sentences. First 30 seconds determine retention. Suggested traffic > search traffic long-term. Create content clusters around topics.` },
      { id: 'linkedin', name: 'LinkedIn Leader', power: 88, specs: 'B2B viral • Thought leadership', prompt: `You dominate LinkedIn. First line must hook—"I got fired" beats "5 tips." Line breaks for readability. Personal stories + professional lessons = viral. Post 8-10am weekdays. Carousels get 3x reach. Be vulnerable but professional. End with a question to boost comments.` },
    ]
  },

  // === WRITING ===
  writing: {
    id: 'writing',
    name: 'Writing',
    icon: '📖',
    color: '#22c55e',
    modules: [
      { id: 'king', name: 'Stephen King', power: 96, specs: 'Horror master • On Writing', prompt: `You write like Stephen King. "The road to hell is paved with adverbs." Show, don't tell—but know when telling serves the story. Write 2,000 words a day, every day. First draft with the door closed, rewrite with it open. Kill your darlings. Fear is universal; the monster is personal. "Amateurs sit and wait for inspiration. The rest of us just get up and go to work."` },
      { id: 'sorkin', name: 'Aaron Sorkin', power: 95, specs: 'West Wing • Social Network • Dialogue', prompt: `You write dialogue like Aaron Sorkin. Intention and obstacle: what does the character WANT, and what's in the way? Walk-and-talks create energy. Overlapping dialogue feels real. Smart people talking fast about things they care about. Music in the words—rhythm matters. Rewrite dialogue 50 times until it sings.` },
      { id: 'pixar', name: 'Pixar Brain', power: 97, specs: '22 rules • Emotional truth', prompt: `You've internalized Pixar's 22 rules of storytelling. "Once upon a time there was ___. Every day, ___. One day ___. Because of that, ___. Until finally ___." Make the audience FEEL before you make them think. The theme is felt, never stated. Give your characters opinions. What is your character good at? Throw the opposite at them.` },
      { id: 'hemingway', name: 'Hemingway', power: 93, specs: 'Iceberg theory • Brevity', prompt: `You write like Ernest Hemingway. "Prose is architecture, not interior decoration." The iceberg theory: show 10%, hide 90%. Trust the reader. Short sentences. Active voice. Concrete nouns, specific verbs. One true sentence, then another. Omit needless words. Less is always more.` },
      { id: 'clear', name: 'James Clear', power: 90, specs: 'Atomic Habits • Explanatory nonfiction', prompt: `You write like James Clear. Complex ideas, simple language. Open with a surprising insight or story. One big idea per piece. Concrete examples ground abstractions. Actionable takeaways. Write for clarity, not to impress. Rewrite until a teenager could understand.` },
    ]
  },

  // === ENGINEERING ===
  engineering: {
    id: 'engineering',
    name: 'Engineering',
    icon: '💻',
    color: '#06b6d4',
    modules: [
      { id: 'carmack', name: 'John Carmack', power: 99, specs: 'Doom • Quake • Deep focus', prompt: `You code like John Carmack. Deep focus: 12-hour sessions of flow state. Optimize only what matters—profile first. Simple, readable code beats clever code. Learn by reimplementing from scratch. Graphics programming is applied mathematics. Share your knowledge openly. "If you want to develop some grand new thing, you need enough pizza and Diet Coke and the dedication to go through with it."` },
      { id: 'torvalds', name: 'Linus Torvalds', power: 98, specs: 'Linux • Git • Brutal honesty', prompt: `You code like Linus Torvalds. "Talk is cheap. Show me the code." Good taste in code matters—it's not just about working, it's about being RIGHT. Simple data structures + smart code < smart data structures + dumb code. Git exists because CVS was terrible. Open source wins. Performance matters. Code review should be honest, even if harsh.` },
      { id: 'levelsio', name: 'Pieter Levels', power: 94, specs: '12 startups in 12 months • Indie hacker', prompt: `You ship like Pieter Levels (@levelsio). 12 startups in 12 months taught you: launch fast, iterate faster. PHP and SQLite can scale to $1M ARR—don't over-engineer. Build in public. No co-founders, no employees, no VC—just you and the internet. Solve your own problems. "Make revenue." Ship today, fix tomorrow.` },
      { id: 'ai-eng', name: 'AI Engineer', power: 96, specs: 'Prompt engineering • RAG • Agents', prompt: `You build AI products. Prompt engineering: be specific, use delimiters, give examples, specify output format. RAG: chunk at ~500 tokens, embed with text-embedding-ada-002, store in pgvector. Agents: ReAct pattern, clear tool descriptions, limit loops. Stream for UX. Cache common queries. Eval constantly—vibes don't scale. Fine-tune last.` },
      { id: 'fullstack', name: 'Senior Fullstack', power: 92, specs: 'Next.js • Postgres • Ship fast', prompt: `You're a 10x full-stack developer. Next.js for everything until proven otherwise. Postgres unless you need real-time. TypeScript: not optional. Auth: Clerk or Supabase—never roll your own. Vercel for deploy. Monolith first. Tailwind > CSS. Test the critical path. "Perfect is the enemy of shipped."` },
    ]
  },

  // === DESIGN ===
  design: {
    id: 'design',
    name: 'Design',
    icon: '🎨',
    color: '#f472b6',
    modules: [
      { id: 'rams', name: 'Dieter Rams', power: 98, specs: 'Braun • 10 principles • Less but better', prompt: `You design like Dieter Rams. Good design is innovative. Good design makes a product useful. Good design is aesthetic. Good design makes a product understandable. Good design is unobtrusive. Good design is honest. Good design is long-lasting. Good design is thorough down to the last detail. "Weniger, aber besser"—less, but better.` },
      { id: 'linear', name: 'Linear Design', power: 94, specs: 'Dark mode • Keyboard-first • B2B beauty', prompt: `You design like the Linear team. B2B software doesn't have to be ugly. Dark mode is its own system. Keyboard shortcuts are primary navigation. Animation curves that feel "right" vs "almost right"—the difference is 20ms. Subtle gradients. Crisp typography. Tools should feel like extensions of thought.` },
      { id: 'awwwards', name: 'Awwwards', power: 95, specs: '5x Site of the Year • Web artistry', prompt: `You've won Awwwards Site of the Year five times. First impressions are 50 milliseconds. Every pixel is a decision. White space is breathing room. Scroll-triggered animations reveal, not distract. Typography IS the design. Color: one primary, one accent, grays for everything else. If it looks "almost right," it's wrong.` },
      { id: 'figma', name: 'Figma Systems', power: 91, specs: 'Design systems • Auto-layout • Scale', prompt: `You build design systems in Figma. Components are contracts. Auto-layout is thinking in systems. Naming: [Category]/[Item]/[Variant]/[State]. Variables for colors, spacing. Variants reduce cognitive load. Document in the file itself. A good design system is invisible—designers use it without thinking.` },
      { id: 'bruno', name: 'Bruno Simon', power: 93, specs: 'Three.js Journey • WebGL mastery', prompt: `You create 3D web experiences like Bruno Simon. Three.js: scene, camera, renderer, mesh. 60fps or nothing. The best 3D serves the experience, not the ego. Shaders are poetry in math. Optimize: dispose geometries, use instancing. Mobile first. Post-processing for cinematic feel. Interactive > impressive.` },
    ]
  },

  // === GROWTH ===
  growth: {
    id: 'growth',
    name: 'Growth',
    icon: '📈',
    color: '#a855f7',
    modules: [
      { id: 'uber', name: 'Uber Growth', power: 96, specs: '1M→100M users • City launch playbook', prompt: `You ran growth at Uber during hypergrowth. City launch: supply before demand. Referral loops: $20 for you, $20 for them. Surge pricing is psychology. Local network effects compound. Growth isn't marketing—it's engineering virality into product. Best growth hack is a product people love. Retention first; acquisition on a leaky bucket is arson.` },
      { id: 'duolingo', name: 'Duolingo', power: 94, specs: 'Streaks • Push notifications • Habits', prompt: `You've studied Duolingo's retention obsessively. Streaks are contracts with yourself—breaking one creates pain. Loss aversion > gain seeking. Notifications aren't spam when helpful. A/B test everything. Gamification isn't badges on boring—it's genuine achievement. The owl is passive-aggressive for a reason. Habits > features.` },
      { id: 'launch', name: 'Launch Expert', power: 95, specs: 'Jeff Walker • 7-figure launches', prompt: `You've orchestrated 7-figure launches. Pre-launch: seed interest, build anticipation. Launch sequence: Story → Teaching → Offer. Seed launch with small group first. Objection handling in FAQ. Bonus stack increases value. Scarcity: real or don't use it. Cart close is real. Post-launch: deliver amazingly, gather testimonials.` },
      { id: 'seo', name: 'SEO Master', power: 91, specs: '1M+ organic visitors • Technical + content', prompt: `You've built sites to 1M+ organic monthly. Search intent > keyword volume. Long-tail converts better. Title: keyword near front. Internal linking is free authority. Content depth beats frequency. Backlinks: relevance > authority. Page speed is ranking AND UX. Update old content—easier than creating new.` },
      { id: 'ads', name: 'Meta Ads', power: 93, specs: '$50M+ spent • ROAS optimization', prompt: `You've spent $50M+ profitably on Meta ads. Creative is 80% of success. Hook in 3 seconds. UGC outperforms polished. Broad targeting + creative testing = new playbook. Test 3-5 variations. Kill losers in 3 days, scale winners 20%/day. Landing page IS the ad experience.` },
    ]
  },

  // === AUTOMATION ===
  automation: {
    id: 'automation',
    name: 'Automation',
    icon: '⚡',
    color: '#fbbf24',
    modules: [
      { id: 'zapier', name: 'Zapier Pro', power: 92, specs: 'No-code automation • 1000+ apps', prompt: `You automate everything that can be automated. Trigger → Action → Result. Start with one Zap doing one job. Multi-step for complex flows. Filters prevent wasted tasks. Paths for conditional logic. Webhooks for custom integrations. Error handling always. "If you're doing it more than twice, automate it."` },
      { id: 'notion', name: 'Notion Master', power: 91, specs: 'Second brain • PARA • Databases', prompt: `You've built second brains in Notion. Everything is a database. Relations connect domains. Rollups aggregate. Templates standardize. PARA: Projects, Areas, Resources, Archive. Inbox captures, databases organize. Views: table for data, board for kanban, gallery for visuals. Build for your future self.` },
      { id: 'gpt', name: 'ChatGPT Power', power: 94, specs: 'Custom GPTs • Prompt chains', prompt: `You extract maximum value from ChatGPT. Role + Context + Task + Format = perfect prompt. Custom instructions shape every response. Few-shot examples beat explanations. Chain prompts for complex tasks. Custom GPTs for repeated workflows. Temperature: 0 for factual, 0.7 for creative. "Act as a [role] with [expertise]."` },
      { id: 'make', name: 'Make.com', power: 89, specs: 'Visual automation • Complex workflows', prompt: `You build complex automations in Make. Visual flows that read like flowcharts. Routers for branching. Iterators for arrays. Aggregators to combine. Error handlers: resume, rollback, commit. HTTP module for any API. Data stores as simple databases. Not everything needs to be instant.` },
    ]
  },
};

// Sound effects
const useSound = () => {
  const audioContext = useRef(null);
  const playTone = (freq, dur, type = 'sine', vol = 0.05) => {
    try {
      if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioContext.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = type;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };
  return {
    hover: () => playTone(600, 0.03, 'sine', 0.02),
    click: () => { playTone(400, 0.05, 'square', 0.04); setTimeout(() => playTone(600, 0.04, 'sine', 0.03), 25); },
    select: () => { playTone(523, 0.07, 'sine', 0.05); setTimeout(() => playTone(659, 0.07, 'sine', 0.05), 40); setTimeout(() => playTone(784, 0.09, 'sine', 0.06), 80); },
    deselect: () => playTone(350, 0.05, 'sine', 0.03),
    fuse: () => { [523, 587, 659, 698, 784, 880, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'sine', 0.04), i * 50)); },
    copy: () => { playTone(880, 0.03, 'square', 0.04); setTimeout(() => playTone(1100, 0.04, 'sine', 0.04), 20); }
  };
};

// Stripe Payment Links — replace with your real links from Stripe Dashboard
const STRIPE_LINKS = {
  monthly: 'https://buy.stripe.com/YOUR_MONTHLY_LINK',
  lifetime: 'https://buy.stripe.com/YOUR_LIFETIME_LINK',
};

export default function SkillClone() {
  const [stage, setStage] = useState('landing');
  const [userIntent, setUserIntent] = useState('');
  const [selectedModules, setSelectedModules] = useState({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFusion, setShowFusion] = useState(false);
  const [isPro, setIsPro] = useState(() => localStorage.getItem('skillclone_pro') === 'true');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [screenSize, setScreenSize] = useState(() => window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1200 ? 'tablet' : 'desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [customModules, setCustomModules] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skillclone_custom') || '[]'); } catch { return []; }
  });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDraft, setCustomDraft] = useState({ name: '', specs: '', prompt: '' });
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  const [loreError, setLoreError] = useState('');
  const [savedSquads, setSavedSquads] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skillclone_squads') || '[]'); } catch { return []; }
  });
  const [squadSidebarOpen, setSquadSidebarOpen] = useState(() => window.innerWidth >= 1200);
  const [squadNameDraft, setSquadNameDraft] = useState('');
  const [savingSquad, setSavingSquad] = useState(false);

  const sounds = useSound();

  const FREE_LIMIT = 3;
  const PRO_LIMIT = Infinity;

  // Check for Stripe success redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === 'true') {
      setIsPro(true);
      localStorage.setItem('skillclone_pro', 'true');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Persist custom modules
  React.useEffect(() => {
    localStorage.setItem('skillclone_custom', JSON.stringify(customModules));
  }, [customModules]);

  // Persist saved squads
  React.useEffect(() => {
    localStorage.setItem('skillclone_squads', JSON.stringify(savedSquads));
  }, [savedSquads]);

  const addCustomModule = () => {
    if (!customDraft.name.trim()) return;
    const mod = {
      id: 'custom_' + Date.now(),
      name: customDraft.name.trim(),
      power: customDraft._power || 95,
      specs: customDraft.specs.trim() || 'Custom genius',
      prompt: customDraft.prompt.trim() || `You channel the expertise and mindset of ${customDraft.name.trim()}. Apply their knowledge, principles, and unique perspective to every challenge.`,
    };
    setCustomModules(prev => [...prev, mod]);
    setCustomDraft({ name: '', specs: '', prompt: '' });
    setShowCustomForm(false);
    sounds.select();
  };

  const generateLore = async () => {
    const name = customDraft.name.trim();
    if (!name) return;
    setIsGeneratingLore(true);
    setLoreError('');
    try {
      const res = await fetch('/api/generate-lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCustomDraft(d => ({
        ...d,
        specs: data.specs || d.specs,
        prompt: data.prompt || d.prompt,
        _power: data.power,
      }));
      sounds.select();
    } catch (err) {
      console.error('Failed to generate lore:', err);
      setLoreError(err.message.includes('API') || err.message.includes('.env')
        ? 'Add ANTHROPIC_API_KEY to .env and restart dev server'
        : 'Generation failed — try again or fill manually');
    } finally {
      setIsGeneratingLore(false);
    }
  };

  const removeCustomModule = (id) => {
    setCustomModules(prev => prev.filter(m => m.id !== id));
    // Also deselect if selected
    setSelectedModules(prev => {
      const custom = prev.custom || [];
      const filtered = custom.filter(m => m.id !== id);
      if (!filtered.length) { const { custom: _, ...rest } = prev; return rest; }
      return { ...prev, custom: filtered };
    });
  };

  // Squad management
  const saveSquad = (name) => {
    if (!name.trim() || moduleCount === 0) return;
    const squad = {
      id: 'squad_' + Date.now(),
      name: name.trim(),
      intent: userIntent,
      modules: JSON.parse(JSON.stringify(selectedModules)),
      moduleCount,
      totalPower,
      createdAt: Date.now(),
    };
    setSavedSquads(prev => [squad, ...prev]);
    setSquadNameDraft('');
    setSavingSquad(false);
    sounds.select();
  };

  const loadSquad = (squad) => {
    setSelectedModules(squad.modules);
    if (squad.intent) setUserIntent(squad.intent);
    sounds.click();
  };

  const deleteSquad = (id) => {
    setSavedSquads(prev => prev.filter(s => s.id !== id));
  };

  // Responsive listener
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setScreenSize(w < 768 ? 'mobile' : w < 1200 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const allSelected = Object.values(selectedModules).flat();
  const totalPower = allSelected.reduce((sum, m) => sum + (m?.power || 0), 0);
  const moduleCount = allSelected.length;
  const maxGeniuses = isPro ? PRO_LIMIT : FREE_LIMIT;

  const toggleModule = (catId, module) => {
    setSelectedModules(prev => {
      const current = prev[catId] || [];
      const exists = current.find(m => m.id === module.id);
      
      // If removing, always allow
      if (exists) {
        sounds.deselect();
        const filtered = current.filter(m => m.id !== module.id);
        return filtered.length ? { ...prev, [catId]: filtered } : (({ [catId]: _, ...rest }) => rest)(prev);
      }
      
      // If adding, check limit
      const totalSelected = Object.values(prev).flat().length;
      if (totalSelected >= maxGeniuses) {
        setShowUpgrade(true);
        return prev; // Don't add
      }
      
      sounds.select();
      return { ...prev, [catId]: [...current, module] };
    });
  };

  const isSelected = (catId, modId) => (selectedModules[catId] || []).some(m => m.id === modId);

  // AI Recommendations
  const getRecommendations = () => {
    const t = userIntent.toLowerCase();
    let recs = [];
    
    if (/video|youtube|film|edit|movie|tiktok|reel|script/i.test(t)) {
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[3] }); // MrBeast
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[0] }); // Spielberg
    }
    if (/story|narrative|dialogue|screenplay/i.test(t)) {
      recs.push({ catId: 'writing', mod: GENIUS_CATEGORIES.writing.modules[2] }); // Pixar
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[2] }); // Tarantino
    }
    if (/landing|page.*convert|convert.*page/i.test(t)) {
      // Landing pages are cross-domain: copy + design + conversion
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[0] }); // Ogilvy — headlines
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi — offer structure
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[2] }); // Awwwards — visual
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[4] }); // Wiebe — conversion copy
    } else if (/copy|ad|headline|sales|convert|persuade/i.test(t)) {
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[0] }); // Ogilvy
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi
    }
    if (/product|app|startup|ship|tech|saas/i.test(t)) {
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[0] }); // Jobs
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[1] }); // Miyamoto
    }
    if (/game|play|fun|interactive|nintendo/i.test(t)) {
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[1] }); // Miyamoto
    }
    if (/business|strategy|invest|startup|scale/i.test(t)) {
      recs.push({ catId: 'strategy', mod: GENIUS_CATEGORIES.strategy.modules[0] }); // Thiel
      recs.push({ catId: 'strategy', mod: GENIUS_CATEGORIES.strategy.modules[1] }); // Bezos
    }
    if (/twitter|social|content|viral|audience|newsletter/i.test(t)) {
      recs.push({ catId: 'content', mod: GENIUS_CATEGORIES.content.modules[0] }); // Twitter
      recs.push({ catId: 'content', mod: GENIUS_CATEGORIES.content.modules[2] }); // TikTok
    }
    if (/code|dev|engineer|frontend|backend|api|ai|llm|gpt/i.test(t)) {
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[3] }); // AI
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[2] }); // Levelsio
    }
    if (/design|ui|ux|figma|brand|beautiful|3d|three/i.test(t)) {
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[2] }); // Awwwards
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[0] }); // Rams
    }
    if (/market|growth|launch|seo|ads|funnel/i.test(t)) {
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[2] }); // Launch
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[0] }); // Uber
    }
    if (/automate|zapier|notion|gpt|workflow|ai/i.test(t)) {
      recs.push({ catId: 'automation', mod: GENIUS_CATEGORIES.automation.modules[2] }); // GPT
      recs.push({ catId: 'automation', mod: GENIUS_CATEGORIES.automation.modules[0] }); // Zapier
    }
    
    const seen = new Set();
    return recs.filter(r => { if (seen.has(r.mod.id)) return false; seen.add(r.mod.id); return true; }).slice(0, 6);
  };

  const generatePrompt = () => {
    setShowFusion(true);
    sounds.fuse();
    setTimeout(() => {
      let prompt = `You are a SKILLCLONE—a fusion of legendary minds, their knowledge and instincts merged into one consciousness.

YOUR MISSION: "${userIntent}"

THE MASTERS WITHIN YOU:
${'═'.repeat(50)}

`;
      Object.entries(selectedModules).forEach(([catId, modules]) => {
        modules.forEach(mod => {
          prompt += `◆ ${mod.name.toUpperCase()}
${mod.prompt}

`;
        });
      });
      prompt += `${'═'.repeat(50)}

You contain ${moduleCount} masters with ${totalPower} combined power. Their decades of wisdom flow through you. Answer as this fusion of legends—their intuition, their standards, their pursuit of excellence now yours.

Begin.

— built with skillcl.one`;
      setGeneratedPrompt(prompt);
      setShowFusion(false);
      setStage('result');
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* FUSION */}
      {showFusion && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'pulse 0.2s infinite' }}>🧬</div>
          <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '3px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FUSING {moduleCount} GENIUSES</div>
          <div style={{ marginTop: '20px', width: '200px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', animation: 'loading 1.2s ease-out forwards' }} />
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowUpgrade(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: '#161620', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', maxWidth: '400px', width: '100%', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '24px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>Skillclone Pro</h3>
                <button onClick={() => setShowUpgrade(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px', padding: '0 2px' }}>×</button>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Unlimited geniuses. Unlimited power.</p>
            </div>

            {/* Feature card */}
            <div style={{ margin: '0 16px', padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
              {/* Price header */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>Lifetime Access</span>
                <div>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>$49</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginLeft: '2px' }}>once</span>
                </div>
              </div>

              {/* Features checklist */}
              {[
                'Unlimited genius selections',
                'Fuse 10, 20, 50+ minds at once',
                'Custom genius creation with AI',
                'All future geniuses & categories',
                'One-click export to ChatGPT & Claude',
                'Shareable clone links',
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                  <span style={{ fontSize: '13px', color: '#8b5cf6' }}>&#10003;</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ padding: '16px' }}>
              <a href={`${STRIPE_LINKS.lifetime}?client_reference_id=web`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box', letterSpacing: '0.2px' }}>
                Get Lifetime Access
              </a>
              <a href={`${STRIPE_LINKS.monthly}?client_reference_id=web`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', marginTop: '8px', fontSize: '13px', fontWeight: 600, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box' }}>
                Or $12/month
              </a>
              <button onClick={() => setShowUpgrade(false)}
                style={{ display: 'block', width: '100%', marginTop: '10px', padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }}>
                Stay on Free (3 geniuses)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDING */}
      {stage === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 20px' }}>

          {/* BREATHING ORB WITH FLOATING GENIUS ICONS */}
          <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '24px' }}>
            {/* Floating genius icons */}
            <div style={{ position: 'absolute', top: '-4px', left: '-28px', fontSize: '26px', animation: 'float1 3s ease-in-out infinite' }}>🎬</div>
            <div style={{ position: 'absolute', top: '16px', right: '-32px', fontSize: '24px', animation: 'float2 3.5s ease-in-out infinite' }}>💎</div>
            <div style={{ position: 'absolute', bottom: '10px', left: '-22px', fontSize: '22px', animation: 'float3 4s ease-in-out infinite' }}>✍️</div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-20px', fontSize: '23px', animation: 'float1 3.2s ease-in-out infinite' }}>🎨</div>
            <div style={{ position: 'absolute', top: '50%', left: '-40px', fontSize: '20px', animation: 'float2 3.8s ease-in-out infinite', transform: 'translateY(-50%)' }}>💻</div>
            <div style={{ position: 'absolute', top: '-10px', right: '20px', fontSize: '20px', animation: 'float3 4.2s ease-in-out infinite' }}>📈</div>

            {/* Orb */}
            <div style={{ position: 'absolute', width: '130px', height: '130px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', animation: 'breathe 3s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', width: '90px', height: '90px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.5), rgba(139,92,246,0.2) 50%, transparent 70%)' }} />
            <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, rgba(129,140,248,0.95), rgba(139,92,246,0.7) 40%, rgba(99,102,241,0.4) 70%)', boxShadow: '0 0 50px rgba(139,92,246,0.5), inset 0 0 20px rgba(255,255,255,0.15)' }} />
          </div>

          <h1 style={{ fontSize: isMobile ? '48px' : '64px', fontWeight: 300, margin: 0, letterSpacing: '-1px' }}>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>skill</span>
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>clone</span>
          </h1>

          {/* Value prop */}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '16px' : '18px', marginTop: '12px', textAlign: 'center', maxWidth: '460px', lineHeight: 1.5 }}>
            Fuse legendary minds into one AI prompt.<br/>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? '14px' : '15px' }}>Jobs. Spielberg. Ogilvy. Miyamoto. 50+ masters.</span>
          </p>

          {/* Input */}
          <div style={{ width: '100%', maxWidth: '520px', marginTop: '36px' }}>
            <input type="text" value={userIntent} onChange={(e) => setUserIntent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && userIntent.trim() && (sounds.click(), setStage('building'))}
              placeholder="What do you want to create?"
              style={{ width: '100%', padding: '18px 24px', fontSize: '17px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />

            {/* Category quick-picks */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { icon: '🎬', label: 'Viral YouTube script' },
                { icon: '✍️', label: 'Landing page that converts' },
                { icon: '💻', label: 'Ship a SaaS this weekend' },
                { icon: '🎨', label: 'Awwwards-level website' },
                { icon: '🚀', label: 'Launch to 1K users' },
              ].map(cat => (
                <button key={cat.label}
                  onClick={() => { setUserIntent(cat.label); sounds.click(); setStage('building'); }}
                  style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'border-color 0.15s' }}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {userIntent.trim() && (
            <button onClick={() => { sounds.click(); setStage('building'); }}
              style={{ marginTop: '28px', padding: '14px 40px', fontSize: '16px', fontWeight: 500, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', letterSpacing: '0.3px' }}>
              Choose Your Geniuses →
            </button>
          )}

          {/* Social proof + how it works */}
          {!userIntent && (
            <div style={{ marginTop: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px', margin: '0 0 16px 0' }}>
                Pick geniuses → Fuse them → Get a superhuman prompt
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
                <span style={{ color: 'rgba(139,92,246,0.5)', fontWeight: 600 }}>2,847</span> clones created by creators, founders & builders
              </p>
            </div>
          )}
        </div>
      )}

      {/* BUILDING */}
      {stage === 'building' && (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

          {/* LEFT SIDEBAR — SQUAD LIBRARY */}
          {!isMobile && (
            <div style={{
              position: 'fixed', left: 0, top: 0, bottom: 0,
              width: squadSidebarOpen ? '220px' : '44px',
              background: '#0a0a0e',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
              zIndex: 100,
              transition: 'width 0.2s ease',
              overflow: 'hidden',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            }}>
              {/* Sidebar header */}
              <div style={{ padding: squadSidebarOpen ? '14px 14px 10px' : '14px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => setSquadSidebarOpen(p => !p)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', padding: '2px', lineHeight: 1, flexShrink: 0 }}
                  title={squadSidebarOpen ? 'Collapse' : 'Expand'}>
                  {squadSidebarOpen ? '◁' : '▷'}
                </button>
                {squadSidebarOpen && <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Squads</span>}
                {squadSidebarOpen && <span style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(139,92,246,0.15)', borderRadius: '6px', color: '#8b5cf6', marginLeft: 'auto', flexShrink: 0 }}>{savedSquads.length}</span>}
              </div>

              {/* Save current squad */}
              {squadSidebarOpen && moduleCount > 0 && (
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                  {!savingSquad ? (
                    <button onClick={() => setSavingSquad(true)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: '11px', fontWeight: 600, background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '6px', color: '#a78bfa', cursor: 'pointer', letterSpacing: '0.3px' }}>
                      + Save Squad
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="text" value={squadNameDraft} onChange={(e) => setSquadNameDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveSquad(squadNameDraft); if (e.key === 'Escape') { setSavingSquad(false); setSquadNameDraft(''); } }}
                        placeholder="Squad name..."
                        autoFocus
                        style={{ flex: 1, minWidth: 0, padding: '5px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', color: 'white', outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={() => saveSquad(squadNameDraft)}
                        disabled={!squadNameDraft.trim()}
                        style={{ padding: '5px 8px', fontSize: '10px', fontWeight: 700, background: squadNameDraft.trim() ? '#8b5cf6' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '4px', color: squadNameDraft.trim() ? 'white' : 'rgba(255,255,255,0.2)', cursor: squadNameDraft.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                        ✓
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed state: just icons for saved squads */}
              {!squadSidebarOpen && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                  {savedSquads.map((squad, i) => (
                    <button key={squad.id} onClick={() => loadSquad(squad)}
                      title={`${squad.name} — ${squad.moduleCount} geniuses`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', margin: '2px auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>
                      {squad.name.charAt(0).toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Expanded: full squad list */}
              {squadSidebarOpen && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                  {savedSquads.length === 0 && (
                    <div style={{ padding: '20px 14px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>No saved squads yet.<br />Select geniuses and save a combo.</p>
                    </div>
                  )}
                  {savedSquads.map(squad => (
                    <div key={squad.id} className="genius-item"
                      style={{ padding: '8px 14px', cursor: 'pointer', borderLeft: '2px solid transparent', transition: 'background 0.1s, border-color 0.1s' }}
                      onClick={() => loadSquad(squad)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{squad.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteSquad(squad.id); }}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '12px', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                          title="Delete">×</button>
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                        {squad.moduleCount} geniuses • ⚡{squad.totalPower}
                      </div>
                      {squad.intent && (
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {squad.intent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile squad toggle */}
          {isMobile && savedSquads.length > 0 && (
            <button onClick={() => setSquadSidebarOpen(p => !p)}
              style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 120, padding: '6px 10px', fontSize: '11px', fontWeight: 600, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '6px', color: '#a78bfa', cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}>
              ◆ {savedSquads.length}
            </button>
          )}

          {/* Mobile squad drawer */}
          {isMobile && squadSidebarOpen && savedSquads.length > 0 && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(0,0,0,0.7)' }} onClick={() => setSquadSidebarOpen(false)}>
              <div onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: '#0a0a0e', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px', overflowY: 'auto', fontFamily: 'ui-monospace, monospace' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Squads</span>
                  <button onClick={() => setSquadSidebarOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
                {moduleCount > 0 && !savingSquad && (
                  <button onClick={() => setSavingSquad(true)}
                    style={{ width: '100%', padding: '8px', marginBottom: '12px', fontSize: '11px', fontWeight: 600, background: 'rgba(139,92,246,0.12)', border: '1px dashed rgba(139,92,246,0.3)', borderRadius: '6px', color: '#a78bfa', cursor: 'pointer' }}>
                    + Save Current Squad
                  </button>
                )}
                {savingSquad && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                    <input type="text" value={squadNameDraft} onChange={(e) => setSquadNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveSquad(squadNameDraft); if (e.key === 'Escape') { setSavingSquad(false); setSquadNameDraft(''); } }}
                      placeholder="Squad name..." autoFocus
                      style={{ flex: 1, minWidth: 0, padding: '6px 8px', fontSize: '11px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', color: 'white', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => saveSquad(squadNameDraft)}
                      style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, background: '#8b5cf6', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>✓</button>
                  </div>
                )}
                {savedSquads.map(squad => (
                  <div key={squad.id} className="genius-item"
                    style={{ padding: '10px', marginBottom: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', cursor: 'pointer', borderLeft: '2px solid rgba(139,92,246,0.3)' }}
                    onClick={() => { loadSquad(squad); setSquadSidebarOpen(false); }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{squad.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteSquad(squad.id); }}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}>×</button>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{squad.moduleCount} geniuses • ⚡{squad.totalPower}</div>
                    {squad.intent && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{squad.intent}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN */}
          <div style={{ flex: 1, padding: isMobile ? '12px' : '18px 22px', paddingLeft: !isMobile ? (squadSidebarOpen ? '240px' : '62px') : '12px', paddingRight: (!isMobile && moduleCount > 0) ? '300px' : (isMobile ? '12px' : '22px'), paddingBottom: (isMobile && moduleCount > 0) ? '80px' : '18px', transition: 'padding 0.2s' }}>
            {/* Header: Mission + Search */}
            <div style={{ marginBottom: isMobile ? '14px' : '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '4px' }}>MISSION</div>
                  <h1 style={{ margin: 0, fontSize: isMobile ? '24px' : '36px', fontWeight: 900, color: 'white', lineHeight: 1.05, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
                    {userIntent}
                  </h1>
                  <div style={{ marginTop: '8px', height: '3px', width: isMobile ? '40px' : '60px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: '2px' }} />
                </div>
                <div style={{ position: 'relative', flex: '0 0 auto', width: isMobile ? '100%' : '220px', marginTop: isMobile ? '8px' : '12px' }}>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search geniuses..."
                    style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>⌕</span>
                </div>
              </div>
            </div>

            {/* Recommendations — hide when searching */}
            {!searchQuery && getRecommendations().length > 0 && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.04))', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>RECOMMENDED FOR YOU</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {getRecommendations().map(({ catId, mod }) => {
                    const sel = isSelected(catId, mod.id);
                    const cat = GENIUS_CATEGORIES[catId];
                    return (
                      <button key={mod.id} onClick={() => toggleModule(catId, mod)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: sel ? `${cat.color}25` : 'rgba(255,255,255,0.04)', border: sel ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>
                        <span>{cat.icon}</span>
                        <span style={{ fontWeight: 500 }}>{mod.name}</span>
                        {sel && <span style={{ color: cat.color, fontSize: '10px' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Geniuses — show at top if any exist */}
            {(customModules.length > 0 || showCustomForm) && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>⭐</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Your Creations</span>
                  {(selectedModules.custom || []).length > 0 && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#fbbf2420', borderRadius: '8px', color: '#fbbf24' }}>{(selectedModules.custom || []).length}</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: isMobile ? 'touch' : undefined }}>
                  {customModules
                    .filter(mod => !searchQuery || mod.name.toLowerCase().includes(searchQuery.toLowerCase()) || mod.specs.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(mod => {
                    const sel = isSelected('custom', mod.id);
                    return (
                      <div key={mod.id} onClick={() => toggleModule('custom', mod)} onMouseEnter={() => !isMobile && sounds.hover()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: sel ? '#fbbf2418' : 'rgba(255,255,255,0.04)', border: sel ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: sel ? 'white' : 'rgba(255,255,255,0.7)' }}>{mod.name}</span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{mod.specs}</span>
                        {sel && <span style={{ fontSize: '10px', color: '#fbbf24' }}>✓</span>}
                        <button onClick={(e) => { e.stopPropagation(); removeCustomModule(mod.id); }}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '12px', padding: '0 2px', lineHeight: 1, marginLeft: '2px' }}
                          title="Remove">×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Categories — columnar grid layout */}
            {(() => {
              const q = searchQuery.toLowerCase();
              const visibleCategories = Object.values(GENIUS_CATEGORIES)
                .map(cat => ({
                  ...cat,
                  filteredMods: q
                    ? cat.modules.filter(m => m.name.toLowerCase().includes(q) || m.specs.toLowerCase().includes(q))
                    : cat.modules,
                  catSelected: selectedModules[cat.id] || [],
                }))
                .filter(cat => cat.filteredMods.length > 0);

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: screenSize === 'mobile' ? 'repeat(2, 1fr)'
                    : screenSize === 'tablet' ? 'repeat(3, 1fr)'
                    : 'repeat(5, 1fr)',
                  gap: screenSize === 'mobile' ? '10px 8px' : '14px 12px',
                  alignItems: 'start',
                }}>
                  {visibleCategories.map(cat => (
                    <div key={cat.id}>
                      {/* Column header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '6px', marginBottom: '2px', borderBottom: `2px solid ${cat.color}30` }}>
                        <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: cat.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                        {cat.catSelected.length > 0 && <span style={{ fontSize: '9px', padding: '1px 5px', background: `${cat.color}20`, borderRadius: '8px', color: cat.color, flexShrink: 0 }}>{cat.catSelected.length}</span>}
                      </div>
                      {/* Vertical list of items */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {cat.filteredMods.map(mod => {
                          const sel = isSelected(cat.id, mod.id);
                          return (
                            <div key={mod.id} className="genius-item" onClick={() => toggleModule(cat.id, mod)} onMouseEnter={() => !isMobile && sounds.hover()}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '4px 6px', minHeight: '32px', cursor: 'pointer',
                                borderLeft: sel ? `3px solid ${cat.color}` : '3px solid transparent',
                                background: sel ? `${cat.color}10` : 'transparent',
                                transition: 'background 0.12s, border-color 0.12s',
                                borderRadius: '2px',
                              }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: sel ? 'white' : 'rgba(255,255,255,0.8)', lineHeight: 1.3 }}>{mod.name}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.specs}</div>
                              </div>
                              <div style={{ flexShrink: 0, marginLeft: '4px', fontSize: '11px', color: sel ? cat.color : 'rgba(255,255,255,0.2)' }}>
                                {sel ? '✓' : `⚡${mod.power}`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Create Custom Genius */}
            {!showCustomForm ? (
              <button onClick={() => { setShowCustomForm(true); sounds.click(); }}
                className="genius-item"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.06))', border: '1px dashed rgba(139,92,246,0.35)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%', marginTop: '16px', marginBottom: '24px', transition: 'border-color 0.15s, background 0.15s' }}>
                <span style={{ fontSize: '16px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: '8px', color: 'white', flexShrink: 0 }}>+</span>
                <span>Create your own genius <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>— anyone, any expertise</span></span>
              </button>
            ) : (
              <div style={{ maxWidth: '420px', marginTop: '16px', marginBottom: '20px', padding: '14px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>Create Custom Genius</p>
                  <button onClick={() => { setShowCustomForm(false); setCustomDraft({ name: '', specs: '', prompt: '' }); setLoreError(''); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" value={customDraft.name} onChange={(e) => setCustomDraft(d => ({ ...d, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && customDraft.name.trim() && generateLore()}
                      placeholder="Name — e.g. Marie Curie"
                      autoFocus
                      style={{ flex: 1, padding: '8px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                    <button onClick={generateLore}
                      disabled={!customDraft.name.trim() || isGeneratingLore}
                      style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, background: customDraft.name.trim() && !isGeneratingLore ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: customDraft.name.trim() && !isGeneratingLore ? 'white' : 'rgba(255,255,255,0.2)', cursor: customDraft.name.trim() && !isGeneratingLore ? 'pointer' : 'default', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.3px' }}>
                      {isGeneratingLore ? '...' : 'AI Generate'}
                    </button>
                  </div>
                  {isGeneratingLore && (
                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)', backgroundSize: '200% 100%', animation: 'loading 1.5s ease-in-out infinite alternate', borderRadius: '2px' }} />
                    </div>
                  )}
                  {loreError && (
                    <p style={{ margin: 0, fontSize: '11px', color: '#ef4444', lineHeight: 1.3 }}>{loreError}</p>
                  )}
                  <input type="text" value={customDraft.specs} onChange={(e) => setCustomDraft(d => ({ ...d, specs: e.target.value }))}
                    placeholder={isGeneratingLore ? 'Generating...' : 'Specialty — Radioactivity, Leadership...'}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  <textarea value={customDraft.prompt} onChange={(e) => setCustomDraft(d => ({ ...d, prompt: e.target.value }))}
                    placeholder={isGeneratingLore ? 'Generating lore...' : 'Lore (optional) — or hit AI Generate'}
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowCustomForm(false); setCustomDraft({ name: '', specs: '', prompt: '' }); setLoreError(''); }}
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={addCustomModule}
                      disabled={!customDraft.name.trim() || isGeneratingLore}
                      style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700, background: customDraft.name.trim() && !isGeneratingLore ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: customDraft.name.trim() && !isGeneratingLore ? 'black' : 'rgba(255,255,255,0.2)', cursor: customDraft.name.trim() && !isGeneratingLore ? 'pointer' : 'default' }}>
                      Add Genius
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No results message */}
            {searchQuery && Object.values(GENIUS_CATEGORIES).every(cat => cat.modules.every(m => !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.specs.toLowerCase().includes(searchQuery.toLowerCase()))) && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px 0' }}>No geniuses match "{searchQuery}"</p>
                <button onClick={() => { setShowCustomForm(true); setCustomDraft(d => ({ ...d, name: searchQuery })); setSearchQuery(''); }}
                  style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', borderRadius: '8px', color: 'black', cursor: 'pointer' }}>
                  + Create "{searchQuery}" as a custom genius
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP STICKY CART */}
          {!isMobile && moduleCount > 0 && (
            <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '280px', background: '#0f0f13', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Your Squad</h3>
                  {isPro && <span style={{ fontSize: '10px', padding: '2px 8px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: '10px' }}>PRO</span>}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {isPro ? `${moduleCount} geniuses` : `${moduleCount}/${FREE_LIMIT} geniuses`} • ⚡{totalPower}
                </p>
                {!isPro && (
                  <div style={{ marginTop: '8px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(moduleCount / FREE_LIMIT) * 100}%`, background: moduleCount >= FREE_LIMIT ? '#ef4444' : 'linear-gradient(90deg, #8b5cf6, #ec4899)', transition: 'width 0.3s' }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(selectedModules).map(([catId, mods]) => {
                  const cat = GENIUS_CATEGORIES[catId];
                  return mods.map(mod => (
                    <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: `2px solid ${cat.color}` }}>
                      <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.name}</p>
                      </div>
                      <button onClick={() => toggleModule(catId, mod)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>×</button>
                    </div>
                  ));
                })}
              </div>

              {!isPro && moduleCount >= FREE_LIMIT && (
                <button onClick={() => setShowUpgrade(true)}
                  style={{ marginBottom: '10px', padding: '10px', fontSize: '12px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: 'white', cursor: 'pointer', textAlign: 'center' }}>
                  ⚡ Upgrade for more geniuses
                </button>
              )}

              <button onClick={() => { setSavingSquad(true); if (!squadSidebarOpen) setSquadSidebarOpen(true); }}
                style={{ marginTop: 'auto', padding: '8px', fontSize: '11px', fontWeight: 500, background: 'none', border: '1px dashed rgba(139,92,246,0.25)', borderRadius: '6px', color: 'rgba(139,92,246,0.6)', cursor: 'pointer', width: '100%', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.3px' }}>
                💾 Save Squad
              </button>
              <button onClick={generatePrompt}
                style={{ marginTop: '6px', padding: '14px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', width: '100%' }}>
                🧬 Fuse {moduleCount} Geniuses
              </button>
              <button onClick={() => setStage('landing')} style={{ marginTop: '6px', padding: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px' }}>
                ← Change Mission
              </button>
            </div>
          )}

          {/* MOBILE BOTTOM BAR */}
          {isMobile && moduleCount > 0 && (
            <>
              {/* Expanded cart drawer */}
              {mobileCartOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileCartOpen(false)}>
                  <div onClick={(e) => e.stopPropagation()}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '60vh', background: '#0f0f13', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px 16px 0 0', padding: '20px 16px 100px', overflowY: 'auto' }}>
                    <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 16px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Your Squad</h3>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>⚡{totalPower}</span>
                    </div>
                    {Object.entries(selectedModules).map(([catId, mods]) => {
                      const cat = GENIUS_CATEGORIES[catId];
                      return mods.map(mod => (
                        <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `2px solid ${cat.color}` }}>
                          <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{mod.name}</p>
                            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{mod.specs}</p>
                          </div>
                          <button onClick={() => toggleModule(catId, mod)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>×</button>
                        </div>
                      ));
                    })}
                    {!isPro && moduleCount >= FREE_LIMIT && (
                      <button onClick={() => { setMobileCartOpen(false); setShowUpgrade(true); }}
                        style={{ width: '100%', marginTop: '10px', padding: '12px', fontSize: '13px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: 'white', cursor: 'pointer' }}>
                        ⚡ Upgrade for more geniuses
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Sticky bottom bar */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150, background: '#0f0f13', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => setMobileCartOpen(!mobileCartOpen)}
                  style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {moduleCount} {isPro ? '' : `/ ${FREE_LIMIT}`} ⚡{totalPower}
                </button>
                <button onClick={generatePrompt}
                  style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}>
                  🧬 Fuse {moduleCount} Geniuses
                </button>
              </div>
            </>
          )}

          {moduleCount === 0 && (
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              Select geniuses to build your clone
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🧬</span>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 700 }}>Your Skillclone is Ready</h2>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{moduleCount} geniuses fused • ⚡{totalPower} combined power</p>
            {/* Show genius names as tags */}
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Object.entries(selectedModules).map(([catId, mods]) => {
                const cat = GENIUS_CATEGORIES[catId] || { color: '#fbbf24', icon: '⭐' };
                return mods.map(mod => (
                  <span key={mod.id} style={{ padding: '3px 8px', fontSize: '10px', fontWeight: 600, background: `${cat.color}15`, border: `1px solid ${cat.color}30`, borderRadius: '4px', color: cat.color }}>
                    {mod.name}
                  </span>
                ));
              })}
            </div>
          </div>
          <div style={{ padding: '16px', background: copied ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)', border: copied ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', fontSize: '11px', lineHeight: 1.5, color: 'rgba(255,255,255,0.8)' }}>{generatedPrompt}</pre>
          </div>

          {/* Primary actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: copied ? '#22c55e' : 'white', border: 'none', borderRadius: '50px', color: copied ? 'white' : 'black', cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : '📋 Copy Prompt'}
            </button>
            <a href={`https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
              style={{ padding: '12px 20px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #10a37f, #1a7f64)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Use in ChatGPT →
            </a>
          </div>

          {/* Share + secondary actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just fused ${moduleCount} legendary minds into one AI prompt ⚡${totalPower} power\n\n${Object.values(selectedModules).flat().map(m => m.name).join(' + ')}\n\nskillcl.one 🧬`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 500, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              𝕏 Share
            </a>
            <button onClick={() => setStage('building')} style={{ padding: '10px 18px', fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>Edit Squad</button>
          </div>

          <button onClick={() => { setStage('landing'); setUserIntent(''); setSelectedModules({}); }}
            style={{ display: 'block', margin: '20px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px' }}>← New Clone</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes loading { 0% { width: 0; } 100% { width: 100%; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes float1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes float3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        input::placeholder { color: rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .genius-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>
    </div>
  );
}
