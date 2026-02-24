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

export default function SkillClone() {
  const [stage, setStage] = useState('landing');
  const [userIntent, setUserIntent] = useState('');
  const [selectedModules, setSelectedModules] = useState({});
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showFusion, setShowFusion] = useState(false);
  const [isPro, setIsPro] = useState(true); // Set to true for testing
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const sounds = useSound();
  
  const FREE_LIMIT = 3;
  const PRO_LIMIT = Infinity;

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
    if (/copy|ad|headline|sales|landing|convert|persuade/i.test(t)) {
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

Begin.`;
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowUpgrade(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: 'linear-gradient(135deg, #1a1a24, #12121a)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '32px 40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            
            {/* Big visual: 3 → ∞ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '42px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>3</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>FREE</div>
              </div>
              <div style={{ fontSize: '28px', color: 'rgba(139,92,246,0.5)' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '42px', fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>∞</div>
                <div style={{ fontSize: '11px', color: '#a78bfa', letterSpacing: '1px' }}>PRO</div>
              </div>
            </div>
            
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Unlock unlimited geniuses</h3>
            
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>Monthly</span>
                <span style={{ fontSize: '22px', fontWeight: 600 }}>$12<span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>/mo</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>Lifetime</span>
                <span style={{ fontSize: '22px', fontWeight: 600 }}>$49 <span style={{ fontSize: '12px', fontWeight: 500, color: '#22c55e' }}>BEST</span></span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowUpgrade(false)}
                style={{ flex: 1, padding: '14px 24px', fontSize: '15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
                Stay Free
              </button>
              <button onClick={() => { setIsPro(true); setShowUpgrade(false); sounds.select(); }}
                style={{ flex: 1, padding: '14px 24px', fontSize: '15px', fontWeight: 600, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>
                Go Pro →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDING */}
      {stage === 'landing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          
          {/* BREATHING ORB WITH FLOATING GENIUS ICONS */}
          <div style={{ width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '16px' }}>
            {/* Floating genius icons */}
            <div style={{ position: 'absolute', top: '-8px', left: '-20px', fontSize: '20px', animation: 'float1 3s ease-in-out infinite' }}>🎬</div>
            <div style={{ position: 'absolute', top: '10px', right: '-25px', fontSize: '18px', animation: 'float2 3.5s ease-in-out infinite' }}>💎</div>
            <div style={{ position: 'absolute', bottom: '5px', left: '-15px', fontSize: '16px', animation: 'float3 4s ease-in-out infinite' }}>✍️</div>
            <div style={{ position: 'absolute', bottom: '-5px', right: '-15px', fontSize: '17px', animation: 'float1 3.2s ease-in-out infinite' }}>🎨</div>
            
            {/* Orb */}
            <div style={{ position: 'absolute', width: '90px', height: '90px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', animation: 'breathe 3s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', width: '65px', height: '65px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.5), rgba(139,92,246,0.2) 50%, transparent 70%)' }} />
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, rgba(129,140,248,0.95), rgba(139,92,246,0.7) 40%, rgba(99,102,241,0.4) 70%)', boxShadow: '0 0 35px rgba(139,92,246,0.5), inset 0 0 15px rgba(255,255,255,0.15)' }} />
          </div>
          
          <h1 style={{ fontSize: '42px', fontWeight: 300, margin: 0 }}>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>skill</span>
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>clone</span>
          </h1>
          
          {/* Value prop - clearer */}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginTop: '8px', textAlign: 'center', maxWidth: '340px' }}>
            Fuse legendary minds into one AI prompt.<br/>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Jobs. Spielberg. Ogilvy. Miyamoto. 50+ masters.</span>
          </p>
          
          {/* Input */}
          <div style={{ width: '100%', maxWidth: '440px', marginTop: '28px' }}>
            <input type="text" value={userIntent} onChange={(e) => setUserIntent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && userIntent.trim() && (sounds.click(), setStage('building'))}
              placeholder="What do you want to create?"
              style={{ width: '100%', padding: '16px 20px', fontSize: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            
            {/* Category quick-picks - SPECIFIC exciting prompts */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { icon: '🎬', label: 'Viral YouTube script' },
                { icon: '✍️', label: 'Landing page that converts' },
                { icon: '💻', label: 'Ship a SaaS this weekend' },
                { icon: '🎨', label: 'Awwwards-level website' },
                { icon: '🚀', label: 'Launch to 1K users' },
              ].map(cat => (
                <button key={cat.label}
                  onClick={() => { setUserIntent(cat.label); sounds.hover(); }}
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {userIntent.trim() && (
            <button onClick={() => { sounds.click(); setStage('building'); }}
              style={{ marginTop: '20px', padding: '12px 32px', fontSize: '14px', fontWeight: 500, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer' }}>
              Choose Your Geniuses →
            </button>
          )}
          
          {/* Social proof / How it works hint */}
          {!userIntent && (
            <p style={{ marginTop: '40px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              Pick geniuses → Fuse them → Get a superhuman prompt
            </p>
          )}
        </div>
      )}

      {/* BUILDING */}
      {stage === 'building' && (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* MAIN */}
          <div style={{ flex: 1, padding: '16px', paddingRight: moduleCount > 0 ? '300px' : '16px', transition: 'padding 0.2s' }}>
            {/* Mission */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mission: </span>
              <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)' }}>"{userIntent}"</span>
            </div>

            {/* Recommendations */}
            {getRecommendations().length > 0 && (
              <div style={{ marginBottom: '20px', padding: '14px', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.04))', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>✨ RECOMMENDED FOR YOU</p>
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

            {/* Categories */}
            {Object.values(GENIUS_CATEGORIES).map(cat => {
              const catSelected = selectedModules[cat.id] || [];
              return (
                <div key={cat.id} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: cat.color }}>{cat.name}</span>
                    {catSelected.length > 0 && <span style={{ fontSize: '10px', padding: '2px 6px', background: `${cat.color}20`, borderRadius: '8px', color: cat.color }}>{catSelected.length}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {cat.modules.map(mod => {
                      const sel = isSelected(cat.id, mod.id);
                      return (
                        <div key={mod.id} onClick={() => toggleModule(cat.id, mod)} onMouseEnter={() => sounds.hover()}
                          style={{ minWidth: '150px', maxWidth: '150px', padding: '10px', background: sel ? `${cat.color}12` : 'rgba(255,255,255,0.02)', border: sel ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: sel ? 'white' : 'rgba(255,255,255,0.8)' }}>{mod.name}</span>
                            {sel && <span style={{ fontSize: '12px', color: cat.color }}>✓</span>}
                          </div>
                          <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{mod.specs}</p>
                          <div style={{ marginTop: '6px', fontSize: '10px', color: sel ? cat.color : 'rgba(255,255,255,0.25)' }}>⚡{mod.power}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* STICKY CART */}
          {moduleCount > 0 && (
            <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '280px', background: '#0f0f13', borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '16px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Your Squad</h3>
                  {isPro && <span style={{ fontSize: '10px', padding: '2px 8px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: '10px' }}>PRO</span>}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {isPro ? `${moduleCount} geniuses` : `${moduleCount}/${FREE_LIMIT} geniuses`} • ⚡{totalPower}
                </p>
                {/* Progress bar - only show for free users */}
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
              
              {/* Upgrade prompt if at limit and not pro */}
              {!isPro && moduleCount >= FREE_LIMIT && (
                <button onClick={() => setShowUpgrade(true)}
                  style={{ marginBottom: '10px', padding: '10px', fontSize: '12px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: 'white', cursor: 'pointer', textAlign: 'center' }}>
                  ⚡ Upgrade for more geniuses
                </button>
              )}
              
              <button onClick={generatePrompt}
                style={{ marginTop: 'auto', padding: '14px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', width: '100%' }}>
                🧬 Fuse {moduleCount} Geniuses
              </button>
              <button onClick={() => setStage('landing')} style={{ marginTop: '6px', padding: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px' }}>
                ← Change Mission
              </button>
            </div>
          )}

          {moduleCount === 0 && (
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              👆 Select geniuses to build your clone
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '36px' }}>🧬</span>
            <h2 style={{ margin: '10px 0 4px 0', fontSize: '20px', fontWeight: 600 }}>Your Skillclone is Ready</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{moduleCount} geniuses • ⚡{totalPower} power</p>
          </div>
          <div style={{ padding: '16px', background: copied ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)', border: copied ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', maxHeight: '350px', overflowY: 'auto', marginBottom: '16px' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace', fontSize: '11px', lineHeight: 1.5, color: 'rgba(255,255,255,0.8)' }}>{generatedPrompt}</pre>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: copied ? '#22c55e' : 'white', border: 'none', borderRadius: '50px', color: copied ? 'white' : 'black', cursor: 'pointer' }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button onClick={() => setStage('building')} style={{ padding: '12px 24px', fontSize: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer' }}>Edit Squad</button>
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
      `}</style>
    </div>
  );
}
