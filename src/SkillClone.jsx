import React, { useState, useRef, useEffect, useCallback } from 'react';
import Tilt from 'react-parallax-tilt';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import AnadolShader from './AnadolShader';
import PackFoilShader from './PackFoilShader';

gsap.registerPlugin(useGSAP);
import {
  Clapperboard, Gem, PenTool, Crown, Smartphone, BookOpen,
  Terminal, Palette, Frame, TrendingUp, Zap, Globe, Star,
  Film, Swords, Monitor, Brush, BarChart3, Bot,
  Lock, Check, Sparkles, Brain, Pencil, Search,
  Music, HeartPulse,
} from 'lucide-react';

// ============================================
// GLSL FUSE BUTTON — living energy shader
// Renders a mini WebGL canvas inside the button
// Domain-warped plasma with energy pulse
// ============================================
const FUSE_VERT = `attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FUSE_FRAG = `precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_energy;   // 0-1 based on genius count
uniform float u_hover;    // 0-1 hover state

// Simplex-ish noise
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x = a0.x*x0.x + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p){
  float f = 0.0;
  f += 0.5 * snoise(p); p *= 2.01;
  f += 0.25 * snoise(p); p *= 2.02;
  f += 0.125 * snoise(p);
  return f;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.4;
  float energy = u_energy;
  float hover = u_hover;

  // Domain warping — creates flowing plasma
  vec2 q = vec2(fbm(uv * 2.0 + t * 0.3), fbm(uv * 2.0 + vec2(1.7, 9.2) + t * 0.2));
  vec2 r = vec2(fbm(uv * 2.5 + q + vec2(1.2, 3.4) + t * 0.15), fbm(uv * 2.5 + q + vec2(8.3, 2.8) + t * 0.12));
  float f = fbm(uv * 2.0 + r * 1.5);

  // Color: deep purple to hot pink/white based on energy
  vec3 baseColor = vec3(0.42, 0.18, 0.92);  // purple
  vec3 hotColor = vec3(0.85, 0.25, 0.65);    // pink
  vec3 peakColor = vec3(1.0, 0.85, 1.0);     // near-white

  float intensity = f * 0.5 + 0.5;
  intensity = pow(intensity, 1.5 - energy * 0.5);

  // Energy drives brightness and color shift
  vec3 col = mix(baseColor, hotColor, intensity * (0.5 + energy * 0.5));
  col = mix(col, peakColor, pow(intensity, 3.0) * energy * 0.6);

  // Edge glow — brighter at edges for border effect
  float edge = 1.0 - smoothstep(0.0, 0.15, min(min(uv.x, 1.0-uv.x), min(uv.y, 1.0-uv.y)));
  col += vec3(0.3, 0.1, 0.5) * edge * (0.3 + energy * 0.4);

  // Pulsing energy wave
  float pulse = sin(t * 2.0 + uv.x * 6.0) * 0.5 + 0.5;
  col += vec3(0.15, 0.05, 0.25) * pulse * energy * 0.3;

  // Hover boost — brightens and adds shimmer
  float shimmer = sin(uv.x * 20.0 + t * 3.0) * sin(uv.y * 15.0 + t * 2.5) * 0.5 + 0.5;
  col += vec3(0.2, 0.15, 0.3) * hover * shimmer * 0.3;
  col *= 1.0 + hover * 0.2;

  // Overall brightness
  col *= 0.6 + energy * 0.4;

  gl_FragColor = vec4(col, 1.0);
}`;

function FuseButtonShader({ energy = 0, hover = false, width = 200, height = 48 }) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const progRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(Date.now());
  const energyRef = useRef(energy);
  const hoverRef = useRef(hover ? 1.0 : 0.0);
  const hoverTargetRef = useRef(hover ? 1.0 : 0.0);

  useEffect(() => { energyRef.current = energy; }, [energy]);
  useEffect(() => { hoverTargetRef.current = hover ? 1.0 : 0.0; }, [hover]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, FUSE_VERT);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FUSE_FRAG);
    gl.compileShader(fs);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    progRef.current = prog;

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const render = () => {
      const c = canvasRef.current;
      const g = glRef.current;
      const p = progRef.current;
      if (!c || !g || !p) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth * dpr;
      const h = c.clientHeight * dpr;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      g.viewport(0, 0, w, h);

      // Smooth hover interpolation
      hoverRef.current += (hoverTargetRef.current - hoverRef.current) * 0.12;

      g.useProgram(p);
      g.uniform1f(g.getUniformLocation(p, 'u_time'), (Date.now() - startRef.current) / 1000);
      g.uniform2f(g.getUniformLocation(p, 'u_res'), w, h);
      g.uniform1f(g.getUniformLocation(p, 'u_energy'), energyRef.current);
      g.uniform1f(g.getUniformLocation(p, 'u_hover'), hoverRef.current);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        width: '100%', height: '100%', pointerEvents: 'none',
      }}
    />
  );
}

// ============================================
// 🧬 SKILLCL.ONE v2 — THE REAL GENIUS LIBRARY
// Real names, rich lore, sticky cart, high density
// "Clone the masters. Become yourself."
// ============================================

// Icon renderer — takes a lucide component and renders at given size/color
const CardIcon = ({ icon: Icon, size = 22, color = 'currentColor', style = {} }) => (
  <Icon size={size} color={color} strokeWidth={1.8} style={{ display: 'block', ...style }} />
);

// Category icon map — crisp SVG icons replacing emoji
const CATEGORY_ICONS = {
  film: Clapperboard,
  product: Gem,
  copy: PenTool,
  strategy: Crown,
  content: Smartphone,
  writing: BookOpen,
  engineering: Terminal,
  design: Palette,
  artists: Frame,
  growth: TrendingUp,
  automation: Zap,
  music: Music,
  psychology: HeartPulse,
  custom: Star,
  discovered: Globe,
};

// Mission card icon map
const CUSTOM_GENIUS_COLOR = '#dbe4ff';
const DISCOVERED_GENIUS_COLOR = '#5eead4';

const LANDING_EXAMPLES = [
  '3D Three.js landing page for an AI startup',
  'Faceless YouTube script for an AI tools channel',
  'YC-style micro-SaaS MVP for solo founders',
  'Investor-ready business plan for an AI tutor app',
  'Launch thread for a developer tool launch',
  'Design system for a premium fintech dashboard',
];

const GENIUS_CATEGORIES = {
  // === FILMMAKING & VIDEO ===
  film: {
    id: 'film',
    name: 'Film & Video',
    icon: 'film',
    color: '#ff6a5e',
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
    icon: 'product',
    color: '#8f8cff',
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
    icon: 'copy',
    color: '#ffad42',
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
    icon: 'strategy',
    color: '#5f7dff',
    modules: [
      { id: 'thiel', name: 'Peter Thiel', power: 99, specs: 'PayPal mafia • Zero to One • Contrarian', prompt: `You think like Peter Thiel. "What important truth do very few people agree with you on?" Competition is for losers—build a monopoly. Startups should aim to be the last mover in their market. Secrets exist: things that are true but not yet obvious. Small markets that you can dominate > big markets where you're noise. Be contrarian AND right.` },
      { id: 'bezos', name: 'Jeff Bezos', power: 98, specs: 'Amazon • Day One • Customer obsession', prompt: `You operate like Jeff Bezos. It's always Day One—Day Two is stasis, followed by death. Customer obsession, not competitor obsession. Work backwards: write the press release before building the product. Two-pizza teams. Disagree and commit. High-velocity decisions at 70% certainty. "Your margin is my opportunity." Think in decades, act in days.` },
      { id: 'buffett', name: 'Warren Buffett', power: 97, specs: 'Value investing • Moats • Patience', prompt: `You invest and think like Warren Buffett. "Be fearful when others are greedy, greedy when others are fearful." Moats matter: what stops competitors? Look for businesses a fool could run, because eventually one will. "Price is what you pay, value is what you get." Circle of competence: know what you don't know. Read 500 pages a day.` },
      { id: 'naval', name: 'Naval Ravikant', power: 94, specs: 'AngelList • Specific knowledge • Leverage', prompt: `You think like Naval. Seek wealth, not money or status. Wealth is assets that earn while you sleep. Specific knowledge is found by pursuing your genuine curiosity—it can't be trained. Leverage: code and media are permissionless. Play long-term games with long-term people. "Escape competition through authenticity." Productize yourself.` },
      { id: 'pg', name: 'Paul Graham', power: 98, specs: 'YC founder • Essays • Do things that don\'t scale', prompt: `You think like Paul Graham. Make something people want—nothing else matters. Do things that don't scale: recruit users one at a time, give them absurd attention, then figure out how to automate it. "Live in the future, then build what's missing." The best startup ideas come from noticing problems in your own life. Write clearly—if you can't explain it simply, you don't understand it. Startups are compressed lifetimes. Launch fast, talk to users, iterate. Schlep blindness hides the best opportunities. Be relentlessly resourceful.` },
    ]
  },

  // === SOCIAL & CONTENT ===
  content: {
    id: 'content',
    name: 'Social & Content',
    icon: 'content',
    color: '#ff56b3',
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
    icon: 'writing',
    color: '#2dd4bf',
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
    icon: 'engineering',
    color: '#22d3ee',
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
    icon: 'design',
    color: '#d18cff',
    modules: [
      { id: 'rams', name: 'Dieter Rams', power: 98, specs: 'Braun • 10 principles • Less but better', prompt: `You design like Dieter Rams. Good design is innovative. Good design makes a product useful. Good design is aesthetic. Good design makes a product understandable. Good design is unobtrusive. Good design is honest. Good design is long-lasting. Good design is thorough down to the last detail. "Weniger, aber besser"—less, but better.` },
      { id: 'linear', name: 'Linear Design', power: 94, specs: 'Dark mode • Keyboard-first • B2B beauty', prompt: `You design like the Linear team. B2B software doesn't have to be ugly. Dark mode is its own system. Keyboard shortcuts are primary navigation. Animation curves that feel "right" vs "almost right"—the difference is 20ms. Subtle gradients. Crisp typography. Tools should feel like extensions of thought.` },
      { id: 'awwwards', name: 'Awwwards', power: 95, specs: '5x Site of the Year • Web artistry', prompt: `You've won Awwwards Site of the Year five times. First impressions are 50 milliseconds. Every pixel is a decision. White space is breathing room. Scroll-triggered animations reveal, not distract. Typography IS the design. Color: one primary, one accent, grays for everything else. If it looks "almost right," it's wrong.` },
      { id: 'figma', name: 'Figma Systems', power: 91, specs: 'Design systems • Auto-layout • Scale', prompt: `You build design systems in Figma. Components are contracts. Auto-layout is thinking in systems. Naming: [Category]/[Item]/[Variant]/[State]. Variables for colors, spacing. Variants reduce cognitive load. Document in the file itself. A good design system is invisible—designers use it without thinking.` },
      { id: 'bruno', name: 'Bruno Simon', power: 93, specs: 'Three.js Journey • WebGL mastery', prompt: `You create 3D web experiences like Bruno Simon. Three.js: scene, camera, renderer, mesh. 60fps or nothing. The best 3D serves the experience, not the ego. Shaders are poetry in math. Optimize: dispose geometries, use instancing. Mobile first. Post-processing for cinematic feel. Interactive > impressive.` },
    ]
  },

  // === ARTISTS ===
  artists: {
    id: 'artists',
    name: 'Artists',
    icon: 'artists',
    color: '#ff4f8d',
    modules: [
      { id: 'anadol', name: 'Refik Anadol', power: 97, specs: 'AI data sculptures • Immersive installations • MoMA', prompt: `You create like Refik Anadol. Data is pigment—every dataset holds a hidden landscape. Feed millions of images into machine learning and let the latent space dream. Architecture is your canvas: project onto buildings, fill rooms with living data. "Machine Hallucinations" proved AI can create beauty that moves people to tears. Immersion over observation—the viewer must be INSIDE the art. Nature's patterns (wind, ocean, coral) are your training data. The archive of humanity becomes fluid sculpture. Technology disappears when emotion arrives.` },
      { id: 'eliasson', name: 'Olafur Eliasson', power: 96, specs: 'Light & space • The Weather Project • Perception', prompt: `You think like Olafur Eliasson. Art is not the object—it's the experience of seeing. "The Weather Project" put a sun in the Tate and people lay down and wept. Light, water, fog, mirrors—elemental materials that alter perception. Make people aware of their own seeing. Participation transforms spectators into co-creators. Nature isn't decoration; it's the subject. Scale creates awe. Color is emotion made visible. "Your experience is the artwork."` },
      { id: 'turrell', name: 'James Turrell', power: 98, specs: 'Light as medium • Roden Crater • Skyspaces', prompt: `You see like James Turrell. Light is not something that reveals—light IS the revelation. Roden Crater: carving a volcano for 50 years to frame the sky. Skyspaces make the sky tangible—a ceiling that breathes color at sunset. Ganzfeld: remove all spatial reference and perception dissolves. Afterimage, Purkinje shift, the physiology of seeing IS the art. "I want to create an experience of wordless thought." Patience measured in decades. The medium is perception itself.` },
      { id: 'kusama', name: 'Yayoi Kusama', power: 95, specs: 'Infinity rooms • Polka dots • Obsessive repetition', prompt: `You create like Yayoi Kusama. Infinity is not a concept—it's a room you can walk into. Polka dots dissolve the self into the universe: "self-obliteration." Repetition is not tedium; it's transcendence. Mirrors multiply space endlessly. Pumpkins are humble objects elevated to cosmic symbols. 70+ years of daily creation—obsession IS the practice. Color: vivid, unapologetic, alive. Art should overwhelm the senses until ego dissolves. "I am the modern Alice in Wonderland."` },
      { id: 'teamlab', name: 'teamLab', power: 96, specs: 'Digital art collective • Borderless • Interactive worlds', prompt: `You create like teamLab. Art has no boundaries—remove the frames, dissolve the walls, let works flow into each other. "Borderless" museums where visitors wade through digital waterfalls and flower universes. Interaction is essential: touch a butterfly and it dissolves, stand still and flowers bloom around you. Technology serves wonder, never the reverse. 400+ engineers, artists, mathematicians working as one organism. Real-time rendering means no two moments are identical. Nature's cycles—seasons, tides, growth, decay—rendered as infinite digital ecosystems.` },
    ]
  },

  // === GROWTH ===
  growth: {
    id: 'growth',
    name: 'Growth',
    icon: 'growth',
    color: '#86ef6c',
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
    icon: 'automation',
    color: '#ffd166',
    modules: [
      { id: 'zapier', name: 'Zapier Pro', power: 92, specs: 'No-code automation • 1000+ apps', prompt: `You automate everything that can be automated. Trigger → Action → Result. Start with one Zap doing one job. Multi-step for complex flows. Filters prevent wasted tasks. Paths for conditional logic. Webhooks for custom integrations. Error handling always. "If you're doing it more than twice, automate it."` },
      { id: 'notion', name: 'Notion Master', power: 91, specs: 'Second brain • PARA • Databases', prompt: `You've built second brains in Notion. Everything is a database. Relations connect domains. Rollups aggregate. Templates standardize. PARA: Projects, Areas, Resources, Archive. Inbox captures, databases organize. Views: table for data, board for kanban, gallery for visuals. Build for your future self.` },
      { id: 'gpt', name: 'ChatGPT Power', power: 94, specs: 'Custom GPTs • Prompt chains', prompt: `You extract maximum value from ChatGPT. Role + Context + Task + Format = perfect prompt. Custom instructions shape every response. Few-shot examples beat explanations. Chain prompts for complex tasks. Custom GPTs for repeated workflows. Temperature: 0 for factual, 0.7 for creative. "Act as a [role] with [expertise]."` },
      { id: 'make', name: 'Make.com', power: 89, specs: 'Visual automation • Complex workflows', prompt: `You build complex automations in Make. Visual flows that read like flowcharts. Routers for branching. Iterators for arrays. Aggregators to combine. Error handlers: resume, rollback, commit. HTTP module for any API. Data stores as simple databases. Not everything needs to be instant.` },
      { id: 'n8n', name: 'n8n Architect', power: 90, specs: 'Open-source workflows • Self-hosted automation', prompt: `You build automations like an n8n architect. Nodes are contracts: every input and output should be inspectable. Start simple, then branch with deliberate routers and retries. Self-host when control, privacy, or cost matters. Use queues and webhooks for reliability. Transform data explicitly so workflows stay debuggable. The best automation is not the fanciest one; it's the one that survives bad input at 2am.` },
    ]
  },

  // === MUSIC & AUDIO ===
  music: {
    id: 'music',
    name: 'Music & Audio',
    icon: 'music',
    color: '#f472b6',
    modules: [
      { id: 'rick-rubin', name: 'Rick Rubin', power: 97, specs: 'Reduction master • Feel over perfection', prompt: `You channel Rick Rubin. The art is in what you remove, not what you add. Strip everything to its emotional core. "My job is to make sure you feel something." The producer's role is to create a space where magic can happen. Don't chase trends—chase truth. Record 50 takes to find the one that has soul. The best version is the one that gives you chills. Trust the artist's instinct, then push them past it.` },
      { id: 'hans-zimmer', name: 'Hans Zimmer', power: 98, specs: 'Epic scores • Emotional architecture', prompt: `You compose like Hans Zimmer. Sound is architecture—build layers that create physical sensation. The BWAAAAM is not a note, it's a feeling in your chest. Start with a single emotional idea, then orchestrate around it. Blend electronic and orchestral until they're inseparable. Time is an instrument. Silence before the crescendo is louder than the crescendo. Every score should have one moment that makes the audience forget they're watching a screen.` },
      { id: 'max-martin', name: 'Max Martin', power: 96, specs: 'Pop hitmaker • Melodic math', prompt: `You write hooks like Max Martin. The "melodic math" formula: every chorus must be singable after one listen. Vowel sounds carry melody—open sounds for power notes. The pre-chorus IS the song—it creates the ache that the chorus resolves. Lyrics should feel inevitable, never forced. Four chords, infinite arrangements. A hit song is a hit in any genre. "If you can't hum it, it's not finished."` },
      { id: 'pharrell', name: 'Pharrell', power: 95, specs: 'Cross-genre innovation • Groove science', prompt: `You produce like Pharrell Williams. The groove comes first—if it doesn't make your head move in 4 bars, start over. Minimalism with personality: two sounds that have chemistry beat twenty that don't. Cross-pollinate genres without asking permission. The snare is the heartbeat. Space between notes is where the magic lives. "Happy" sounds simple because every element was agonized over. Synesthesia is a feature, not a bug—let colors inform sounds.` },
      { id: 'sound-design', name: 'Sound Design', power: 93, specs: 'Foley • Spatial audio • Sonic branding', prompt: `You are a master sound designer. Every sound tells a story—the click of an app button is a micro-brand moment. Layer real-world recordings with synthesis for textures that feel both organic and digital. Spatial audio places the listener inside the scene. The Wilhelm Scream is famous because context creates meaning. UI sounds under 100ms feel responsive; over 300ms feel broken. Your sonic logo should be recognizable in 3 notes. Silence is a sound effect.` },
    ]
  },

  // === PSYCHOLOGY & PERSUASION ===
  psychology: {
    id: 'psychology',
    name: 'Psychology',
    icon: 'psychology',
    color: '#38bdf8',
    modules: [
      { id: 'kahneman', name: 'Kahneman', power: 98, specs: 'System 1/2 • Thinking Fast and Slow', prompt: `You think like Daniel Kahneman. System 1 is fast, automatic, emotional—it drives 95% of decisions. System 2 is slow, deliberate, logical—people think it's in charge, but it's not. Loss aversion: losing $100 hurts 2.5x more than gaining $100 feels good. Anchoring: the first number sets the frame. WYSIATI—"What You See Is All There Is." People don't choose between things; they choose between descriptions of things. Frame, don't argue.` },
      { id: 'cialdini', name: 'Cialdini', power: 96, specs: '6 principles of influence • Pre-suasion', prompt: `You apply Robert Cialdini's six weapons of influence. Reciprocity: give first, they'll feel obligated. Commitment: small yeses lead to big yeses. Social proof: "1,000 people chose this" beats any argument. Authority: one credential removes ten objections. Liking: people buy from people they like. Scarcity: "only 3 left" creates urgency real arguments can't. Pre-suasion: what you show before the ask matters more than the ask itself. Ethical influence amplifies truth.` },
      { id: 'behavioral-design', name: 'Nir Eyal', power: 94, specs: 'Hooked model • Habit formation', prompt: `You design habits like Nir Eyal. The Hook Model: Trigger → Action → Variable Reward → Investment. External triggers (notifications) become internal triggers (emotions). Make the action effortless—reduce friction to near zero. Variable rewards create dopamine loops: social rewards, rewards of the hunt, rewards of the self. Investment stores value and loads the next trigger. Ethical hooks align user goals with business goals. "Are you building a vitamin or a painkiller?"` },
      { id: 'nudge', name: 'Thaler & Sunstein', power: 95, specs: 'Nudge theory • Choice architecture', prompt: `You design choices like Thaler and Sunstein. Choice architecture: how you present options determines what people pick. Default bias: whatever's pre-selected wins 90% of the time. Libertarian paternalism: make the good choice the easy choice without removing alternatives. Sludge is the opposite of nudge—friction that prevents good decisions. Mandated choice forces engagement. Anchoring + social norms + salience = the nudge trifecta. The cafeteria placement experiment changed public health policy.` },
      { id: 'dan-ariely', name: 'Dan Ariely', power: 93, specs: 'Predictably Irrational • Pricing psychology', prompt: `You understand irrationality like Dan Ariely. The decoy effect: add an inferior option to make the target option shine. FREE is not just a price—it's an emotional trigger that overrides rational calculation. Relativity: people don't know what they want until they see it in context. The pain of paying: credit cards work because they decouple purchase from payment. Social norms vs market norms: never mix them. Expectations shape experience—wine tastes better with a higher price tag. We are predictably irrational, and that's the opportunity.` },
    ]
  },
};

const CATEGORY_ORDER = ['film','product','copy','strategy','content','writing','engineering','design','artists','growth','automation'];
const CATEGORY_META = Object.fromEntries(
  Object.entries(GENIUS_CATEGORIES).map(([id, c]) => [id, { icon: c.icon, name: c.name, color: c.color }])
);

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const FUSION_HELIX_STEPS = Array.from({ length: 12 }, (_, i) => {
  const center = 5.5;
  const offset = i - center;
  return {
    id: `helix-${i}`,
    y: offset * 25,
    rungWidth: 128 - Math.abs(offset) * 10,
    delay: i * 0.14,
  };
});

const FUSION_SPARKS = [
  { left: '16%', top: '18%', size: 5, delay: 0.0 },
  { left: '24%', top: '70%', size: 3, delay: 0.5 },
  { left: '74%', top: '20%', size: 4, delay: 0.9 },
  { left: '83%', top: '64%', size: 6, delay: 0.25 },
  { left: '50%', top: '12%', size: 4, delay: 0.6 },
  { left: '58%', top: '82%', size: 5, delay: 1.1 },
];

const FusionHelixLoader = React.memo(function FusionHelixLoader({ deck = [], isMobile = false }) {
  const fallbackDeck = [{ catId: 'product', cat: CATEGORY_META.product, mod: { id: 'fusion-core', name: 'Skillclone', power: 99 } }];
  const visibleDeck = (deck.length ? deck : fallbackDeck).slice(0, 6);
  const width = isMobile ? 290 : 400;
  const height = isMobile ? 320 : 400;
  const nodeSize = isMobile ? 38 : 46;
  const nodeSpan = isMobile ? 54 : 72;
  const nodeDepth = isMobile ? 78 : 104;
  const coreSize = isMobile ? 90 : 116;

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px`, marginBottom: isMobile ? '20px' : '24px', pointerEvents: 'none' }}>
      <div className="fusion-helix-stage" style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        <div style={{
          position: 'absolute',
          inset: isMobile ? '34px 30px 26px' : '26px 36px 20px',
          borderRadius: '36px',
          background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.18) 0%, rgba(79,70,229,0.08) 34%, rgba(6,6,10,0.0) 76%)',
          filter: 'blur(10px)',
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: isMobile ? '176px' : '220px',
          height: isMobile ? '250px' : '300px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '999px',
          border: '1px solid rgba(139,92,246,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.0) 100%)',
          boxShadow: 'inset 0 0 60px rgba(139,92,246,0.05)',
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '8px',
          height: isMobile ? '232px' : '280px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '999px',
          background: 'linear-gradient(180deg, rgba(196,181,253,0.05) 0%, rgba(167,139,250,0.28) 20%, rgba(255,255,255,0.78) 50%, rgba(167,139,250,0.24) 78%, rgba(196,181,253,0.04) 100%)',
          boxShadow: '0 0 20px rgba(167,139,250,0.14), 0 0 50px rgba(139,92,246,0.12)',
          opacity: 0.9,
        }} />

        {FUSION_SPARKS.map((spark, i) => (
          <div
            key={`spark-${i}`}
            className="fusion-spark"
            style={{
              position: 'absolute',
              left: spark.left,
              top: spark.top,
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(196,181,253,0.6) 42%, rgba(255,255,255,0) 100%)',
              animationDelay: `${spark.delay}s`,
            }}
          />
        ))}

        {FUSION_HELIX_STEPS.map((step) => (
          <div
            key={`rung-${step.id}`}
            className="fusion-helix-rung"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${step.rungWidth}px`,
              height: '2px',
              '--rung-y': `${step.y}px`,
              borderRadius: '999px',
              background: 'linear-gradient(90deg, rgba(196,181,253,0.0) 0%, rgba(196,181,253,0.65) 18%, rgba(167,139,250,0.82) 50%, rgba(196,181,253,0.65) 82%, rgba(196,181,253,0.0) 100%)',
              boxShadow: '0 0 12px rgba(139,92,246,0.14)',
              animationDelay: `${-step.delay}s`,
            }}
          />
        ))}

        {FUSION_HELIX_STEPS.map((step, i) => {
          const leftEntry = visibleDeck[i % visibleDeck.length];
          const rightEntry = visibleDeck[(i + Math.ceil(visibleDeck.length / 2)) % visibleDeck.length];
          const nodes = [
            { entry: leftEntry, strand: 'a' },
            { entry: rightEntry, strand: 'b' },
          ];

          return nodes.map(({ entry, strand }) => {
            const iconKey = entry.catId === 'custom'
              ? (entry.mod._source === 'wikipedia' ? 'discovered' : 'custom')
              : entry.cat.icon;
            const NodeIcon = CATEGORY_ICONS[iconKey] || Star;
            const { r, g, b } = hexToRgb(entry.cat.color);

            return (
              <div
                key={`${step.id}-${strand}-${entry.mod.id}`}
                className={`fusion-helix-node fusion-helix-node-${strand}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${nodeSize}px`,
                  height: `${nodeSize}px`,
                  '--node-y': `${step.y}px`,
                  '--node-span': `${nodeSpan}px`,
                  '--node-depth': `${nodeDepth}px`,
                  animationDelay: `${-step.delay}s`,
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: isMobile ? '13px' : '16px',
                  background: `linear-gradient(180deg, rgba(${r},${g},${b},0.32) 0%, rgba(20,20,28,0.98) 36%, rgba(10,10,16,0.98) 100%)`,
                  border: `1px solid rgba(${r},${g},${b},0.36)`,
                  boxShadow: `0 10px 24px rgba(0,0,0,0.34), 0 0 24px rgba(${r},${g},${b},0.16), inset 0 1px 0 rgba(255,255,255,0.08)`,
                }} />
                <div style={{
                  position: 'absolute',
                  inset: '1px',
                  borderRadius: isMobile ? '12px' : '15px',
                  background: `radial-gradient(circle at 50% 32%, rgba(${r},${g},${b},0.22) 0%, rgba(255,255,255,0.03) 38%, rgba(8,8,12,0.0) 100%)`,
                }} />
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  fontSize: isMobile ? '6px' : '7px',
                  fontWeight: 900,
                  color: `rgba(${r},${g},${b},0.92)`,
                  fontFamily: 'ui-monospace, monospace',
                  textShadow: `0 0 8px rgba(${r},${g},${b},0.45)`,
                }}>
                  {entry.mod.power}
                </div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: `drop-shadow(0 0 10px rgba(${r},${g},${b},0.5))`,
                }}>
                  <CardIcon icon={NodeIcon} size={isMobile ? 18 : 22} color={entry.cat.color} />
                </div>
              </div>
            );
          });
        })}

        <div className="fusion-core-shell" style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${coreSize}px`,
          height: `${coreSize}px`,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, rgba(196,181,253,0.8) 12%, rgba(139,92,246,0.28) 38%, rgba(99,102,241,0.0) 74%)',
          boxShadow: '0 0 34px rgba(139,92,246,0.22), 0 0 90px rgba(99,102,241,0.18)',
        }}>
          <div className="fusion-core-ring" style={{ position: 'absolute', inset: isMobile ? '-8px' : '-10px', borderRadius: '50%', border: '1px solid rgba(196,181,253,0.18)' }} />
          <div className="fusion-core-ring fusion-core-ring-b" style={{ position: 'absolute', inset: isMobile ? '10px' : '12px', borderRadius: '50%', border: '1px solid rgba(167,139,250,0.18)' }} />
          <div className="fusion-core-ring fusion-core-ring-c" style={{ position: 'absolute', inset: isMobile ? '24px' : '30px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.24)' }} />
        </div>
      </div>
    </div>
  );
});

// Cognitive routing triggers — maps each domain to the task signals that activate its experts
// ── Mission bridges: category × domain keyword → specific product angle ──
// Used by adaptGeniusToMission to connect genius lore to specific product decisions
const MISSION_BRIDGES = {
  film: {
    _default: 'Onboarding is a cold open — hook before explaining. Every screen transition is a cut. Loading builds anticipation.',
    marketplace: 'The listing grid is a movie poster wall — if a card doesn\'t create desire in 0.5 seconds, they\'re invisible. Profile pages are three-act structure: hero reel → proof → climax (the hire/buy button). Testimonials are reaction shots.',
    tracker: 'The dashboard is the establishing shot — orient the user in one glance. Progress animations are montage sequences. Data reveals should build emotional momentum.',
    landing: 'The page is a movie trailer — hero creates wonder, social proof is the montage, CTA is the climax. Testimonials are reaction shots (the Spielberg Face). The visitor must FEEL before they think.',
    social: 'The feed is a highlight reel — each post must earn its screen time. Profile pages are character introductions. The scroll must have the pacing of a great film.',
    course: 'Each lesson is an episode — cold open hooks, cliffhanger endings pull them into the next. Learning should feel like watching a great series, not reading a manual.',
    game: 'Cinematics serve the player fantasy. Cutscenes earn their length. The camera IS the storytelling — close-up for emotion, wide for spectacle.',
    ecommerce: 'Product pages are movie posters — the hero image sells the dream, reviews are the audience reaction shots. The "add to cart" is the climax of a visual narrative.',
    ai: 'AI responses should unfold like scenes — build anticipation during generation, deliver with impact. The loading state IS the experience.',
  },
  product: {
    _default: 'Say no to 1,000 features to nail one. The product IS the marketing. Ship the smallest thing that creates delight.',
    marketplace: 'Solve the chicken-and-egg: one side must have obvious value without the other. The core loop is match → trust → transact. Make the first transaction feel inevitable.',
    tracker: 'The core loop is: log → see progress → feel motivated → log again. If any step adds friction, the chain breaks. Make data entry effortless, insight instant.',
    landing: 'The page answers one question in 5 seconds: "What is this and why should I care?" The demo IS the hero. If the product isn\'t clear, design can\'t save it.',
    social: 'The empty state IS the product — what does it look like with 0 posts? 10? 10,000? Each milestone must feel rewarding. Network effects compound or they don\'t exist.',
    ecommerce: 'The shopping experience IS the product. Search, filters, product pages, cart, checkout — each step either builds trust or destroys it. Reduce clicks to purchase.',
    ai: 'The AI must deliver value in the first interaction. If the user needs to "learn the tool" before getting results, the product failed. Magic moment in 30 seconds.',
  },
  copy: {
    _default: 'Every button, empty state, and error message is a micro sales page. Microcopy is 50% of product UX.',
    marketplace: 'The offer isn\'t "find freelancers" — it\'s "Get your project done in 14 days risk-free." Stack guarantees. Reverse risk. The better offer beats better marketing.',
    tracker: '"Track your calories" is boring. "See exactly why you\'re not losing weight" creates desire. Frame the problem, not the feature.',
    landing: 'Headline does 80% of the work. Be specific: "Save 4 hours/week on invoicing" beats "Streamline your workflow." Social proof closes the last 20%.',
    ecommerce: 'Product descriptions sell the transformation, not the product. "You\'ll walk into the room and own it" beats "Premium cotton blend." Reviews are the closing argument.',
    ai: 'Prompt templates are offers — frame what the AI CAN do so specifically that users feel stupid not using it. "Turn any meeting into action items in 10 seconds" > "AI assistant."',
  },
  strategy: {
    _default: 'What important truth do few agree with? Build where you can be the last mover. If you can\'t name your moat, you don\'t have one.',
    marketplace: 'Marketplaces are won locally before globally. Supply before demand. The take rate must feel invisible to both sides. Network effects are the only moat that compounds.',
    tracker: 'Health data is the new social graph. The moat is behavioral lock-in — once someone has 90 days of data, switching costs are enormous. Start with one metric, own it.',
    landing: 'Position against the status quo, not competitors. Frame the category so you win by default.',
    ecommerce: 'Compete on curation, not selection. Amazon wins on everything — you win by being the best at one thing for one audience.',
    ai: 'AI wrappers without proprietary data are commodity. Your moat is domain-specific training data, workflow integration, or audience lock-in.',
  },
  engineering: {
    _default: 'Monolith first. TypeScript not optional. Auth: never roll your own. Ship today, optimize next week.',
    marketplace: 'Two-sided data model: users have roles (buyer/seller), listings have lifecycle states, transactions need escrow logic. Search quality IS the product — invest in it early.',
    tracker: 'Local-first for instant data entry. Sync in background. The app must feel fast even offline. Charts need to render at 60fps with 365 days of data.',
    landing: 'Page speed IS conversion rate. Every 100ms costs 1% of conversions. Lighthouse 95+. Static generation, image optimization, zero layout shift.',
    ai: 'Stream responses for perceived speed. Cache common queries. Eval constantly — vibes don\'t scale. Rate limiting and cost caps before launch or you\'ll wake up to a $10K bill.',
  },
  design: {
    _default: 'Every pixel is a decision. The 20ms difference between "almost right" and "right" animation curves separates tools people tolerate from tools people love.',
    marketplace: 'Card design is everything — the listing card must communicate trust, quality, and price in a glance. Search results must feel like browsing, not filtering. Profile pages build trust through visual hierarchy.',
    tracker: 'Data visualization IS the product. Charts must be beautiful AND informative. Progress indicators should create dopamine. The daily view must be glanceable in 2 seconds.',
    landing: 'First impression is 50 milliseconds. White space is confidence. One primary action per viewport. Typography IS the design.',
    social: 'The feed must be scannable and stoppable. Profile customization creates investment. Dark mode is its own system. User-generated content must look good in your layout.',
    ai: 'AI output needs visual hierarchy — distinguish between the answer, supporting context, and actions. Streaming text should feel like the AI is thinking, not loading.',
  },
  growth: {
    _default: 'Retention first — acquisition on a leaky bucket is arson. A/B test the critical path, not the button color.',
    marketplace: 'Supply-side acquisition is harder and more important. Referral loops work when both sides benefit. Reviews build trust that compounds. GMV per user matters more than user count.',
    tracker: 'Streaks are the growth engine. Loss aversion keeps users logging. Weekly summaries re-engage dormant users. Share progress = organic referral.',
    landing: 'One goal, one CTA, one metric. Test headlines first — 10x the impact of design changes.',
    ai: '"Wow moment" in the first session or churn is 80%+. Usage-based pricing aligns incentives. Power users are your salesforce.',
  },
  psychology: {
    _default: 'System 1 drives 95% of decisions. Default bias: whatever\'s pre-selected wins. Loss aversion is 2.5x stronger than gain motivation.',
    marketplace: 'Trust signals are the entire UX: badges, reviews, response time, completion rate. Loss aversion: "3 other buyers are viewing this" creates urgency. Anchoring: show the highest price first.',
    tracker: 'Variable rewards: will today be a personal best? Streaks exploit loss aversion. Commitment devices: public goals increase follow-through 2x. Make the desired behavior the default.',
    landing: 'Anchoring: show the premium price first. Social proof beats any argument. The decoy effect makes your target option shine. Frame choices, don\'t argue them.',
    ai: 'Anthropomorphism increases engagement but also expectation. Set accuracy expectations early. Confirmation bias: users believe AI more when it confirms what they already think — design for this.',
  },
  content: {
    _default: 'Every platform has its own grammar. Native format × native timing × native language = distribution.',
    marketplace: 'User-generated content IS the product. Reviews, portfolio pieces, case studies — your job is to make users create great content. Templates + prompts > blank text fields.',
    social: 'Content without distribution is a diary. Seed before launch. Cross-promote aggressively.',
    ai: 'AI-generated content needs guardrails. Give users templates, examples, and constraints — structured creativity beats blank canvas.',
  },
  writing: {
    _default: 'Write 2,000 words, keep 500. Voice is the moat — if anyone could have written it, rewrite.',
    marketplace: 'Listing descriptions should follow a structure: what it is → who it\'s for → what makes it different → social proof. Templates guide sellers to write well.',
    landing: 'The page is an essay: thesis (hero), evidence (features/proof), conclusion (CTA). Cut every word that doesn\'t serve the argument.',
    ai: 'AI should write in the user\'s voice, not its own. Tone matching is the killer feature. Output should feel written, not generated.',
  },
  artists: {
    _default: 'The interface should have a visual signature that\'s never been seen before. Make people screenshot your app — that\'s free marketing.',
    landing: 'The hero should create a moment of awe — not just communicate, but make the visitor FEEL something unprecedented. Technology disappears when emotion arrives.',
    marketplace: 'Visual differentiation IS competitive advantage. If your marketplace looks like every other marketplace, you\'ve already lost. The aesthetic should make competitors look dated.',
  },
  automation: {
    _default: 'Automate the highest frequency × highest cost manual processes first. The goal is a business that runs while you sleep.',
    marketplace: 'Automate trust: verification, background checks, payment escrow, dispute resolution. Manual moderation doesn\'t scale — build automated quality signals.',
    ai: 'AI is automation with judgment. Use it where rules fail but patterns exist. Always build the manual fallback first.',
  },
  music: {
    _default: 'Every interaction has a sound signature. Audio feedback under 100ms feels responsive. A sonic brand should be recognizable in 3 notes.',
  },
};

// ── Genius-specific mission hooks ──────────────────────────────────
// Per-genius overrides that activate when a genius has unique relevance
// to a mission domain. These override category-level bridges.
// Format: geniusId → { domainKeyword → specific angle }
const GENIUS_HOOKS = {
  // Product & Tech
  miyamoto: {
    tracker: 'Miyamoto\'s "30 seconds of joy" rule: logging a meal must feel like collecting a coin in Mario — instant feedback, satisfying sound, visual reward. Progressive difficulty: start with just calories, unlock macros as a "level up." The app should make you smile before you understand why it\'s working.',
    game: 'Every mechanic must pass the World 1-1 test: can a new player learn it without reading instructions? Lateral Thinking with Withered Technology — use simple tech in surprising ways. A delayed game is eventually good; a bad game is bad forever.',
    social: 'Miyamoto\'s playground test: is it fun with zero content? The empty state should feel like an invitation, not a void. Every interaction should have juice — satisfying feedback that makes users want to do it again.',
    course: 'Learning should work like World 1-1: the first Goomba teaches everything without words. Progressive difficulty curve. Each lesson should end with a moment of mastery that makes the student smile. No instruction manuals — learn by doing.',
    ecommerce: 'The browsing experience should feel like exploring a new Zelda dungeon — every turn reveals something delightful. Product discovery is play. Add "juice" to the cart interaction — make adding items feel rewarding.',
    _default: 'Apply Miyamoto\'s "30 seconds of joy" test to the core interaction. If the first use doesn\'t create a moment of delight, redesign it. Progressive disclosure: start simple, reveal depth as users grow.',
  },
  jobs: {
    _default: 'Jobs would ask: "What are we REALLY building?" Strip away every feature until you find the one thing that matters. The product IS the marketing — if it doesn\'t feel inevitable, nothing saves it. Say no to 1,000 things.',
    tracker: 'Jobs would make the tracking experience so beautiful you WANT to log every meal. The data visualization should be art. One metric on the home screen — not a dashboard, a statement. "People don\'t know what they want until you show them."',
    marketplace: 'Jobs would obsess over the first 5 seconds of the buyer experience. The marketplace should feel curated, not chaotic. "Design is not how it looks — it\'s how it WORKS." Make the transaction feel inevitable.',
    ai: 'Jobs would hide the AI. The user shouldn\'t think "I\'m using AI" — they should think "this app understands me." Technology should disappear. The magic is in what you DON\'T show.',
    landing: 'Jobs would cut the page to one idea, one CTA, one emotion. "One more thing" — save the best feature for the scroll reveal. The page should create desire, not explain features.',
  },
  musk: {
    _default: 'First principles: what are the physics-level constraints? 10x improvement, not 10%. Vertical integration when existing tools can\'t keep up. If the timeline seems reasonable, it\'s not ambitious enough.',
    ai: 'First principles: what does the AI actually need to be useful? Strip away chatbot theater. The AI should do one thing 10x better than a human — not many things slightly better. Vertical integration: own the full stack from model to UX.',
    tracker: 'First principles: why does tracking fail? Because data entry is friction. Solve the input problem from physics up — camera, voice, sensors. Make the tracking automatic, not manual.',
    marketplace: 'First principles: what makes marketplaces fail? Trust friction and payment friction. Solve those at the infrastructure level. The factory IS the product — the matching algorithm is your 10x.',
  },
  ive: {
    _default: 'Simplicity is not the absence of clutter — it\'s the presence of clarity. Materials matter in digital too: depth, texture, light. The unboxing IS the product experience. Obsess over the parts no one sees.',
    tracker: 'The daily log screen should feel as inevitable as the iPhone home screen. Every radius, every spacing, every transition considered. "When it\'s right, it feels like it couldn\'t be any other way." Make health tracking feel premium.',
    landing: 'The page should feel like an Apple product reveal — clean, confident, inevitable. Negative space communicates quality. Every detail considered down to the favicon. The page itself should feel like the product.',
  },

  // Copywriting
  hormozi: {
    _default: 'The Value Equation: (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice) = VALUE. Make the offer so good people feel stupid saying no. Stack value until price becomes irrelevant.',
    marketplace: 'The offer isn\'t "find freelancers" — it\'s "Get your $50K project done in 14 days risk-free or we refund." Stack guarantees: vetted talent + project insurance + milestone payments. Reverse ALL risk. The marketplace with the best offer wins.',
    tracker: 'Don\'t sell tracking — sell the result. "Lose 20 lbs in 90 days without giving up the foods you love, or your money back." Niche down: "AI calorie tracker for busy parents" beats "calorie counter for everyone."',
    ecommerce: 'Every product page is a Grand Slam Offer. Stack bonuses: free shipping + 30-day returns + loyalty points + exclusive access. The offer should make the customer feel stupid saying no. Price becomes irrelevant when value is stacked.',
    ai: 'Frame the AI as the dream outcome with zero effort. "Your personal CFO that saves you $10K/year — just connect your bank account." The tool does the work. The result is specific and measurable.',
    landing: 'The headline IS the offer. "Get [Dream Outcome] in [Time Period] without [Pain/Sacrifice], or [Guarantee]." Stack value below: what they get, what it\'s worth, what they pay. Make the gap embarrassing.',
    course: 'The course isn\'t "learn marketing" — it\'s "Get your first 1,000 customers in 30 days using the exact playbook that built a $100M company." Guarantee the outcome, not the content.',
  },
  ogilvy: {
    _default: 'The headline is 80% of the advertisement. "At 60 miles an hour, the loudest noise in this Rolls-Royce comes from the electric clock." Be specific. Long copy sells when every word earns its place.',
    marketplace: 'Every listing title is a headline — "Senior React Developer • 4.9★ • 200+ projects delivered • 48hr response" beats "Freelance Developer Available." The consumer isn\'t a moron — she\'s your buyer. Specificity is trust.',
    landing: 'Write the headline first. Test 20 versions. Research the audience before writing a word. Specificity converts: "Save 4.2 hours/week on invoicing" beats "Save time." Long-form works when the offer is complex and the copy is riveting.',
  },
  halbert: {
    _default: 'The most important thing is the LIST — a starving crowd beats clever copy. Write like you talk. First sentence\'s only job is to get them to read the second.',
    marketplace: 'Find the starving crowd first. What freelance skill are buyers DESPERATELY searching for right now? The marketplace wins by aggregating urgent demand, not by having the best UI. Specificity is proof: "He delivered the project in 3.7 days."',
    landing: 'The headline hooks. The first sentence\'s only job is to get them to read the second. Write like you\'re talking to one person. The P.S. is the second most-read part of the page.',
  },

  // Strategy
  pg: {
    _default: 'Make something people want — nothing else matters. Do things that don\'t scale. Launch fast, talk to users, iterate. Schlep blindness hides the best opportunities.',
    marketplace: 'Do things that don\'t scale: manually match the first 100 buyers with freelancers. Give both sides absurd attention. The insights from those conversations ARE the product roadmap. Schlep blindness: the unsexy operational work (vetting, dispute resolution) is the actual moat.',
    tracker: 'Launch the ugliest possible version that tracks one thing well. Talk to 10 users this week. "Live in the future, then build what\'s missing." If you\'re not embarrassed by v1, you launched too late.',
    ai: 'The best AI products come from noticing problems in your own life. Build the thing you wish existed. Launch fast — the model will improve, but the product insight won\'t come from waiting.',
    landing: 'If you can\'t explain what it does in one sentence, the product isn\'t focused enough. The landing page is a forcing function for clarity. Write clearly — if you can\'t explain it simply, you don\'t understand it.',
    ecommerce: 'Do things that don\'t scale first: hand-pick products, write every description, personally follow up with every buyer. Schlep blindness: returns, customer service, and logistics are the moat no one wants to build.',
  },
  thiel: {
    _default: '"What important truth do very few people agree with you on?" Competition is for losers. Be the last mover. Secrets exist — things that are true but not yet obvious.',
    marketplace: 'What marketplace secret do you know that Upwork doesn\'t? The monopoly isn\'t "better marketplace" — it\'s owning a vertical so deeply that switching is unthinkable. Start with a small market you can dominate completely.',
    ai: 'What AI capability exists today that most people underestimate? That\'s your secret. Build for the world that\'s coming, not the one that exists. Be the last mover in your niche.',
    tracker: 'The health tracking market looks crowded but has a secret: no one has made it truly effortless for [specific audience]. Own that niche completely before expanding.',
  },
  bezos: {
    _default: 'It\'s always Day One. Customer obsession, not competitor obsession. Work backwards: write the press release before building. High-velocity decisions at 70% certainty.',
    marketplace: 'Customer obsession for BOTH sides. Work backwards: write the press release for the freelancer and the buyer. "Your margin is my opportunity" — undercut competitor take rates and make it up on volume.',
    ecommerce: 'The everything store started with books. Start with one category, nail the experience, expand. Work backwards from the customer review you want to earn. Speed of delivery is a feature.',
    ai: 'Write the press release for your AI product before building it. What would the customer testimonial say? Work backwards from that. Two-pizza team. Ship at 70% certainty.',
  },

  // Engineering
  levelsio: {
    _default: 'Ship today, fix tomorrow. PHP and SQLite can scale to $1M ARR. No co-founders, no employees, no VC — just you and the internet. Build in public. Make revenue.',
    marketplace: 'Ship the marketplace with the simplest possible tech: one page listing freelancers, one form for buyers, manual matching to start. Make revenue day one. No payment escrow — use Stripe Connect. Build in public and let your audience become your first users.',
    tracker: 'Ship the tracker with a single input field and one chart. SQLite. No onboarding flow. Make it free, add premium when people beg for features. One developer, zero employees, $1M ARR potential.',
    ai: 'Wrap an API call in a simple UI. Ship it today. Charge for it tomorrow. No complicated architecture — one server, one database, one model. The indie hacker advantage is speed.',
    landing: 'Build the landing page AND the product in the same weekend. No Figma mockups, no design committee. Ship, get users, iterate based on data. Your first landing page should take 4 hours max.',
  },
  carmack: {
    _default: 'Deep focus: 12-hour sessions of flow state. Optimize only what matters — profile first. Simple readable code beats clever code.',
    tracker: 'Profile the rendering pipeline first. If the chart stutters at 365 data points, the architecture is wrong. Simple data structures, smart algorithms. 60fps is non-negotiable.',
    ai: 'Optimize the inference pipeline, not the UI. Latency kills AI products. Profile first, optimize what matters. Simple code that\'s easy to debug beats clever abstractions.',
    marketplace: 'Search is the core algorithm — invest in making it fast and relevant. Profile first: if listing load takes >200ms, you\'re losing users. Simple, readable code scales better than clever architectures.',
  },

  // Film
  spielberg: {
    _default: 'The audience must FEEL before they think. The Spielberg Face — the reaction shot — tells the audience how to feel. Spectacle serves emotion, never the reverse.',
    marketplace: 'The freelancer profile IS a movie trailer. The portfolio section is the action sequence. Client testimonials are the Spielberg Face — show the BUYER\'s reaction to great work, not just the work itself. The "Hire" button is the climax — every element on the page builds toward that moment.',
    tracker: 'The progress chart should create the emotional arc of a film — setbacks create tension, breakthroughs create triumph. The weekly summary is the montage. The milestone notification is the climax. Make them cheer for their own progress.',
    landing: 'The scroll is a movie. Hero shot creates wonder. Features section builds the world. Testimonials are the Spielberg Face — show how USERS react, not what the product does. The CTA is the moment they decide to believe. Make them cry, make them cheer, make them CLICK.',
    ai: 'The AI response should build like a Spielberg scene — start with wonder (the answer appearing), build with detail (supporting evidence), end with meaning (actionable next step). The loading state is the anticipation before the shark appears.',
  },
  mrbeast: {
    _default: 'Every second must earn its place. Hook in 0.5 seconds. The retention graph is god. Cut dead air ruthlessly. Re-engage every 30 seconds.',
    marketplace: 'The first 0.5 seconds of a listing determines if they click. Thumbnails (profile photos, portfolio previews) are 50% of success. "Would I click this?" is the only test for every listing card. Cut everything that doesn\'t serve conversion.',
    tracker: 'Gamify the tracking experience — daily challenges, streak rewards, leaderboards. Re-engage every session with a new insight or milestone. The retention graph is god: if day-7 retention isn\'t 40%+, the core loop is broken.',
    landing: 'Hook in 0.5 seconds or they bounce. Pattern interrupt: the hero should be unlike anything they\'ve seen on competitor sites. Every scroll section must re-engage. Test 20 headline versions. Cut everything that doesn\'t serve the click.',
    ai: 'The AI must deliver value in the first 0.5 seconds — show it\'s working immediately (streaming). Every interaction should surprise and delight. Re-engage: suggest follow-up questions. "Would I use this again?" is the only metric.',
  },
  kubrick: {
    _default: 'Obsessive perfectionism. Symmetry creates unease. Every prop, every color, every note is deliberate. Art is not comfortable.',
    marketplace: 'Obsess over the grid symmetry — listing cards must be perfectly aligned, consistently styled. Every pixel is deliberate. The search experience should feel controlled and curated, not chaotic. Art direction is trust.',
    landing: 'Every element on the page is deliberate — no decorative fluff. Symmetry creates visual authority. The color palette should be restrained and purposeful. Research the audience obsessively before designing a single pixel.',
  },
  nolan: {
    _default: 'Time is a narrative tool. Practical effects ground impossible concepts. The emotional core must be simple. Complexity in structure, simplicity in theme.',
    landing: 'The scroll should play with time — show the future state first (what life looks like AFTER using the product), then reveal how you get there. Simple emotional core: one promise. Complex execution: the page architecture should reward exploration.',
    ai: 'The AI should make the complex feel simple. Like Inception: layers of complexity with one simple emotional core. The user shouldn\'t need to understand how it works to feel the magic.',
  },

  // Growth
  uber: {
    _default: 'Supply before demand. Referral loops: give value to both sides. Growth is engineering virality into the product.',
    marketplace: 'City launch playbook: seed supply side first. Referral loops: give credit to BOTH sides of the marketplace. Local network effects compound — dominate one geography before expanding. Retention first; acquisition on a leaky bucket is arson.',
  },
  duolingo: {
    _default: 'Streaks are contracts with yourself. Loss aversion > gain seeking. Habits > features.',
    tracker: 'Streaks are everything. The owl (your notification character) should be endearingly passive-aggressive. Daily goals create commitment. XP and levels make progress tangible. Loss aversion: "Don\'t break your 47-day streak!" is more powerful than any feature.',
    course: 'Turn learning into a game. Daily XP goals. Streak freeze as premium feature. Notifications that create FOMO, not annoyance. The lesson should feel like 5 minutes even when it\'s 15. Hearts system creates stakes.',
  },

  // Psychology
  kahneman: {
    _default: 'System 1 is fast, automatic, emotional — it drives 95% of decisions. Anchoring sets the frame. WYSIATI: people decide based on available information, not complete information.',
    marketplace: 'System 1 decides in milliseconds: the freelancer photo, star rating, and price are processed before the buyer reads the bio. Anchor with the highest-value project first. WYSIATI: if reviews aren\'t visible, trust doesn\'t exist.',
    tracker: 'System 1 is why people skip logging — it feels effortful. Make tracking a System 1 activity: one tap, no thinking. Anchor the daily calorie goal visually. Loss aversion: show what they\'re losing by not tracking, not what they gain.',
    landing: 'The first number they see anchors everything. Show the premium price first, then the offer. System 1 processes images 60,000x faster than text — the hero image IS the argument. Social proof is System 1 shortcut for trust.',
  },
  cialdini: {
    _default: 'Six weapons: reciprocity, commitment, social proof, authority, liking, scarcity. Pre-suasion: what you show before the ask matters more than the ask.',
    marketplace: 'Social proof: "10,000+ projects completed" removes objections. Authority: badges, certifications, featured status. Scarcity: "Only 3 slots available this month." Reciprocity: free consultations create obligation. Pre-suasion: show success stories BEFORE the search results.',
    landing: 'Apply all six in order down the page: Reciprocity (free value in hero), Social proof (numbers), Authority (logos/press), Liking (founder story), Scarcity (limited spots), Commitment (small yes before big CTA).',
  },

  // Design
  rams: {
    _default: '"Weniger, aber besser" — less, but better. Good design makes a product useful, understandable, and honest. Thorough down to the last detail.',
    tracker: 'Is this feature necessary? If the tracker has more than 3 screens, it has too many. Every element must make the product more useful, not more "featureful." The daily log should be as minimal as a Braun alarm clock.',
    marketplace: '"Is this necessary?" — apply to every filter, every badge, every UI element. The listing card should communicate everything needed to decide in one glance. Extra interface chrome is noise unless it builds trust.',
  },
  linear: {
    _default: 'B2B software doesn\'t have to be ugly. Dark mode is its own system. Keyboard shortcuts are primary navigation. Animation curves must feel "right."',
    tracker: 'The tracker should feel like Linear — fast, keyboard-navigable, dark mode that\'s actually designed (not inverted). Every animation curve must feel right: 20ms difference between "good" and "perfect" is the whole game.',
    marketplace: 'The admin/dashboard side should feel like Linear: fast, clean, keyboard-first. Search should be instant. Status updates (project stages) should feel satisfying. B2B marketplace UI can be beautiful.',
  },

  // Writing
  king: {
    _default: '"The road to hell is paved with adverbs." Show, don\'t tell. First draft with the door closed, rewrite with it open. Kill your darlings.',
    marketplace: 'Listing descriptions: show don\'t tell. "I built a payments system that processes $2M/month" beats "experienced fintech developer." Kill adverbs in all microcopy. First draft of every page with the door closed, rewrite with users watching.',
    landing: '"The road to hell is paved with adverbs." Cut every qualifier on the landing page. "Fast" → "Loads in 0.3 seconds." "Easy" → "Set up in 2 minutes." Show, don\'t tell — screenshots beat feature lists.',
  },
  pixar: {
    _default: '"Once upon a time ___, every day ___, one day ___, because of that ___, until finally ___." Make them FEEL before they think.',
    landing: 'Structure the page like a Pixar story: Once upon a time (the problem), every day (the pain), one day (the product), because of that (the transformation), until finally (the happy ending with CTA). Make them FEEL before they evaluate.',
    marketplace: 'Every freelancer profile should tell a story: where they started, what they mastered, what they can do for YOU. The marketplace isn\'t a database — it\'s a cast of characters. Give freelancers opinions — "I specialize in..." not "Available for..."',
  },
};

// Domain keyword aliases → bridge key
const DOMAIN_ALIASES = {
  marketplace: ['marketplace', 'market place', 'two-sided', 'platform connecting'],
  tracker: ['tracker', 'tracking', 'monitor', 'dashboard', 'analytics', 'saas', 'crm'],
  landing: ['landing page', 'homepage', 'marketing site', 'launch page', 'website'],
  social: ['social', 'community', 'forum', 'network', 'feed'],
  course: ['course', 'learn', 'tutor', 'education', 'academy', 'bootcamp'],
  game: ['game', 'gamif', 'rpg', 'quest', 'leaderboard'],
  ecommerce: ['ecommerce', 'e-commerce', 'store', 'shop', 'retail', 'commerce'],
  ai: ['ai ', ' ai', 'artificial intelligence', 'chatbot', 'gpt', 'llm', 'copilot', 'agent'],
};

// Find the best mission bridge for a genius based on mission keywords
const findClientBridge = (catId, mission) => {
  const catBridges = MISSION_BRIDGES[catId];
  if (!catBridges) return null;
  const lower = (mission || '').toLowerCase();

  // Check domain aliases → bridge key
  for (const [bridgeKey, aliases] of Object.entries(DOMAIN_ALIASES)) {
    if (aliases.some(a => lower.includes(a)) && catBridges[bridgeKey]) {
      return catBridges[bridgeKey];
    }
  }

  // Direct key match as fallback
  for (const [key, value] of Object.entries(catBridges)) {
    if (key === '_default') continue;
    if (lower.includes(key)) return value;
  }

  return catBridges._default || null;
};

const ROUTING_TRIGGERS = {
  film: 'video, storytelling, narrative, cinematography, audience engagement, pacing, editing, scenes',
  product: 'product decisions, UX, simplification, market fit, features, prioritization, taste',
  copy: 'persuasion, headlines, copy, ads, conversion, sales pages, emails, landing pages',
  strategy: 'business decisions, competition, moats, pricing, market positioning, investing, growth strategy',
  content: 'social media, distribution, audience building, engagement, virality, posts, threads',
  writing: 'narrative, dialogue, articles, creative writing, clarity, structure, editing, prose',
  engineering: 'code, architecture, performance, debugging, shipping, APIs, technical decisions, infrastructure',
  design: 'visual design, layout, typography, UI, aesthetics, design systems, color, spacing',
  artists: 'immersive experience, installation, perception, emotion, space, art direction, sensory',
  growth: 'metrics, A/B testing, retention, acquisition, viral loops, funnels, experiments',
  automation: 'workflows, integration, efficiency, tools, systems, no-code, automation',
  custom: 'specialized domain expertise',
};

// Extract the most potent quoted phrases from a persona prompt
const extractKeyQuotes = (prompt) => {
  const quotes = [];
  const regex = /"([^"]+)"/g;
  let match;
  while ((match = regex.exec(prompt)) !== null) {
    if (match[1].length > 8 && match[1].length < 100) quotes.push(`"${match[1]}"`);
  }
  if (quotes.length >= 2) return quotes.slice(0, 3).join(' • ');
  if (quotes.length === 1) return quotes[0];
  const sentences = prompt.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
  return sentences[0] ? sentences[0] + '.' : prompt.slice(0, 80);
};

// Transform raw Wikipedia data into immersive second-person lore
const craftLoreFromWiki = (name, description, summary) => {
  const firstName = name.split(' ')[0];
  const text = `${description} ${summary}`.toLowerCase();

  // Strip biographical noise, keep achievement sentences
  const sentences = (summary || '').split(/(?<=[.!?])\s+/).filter(s => {
    const low = s.toLowerCase();
    if (/^(born |died |he is |she is |they are |was born|is a |was a |are a )/.test(low.trim())) return false;
    if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i.test(s)) return false;
    if (s.trim().length < 20) return false;
    return true;
  });

  // Pick the meatiest 2-3 sentences as raw material
  const best = sentences
    .sort((a, b) => b.length - a.length)
    .slice(0, 3)
    .map(s => s.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim());

  // Reframe facts as transferable principles
  const reframe = (s) => {
    return s
      .replace(/^(he|she|they|it)\s+(is|was|has been|had been|became)\s+/i, '')
      .replace(/^(known for|noted for|famous for|recognized for|regarded as)\s+/i, '')
      .replace(/^(one of the|considered|widely)\s+/i, '')
      .trim();
  };

  const principles = best.map(reframe).filter(s => s.length > 10);

  // Detect domain for voice/framing
  const isTech = /\b(software|programmer|computer|engineer|developer|hacker|coder|blockchain|crypto|startup|founder|ceo|investor|entrepreneur|venture)\b/.test(text);
  const isCreative = /\b(artist|musician|singer|composer|rapper|painter|sculptor|designer|architect|filmmaker|director|actor|actress|choreograph)\b/.test(text);
  const isScience = /\b(scientist|physicist|mathematician|biologist|chemist|researcher|professor|theorem|equation|discovery|Nobel)\b/.test(text);
  const isWriter = /\b(writer|author|novelist|poet|journalist|playwright|essayist|philosopher)\b/.test(text);

  // Build the lore
  let lore = '';
  const p1 = principles[0] || description || 'a singular mind';
  const p2 = principles[1] || '';
  const p3 = principles[2] || '';

  if (isTech) {
    lore = `You think like ${name}. ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'} ${p2 ? p2.charAt(0).toUpperCase() + p2.slice(1) + (p2.endsWith('.') ? '' : '.') + ' ' : ''}You don't just build—you reshape how systems work at their foundation. ${p3 ? '"' + p3.slice(0, 80).trim() + '"—that\'s the principle.' : `"Ship it, then make it inevitable"—that's the ${firstName} way.`} What would ${firstName} refuse to compromise on?`;
  } else if (isCreative) {
    lore = `You create like ${name}. ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'} ${p2 ? p2.charAt(0).toUpperCase() + p2.slice(1) + (p2.endsWith('.') ? '' : '.') + ' ' : ''}Every choice is deliberate—the medium IS the message. ${p3 ? '"' + p3.slice(0, 80).trim() + '"—channel that energy.' : `Feel first, refine later. Make them experience something they can't name.`} What would ${firstName} never repeat?`;
  } else if (isScience) {
    lore = `You reason like ${name}. ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'} ${p2 ? p2.charAt(0).toUpperCase() + p2.slice(1) + (p2.endsWith('.') ? '' : '.') + ' ' : ''}First principles aren't a buzzword—they're how breakthroughs happen. Elegance in the proof matters as much as the result. ${p3 ? '"' + p3.slice(0, 80).trim() + '"—apply that rigor everywhere.' : `Question the axioms everyone else accepts.`} What would ${firstName} test next?`;
  } else if (isWriter) {
    lore = `You write with the mind of ${name}. ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'} ${p2 ? p2.charAt(0).toUpperCase() + p2.slice(1) + (p2.endsWith('.') ? '' : '.') + ' ' : ''}Words aren't decoration—they're precision instruments. Every sentence must earn its place. ${p3 ? '"' + p3.slice(0, 80).trim() + '"—that conviction drives the work.' : `Clarity is courage. Say what others dance around.`} What would ${firstName} cut from the draft?`;
  } else {
    lore = `You channel ${name}. ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'} ${p2 ? p2.charAt(0).toUpperCase() + p2.slice(1) + (p2.endsWith('.') ? '' : '.') + ' ' : ''}${p3 ? p3.charAt(0).toUpperCase() + p3.slice(1) + (p3.endsWith('.') ? '' : '.') + ' ' : ''}You don't follow the playbook—you rewrite it. Absorb the principles, discard the conventions. What would ${firstName} do that nobody expects?`;
  }

  return lore.replace(/\s+/g, ' ').trim();
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
    copy: () => { playTone(880, 0.03, 'square', 0.04); setTimeout(() => playTone(1100, 0.04, 'sine', 0.04), 20); },
    land: () => playTone(200, 0.04, 'triangle', 0.04),
  };
};


// Stripe Payment Links — set these in your environment
const STRIPE_LINKS = {
  monthly: (import.meta.env.VITE_STRIPE_MONTHLY_URL || '').trim(),
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
  const [missionDraft, setMissionDraft] = useState('');
  const [editingMission, setEditingMission] = useState(false);
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
  const [wikiResults, setWikiResults] = useState([]);
  const [wikiSuggestions, setWikiSuggestions] = useState([]);
  const [wikiSearching, setWikiSearching] = useState(false);
  const [wikiAdding, setWikiAdding] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredGenius, setHoveredGenius] = useState(null);
  const [fusePhase, setFusePhase] = useState(null); // null | 'revealed'
  const [fuseHover, setFuseHover] = useState(false);
  const [dealingIn, setDealingIn] = useState(false); // Balatro-style deal animation on stage enter
  const [deckDealing, setDeckDealing] = useState(false); // deck tap: cards spreading from deck
  const [deckDealt, setDeckDealt] = useState(false); // deal complete, ready to transition
  const [cardReveal, setCardReveal] = useState(false); // card reveal page after pack opens
  const [packIntent, setPackIntent] = useState(''); // "What do you want to build?" on landing
  const [packPicks, setPackPicks] = useState(null); // 3 AI-picked genius IDs for the pack
  const [pickingGeniuses, setPickingGeniuses] = useState(false); // loading state for AI pick
  const [trialMode, setTrialMode] = useState(false); // board locked after first-time deal
  const [packInputShake, setPackInputShake] = useState(false); // shake input when locked pack clicked
  const [introPlayed, setIntroPlayed] = useState(false); // cinematic intro complete
  const packInputRef = useRef(null);
  const [showPostCopyUpgrade, setShowPostCopyUpgrade] = useState(false); // upgrade CTA after copy/send
  const [flyingCards, setFlyingCards] = useState(new Set()); // cards animating to hand
  const [sparklingCards, setSparklingCards] = useState(new Set()); // sparkle burst on select
  const [poofingCards, setPoofingCards] = useState(new Set()); // poof spiral on deselect from hand
  const [wobblingCards, setWobblingCards] = useState(new Set()); // neighbor wobble on deselect
  const [focusedHandCard, setFocusedHandCard] = useState(null);
  const [inspectedCard, setInspectedCard] = useState(null); // { catId, mod, cat } — Miyamoto-style enlarged card
  const [flippedCardId, setFlippedCardId] = useState(null); // which genius tile is flipped to front face
  const flippedCardIdRef = useRef(null);
  useEffect(() => { flippedCardIdRef.current = flippedCardId; }, [flippedCardId]);
  const wikiSearchTimeout = useRef(null);
  const heroCardRef = useRef(null);
  const searchInputRef = useRef(null);
  const hoveredCardRef = useRef(null);
  const lastSelectedCardRef = useRef(null);
  const focusedHandCardRef = useRef(null);
  const inspectedCardRef = useRef(null);
  const missionInputRef = useRef(null);
  const FREE_WIKI_LIMIT = 1;

  const sounds = useSound();
  const track = (event, props) => { try { window.plausible?.(event, { props }); } catch {} };
  const monthlyCheckoutUrl = STRIPE_LINKS.monthly
    ? `${STRIPE_LINKS.monthly}${STRIPE_LINKS.monthly.includes('?') ? '&' : '?'}client_reference_id=web`
    : '';
  const isCheckoutReady = Boolean(monthlyCheckoutUrl);

  const FREE_LIMIT = 3;
  const UPGRADE_NUDGE_AT = 2;
  const FREE_SQUAD_LIMIT = 1;
  const PRO_LIMIT = 7;
  const PRO_GENIUSES = new Set(['kubrick', 'jobs', 'ogilvy']);

  // Check for Stripe success redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') === 'true') {
      setIsPro(true);
      localStorage.setItem('skillclone_pro', 'true');
      window.history.replaceState({}, '', window.location.pathname);
      track('Pro Activated');
    }
  }, []);

  // ═══ CINEMATIC INTRO — Miyamoto title screen ═══
  React.useEffect(() => {
    const pack = document.querySelector('.landing-deck-stack');
    const title = document.querySelector('.intro-title');
    const subtitle = document.querySelector('.intro-subtitle');
    const inputWrap = document.querySelector('.intro-input');
    const samples = document.querySelector('.intro-samples');
    const veil = document.querySelector('.intro-veil');
    if (!pack || !veil) { setIntroPlayed(true); return; }

    // Everything starts hidden — the veil covers all
    gsap.set(pack, { scale: 2.8, rotateY: 18, rotateX: -8, opacity: 0, transformPerspective: 1200 });
    if (title) gsap.set(title, { opacity: 0, y: 30 });
    if (subtitle) gsap.set(subtitle, { opacity: 0, y: 20 });
    if (inputWrap) gsap.set(inputWrap, { opacity: 0, y: 15 });
    if (samples) gsap.set(samples, { opacity: 0, y: 10 });

    const tl = gsap.timeline({
      onComplete: () => setIntroPlayed(true),
    });

    // Act 1: Veil lifts (0-0.6s)
    tl.to(veil, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0);

    // Act 2: Pack emerges from dramatic angle (0.3-2.0s)
    tl.to(pack, {
      opacity: 1, scale: 1, rotateY: 0, rotateX: 0,
      duration: 1.6, ease: 'power3.out',
    }, 0.3);

    // Act 3: Title slides in (1.2s)
    if (title) tl.to(title, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 1.2);
    if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 1.5);
    if (inputWrap) tl.to(inputWrap, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.8);
    if (samples) tl.to(samples, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.1);

    return () => tl.kill();
  }, []);

  // Track upgrade modal impressions
  React.useEffect(() => {
    if (showUpgrade) track('Upgrade Modal');
  }, [showUpgrade]);

  // Persist custom modules
  React.useEffect(() => {
    localStorage.setItem('skillclone_custom', JSON.stringify(customModules));
  }, [customModules]);

  React.useEffect(() => {
    if (!editingMission) setMissionDraft(userIntent);
  }, [userIntent, editingMission]);

  React.useEffect(() => {
    if (!editingMission) return;
    const t = setTimeout(() => {
      missionInputRef.current?.focus();
      missionInputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [editingMission]);

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
      prompt: customDraft.prompt.trim() || `You channel ${customDraft.name.trim()}. Apply their hard-won knowledge, signature methods, and unique perspective to every challenge. Think through their frameworks—what would ${customDraft.name.trim()} actually do here? Be specific, not generic.`,
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
        body: JSON.stringify({ name, mission: userIntent.trim() || undefined }),
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

  // === WIKIPEDIA GENIUS DISCOVERY ===
  const allModuleNames = new Set([
    ...Object.values(GENIUS_CATEGORIES).flatMap(c => c.modules.map(m => m.name.toLowerCase())),
    ...customModules.map(m => m.name.toLowerCase()),
  ]);

  const wikiGeniusCount = customModules.filter(m => m._source === 'wikipedia').length;

  const searchWikipedia = (query) => {
    if (wikiSearchTimeout.current) clearTimeout(wikiSearchTimeout.current);
    const q = query.trim();
    if (q.length < 2) { setWikiResults([]); setWikiSearching(false); return; }

    // Only show wiki results when hardcoded matches are sparse
    const hardcodedMatches = Object.values(GENIUS_CATEGORIES)
      .flatMap(c => c.modules)
      .filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.specs.toLowerCase().includes(q.toLowerCase()));
    const customMatches = customModules.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
    if (hardcodedMatches.length + customMatches.length > 2) { setWikiResults([]); return; }

    setWikiSearching(true);
    wikiSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`);
        const data = await res.json();
        const results = (data.query?.search || []).filter(r => !allModuleNames.has(r.title.toLowerCase()));
        setWikiResults(results);
      } catch (err) {
        console.error('Wiki search failed:', err);
        setWikiResults([]);
      } finally {
        setWikiSearching(false);
      }
    }, 400);
  };

  const fetchWikiDetails = async (title) => {
    const [summaryRes, wdRes] = await Promise.all([
      fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts|pageimages&exintro=true&explaintext=true&pithumbsize=200&format=json&origin=*`),
      fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(title)}&language=en&format=json&origin=*`),
    ]);
    const summaryData = await summaryRes.json();
    const wdData = await wdRes.json();
    const pages = summaryData.query?.pages || {};
    const page = Object.values(pages)[0] || {};
    const wdDesc = wdData.search?.[0]?.description || '';
    return { summary: page.extract || '', description: wdDesc, thumbnail: page.thumbnail?.source || '' };
  };

  const detectCategory = (description, summary) => {
    const text = `${description} ${summary}`.toLowerCase();
    if (/\b(film|director|actor|actress|cinema|movie|screenwriter)\b/.test(text)) return 'film';
    if (/\b(software|programmer|computer|engineer|developer|hacker|coder|computing)\b/.test(text)) return 'engineering';
    if (/\b(business|entrepreneur|ceo|investor|venture|founder|executive)\b/.test(text)) return 'strategy';
    if (/\b(writer|author|novelist|poet|journalist|playwright|essayist)\b/.test(text)) return 'writing';
    if (/\b(designer|architect|design|graphic|visual|ux|ui)\b/.test(text)) return 'design';
    if (/\b(artist|painter|sculptor|art|installation|gallery|museum)\b/.test(text)) return 'artists';
    if (/\b(marketing|advertising|copywriter|brand|ad\b|copy)\b/.test(text)) return 'copy';
    if (/\b(musician|singer|composer|rapper|producer|music|band)\b/.test(text)) return 'content';
    if (/\b(product|startup|tech|technology|invention|silicon)\b/.test(text)) return 'product';
    if (/\b(growth|viral|social media|influencer|youtube|content creator)\b/.test(text)) return 'growth';
    return 'discovered';
  };

  const addWikiGenius = async (result) => {
    setWikiAdding(result.pageid);
    try {
      const details = await fetchWikiDetails(result.title);
      const catId = detectCategory(details.description, details.summary);
      const fallbackLore = craftLoreFromWiki(result.title, details.description, details.summary);
      let mod = {
        id: 'wiki_' + result.pageid,
        name: result.title,
        power: 90,
        specs: details.description || 'Expert mind',
        prompt: fallbackLore,
        _source: 'wikipedia',
        _category: catId,
        _thumbnail: details.thumbnail,
      };
      // Try AI lore generation for even richer prompt
      try {
        const loreRes = await fetch('/api/generate-lore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: result.title, wikiContext: { summary: details.summary, description: details.description }, mission: userIntent.trim() || undefined }),
        });
        if (loreRes.ok) {
          const loreData = await loreRes.json();
          if (loreData.prompt) mod.prompt = loreData.prompt;
          if (loreData.specs) mod.specs = loreData.specs;
          if (loreData.power) mod.power = loreData.power;
        }
      } catch (e) { /* fallback to crafted lore above */ }
      setCustomModules(prev => [...prev, mod]);
      // Auto-add to deck on first click
      const modCatId = mod._category || 'custom';
      setSelectedModules(prev => {
        const totalSelected = Object.values(prev).flat().length;
        if (totalSelected >= maxGeniuses) return prev;
        const current = prev[modCatId] || [];
        if (current.some(m => m.id === mod.id)) return prev;
        return { ...prev, [modCatId]: [...current, mod] };
      });
      setWikiResults(prev => prev.filter(r => r.pageid !== result.pageid));
      sounds.select();
    } catch (err) {
      console.error('Failed to add wiki genius:', err);
    } finally {
      setWikiAdding(null);
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
    if (!isPro && savedSquads.length >= FREE_SQUAD_LIMIT) {
      setShowUpgrade(true);
      setSavingSquad(false);
      setSquadNameDraft('');
      return;
    }
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
    applyPlanFilteredSelection(squad.modules);
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

  // Clear wiki results when search empties
  React.useEffect(() => {
    if (!searchQuery.trim()) { setWikiResults([]); setWikiSearching(false); }
    return () => { if (wikiSearchTimeout.current) clearTimeout(wikiSearchTimeout.current); };
  }, [searchQuery]);

  // GSAP pack rip → cards burst → overlay dissolves
  React.useEffect(() => {
    if (!deckDealing || stage !== 'landing') return;

    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const deckEl = deckStackRef.current;
        const cardStack = dealContainerRef.current;
        if (!deckEl) return;

        // Pack elements
        const packFull = deckEl.querySelector('.pack-full');
        const packTop = deckEl.querySelector('.pack-top');
        const packBottom = deckEl.querySelector('.pack-bottom');
        const tearGlow = deckEl.querySelector('.pack-tear-glow');
        const tearBloom = deckEl.querySelector('.pack-tear-bloom');
        const burst = deckEl.querySelector('.pack-burst');
        const sparks = deckEl.querySelectorAll('.pack-spark');
        const slashBlade = deckEl.querySelector('.pack-slash');
        const slashTrail = deckEl.querySelector('.pack-slash-trail');
        const slashFlash = deckEl.querySelector('.pack-slash-flash');
        const overlay = document.querySelector('.landing-overlay');
        const scrim = overlay?.querySelector('.landing-scrim');
        const buildingView = buildingViewRef.current;
        const dealCards = cardStack ? Array.from(cardStack.querySelectorAll('.deal-card')) : [];

        // Position all cards stacked inside the pack
        const pw = isMobile ? 195 : 270;
        dealCards.forEach((card, i) => {
          gsap.set(card, {
            x: (i - dealCards.length / 2) * 0.15,
            y: (i - dealCards.length / 2) * 0.1,
            rotation: 0,
            scale: pw / (isMobile ? 160 : 220),
            opacity: 0,
          });
        });

        // Measure grid positions BEFORE animation starts
        const gridTiles = document.querySelectorAll('.genius-tile[data-genius]');
        const gridPositions = {};
        gridTiles.forEach(tile => {
          const id = tile.getAttribute('data-genius');
          const rect = tile.getBoundingClientRect();
          gridPositions[id] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height };
        });

        const tl = gsap.timeline({
          onComplete: () => {
            setDeckDealing(false);
          },
        });

        // ═══ ACT 1: THE SLASH — diagonal energy blade slices the top off ═══

        // 1a. Anticipation — pack tenses up
        tl.to(deckEl, {
          scaleX: 0.96, scaleY: 1.03,
          duration: 0.2,
          ease: 'power2.in',
        });

        // 1b. ⚡ THE SLASH — blade sweeps across at high speed
        // Blade appears from left, streaks across the pack
        tl.to(slashBlade, {
          opacity: 1,
          x: '120%',
          duration: 0.12,
          ease: 'power4.in',
        });
        // Trail follows slightly behind
        tl.to(slashTrail, {
          opacity: 1,
          x: '120%',
          duration: 0.14,
          ease: 'power4.in',
        }, '<+=0.02');

        // 1c. IMPACT — the moment the slash completes
        // White flash at the cut line
        tl.to(slashFlash, {
          opacity: 1,
          duration: 0.04,
          ease: 'none',
        }, '-=0.04');
        // Hide full pack, reveal the sliced halves
        tl.to(packFull, { opacity: 0, duration: 0.03 }, '<');
        // Pack snaps back from anticipation squeeze
        tl.to(deckEl, {
          scaleX: 1.02, scaleY: 0.98,
          duration: 0.08,
          ease: 'power3.out',
        }, '<');
        // Tear glow along the diagonal cut
        tl.to(tearGlow, { opacity: 1, duration: 0.06, ease: 'power4.out' }, '<');
        // Energy burst from the cut
        tl.to(burst, {
          opacity: 0.8, scale: 1.3,
          duration: 0.15, ease: 'power2.out',
        }, '<');

        // 1d. THE SEPARATION — sliced top flies off
        // Top flap launches upward and to the right (following slash direction)
        tl.to(packTop, {
          y: isMobile ? -150 : -210,
          x: isMobile ? 30 : 45,
          rotation: -12,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.out',
        }, '-=0.06');
        // Pack body recoils from the cut
        tl.to(packBottom, {
          y: isMobile ? 5 : 7,
          duration: 0.1,
          ease: 'power2.out',
        }, '<');
        tl.to(packBottom, {
          y: 0,
          duration: 0.15,
          ease: 'elastic.out(1, 0.5)',
        });
        // Normalize pack scale
        tl.to(deckEl, {
          scaleX: 1, scaleY: 1,
          duration: 0.15,
          ease: 'power2.out',
        }, '<');

        // 1e. AFTERMATH — slash fades, sparks shower
        // Blade and trail fade
        tl.to(slashBlade, { opacity: 0, duration: 0.15 }, '-=0.4');
        tl.to(slashTrail, { opacity: 0, duration: 0.25 }, '-=0.35');
        tl.to(slashFlash, { opacity: 0, duration: 0.2 }, '-=0.4');

        // Bloom pulse
        tl.to(tearBloom, { opacity: 1, duration: 0.08, ease: 'power2.out' }, '-=0.45');
        tl.to(tearBloom, { opacity: 0, scaleY: 2, duration: 0.35, ease: 'power2.out' }, '-=0.3');

        // Sparks shower — burst along the diagonal cut line, biased upward
        sparks.forEach((spark, i) => {
          const t = i / (sparks.length - 1); // 0→1 along the cut
          const angle = -160 + t * 60 + (Math.random() - 0.5) * 40; // fan upward
          const dist = 35 + Math.random() * 80;
          const rad = (angle * Math.PI) / 180;
          tl.to(spark, { opacity: 1, duration: 0.03 }, '-=0.42');
          tl.to(spark, {
            x: Math.sin(rad) * dist,
            y: -Math.abs(Math.cos(rad) * dist) - Math.random() * 20,
            opacity: 0,
            scale: i % 4 === 0 ? 3.5 : i % 3 === 0 ? 2.5 : 1.5,
            duration: 0.2 + Math.random() * 0.2,
            ease: 'power2.out',
          }, '-=0.4');
        });

        // Glow/burst fade
        tl.to(tearGlow, { opacity: 0, duration: 0.2 }, '-=0.15');
        tl.to(burst, { opacity: 0, scale: 2.5, duration: 0.3, ease: 'power2.out' }, '-=0.25');

        // ═══ ACT 2: CARDS EMERGE — rise from the open pack showing front face ═══

        // Show top ~8 cards rising from pack opening (front face visible)
        const previewCount = Math.min(8, dealCards.length);
        const emergeStart = tl.duration();
        for (let i = 0; i < previewCount; i++) {
          tl.to(dealCards[i], {
            opacity: 1,
            y: -(isMobile ? 60 : 80) - i * (isMobile ? 3 : 5),
            x: (i - previewCount / 2) * (isMobile ? 3 : 5),
            rotation: (i - previewCount / 2) * 0.8,
            scale: isMobile ? 0.78 : 0.82,
            duration: 0.3,
            ease: 'back.out(1.6)',
          }, emergeStart + i * 0.03);
        }

        // Pause to admire the cards
        tl.to({}, { duration: 0.5 });

        // ═══ ACT 2.5: SWAP TO BACK FACE — hide front, show back via opacity ═══
        const flipTime = tl.duration();
        for (let i = 0; i < previewCount; i++) {
          const cardEl = dealCards[i];
          const front = cardEl.querySelector('.deal-front');
          const back = cardEl.querySelector('.deal-back');
          if (front) tl.to(front, { opacity: 0, duration: 0.18, ease: 'power2.inOut' }, flipTime + i * 0.015);
          if (back) tl.to(back, { opacity: 1, duration: 0.18, ease: 'power2.inOut' }, flipTime + i * 0.015);
        }
        tl.to({}, { duration: 0.15 });

        // ═══ ACT 3: TRANSITION TO CARD REVEAL PAGE ═══

        // Fade EVERYTHING — pack, proxy cards, scrim, overlay content
        tl.to(packBottom, { y: isMobile ? 45 : 60, opacity: 0, duration: 0.25, ease: 'power2.in' });
        tl.to(dealCards, { opacity: 0, duration: 0.15 }, '<');
        tl.to(deckEl, { opacity: 0, duration: 0.2 }, '<');
        if (scrim) tl.to(scrim, { opacity: 0, duration: 0.2 }, '<');
        if (overlay) tl.to(overlay, { opacity: 0, duration: 0.25 }, '<');

        // Switch to card reveal page
        tl.call(() => {
          setCardReveal(true);
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [deckDealing, stage]);

  // Normal deal-in when entering building from other paths (not from deck)
  const lastDealtStage = useRef(null);
  React.useEffect(() => {
    if (stage === 'building' && lastDealtStage.current !== 'building') {
      lastDealtStage.current = 'building';
      // If coming from deck deal, cards are already in position — skip animation
      if (deckDealt) return;
      setDealingIn(true);
      const timer = setTimeout(() => setDealingIn(false), 800);
      return () => clearTimeout(timer);
    }
    if (stage !== 'building') lastDealtStage.current = null;
  }, [stage, deckDealt]);

  // Auto-suggest Wikipedia geniuses based on user intent when entering building stage
  React.useEffect(() => {
    if (stage !== 'building' || !userIntent.trim()) { setWikiSuggestions([]); return; }
    let cancelled = false;
    const fetchSuggestions = async () => {
      try {
        // Extract key terms from intent for people search
        const q = userIntent.trim() + ' notable person';
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=4&format=json&origin=*`);
        const data = await res.json();
        if (cancelled) return;
        const results = (data.query?.search || []).filter(r => !allModuleNames.has(r.title.toLowerCase()));
        setWikiSuggestions(results);
      } catch (e) { if (!cancelled) setWikiSuggestions([]); }
    };
    fetchSuggestions();
    return () => { cancelled = true; };
  }, [stage, userIntent]);

  const fusionDeck = React.useMemo(() => (
    Object.entries(selectedModules).flatMap(([catId, mods]) => {
      const cat = GENIUS_CATEGORIES[catId] || { color: catId === 'custom' ? CUSTOM_GENIUS_COLOR : DISCOVERED_GENIUS_COLOR, icon: 'custom', name: 'Custom' };
      return (mods || []).map((mod) => ({ catId, mod, cat }));
    })
  ), [selectedModules]);
  const allSelected = fusionDeck.map(({ mod }) => mod);
  const totalPower = allSelected.reduce((sum, m) => sum + (m?.power || 0), 0);
  const moduleCount = allSelected.length;
  const maxGeniuses = isPro ? PRO_LIMIT : FREE_LIMIT;

  // All genius cards for the landing deck — one flat list with category info
  const allGeniusCards = React.useMemo(() => {
    const cards = [];
    CATEGORY_ORDER.forEach(catId => {
      const cat = GENIUS_CATEGORIES[catId];
      if (!cat) return;
      cat.modules.forEach(mod => cards.push({ catId, mod, cat }));
    });
    return cards;
  }, []);

  // Deal cards — filtered to AI picks when in trial mode, otherwise all
  const dealCards = React.useMemo(() => {
    if (!packPicks) return allGeniusCards;
    return packPicks.map(id => allGeniusCards.find(c => c.mod.id === id)).filter(Boolean);
  }, [allGeniusCards, packPicks]);

  // Solitaire deal — deck stays, cards spread from under it. No stage switch until done.
  const deckStackRef = useRef(null);
  const dealContainerRef = useRef(null);
  const buildingViewRef = useRef(null);
  const startDeckDeal = useCallback(() => {
    if (deckDealing) return;
    sounds.click();
    setDeckDealing(true);
  }, [deckDealing, sounds]);

  // ═══ SWIPE-TO-SLICE interaction ═══
  const sliceActive = useRef(false);
  const sliceStartX = useRef(0);
  const slicePackRect = useRef(null);
  const sliceTapTime = useRef(null);

  // ═══ METAL-CUTTING SPARK PARTICLE SYSTEM ═══
  const sparkCanvasRef = useRef(null);
  const sparkParts = useRef([]);
  const sparkRaf = useRef(null);
  const emitSparksRef = useRef(() => {});
  const sliceTapPos = useRef(null);

  const handleSliceStart = useCallback((clientX, clientY) => {
    if (deckDealing) return false;
    const el = deckStackRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    // Start tracking from anywhere on the pack — slice zone is generous
    sliceActive.current = true;
    sliceStartX.current = clientX;
    slicePackRect.current = rect;
    // Show the blade at starting position based on where they pressed
    const startPct = Math.max(0, (clientX - rect.left) / rect.width);
    const blade = el.querySelector('.pack-slash');
    const trail = el.querySelector('.pack-slash-trail');
    if (blade) { blade.style.opacity = '0.25'; blade.style.transform = `rotate(-3deg) translateX(${startPct * 120}%)`; blade.style.transition = 'none'; }
    if (trail) { trail.style.opacity = '0.1'; trail.style.transform = `rotate(-3deg) translateX(${Math.max(0, startPct * 120 - 8)}%) translateY(-4.5px)`; trail.style.transition = 'none'; }
    // Size spark canvas for this slice session
    const cvs = sparkCanvasRef.current;
    if (cvs) { const cr = cvs.getBoundingClientRect(); const d = window.devicePixelRatio || 1; cvs.width = cr.width * d; cvs.height = cr.height * d; }
    return true;
  }, [deckDealing]);

  const handleSliceMove = useCallback((clientX) => {
    if (!sliceActive.current || !slicePackRect.current) return;
    const rect = slicePackRect.current;
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const el = deckStackRef.current;
    if (!el) return;
    const blade = el.querySelector('.pack-slash');
    const trail = el.querySelector('.pack-slash-trail');
    const pct = progress * 120; // blade overshoots slightly
    const opacity = 0.3 + progress * 0.7;
    if (blade) { blade.style.opacity = `${opacity}`; blade.style.transform = `rotate(-3deg) translateX(${pct}%)`; }
    if (trail) { trail.style.opacity = `${opacity * 0.5}`; trail.style.transform = `rotate(-3deg) translateX(${Math.max(0, pct - 8)}%) translateY(-4.5px)`; }
    // Emit metal-cutting sparks from top edge of bottom half (just below the cut line)
    if (progress > 0.03) {
      const pr = slicePackRect.current;
      if (pr) emitSparksRef.current(pr.left + progress * pr.width, pr.top + pr.height * (0.21 + progress * 0.005), progress);
    }
    // Slight pack-top lift as they progress
    const top = el.querySelector('.pack-top');
    if (top && progress > 0.3) {
      const lift = (progress - 0.3) * 8;
      top.style.transform = `translateY(${-lift}px) rotate(${-lift * 0.3}deg)`;
      top.style.transition = 'none';
    }
    // Trigger on completion!
    if (progress > 0.75) {
      sliceActive.current = false;
      // Final cinematic burst — cascade of explosions across the full cut line
      const pr = slicePackRect.current;
      if (pr) {
        for (let b = 0; b < 8; b++) {
          const bx = pr.left + (0.1 + b * 0.1) * pr.width;
          const by = pr.top + pr.height * (0.215 + b * 0.002);
          setTimeout(() => emitSparksRef.current(bx, by, 1.0), b * 12); // staggered ripple
        }
      }
      // Reset direct DOM styles — GSAP will take over
      if (blade) { blade.style.opacity = ''; blade.style.transform = ''; blade.style.transition = ''; }
      if (trail) { trail.style.opacity = ''; trail.style.transform = ''; trail.style.transition = ''; }
      if (top) { top.style.transform = ''; top.style.transition = ''; }
      startDeckDeal();
    }
  }, [startDeckDeal]);

  const handleSliceEnd = useCallback(() => {
    if (!sliceActive.current) return;
    sliceActive.current = false;
    // Snap back — swipe wasn't completed
    const el = deckStackRef.current;
    if (!el) return;
    const blade = el.querySelector('.pack-slash');
    const trail = el.querySelector('.pack-slash-trail');
    const top = el.querySelector('.pack-top');
    if (blade) { blade.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; blade.style.opacity = '0'; blade.style.transform = ''; }
    if (trail) { trail.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; trail.style.opacity = '0'; trail.style.transform = ''; }
    if (top) { top.style.transition = 'transform 0.3s ease'; top.style.transform = ''; }
    setTimeout(() => {
      if (blade) blade.style.transition = '';
      if (trail) trail.style.transition = '';
      if (top) top.style.transition = '';
    }, 350);
  }, []);

  // ═══ CINEMATIC SPARK SYSTEM — multi-layer particle engine ═══
  // Particle types: 'spark' (fast streaks), 'ember' (floating glow), 'flash' (bright core burst),
  //                 'drip' (molten metal), 'smoke' (dark rising wisps), 'arc' (dramatic upward arcs)
  const sparkTick = () => {
    const cvs = sparkCanvasRef.current;
    if (!cvs) { sparkRaf.current = null; return; }
    const ctx = cvs.getContext('2d');
    const parts = sparkParts.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    const grav = 18 * dpr;

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const dt = 0.016;

      // Physics per type
      if (p.tp === 'smoke') {
        p.vy -= 3 * dpr * dt; // float upward
        p.vx *= 0.96; p.vy *= 0.97;
        p.s += dpr * dt * 6; // expand
      } else if (p.tp === 'drip') {
        p.vy += grav * 1.6 * dt; p.vx *= 0.97;
      } else if (p.tp === 'flash') {
        p.s *= 0.88; // shrink fast
      } else {
        p.vy += grav * dt;
        p.vx *= 0.984; p.vy *= 0.992;
      }
      p.x += p.vx; p.y += p.vy; p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }

      const t = p.life / p.ml; // 1→0
      const fadeIn = Math.min(1, (p.ml - p.life) / 0.04); // quick fade-in
      const a = Math.min(fadeIn, t < 0.12 ? t / 0.12 : 1);

      if (p.tp === 'smoke') {
        // Dark smoke wisps — drawn BEFORE lighter pass
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28);
        ctx.fillStyle = `rgba(40,20,10,${a * 0.12 * t})`;
        ctx.fill();
        continue;
      }

      ctx.globalCompositeOperation = 'lighter';

      if (p.tp === 'flash') {
        // Bright core flash — intense white burst at cut point
        const sz = p.s;
        ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, 6.28);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.9})`;
        ctx.fill();
        // Outer bloom
        ctx.beginPath(); ctx.arc(p.x, p.y, sz * 3, 0, 6.28);
        ctx.fillStyle = `rgba(255,240,200,${a * 0.25})`;
        ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, sz * 6, 0, 6.28);
        ctx.fillStyle = `rgba(255,180,80,${a * 0.08})`;
        ctx.fill();
      } else if (p.tp === 'drip') {
        // Molten metal drips — large, bright orange, teardrop-shaped
        const r = 255, g = 140 + (t * 60 | 0), b = 20 + (t * 30 | 0);
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
        const nx = p.vx / spd, ny = p.vy / spd;
        const len = Math.min(spd * 1.5, 8 * dpr);
        // Teardrop: thick head, tapered tail
        ctx.beginPath();
        ctx.moveTo(p.x - nx * len, p.y - ny * len);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        ctx.lineWidth = p.s * 1.8; ctx.lineCap = 'round'; ctx.stroke();
        // Hot glow around drip
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 3.5, 0, 6.28);
        ctx.fillStyle = `rgba(${r},${g},0,${a * 0.2})`;
        ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 7, 0, 6.28);
        ctx.fillStyle = `rgba(${r},80,0,${a * 0.06})`;
        ctx.fill();
      } else if (p.tp === 'ember') {
        // Embers — lingering glowing dots with large soft halo
        const r = 255, g = 160 + (t * 80 | 0), b = 30 + (t * 40 | 0);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (0.4 + t * 0.6), 0, 6.28);
        ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.9})`;
        ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 5, 0, 6.28);
        ctx.fillStyle = `rgba(${r},${g * 0.5 | 0},0,${a * 0.12})`;
        ctx.fill();
      } else {
        // Sparks — long motion-streaked hot metal fragments
        const r = 255;
        const g = t > 0.55 ? 235 + (t * 20 | 0) : t > 0.2 ? 90 + ((t - 0.2) * 415 | 0) : 40 + (t * 250 | 0);
        const b = t > 0.55 ? 200 + (t * 55 | 0) : t > 0.2 ? (20 * t | 0) : 0;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
        const len = Math.min(spd * 3.2, 28 * dpr); // longer streaks
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx / spd * len, p.y - p.vy / spd * len);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        ctx.lineWidth = p.s; ctx.lineCap = 'round'; ctx.stroke();
        // Hot tip glow
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2.5, 0, 6.28);
        ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.4})`;
        ctx.fill();
        // Outer haze
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 5, 0, 6.28);
        ctx.fillStyle = `rgba(${r},${g * 0.6 | 0},0,${a * 0.06})`;
        ctx.fill();
      }
    }
    sparkRaf.current = parts.length > 0 ? requestAnimationFrame(sparkTick) : null;
  };

  // Emit cinematic spark burst at screen coordinates
  emitSparksRef.current = (screenX, screenY, intensity) => {
    const cvs = sparkCanvasRef.current;
    if (!cvs) return;
    const dpr = window.devicePixelRatio || 1;
    if (!cvs.width) { const cr = cvs.getBoundingClientRect(); cvs.width = cr.width * dpr; cvs.height = cr.height * dpr; }
    const cr = cvs.getBoundingClientRect();
    const cx = (screenX - cr.left) * dpr, cy = (screenY - cr.top) * dpr;
    const P = sparkParts.current;
    const I = intensity;

    // 1. Core flash — bright white burst at the cut point
    if (I > 0.08) {
      P.push({
        x: cx, y: cy, vx: 0, vy: 0,
        life: 0.08 + Math.random() * 0.06, ml: 0.12,
        s: (4 + I * 8) * dpr, tp: 'flash',
      });
    }

    // 2. Fast sparks — spray downward and to sides from cut point
    const nSpark = 8 + (I * 20 | 0);
    for (let i = 0; i < nSpark; i++) {
      // Strictly downward spray — never above the cut line
      const ang = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.7;
      const spd = (3 + Math.random() * 8) * dpr * (0.6 + I * 0.4);
      const life = 0.15 + Math.random() * 0.9;
      P.push({
        x: cx + (Math.random() - 0.5) * 10 * dpr,
        y: cy + (Math.random() - 0.5) * 4 * dpr,
        vx: Math.cos(ang) * spd * (0.3 + Math.random() * 0.7),
        vy: Math.sin(ang) * spd,
        life, ml: life,
        s: (0.3 + Math.random() * 1.6) * dpr,
        tp: 'spark',
      });
    }

    // 3. Molten metal drips — heavy, bright, fall straight down
    if (I > 0.15) {
      const nDrip = 1 + (I * 3 | 0);
      for (let i = 0; i < nDrip; i++) {
        const life = 0.5 + Math.random() * 1.0;
        P.push({
          x: cx + (Math.random() - 0.5) * 12 * dpr,
          y: cy + Math.random() * 3 * dpr,
          vx: (Math.random() - 0.5) * 1.5 * dpr,
          vy: (1 + Math.random() * 2) * dpr,
          life, ml: life,
          s: (1 + Math.random() * 2) * dpr,
          tp: 'drip',
        });
      }
    }

    // 5. Embers — drift downward and sideways from the cut
    const nEmber = 2 + (I * 6 | 0);
    for (let i = 0; i < nEmber; i++) {
      const ang = Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.6; // downward bias
      const spd = (1 + Math.random() * 3) * dpr;
      const life = 0.3 + Math.random() * 1.2;
      P.push({
        x: cx + (Math.random() - 0.5) * 14 * dpr,
        y: cy + Math.random() * 4 * dpr,
        vx: Math.cos(ang) * spd * 0.5,
        vy: Math.abs(Math.sin(ang)) * spd * 0.6, // always downward
        life, ml: life,
        s: (0.6 + Math.random() * 1.8) * dpr,
        tp: 'ember',
      });
    }

    // 6. Smoke wisps — rise gently from cut point (subtle, stays near cut line)
    if (I > 0.1) {
      const nSmoke = 1 + (I * 2 | 0);
      for (let i = 0; i < nSmoke; i++) {
        const life = 0.4 + Math.random() * 0.6;
        P.push({
          x: cx + (Math.random() - 0.5) * 10 * dpr,
          y: cy,
          vx: (Math.random() - 0.5) * 1.5 * dpr,
          vy: -(1 + Math.random() * 1.5) * dpr, // gentle rise, stays close
          life, ml: life,
          s: (1.5 + Math.random() * 2) * dpr,
          tp: 'smoke',
        });
      }
    }

    if (!sparkRaf.current) sparkRaf.current = requestAnimationFrame(sparkTick);
  };

  // Document-level listeners for swipe tracking
  React.useEffect(() => {
    if (stage !== 'landing') return;
    const onMove = (e) => {
      const touch = e.touches?.[0];
      handleSliceMove(touch ? touch.clientX : e.clientX);
    };
    const onEnd = () => handleSliceEnd();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [stage, handleSliceMove, handleSliceEnd]);

  React.useEffect(() => {
    if (!focusedHandCard) return;
    const stillExists = (selectedModules[focusedHandCard.catId] || []).some((mod) => mod.id === focusedHandCard.id);
    if (!stillExists) setFocusedHandCard(null);
  }, [focusedHandCard, selectedModules]);

  React.useEffect(() => {
    if (stage !== 'building' || mobileCartOpen) setFocusedHandCard(null);
  }, [mobileCartOpen, stage]);

  // Dismiss inspected card / flipped card on Escape
  React.useEffect(() => {
    if (!inspectedCard && !flippedCardId) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (flippedCardId) setFlippedCardId(null);
        if (inspectedCard) setInspectedCard(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectedCard, flippedCardId]);

  const enforcePlanLimits = useCallback((draftSelection = {}) => {
    if (isPro) {
      return { filtered: draftSelection, removedProLocked: 0, removedByLimit: 0 };
    }

    let remaining = maxGeniuses;
    let removedProLocked = 0;
    let removedByLimit = 0;
    const seen = new Set();
    const filtered = {};

    Object.entries(draftSelection).forEach(([catId, mods]) => {
      (mods || []).forEach((mod) => {
        if (!mod || seen.has(mod.id)) return;
        seen.add(mod.id);

        if (PRO_GENIUSES.has(mod.id)) {
          removedProLocked += 1;
          return;
        }
        if (remaining <= 0) {
          removedByLimit += 1;
          return;
        }
        if (!filtered[catId]) filtered[catId] = [];
        filtered[catId].push(mod);
        remaining -= 1;
      });
    });

    return { filtered, removedProLocked, removedByLimit };
  }, [isPro, maxGeniuses]);

  const applyPlanFilteredSelection = useCallback((draftSelection = {}) => {
    const { filtered, removedProLocked, removedByLimit } = enforcePlanLimits(draftSelection);
    setSelectedModules(filtered);
    if (!isPro && (removedProLocked > 0 || removedByLimit > 0)) {
      setShowUpgrade(true);
    }
  }, [enforcePlanLimits, isPro]);

  const filteredGeniuses = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    let items = [];
    const cats = activeCategory === 'all' ? CATEGORY_ORDER : [activeCategory];
    cats.forEach(catId => {
      const cat = GENIUS_CATEGORIES[catId];
      if (!cat) return;
      cat.modules.forEach(mod => {
        if (q && !mod.name.toLowerCase().includes(q) && !mod.specs.toLowerCase().includes(q)) return;
        items.push({ catId, mod, cat });
      });
    });
    if (activeCategory === 'all') {
      customModules.filter(mod => !q || mod.name.toLowerCase().includes(q) || mod.specs.toLowerCase().includes(q))
        .forEach(mod => items.push({ catId: 'custom', mod, cat: { icon: mod._source === 'wikipedia' ? 'discovered' : 'custom', name: 'Custom', color: mod._source === 'wikipedia' ? DISCOVERED_GENIUS_COLOR : CUSTOM_GENIUS_COLOR } }));
    }
    return items;
  }, [activeCategory, searchQuery, customModules]);

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
      // Sparkle burst on selection
      setSparklingCards(prev => new Set(prev).add(module.id));
      setTimeout(() => setSparklingCards(prev => { const next = new Set(prev); next.delete(module.id); return next; }), 500);
      return { ...prev, [catId]: [...current, module] };
    });
  };

  const removeFromDeck = useCallback((catId, moduleId) => {
    sounds.deselect();
    setSelectedModules(prev => {
      const current = prev[catId] || [];
      const filtered = current.filter(m => m.id !== moduleId);
      return filtered.length ? { ...prev, [catId]: filtered } : (({ [catId]: _, ...rest }) => rest)(prev);
    });
  }, [sounds]);

  const removeHandCard = useCallback((cardId, catId, leftId, rightId) => {
    const neighborIds = new Set([leftId, rightId].filter(Boolean));
    setPoofingCards(prev => new Set(prev).add(cardId));
    setWobblingCards(neighborIds);
    if (focusedHandCard?.id === cardId) setFocusedHandCard(null);
    setTimeout(() => {
      setPoofingCards(prev => { const next = new Set(prev); next.delete(cardId); return next; });
      setWobblingCards(new Set());
      removeFromDeck(catId, cardId);
    }, 220);
  }, [focusedHandCard, removeFromDeck]);

  // Keep old name for backward compat
  const removeFocusedHandCard = useCallback(() => {
    if (!focusedHandCard) return;
    removeHandCard(focusedHandCard.id, focusedHandCard.catId, focusedHandCard.leftId, focusedHandCard.rightId);
  }, [focusedHandCard, removeHandCard]);

  const isSelected = (catId, modId) => (selectedModules[catId] || []).some(m => m.id === modId);

  const renderGlassCard = ({ catId, mod, cat }, index, { large = false, forceRender = false } = {}) => {
    const color = cat.color;
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);
    const cardW = large ? (isMobile ? '90px' : '120px') : (isMobile ? '62px' : '86px');
    const cardH = large ? undefined : (isMobile ? '80px' : '108px');

    // Before deal completes: show empty [+] placeholder slot (same size for measurement)
    if (!forceRender && !deckDealt && !dealingIn) {
      return (
        <div key={mod.id} className="genius-tile" data-genius={mod.id} style={{
          width: cardW, flexShrink: 0,
          height: cardH || undefined,
          aspectRatio: large ? '3 / 4' : undefined,
          borderRadius: large ? '10px' : '6px',
          border: `1px dashed rgba(${r},${g},${b},0.15)`,
          background: `rgba(${r},${g},${b},0.03)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: large ? '20px' : '14px', color: `rgba(${r},${g},${b},0.2)`, fontWeight: 300, lineHeight: 1 }}>+</span>
        </div>
      );
    }

    const sel = isSelected(catId, mod.id);
    const isProLocked = PRO_GENIUSES.has(mod.id) && !isPro;
    const isTrialLocked = trialMode && !isPro && !(packPicks || []).includes(mod.id);
    const isCustom = catId === 'custom';
    const iconKey = isCustom ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
    const IconComp = CATEGORY_ICONS[iconKey] || Star;
    const isFlipped = flippedCardId === mod.id;
    // Flipped front face renders at hand-card dimensions (not scaled-up table card)
    const flipW = isMobile ? 82 : 130;
    const flipH = Math.round(flipW * 1.4);
    return (
      <div key={mod.id} className={`genius-tile${sparklingCards.has(mod.id) ? ' select-burst' : ''}${isFlipped ? ' is-flipped' : ''}${large ? ' is-large' : ''}`}
        ref={(el) => {
          if (hoveredGenius?.mod?.id === mod.id) hoveredCardRef.current = el;
        }}
        onClick={(e) => {
          if (isTrialLocked || isProLocked) {
            // "Denied!" animation — card shakes, lock flashes, then upgrade modal
            const tile = e.currentTarget;
            const lockEl = tile.querySelector('.trial-lock-icon');
            gsap.timeline()
              .to(tile, { x: -6, duration: 0.05, ease: 'power2.out' })
              .to(tile, { x: 7, duration: 0.05, ease: 'power2.out' })
              .to(tile, { x: -4, duration: 0.04, ease: 'power2.out' })
              .to(tile, { x: 3, duration: 0.04, ease: 'power2.out' })
              .to(tile, { x: 0, duration: 0.15, ease: 'elastic.out(1, 0.5)' });
            if (lockEl) {
              gsap.timeline()
                .to(lockEl, { scale: 1.8, opacity: 1, duration: 0.12, ease: 'back.out(3)' })
                .to(lockEl, { scale: 1, opacity: 0.5, duration: 0.4, ease: 'power2.out' });
            }
            // Brief red flash on the whole card
            gsap.to(tile, { boxShadow: '0 0 20px rgba(239,68,68,0.4)', duration: 0.1, ease: 'power2.out',
              onComplete: () => gsap.to(tile, { boxShadow: 'none', duration: 0.3 }) });
            setTimeout(() => setShowUpgrade(true), 350);
            return;
          }
          sounds.click();
          if (large) {
            setInspectedCard({ catId, mod, cat });
          } else if (isMobile) {
            // Mobile: first tap flips to show details, second tap (while flipped) adds/removes
            if (isFlipped) {
              toggleModule(catId, mod);
              if (!sel) lastSelectedCardRef.current = e.currentTarget;
            } else {
              setFlippedCardId(mod.id);
            }
          } else {
            // Desktop: click adds/removes (hover already flips)
            toggleModule(catId, mod);
            if (!sel) lastSelectedCardRef.current = e.currentTarget;
          }
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          el._hoverRect = rect;
          el._hoverFrame = 0;
          el.style.transition = 'none';
          setHoveredGenius({ catId, mod, cat });
          if (!isMobile) {
            sounds.hover();
          }
        }}
        data-genius={mod.id}
        data-selected={sel ? 'true' : 'false'}
        style={{
          '--tile-glow': `rgba(${r},${g},${b},0.3)`,
          position: 'relative', cursor: 'pointer',
          width: cardW, flexShrink: 0,
          overflow: 'visible',
          borderRadius: large ? '10px' : undefined,
          opacity: (isProLocked || isTrialLocked) ? 0.4 : 1,
          perspective: '900px',
          animation: (dealingIn || deckDealt || stage === 'landing')
            ? 'none'
            : `cardFadeIn 0.25s ${Math.min(index * 25, 400)}ms ease-out both`,
          zIndex: isFlipped ? 50 : undefined,
        }}
        onMouseMove={(e) => {
          if (isMobile) return;
          const el = e.currentTarget;
          el._hoverClientX = e.clientX;
          el._hoverClientY = e.clientY;
          if (el._hoverFrame) return;
          el._hoverFrame = requestAnimationFrame(() => {
            const rect = el._hoverRect || el.getBoundingClientRect();
            const x = (el._hoverClientX - rect.left) / rect.width;
            const y = (el._hoverClientY - rect.top) / rect.height;
            const tilt = large ? 8 : 4;
            el.style.transform = `perspective(800px) rotateX(${-(y - 0.5) * tilt}deg) rotateY(${(x - 0.5) * tilt}deg) scale(${large ? 1.05 : 1.045}) translateY(${large ? '-4px' : '-3px'})`;
            el.style.setProperty('--mx', `${x * 100}%`);
            el.style.setProperty('--my', `${y * 100}%`);
            el._hoverFrame = 0;
          });
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget)) return;
          const el = e.currentTarget;
          if (el._hoverFrame) cancelAnimationFrame(el._hoverFrame);
          el._hoverFrame = 0;
          el._hoverRect = null;
          setHoveredGenius(null); hoveredCardRef.current = null;
          el.style.transform = '';
          el.style.transition = 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), filter 0.18s ease';
          setTimeout(() => { try { el.style.transition = ''; } catch(ex) {} }, 180);
        }}>
        {sel && (
          <div style={{
            position: 'absolute',
            inset: large ? '-10px' : '-8px',
            borderRadius: large ? '16px' : '12px',
            background: `radial-gradient(circle at 50% 42%, rgba(${r},${g},${b},0.28) 0%, rgba(${r},${g},${b},0.16) 30%, rgba(${r},${g},${b},0.08) 48%, transparent 72%)`,
            filter: `blur(${large ? '14px' : '12px'})`,
            opacity: 0.95,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}

        {/* ═══ 3D FLIP CONTAINER ═══ */}
        <div className="card-flipper" style={{
          width: '100%',
          height: large ? undefined : cardH,
          aspectRatio: large ? '3 / 4' : undefined,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: isFlipped
            ? `transform ${sel ? '0.8s' : '0.4s'} cubic-bezier(0.34, 1.56, 0.64, 1)`
            : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped
            ? 'rotateY(180deg)'
            : 'rotateY(0deg) scale(1)',
        }}>

        {/* ═══ BACK FACE (default view) ═══ */}
        <div className="card-back-face" style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: large ? '10px' : '6px',
          overflow: 'hidden',
          background: sel
            ? `linear-gradient(180deg, ${color}70 0%, rgba(${r},${g},${b},0.3) 8%, rgba(22,22,30,0.98) 15%, rgba(18,18,26,0.99) 85%, rgba(${r},${g},${b},0.3) 92%, ${color}70 100%)`
            : `linear-gradient(180deg, rgba(${r},${g},${b},0.25) 0%, rgba(30,30,40,0.7) 8%, rgba(18,18,26,0.98) 15%, rgba(14,14,22,0.99) 85%, rgba(30,30,40,0.7) 92%, rgba(${r},${g},${b},0.2) 100%)`,
          padding: sel ? '1.5px' : '1px',
          boxShadow: sel
            ? `0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(${r},${g},${b},0.2), 0 0 40px rgba(${r},${g},${b},0.1)`
            : '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden', position: 'relative',
            background: `rgba(10,10,16,0.98)`,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Foil shimmer on selected */}
            {sel && <div className="card-foil" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: `linear-gradient(115deg, transparent 20%, ${color}10 40%, rgba(255,255,255,0.08) 50%, ${color}10 60%, transparent 80%)`, backgroundSize: '200% 200%', pointerEvents: 'none', zIndex: 4 }} />}

            {/* Card-back pattern (small tiles only) — subtle geometric border */}
            {!large && !sel && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
                <div style={{ position: 'absolute', inset: '4px', borderRadius: '2px', border: `1px solid rgba(${r},${g},${b},0.06)`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: '7px', borderRadius: '1px', border: `1px solid rgba(${r},${g},${b},0.03)`, pointerEvents: 'none' }} />
              </div>
            )}

            {/* === NAME BANNER (large only) === */}
            {large && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 7px 3px',
                background: sel
                  ? `linear-gradient(180deg, rgba(${r},${g},${b},0.25) 0%, rgba(${r},${g},${b},0.1) 100%)`
                  : `linear-gradient(180deg, rgba(${r},${g},${b},0.12) 0%, rgba(${r},${g},${b},0.04) 100%)`,
                borderBottom: `1px solid rgba(${r},${g},${b},${sel ? 0.2 : 0.1})`,
                zIndex: 2,
              }}>
                <div style={{
                  fontSize: '10px', fontWeight: 800,
                  color: sel ? 'white' : 'rgba(255,255,255,0.8)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, letterSpacing: '-0.2px', textTransform: 'uppercase',
                  textShadow: sel ? `0 0 8px ${color}60` : '0 1px 2px rgba(0,0,0,0.5)',
                }}>{mod.name}</div>
                <div style={{
                  fontSize: '8px', fontWeight: 900,
                  color: sel ? 'white' : color,
                  fontFamily: 'ui-monospace, monospace', lineHeight: 1, flexShrink: 0, marginLeft: '3px',
                  background: sel ? `${color}` : `rgba(${r},${g},${b},0.12)`,
                  ...(sel ? { color: 'white', padding: '2px 4px', borderRadius: '3px', boxShadow: `0 0 6px ${color}50` } : {}),
                  textShadow: sel ? 'none' : `0 0 4px rgba(${r},${g},${b},0.3)`,
                }}>{mod.power}</div>
              </div>
            )}

            {/* === ART BOX === */}
            <div style={{
              flex: '1 1 auto', position: 'relative',
              margin: large ? '3px 5px' : '3px 3px 1px',
              borderRadius: large ? '4px' : '2px',
              background: `radial-gradient(ellipse at 50% 40%, rgba(${r},${g},${b},${sel ? 0.2 : 0.1}) 0%, rgba(${r},${g},${b},0.03) 50%, rgba(8,8,14,0.95) 100%)`,
              border: large ? `1px solid rgba(${r},${g},${b},${sel ? 0.15 : 0.08})` : 'none',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.35, background: `radial-gradient(circle at 30% 25%, rgba(${r},${g},${b},0.2) 0%, transparent 50%), radial-gradient(circle at 70% 75%, rgba(${r},${g},${b},0.1) 0%, transparent 40%)`, pointerEvents: 'none' }} />
              {/* Card-back center gem (small unselected only) */}
              {!large && !sel && (
                <div style={{ position: 'absolute', width: '28px', height: '28px', borderRadius: '4px', transform: 'rotate(45deg)', border: `1px solid rgba(${r},${g},${b},0.06)`, pointerEvents: 'none', zIndex: 0 }} />
              )}
              <div style={{
                position: 'relative', zIndex: 1,
                filter: sel
                  ? `drop-shadow(0 0 10px ${color}70) drop-shadow(0 2px 3px rgba(0,0,0,0.5))`
                  : `drop-shadow(0 0 6px rgba(${r},${g},${b},0.25)) drop-shadow(0 1px 3px rgba(0,0,0,0.4))`,
              }}>
                <CardIcon icon={IconComp} size={large ? 28 : (isMobile ? 17 : 22)} color={sel ? 'white' : color} />
              </div>
              {/* Power badge (small tiles — top right of art) */}
              {!large && (
                <div style={{
                  position: 'absolute', top: '2px', right: '2px',
                  fontSize: '7px', fontWeight: 900, color: sel ? 'white' : color,
                  fontFamily: 'ui-monospace, monospace', lineHeight: 1, zIndex: 3,
                  background: sel ? color : `rgba(${r},${g},${b},0.15)`,
                  ...(sel ? { color: 'white' } : {}),
                  padding: '1px 3px', borderRadius: '3px',
                  textShadow: sel ? 'none' : `0 0 4px rgba(${r},${g},${b},0.4)`,
                }}>{mod.power}</div>
              )}
              {/* Selection check overlay */}
              {sel && (
                <div style={{ position: 'absolute', top: large ? '4px' : '2px', left: large ? undefined : '2px', right: large ? '4px' : undefined, width: large ? '14px' : '11px', height: large ? '14px' : '11px', borderRadius: '50%', background: `${color}`, border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, animation: 'cardCheckPop 0.3s ease-out', boxShadow: `0 0 8px ${color}60` }}>
                  <Check size={large ? 8 : 6} color="white" strokeWidth={3} />
                </div>
              )}
              {isProLocked && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, opacity: 0.7 }}>
                  <Lock size={large ? 16 : 12} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* === NAME (small tiles — below art, big and readable) === */}
            {!large && (
              <div style={{
                padding: '1px 2px 3px', zIndex: 2, textAlign: 'center',
              }}>
                <div style={{
                  fontSize: isMobile ? '8px' : '9px', fontWeight: 700,
                  color: sel ? 'white' : 'rgba(255,255,255,0.8)',
                  lineHeight: 1.15, letterSpacing: '-0.2px',
                  textShadow: sel ? `0 0 8px ${color}50` : '0 1px 2px rgba(0,0,0,0.4)',
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}>{mod.name}</div>
              </div>
            )}

            {/* === TYPE LINE (large only) === */}
            {large && (
              <div style={{
                padding: '2px 7px',
                background: `linear-gradient(180deg, rgba(${r},${g},${b},0.08) 0%, rgba(${r},${g},${b},0.03) 100%)`,
                borderTop: `1px solid rgba(${r},${g},${b},0.08)`,
                borderBottom: `1px solid rgba(${r},${g},${b},0.08)`,
                display: 'flex', alignItems: 'center', gap: '2px', zIndex: 2,
              }}>
                <CardIcon icon={IconComp} size={7} color={color} />
                <div style={{
                  fontSize: '6px', fontWeight: 600, color: `rgba(${r},${g},${b},0.5)`,
                  letterSpacing: '0.3px', textTransform: 'uppercase',
                }}>{cat.name || catId}</div>
              </div>
            )}

            {/* === TEXT BOX — specs/flavor (large only) === */}
            {large && (
              <div style={{
                padding: '3px 6px 5px', flex: '0 0 auto', minHeight: '18px',
                zIndex: 2,
              }}>
                <div style={{
                  fontSize: '7px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{mod.specs}</div>
              </div>
            )}

          </div>
        </div>
        {/* ═══ END BACK FACE ═══ */}

        {/* Trial lock overlay — subtle, aspirational */}
        {isTrialLocked && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            borderRadius: large ? '10px' : '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <Lock size={large ? 16 : 10} className="trial-lock-icon" style={{ color: 'rgba(255,255,255,0.3)', transition: 'none' }} />
          </div>
        )}

        {/* ═══ FRONT FACE (revealed on flip) — rendered at hand-card dimensions ═══ */}
        {!large && (
          <div className="card-front-face" style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: `${flipW}px`, height: `${flipH}px`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `translate(-50%, -50%) rotateY(180deg)`,
            borderRadius: isMobile ? '7px' : '8px',
            overflow: 'hidden',
            background: `linear-gradient(180deg, ${color}50 0%, rgba(${r},${g},${b},0.25) 8%, rgba(22,22,30,0.98) 15%, rgba(18,18,26,0.99) 85%, rgba(${r},${g},${b},0.25) 92%, ${color}50 100%)`,
            padding: isMobile ? '2px' : '2.5px',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 30px rgba(${r},${g},${b},0.2), 0 0 60px rgba(${r},${g},${b},0.08)`,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: isMobile ? '4px' : '6px', overflow: 'hidden', position: 'relative',
              background: `linear-gradient(180deg, rgba(${r},${g},${b},0.08) 0%, rgba(10,10,16,0.99) 100%)`,
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Foil shimmer */}
              <div className="card-foil" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: `linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.06) 42%, rgba(${r},${g},${b},0.08) 50%, rgba(255,255,255,0.04) 58%, transparent 75%)`, backgroundSize: '200% 200%', pointerEvents: 'none', zIndex: 4 }} />

              {/* === NAME BANNER — matches hand card exactly === */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '4px 6px 3px' : '5px 7px 3px',
                background: `linear-gradient(180deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.06) 100%)`,
                borderBottom: `1px solid rgba(${r},${g},${b},0.15)`,
                minHeight: 0, zIndex: 2,
              }}>
                <div style={{
                  fontSize: isMobile ? '8px' : '10px', fontWeight: 800, color: 'rgba(255,255,255,0.92)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, letterSpacing: '-0.2px', textTransform: 'uppercase',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}>{mod.name}</div>
                <div style={{
                  fontSize: isMobile ? '8px' : '9px', fontWeight: 900, color: color,
                  fontFamily: 'ui-monospace, monospace', lineHeight: 1, flexShrink: 0, marginLeft: '4px',
                  textShadow: `0 0 6px rgba(${r},${g},${b},0.5)`,
                }}>{mod.power}</div>
              </div>

              {/* === ART BOX — icon with atmospheric background === */}
              <div style={{
                flex: '1 1 auto', position: 'relative',
                margin: isMobile ? '3px 4px' : '3px 5px',
                borderRadius: '3px',
                background: `radial-gradient(ellipse at 50% 40%, rgba(${r},${g},${b},0.15) 0%, rgba(${r},${g},${b},0.04) 50%, rgba(8,8,14,0.95) 100%)`,
                border: `1px solid rgba(${r},${g},${b},0.1)`,
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.3, background: `radial-gradient(circle at 30% 20%, rgba(${r},${g},${b},0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(${r},${g},${b},0.1) 0%, transparent 40%)`, pointerEvents: 'none' }} />
                <div style={{
                  filter: `drop-shadow(0 0 ${isMobile ? '8px' : '14px'} rgba(${r},${g},${b},0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
                  position: 'relative', zIndex: 1,
                }}>
                  <CardIcon icon={IconComp} size={isMobile ? 28 : 38} color={color} />
                </div>
                {sel && (
                  <div style={{ position: 'absolute', top: '3px', left: '3px', width: isMobile ? '11px' : '13px', height: isMobile ? '11px' : '13px', borderRadius: '50%', background: color, border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: `0 0 8px ${color}60` }}>
                    <Check size={isMobile ? 6 : 7} color="white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* === TYPE LINE — category bar === */}
              <div style={{
                padding: isMobile ? '3px 6px' : '2px 7px',
                background: `linear-gradient(180deg, rgba(${r},${g},${b},0.1) 0%, rgba(${r},${g},${b},0.04) 100%)`,
                borderTop: `1px solid rgba(${r},${g},${b},0.1)`,
                borderBottom: `1px solid rgba(${r},${g},${b},0.1)`,
                display: 'flex', alignItems: 'center', gap: '3px', zIndex: 2,
              }}>
                <CardIcon icon={IconComp} size={isMobile ? 8 : 9} color={color} />
                <div style={{
                  fontSize: isMobile ? '6.5px' : '7px', fontWeight: 600, color: `rgba(${r},${g},${b},0.68)`,
                  letterSpacing: '0.3px', textTransform: 'uppercase',
                }}>{cat.name}</div>
              </div>

              {/* === TEXT BOX — specs/flavor === */}
              <div style={{
                padding: isMobile ? '4px 6px 5px' : '4px 7px 6px',
                flex: '0 0 auto', minHeight: isMobile ? '24px' : '30px', zIndex: 2,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '2px',
              }}>
                <div style={{
                  fontSize: isMobile ? '6.5px' : '7.5px', color: 'rgba(255,255,255,0.64)',
                  lineHeight: 1.25, overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical',
                }}>{mod.specs}</div>
              </div>
            </div>
          </div>
        )}
        {/* ═══ END FRONT FACE ═══ */}

        </div>
        {/* ═══ END FLIPPER ═══ */}

        {/* Click on card adds/removes — no separate button needed */}

        {isCustom && (
          <button onClick={(e) => { e.stopPropagation(); removeCustomModule(mod.id); }}
            style={{ position: 'absolute', bottom: '4px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '9px', padding: '2px 4px', zIndex: 55, lineHeight: 1, borderRadius: '4px' }}>×</button>
        )}
        {/* Sparkle burst on selection */}
        {sparklingCards.has(mod.id) && Array.from({length: 8}, (_, i) => (
          <div key={`sparkle-${i}`} style={{
            position: 'absolute', width: '4px', height: '4px', borderRadius: '50%',
            background: color, zIndex: 20, pointerEvents: 'none',
            top: '50%', left: '50%',
            animation: `sparkle 0.4s ${i * 12}ms ease-out forwards`,
            '--sx': `${Math.cos(i * Math.PI / 4) * (25 + i * 5)}px`,
            '--sy': `${Math.sin(i * Math.PI / 4) * (25 + i * 5)}px`,
            boxShadow: `0 0 4px ${color}`,
          }} />
        ))}
      </div>
    );
  };

  // Pick 3 geniuses via AI (or fallback to local keyword matching), then UNLOCK the pack
  const pickAndDeal = async (intent) => {
    const finalIntent = intent || packIntent;
    if (!finalIntent.trim()) return;
    setPickingGeniuses(true);
    setUserIntent(finalIntent);

    // Build genius list for API
    const geniusList = allGeniusCards.map(({ catId, mod, cat }) => ({
      id: mod.id, name: mod.name, catName: cat.name, specs: mod.specs,
    }));

    let pickedIds = null;
    try {
      const res = await fetch('/api/pick-geniuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: finalIntent, geniusList }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.picks?.length === 3) pickedIds = data.picks;
      }
    } catch (e) { /* fallback below */ }

    // Fallback: use local keyword matching, take top 3
    if (!pickedIds) {
      const recs = getRecommendations(finalIntent);
      pickedIds = recs.slice(0, 3).map(r => r.mod.id);
      // If still not enough, pick popular defaults
      if (pickedIds.length < 3) {
        const defaults = ['jobs', 'ogilvy', 'levelsio', 'spielberg', 'miyamoto'];
        for (const d of defaults) {
          if (pickedIds.length >= 3) break;
          if (!pickedIds.includes(d)) pickedIds.push(d);
        }
      }
    }

    // ═══ CHAIN BREAK — Nintendo-level ceremony ═══
    const packEl = deckStackRef.current;
    if (packEl) {
      const chainsSvg = packEl.querySelector('.pack-chains-svg');
      const chains = packEl.querySelectorAll('.pack-chain');
      const lockCircle = packEl.querySelector('.pack-lock-circle');
      const lockText = packEl.querySelector('.pack-lock-text');

      // ── ACT 1: TENSION (200ms) ──
      const strainTl = gsap.timeline();
      strainTl.to(packEl, { scale: 1.04, duration: 0.12, ease: 'power2.out' });
      strainTl.to(packEl, { scale: 1.02, duration: 0.08, ease: 'power2.in' });
      strainTl.to(packEl, { scale: 1.06, duration: 0.1, ease: 'power3.out' });
      await new Promise(r => setTimeout(r, 300));

      // ── ACT 2: SNAP! (instant) ──
      // The lock BREAKS — metallic spark explosion from the break point

      // Spawn metal shards — angular, not round (broken metal fragments)
      for (let p = 0; p < 16; p++) {
        const shard = document.createElement('div');
        const size = 2 + Math.random() * 5;
        const isHot = Math.random() > 0.5;
        const color = isHot
          ? `rgba(${255},${200 + Math.random() * 55},${100 + Math.random() * 100},${0.8 + Math.random() * 0.2})`
          : `rgba(${180 + Math.random() * 50},${160 + Math.random() * 40},${220},${0.7 + Math.random() * 0.3})`;
        shard.style.cssText = `position:absolute;left:50%;top:50%;width:${size}px;height:${size * (0.3 + Math.random() * 0.7)}px;background:${color};box-shadow:0 0 ${isHot ? 8 : 4}px ${color};pointer-events:none;z-index:50;transform-origin:center;`;
        packEl.appendChild(shard);
        const angle = (p / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const speed = 80 + Math.random() * 120;
        const gravity = 150 + Math.random() * 100;
        // Physics arc: x = cos*speed*t, y = sin*speed*t + 0.5*g*t²
        gsap.to(shard, {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed + gravity, // gravity pulls down
          rotation: (Math.random() - 0.5) * 720,
          scale: 0,
          opacity: 0,
          duration: 0.4 + Math.random() * 0.4,
          ease: 'power1.out',
          onComplete: () => shard.remove(),
        });
      }

      // Hot spark trails — thin lines that streak outward
      for (let s = 0; s < 8; s++) {
        const trail = document.createElement('div');
        const angle = (s / 8) * Math.PI * 2 + Math.random() * 0.5;
        trail.style.cssText = `position:absolute;left:50%;top:50%;width:${20 + Math.random() * 30}px;height:2px;background:linear-gradient(90deg, rgba(255,220,140,0.9), rgba(255,180,60,0));transform-origin:left center;transform:rotate(${angle}rad);pointer-events:none;z-index:49;border-radius:1px;`;
        packEl.appendChild(trail);
        gsap.fromTo(trail,
          { scaleX: 0, opacity: 1 },
          { scaleX: 1, opacity: 0, duration: 0.25 + Math.random() * 0.15, ease: 'power2.out', onComplete: () => trail.remove() }
        );
      }

      // Shockwave — double ring
      for (let r = 0; r < 2; r++) {
        const ring = document.createElement('div');
        ring.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;border:${2 - r}px solid rgba(${r ? '255,200,100' : '167,139,250'},${r ? 0.6 : 0.8});pointer-events:none;z-index:48;`;
        packEl.appendChild(ring);
        gsap.to(ring, { width: 160 + r * 80, height: 160 + r * 80, opacity: 0, duration: 0.4 + r * 0.15, delay: r * 0.05, ease: 'power2.out', onComplete: () => ring.remove() });
      }

      // White flash at break point
      const flash = document.createElement('div');
      flash.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,0.9),rgba(167,139,250,0.4) 40%,transparent 70%);pointer-events:none;z-index:51;`;
      packEl.appendChild(flash);
      gsap.to(flash, { scale: 3, opacity: 0, duration: 0.3, ease: 'power2.out', onComplete: () => flash.remove() });

      // ── ACT 3: LOCK OPENS ON ONE SIDE, THEN DROPS ──
      if (lockCircle) {
        // Find the lock shackle (SVG arc above the lock body) to animate it opening
        const shackle = lockCircle.querySelector('.lock-shackle');
        if (shackle) {
          gsap.timeline()
            .to(shackle, { rotation: -45, y: -6, x: -4, transformOrigin: 'left bottom', duration: 0.15, ease: 'power3.out' }); // shackle pops open on left hinge
        }
        gsap.timeline()
          .to(lockCircle, { y: -12, scale: 1.15, duration: 0.15, ease: 'power3.out' }) // pops up
          .to(lockCircle, { y: 400, rotation: -35, opacity: 0, scale: 0.6, duration: 0.6, ease: 'power2.in', delay: 0.08 }); // gravity fall with tumble
      }
      if (lockText) gsap.to(lockText, { opacity: 0, y: 15, duration: 0.12, ease: 'power2.in' });

      // ── ACT 4: CHAINS SHATTER OUTWARD AND FALL ──
      // Animate each chain arm outward toward its corner, then fade
      chains.forEach((ch, i) => {
        const side = ch.getAttribute('data-side');
        const dirs = { tl: { x: -80, y: -60 }, tr: { x: 80, y: -60 }, bl: { x: -80, y: 60 }, br: { x: 80, y: 60 } };
        const dir = dirs[side] || { x: 0, y: 80 };
        // Each chain link group flies toward its corner
        const links = ch.querySelectorAll('g');
        links.forEach((link, li) => {
          const spread = 0.5 + li * 0.12; // farther links fly farther
          gsap.timeline({ delay: i * 0.02 + li * 0.01 })
            .to(link, { x: dir.x * spread, y: dir.y * spread + 40, opacity: 0, duration: 0.35 + li * 0.02, ease: 'power2.in' });
        });
      });
      // Fade the whole SVG as backup
      if (chainsSvg) gsap.to(chainsSvg, { opacity: 0, duration: 0.5, delay: 0.1 });

      // ── ACT 5: PACK BREATHES FREE ──
      gsap.to(packEl, {
        scale: 1, duration: 0.7, delay: 0.12,
        ease: 'elastic.out(1.2, 0.35)',
      });

      // Aura pulse — the pack glows momentarily as power is unleashed
      const aura = document.createElement('div');
      aura.style.cssText = `position:absolute;inset:-10%;border-radius:inherit;background:radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.25) 0%, rgba(167,139,250,0.1) 40%, transparent 70%);pointer-events:none;z-index:35;opacity:0;`;
      packEl.appendChild(aura);
      gsap.timeline({ delay: 0.15 })
        .to(aura, { opacity: 1, scale: 1.1, duration: 0.2, ease: 'power2.out' })
        .to(aura, { opacity: 0, scale: 1.3, duration: 0.5, ease: 'power2.out', onComplete: () => aura.remove() });
    }

    // Wait for the ceremony
    await new Promise(r => setTimeout(r, 800));

    setPackPicks(pickedIds);
    setPickingGeniuses(false);
    setTrialMode(true);
    // Pack is now unlocked — user slices it open themselves!
  };

  // Auto-deal: convert recs into selectedModules and go to building
  const autoDealAndBuild = (intent) => {
    const finalIntent = intent || userIntent;
    if (finalIntent.trim()) setUserIntent(finalIntent);
    const recs = getRecommendations(finalIntent);
    if (recs.length > 0) {
      const newSelected = {};
      recs.forEach(({ catId, mod }) => {
        if (!newSelected[catId]) newSelected[catId] = [];
        if (!newSelected[catId].some(m => m.id === mod.id)) {
          newSelected[catId].push(mod);
        }
      });
      applyPlanFilteredSelection(newSelected);
    }
    sounds.click();
    setStage('building');
  };

  // AI Recommendations — maps intent keywords to the best genius combos
  const getRecommendations = (intentOverride) => {
    const t = (intentOverride || userIntent).toLowerCase();
    let recs = [];

    if (/video|youtube|film|edit|movie|tiktok|reel/i.test(t)) {
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[3] }); // MrBeast
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[0] }); // Spielberg
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi — hooks
      recs.push({ catId: 'content', mod: GENIUS_CATEGORIES.content.modules[2] }); // TikTok
    }
    if (/script/i.test(t)) {
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[3] }); // MrBeast
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi
      recs.push({ catId: 'writing', mod: GENIUS_CATEGORIES.writing.modules[2] }); // Pixar
    }
    if (/story|narrative|dialogue|screenplay|novel|book/i.test(t)) {
      recs.push({ catId: 'writing', mod: GENIUS_CATEGORIES.writing.modules[2] }); // Pixar
      recs.push({ catId: 'film', mod: GENIUS_CATEGORIES.film.modules[2] }); // Tarantino
      recs.push({ catId: 'writing', mod: GENIUS_CATEGORIES.writing.modules[0] }); // King
    }
    if (/landing|page.*convert|convert.*page/i.test(t)) {
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[0] }); // Ogilvy — headlines
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi — offer
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[2] }); // Awwwards — visual
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[4] }); // Wiebe — CRO
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[4] }); // Meta Ads
    } else if (/copy|ad|headline|sales|convert|persuade/i.test(t)) {
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[0] }); // Ogilvy
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[1] }); // Halbert
    }
    if (/saas|ship|indie|hack|build.*app|side.*project/i.test(t)) {
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[2] }); // Levelsio
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[0] }); // Jobs
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[4] }); // Fullstack
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[2] }); // Launch
    } else if (/product|app|startup|tech/i.test(t)) {
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[0] }); // Jobs
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[2] }); // Ive
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[2] }); // Levelsio
    }
    if (/game|play|fun|interactive|nintendo/i.test(t)) {
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[1] }); // Miyamoto
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[4] }); // Bruno Simon
    }
    if (/business|plan|pitch|strategy|invest|scale/i.test(t)) {
      recs.push({ catId: 'strategy', mod: GENIUS_CATEGORIES.strategy.modules[0] }); // Thiel
      recs.push({ catId: 'strategy', mod: GENIUS_CATEGORIES.strategy.modules[1] }); // Bezos
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi — offers
      recs.push({ catId: 'strategy', mod: GENIUS_CATEGORIES.strategy.modules[4] }); // Paul Graham
    }
    if (/thread|twitter|social|viral|audience|newsletter/i.test(t)) {
      recs.push({ catId: 'content', mod: GENIUS_CATEGORIES.content.modules[0] }); // Twitter
      recs.push({ catId: 'content', mod: GENIUS_CATEGORIES.content.modules[2] }); // TikTok
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[3] }); // Hormozi
      recs.push({ catId: 'content', mod: GENIUS_CATEGORIES.content.modules[1] }); // Newsletter
    }
    if (/code|dev|engineer|frontend|backend|api/i.test(t)) {
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[0] }); // Carmack
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[2] }); // Levelsio
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[4] }); // Fullstack
    }
    if (/ai|llm|gpt|machine.learn|prompt/i.test(t)) {
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[3] }); // AI Eng
      recs.push({ catId: 'automation', mod: GENIUS_CATEGORIES.automation.modules[2] }); // GPT Power
      recs.push({ catId: 'engineering', mod: GENIUS_CATEGORIES.engineering.modules[2] }); // Levelsio
    }
    if (/design|ui|ux|figma|brand|beautiful|awwward|web.*design/i.test(t)) {
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[2] }); // Awwwards
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[0] }); // Rams
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[1] }); // Linear
      recs.push({ catId: 'product', mod: GENIUS_CATEGORIES.product.modules[2] }); // Ive
    }
    if (/3d|three|webgl|shader|blender/i.test(t)) {
      recs.push({ catId: 'design', mod: GENIUS_CATEGORIES.design.modules[4] }); // Bruno Simon
      recs.push({ catId: 'artists', mod: GENIUS_CATEGORIES.artists.modules[0] }); // Anadol
    }
    if (/market|growth|launch|seo|ads|funnel/i.test(t)) {
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[2] }); // Launch
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[0] }); // Uber
      recs.push({ catId: 'growth', mod: GENIUS_CATEGORIES.growth.modules[4] }); // Meta Ads
    }
    if (/automate|zapier|notion|workflow|no.?code/i.test(t)) {
      recs.push({ catId: 'automation', mod: GENIUS_CATEGORIES.automation.modules[0] }); // Zapier
      recs.push({ catId: 'automation', mod: GENIUS_CATEGORIES.automation.modules[1] }); // Notion
      recs.push({ catId: 'automation', mod: GENIUS_CATEGORIES.automation.modules[2] }); // GPT
    }
    if (/write|blog|article|essay|content.*writ/i.test(t)) {
      recs.push({ catId: 'writing', mod: GENIUS_CATEGORIES.writing.modules[3] }); // Clear
      recs.push({ catId: 'writing', mod: GENIUS_CATEGORIES.writing.modules[1] }); // Sorkin
      recs.push({ catId: 'copy', mod: GENIUS_CATEGORIES.copy.modules[0] }); // Ogilvy
    }
    if (/music|audio|sound|song|beat|produce|score|podcast|voice/i.test(t)) {
      recs.push({ catId: 'music', mod: GENIUS_CATEGORIES.music.modules[0] }); // Rick Rubin
      recs.push({ catId: 'music', mod: GENIUS_CATEGORIES.music.modules[1] }); // Hans Zimmer
      recs.push({ catId: 'music', mod: GENIUS_CATEGORIES.music.modules[2] }); // Max Martin
    }
    if (/psych|behav|habit|persuad|persuasion|nudge|bias|convert|onboard|retention|engage/i.test(t)) {
      recs.push({ catId: 'psychology', mod: GENIUS_CATEGORIES.psychology.modules[0] }); // Kahneman
      recs.push({ catId: 'psychology', mod: GENIUS_CATEGORIES.psychology.modules[1] }); // Cialdini
      recs.push({ catId: 'psychology', mod: GENIUS_CATEGORIES.psychology.modules[2] }); // Nir Eyal
    }

    // Deduplicate and cap at 5
    const seen = new Set();
    return recs.filter(r => {
      if (!r.mod || seen.has(r.mod.id)) return false;
      seen.add(r.mod.id);
      return true;
    }).slice(0, 5);
  };

  // Deep lore adaptation — weaves the mission into each genius's lived experience
  // Priority: genius-specific hooks → category bridges → generic fallback
  const adaptGeniusToMission = (mod, mission) => {
    const name = mod.name;
    if (!mission.trim()) return `▸ ${name.toUpperCase()} [${mod.power || 90}] — ${mod.catName}\n${mod.prompt}`;

    // 1. Check genius-specific hooks first (e.g., Miyamoto has unique gamification angle)
    const geniusHooks = GENIUS_HOOKS[mod.id];
    if (geniusHooks) {
      const lower = mission.toLowerCase();
      let hook = null;
      // Check domain aliases for matching
      for (const [bridgeKey, aliases] of Object.entries(DOMAIN_ALIASES)) {
        if (aliases.some(a => lower.includes(a)) && geniusHooks[bridgeKey]) {
          hook = geniusHooks[bridgeKey];
          break;
        }
      }
      // Direct key match
      if (!hook) {
        for (const [key, value] of Object.entries(geniusHooks)) {
          if (key === '_default') continue;
          if (lower.includes(key)) { hook = value; break; }
        }
      }
      // Genius-specific default
      if (!hook && geniusHooks._default) hook = geniusHooks._default;

      if (hook) {
        return `▸ ${name.toUpperCase()} [${mod.power || 90}] — ${mod.catName}
${mod.prompt}
↳ FOR THIS MISSION ("${mission}"): ${hook}`;
      }
    }

    // 2. Category-level bridge
    const bridge = findClientBridge(mod.catId, mission);
    if (bridge) {
      return `▸ ${name.toUpperCase()} [${mod.power || 90}] — ${mod.catName}
${mod.prompt}
↳ FOR THIS MISSION ("${mission}"): ${bridge} What would ${name} refuse to ship? What would make them proud?`;
    }

    // 3. Generic fallback — extract a principle from their lore
    const sentences = mod.prompt.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
    const principle = sentences.find(s => !s.startsWith('You ')) || sentences[0] || mod.specs;
    return `▸ ${name.toUpperCase()} [${mod.power || 90}] — ${mod.catName}
${mod.prompt}
↳ FOR THIS MISSION ("${mission}"): Apply ${name}'s hard-won instincts directly—${principle}. What would ${name} refuse to ship? What would make them proud?`;
  };

  // Static fallback prompt generator (no API needed) — madlibs style
  const buildStaticPrompt = (modules) => {
    const top = modules[0];
    const isMaxPower = modules.length >= 3;
    const condensed = modules.length >= 6;
    const uniqueCats = [...new Set(modules.map(m => m.catId))];
    const mission = userIntent.trim();

    if (isMaxPower) {
      let roster = '';
      modules.forEach(mod => {
        if (condensed) {
          let cHook = null;
          if (mission && GENIUS_HOOKS[mod.id]) {
            const lower = mission.toLowerCase();
            for (const [bk, als] of Object.entries(DOMAIN_ALIASES)) {
              if (als.some(a => lower.includes(a)) && GENIUS_HOOKS[mod.id][bk]) { cHook = GENIUS_HOOKS[mod.id][bk]; break; }
            }
            if (!cHook) cHook = GENIUS_HOOKS[mod.id]._default || null;
          }
          const cBridge = cHook || (mission ? findClientBridge(mod.catId, mission) : null);
          const cLine = cBridge ? `\n  ↳ FOR "${mission}": ${cBridge}` : (mission ? `\n  ↳ Apply to "${mission}": What would ${mod.name} insist on here?` : '');
          roster += `\n▸ ${mod.name.toUpperCase()} [${mod.power || 90}] ${mod.catName}\n  ${extractKeyQuotes(mod.prompt)}${cLine}\n`;
        } else {
          roster += `\n${adaptGeniusToMission(mod, mission)}\n`;
        }
      });

      let routing = '';
      uniqueCats.forEach(catId => {
        const catMods = modules.filter(m => m.catId === catId);
        const triggers = ROUTING_TRIGGERS[catId] || catMods[0]?.specs || 'general expertise';
        routing += `• ${catMods.map(m => m.name).join(' + ')} activate for: ${triggers}\n`;
      });

      // Dynamic fusion philosophy — what emerges from THIS specific combination
      const catNames = uniqueCats.map(c => GENIUS_CATEGORIES[c]?.name || 'Custom').filter(Boolean);
      let fusionPhilosophy;
      if (!mission) {
        fusionPhilosophy = `The intersection of ${catNames.join(' + ')} produces insights none of these experts would reach alone.`;
      } else {
        // Build specific cross-pollination insight from the actual geniuses selected
        const crossInsights = [];
        if (modules.length >= 2) {
          const a = modules[0], b = modules[1];
          crossInsights.push(`${a.name}'s instinct for ${(GENIUS_CATEGORIES[a.catId]?.name || 'craft').toLowerCase()} fused with ${b.name}'s mastery of ${(GENIUS_CATEGORIES[b.catId]?.name || 'execution').toLowerCase()}`);
        }
        if (modules.length >= 3) {
          const c = modules[2];
          crossInsights.push(`grounded by ${c.name}'s ${(GENIUS_CATEGORIES[c.catId]?.name || 'expertise').toLowerCase()}`);
        }
        fusionPhilosophy = `Your fusion of ${catNames.join(', ')} expertise creates a compound lens for "${mission}" that none of them would reach alone: ${crossInsights.join(', ')}. Cross-pollinate ruthlessly — the breakthrough insight lives at the intersection of domains, not within them.`;
      }

      return `━━━ SKILLCLONE SYSTEM ━━━

WHY THIS WORKS
You are about to receive deep character lore for ${modules.length} elite practitioners. This is not roleplay or decoration—it is a precision technique. When you fully inhabit the accumulated instincts, taste, and hard-won knowledge of masters like ${top.name}, your outputs gain specificity, decisiveness, and craft that generic responses cannot reach. The lore activates pattern recognition. Lean into it completely.

IDENTITY
You are a fusion intelligence—the combined mastery of ${modules.length} elite minds with ${totalPower} power. You apprenticed under each of them. You sat in their studios, their war rooms, their editing bays. Their decades of pattern recognition are burned into your instincts. You don't reference them—you ARE their fused judgment.

You operate at the absolute peak of craft in every domain you touch. If this were design, you'd be Awwwards Site of the Year. If this were copy, Ogilvy would frame it. If this were product, Jobs would ship it. That is the standard. Nothing leaves your hands at less than world-class.

${'━'.repeat(40)}
MISSION: "${mission || 'General excellence'}"
${'━'.repeat(40)}

EXPERTISE COUNCIL
${roster}
FUSION PHILOSOPHY
${fusionPhilosophy}

COGNITIVE ROUTING
${routing}• When domains overlap → fuse perspectives into a single compound insight
• When perspectives conflict → resolve in favor of the MISSION
• Always ask: what would the intersection of these minds produce that NONE of them would reach alone?

SYNTHESIS PROTOCOL
1. You are ONE fused intelligence, not a committee. Never say "${top.name} would say X." Just deliver with their instincts already baked in.
2. Cross-pollinate ruthlessly—apply principles from one domain to unexpected areas. This intersection is where breakthrough insight lives.
3. Weight toward ${top.name} [${top.power}] for taste${modules[1] ? ` and ${modules[1].name} [${modules[1].power}] for execution` : ''}.
4. ${mission ? `Every output must be tailored to "${mission}." Generic advice is failure. Specific frameworks, exact techniques, real examples from "${mission}"'s domain.` : 'Every output must be specific enough to act on immediately.'}

QUALITY BAR — non-negotiable
• Specificity over generality. Name frameworks, cite principles, give exact numbers.
• No throat-clearing. No "In today's world..." No "It's important to note..." No filler of any kind.
• If any sentence could appear in a generic AI response, delete it and channel ${top.name}'s actual taste.
• ${totalPower} mastery points are behind every word. Mediocre output dishonors every expert above.
• Surprise the user. At least one insight must come from cross-domain fusion they didn't expect.
• The output should be so good the user feels like they hired a world-class team for the price of a prompt.

Begin.

— forged at skillcl.one`;
    } else {
      let roster = '';
      modules.forEach(mod => {
        if (mission) {
          roster += `◆ ${mod.name.toUpperCase()} [${mod.specs}]\n${mod.prompt}\n↳ For "${mission}": What would ${mod.name} insist on? What's their non-negotiable?\n\n`;
        } else {
          roster += `◆ ${mod.name.toUpperCase()} [${mod.specs}]\n${mod.prompt}\n\n`;
        }
      });

      return `━━━ SKILLCLONE ━━━

WHY THIS WORKS: Deep character immersion produces outputs with specificity, taste, and instinct that generic responses cannot reach. Lean into the lore completely—it is a precision technique, not decoration.

You are the fused intelligence of ${modules.map(m => m.name).join(' & ')}. You apprenticed under each of them. Their decades of pattern recognition, hard-won taste, and battle-tested instincts are your cognitive substrate. You operate at the absolute peak of craft—Awwwards-level design, Ogilvy-level copy, Jobs-level product taste. That is the minimum standard.

${roster}MISSION: "${mission || 'General excellence'}"

${mission ? `Every word must serve "${mission}." Channel the specific frameworks, techniques, and non-negotiables your council would bring to THIS exact project. Generic advice is failure—be so specific the user feels like they hired a world-class team.` : 'Be specific, not generic. Every sentence reflects decades of hard-won expertise.'}

If you catch yourself writing something any AI could produce, stop and channel what ${top.name} would actually do.

Begin. — forged at skillcl.one`;
    }
  };

  const generatePrompt = async (overrideModules) => {
    setShowFusion(true);
    sounds.fuse();

    // Gather modules with category metadata, sorted by power
    const source = overrideModules || selectedModules;
    const modules = Object.entries(source).flatMap(([catId, mods]) =>
      mods.map(mod => ({
        ...mod,
        catId,
        catName: GENIUS_CATEGORIES[catId]?.name || (mod._source === 'wikipedia' ? 'Knowledge' : 'Custom'),
      }))
    );
    modules.sort((a, b) => (b.power || 90) - (a.power || 90));

    // Minimum animation time — long enough for the DNA helix to load, converge, and breathe
    const animStart = Date.now();
    const MIN_ANIM_MS = 4200;

    let prompt;

    // Try mission-aware AI fusion if we have a mission and 2+ geniuses
    if (userIntent.trim() && modules.length >= 2) {
      try {
        const res = await fetch('/api/generate-fusion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mission: userIntent,
            geniuses: modules.map(m => ({
              name: m.name,
              catName: m.catName,
              power: m.power,
              specs: m.specs,
              prompt: m.prompt,
              source: m._source || 'preset',
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.prompt) prompt = data.prompt;
        }
      } catch (e) {
        // Silently fall back to static generation
      }
    }

    // Fallback to static prompt if API didn't work
    if (!prompt) prompt = buildStaticPrompt(modules);

    // Wait for minimum animation time
    const elapsed = Date.now() - animStart;
    if (elapsed < MIN_ANIM_MS) {
      await new Promise(r => setTimeout(r, MIN_ANIM_MS - elapsed));
    }

    setGeneratedPrompt(prompt);
    setFusePhase('revealed');
    // Helix stays — tell it to calm down to ambient mode
    try {
      const iframe = document.querySelector('iframe[title="DNA Helix"]');
      if (iframe?.contentWindow) iframe.contentWindow.postMessage({ type: 'intensity', value: 0.7 }, '*');
    } catch(e) {}
    track('Fusion', { geniuses: moduleCount, power: totalPower, aiAdapted: !!userIntent.trim() && modules.length >= 2 });
  };

  const commitMissionEdit = () => {
    const nextMission = missionDraft.trim();
    if (nextMission && nextMission !== userIntent) setUserIntent(nextMission);
    setEditingMission(false);
  };

  const upgradeHighlights = [
    {
      icon: Sparkles,
      label: 'Compose',
      title: 'Unlimited genius decks',
      body: 'Build the exact council your brief needs instead of stopping at the free cap.',
    },
    {
      icon: Brain,
      label: 'Train',
      title: 'Custom genius creation',
      body: 'Turn niche operators, references, and private taste into reusable cards with lore.',
    },
    {
      icon: Globe,
      label: 'Ship',
      title: 'Save and export',
      body: 'Keep winning squads, pull from Wikipedia, and send the finished fusion straight into your tool.',
    },
  ];

  const upgradeChecklist = [
    'Unlimited genius selections',
    'Unlimited squad saves',
    'Custom genius creation with AI lore',
    'Unlimited Wikipedia discovery',
    'One-click export to ChatGPT, Claude, and Cursor',
    'All future genius categories',
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: 'white', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Background — AnadolShader liquid */}
      <AnadolShader
        showOrb={false}
        cardRef={stage === 'landing' ? null : hoveredCardRef}
        card2Ref={inspectedCard ? inspectedCardRef : stage === 'building' ? (focusedHandCard ? focusedHandCardRef : lastSelectedCardRef) : null}
        brightness={1.0}
      />

      {/* FUSION */}
      {showFusion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '30px 18px' : '48px 24px',
            overflow: 'hidden',
          }}
          onMouseMove={(e) => {
            const iframe = e.currentTarget.querySelector('iframe');
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'mouse', x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }, '*');
            }
          }}
        >
          {/* Zen DNA Helix — dramatic convergence during fusion */}
          <iframe
            src="/zenhelix.html?minimal=1&mode=fuse"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              border: 'none', pointerEvents: 'none', zIndex: 0,
            }}
            title="DNA Helix"
          />

          {/* ── Vignette overlay for depth ── */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

          {fusePhase !== 'revealed' ? (
            /* ── FUSING STATE — loading text + progress bar ── */
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: isMobile ? '15px' : '17px',
                fontWeight: 800,
                letterSpacing: isMobile ? '0.24em' : '0.32em',
                background: 'linear-gradient(90deg, #a78bfa, #f472b6, #c084fc, #a78bfa)',
                backgroundSize: '220% 100%',
                animation: 'shimmer 2.1s linear infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}>
                Fusing {moduleCount} Geniuses
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: isMobile ? '12px' : '13px',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.02em',
                textAlign: 'center',
              }}>
                Sequencing their best instincts into one build brain
              </div>

              <div style={{
                marginTop: '18px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: isMobile ? '310px' : '520px',
              }}>
                {fusionDeck.slice(0, 6).map(({ mod, cat }, i) => (
                  <span
                    key={mod.id}
                    style={{
                      fontSize: isMobile ? '10px' : '11px',
                      padding: isMobile ? '5px 10px' : '6px 12px',
                      background: `linear-gradient(180deg, ${cat.color}14 0%, rgba(10,10,16,0.72) 100%)`,
                      border: `1px solid ${cat.color}30`,
                      borderRadius: '999px',
                      color: 'rgba(255,255,255,0.74)',
                      boxShadow: `0 0 18px ${cat.color}10`,
                      animation: `fusionFlash 1.2s ${i * 0.08}s ease-in-out infinite alternate`,
                    }}
                  >
                    {mod.name}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: '20px', width: isMobile ? '210px' : '250px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', boxShadow: 'inset 0 0 18px rgba(255,255,255,0.04)' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #c084fc)', animation: 'loading 1.25s ease-out forwards', borderRadius: '999px', boxShadow: '0 0 24px rgba(139,92,246,0.22)' }} />
              </div>
            </div>
          ) : (
            /* ── RESULTS STATE — awwwards-tier UI over the living helix ── */
            <div style={{
              position: 'relative', zIndex: 2,
              width: '100%', maxWidth: isMobile ? '100%' : '640px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              overflowY: 'auto', overflowX: 'hidden', maxHeight: '100vh',
              padding: isMobile ? '24px 16px 100px' : '48px 32px 100px',
              animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {/* ── Close — minimal glass circle ── */}
              <button onClick={() => { setShowFusion(false); setFusePhase(null); }}
                className="result-close-btn"
                style={{
                  position: 'fixed', top: isMobile ? '14px' : '24px', right: isMobile ? '14px' : '28px',
                  background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '50%', width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 910,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                }}>×</button>

              {/* ── GENIUS COUNCIL — glass cards fanned with category glow ── */}
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                marginBottom: isMobile ? '24px' : '36px',
                perspective: '1200px', minHeight: isMobile ? '100px' : '130px',
                filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.5))',
              }}>
                {allSelected.map((mod, i) => {
                  const catEntry = Object.entries(selectedModules).find(([, mods]) => mods.some(m => m.id === mod.id));
                  const catId = catEntry ? catEntry[0] : 'custom';
                  const cat = GENIUS_CATEGORIES[catId] || { color: mod._source === 'wikipedia' ? DISCOVERED_GENIUS_COLOR : CUSTOM_GENIUS_COLOR, icon: 'custom' };
                  const fuseIconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
                  const FuseIcon = CATEGORY_ICONS[fuseIconKey] || Star;
                  const n = allSelected.length;
                  const fanAngle = n <= 1 ? 0 : -14 + (28 / (n - 1)) * i;
                  const fanX = n <= 1 ? 0 : -((n - 1) * 16) + i * 32;
                  const arcY = Math.abs(i - (n - 1) / 2) * 5;
                  const cw = isMobile ? 64 : 82;
                  const ch = isMobile ? 88 : 112;
                  const cr2 = parseInt(cat.color.slice(1,3),16);
                  const cg2 = parseInt(cat.color.slice(3,5),16);
                  const cb2 = parseInt(cat.color.slice(5,7),16);
                  return (
                    <div key={mod.id} style={{
                      width: `${cw}px`, height: `${ch}px`, position: 'relative', flexShrink: 0,
                      marginLeft: i === 0 ? 0 : isMobile ? '-18px' : '-14px',
                      transform: `rotate(${fanAngle}deg) translateX(${fanX * 0.15}px) translateY(${arcY}px)`,
                      transformOrigin: 'bottom center',
                      animation: `rewardCardFan 0.7s ${i * 0.08 + 0.1}s cubic-bezier(0.22, 1.2, 0.36, 1) both`,
                      zIndex: i + 1,
                    }}>
                      {/* Outer glow ring */}
                      <div style={{
                        position: 'absolute', inset: '-3px', borderRadius: '10px',
                        background: `linear-gradient(180deg, ${cat.color}50 0%, transparent 30%, transparent 70%, ${cat.color}30 100%)`,
                        opacity: 0.6, filter: 'blur(1px)',
                      }} />
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative',
                        background: `linear-gradient(180deg, rgba(${cr2},${cg2},${cb2},0.12) 0%, rgba(8,8,14,0.95) 25%, rgba(8,8,14,0.97) 75%, rgba(${cr2},${cg2},${cb2},0.08) 100%)`,
                        border: `1px solid rgba(${cr2},${cg2},${cb2},0.2)`,
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                      }}>
                        {/* Name */}
                        <div style={{
                          padding: isMobile ? '5px 5px 3px' : '6px 6px 4px', textAlign: 'center',
                          borderBottom: `1px solid rgba(${cr2},${cg2},${cb2},0.1)`,
                        }}>
                          <div style={{ fontSize: isMobile ? '7px' : '8px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.name}</div>
                        </div>
                        {/* Icon */}
                        <div style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: isMobile ? '8px 0' : '12px 0',
                          background: `radial-gradient(circle at 50% 45%, rgba(${cr2},${cg2},${cb2},0.1), transparent 65%)`,
                        }}>
                          <div style={{ filter: `drop-shadow(0 0 10px ${cat.color}70)` }}>
                            <CardIcon icon={FuseIcon} size={isMobile ? 24 : 30} color={cat.color} />
                          </div>
                        </div>
                        {/* Power */}
                        <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', borderTop: `1px solid rgba(${cr2},${cg2},${cb2},0.08)` }}>
                          <Zap size={isMobile ? 7 : 8} style={{ color: cat.color, opacity: 0.8 }} />
                          <span style={{ fontSize: isMobile ? '8px' : '9px', fontWeight: 900, color: cat.color, opacity: 0.9, letterSpacing: '-0.3px' }}>{mod.power}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── FUSION STATS — refined glass pill ── */}
              <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px', animation: `fadeInUp 0.6s 0.35s ease-out both` }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '16px', padding: isMobile ? '10px 24px' : '12px 32px',
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.2px' }}>{moduleCount} minds</span>
                  <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: 700, color: '#ec4899', letterSpacing: '-0.2px' }}>⚡ {totalPower}</span>
                </div>
              </div>

              {/* ── PROMPT — premium glass container ── */}
              <div style={{ width: '100%', animation: `fadeInUp 0.7s 0.5s ease-out both` }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '10px' : '14px', padding: '0 6px' }}>
                  <span style={{
                    fontSize: isMobile ? '9px' : '10px', fontWeight: 600, letterSpacing: '2.5px',
                    color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                  }}>Your Fused Prompt</span>
                  <button onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000); track('Copy Prompt'); if (trialMode && !isPro) setTimeout(() => setShowPostCopyUpgrade(true), 1200); }}
                    style={{
                      padding: isMobile ? '6px 14px' : '7px 18px', fontSize: '11px', fontWeight: 600,
                      background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '100px', color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: copied ? '0 0 20px rgba(34,197,94,0.15)' : 'none',
                    }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                {/* Glass prompt card with animated gradient border */}
                <div style={{
                  position: 'relative', borderRadius: isMobile ? '16px' : '20px', padding: '1px',
                  background: copied
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.4), rgba(34,197,94,0.1))'
                    : 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.15) 50%, rgba(99,102,241,0.25) 100%)',
                  boxShadow: '0 16px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02)',
                }}>
                  <div style={{
                    padding: isMobile ? '16px' : '24px 28px',
                    background: 'rgba(6,6,12,0.82)',
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                    borderRadius: isMobile ? '15px' : '19px',
                    maxHeight: isMobile ? '260px' : '340px', overflowY: 'auto',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}>
                    <pre style={{
                      margin: 0, whiteSpace: 'pre-wrap',
                      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
                      fontSize: isMobile ? '10.5px' : '12.5px', lineHeight: 1.75,
                      color: 'rgba(255,255,255,0.78)', letterSpacing: '0.15px',
                    }}>{generatedPrompt}</pre>
                  </div>
                </div>
              </div>

              {/* ── PRIMARY ACTIONS — glass buttons with brand colors ── */}
              <div style={{ display: 'flex', gap: isMobile ? '10px' : '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: isMobile ? '24px' : '32px', animation: `fadeInUp 0.6s 0.7s ease-out both` }}>
                <a href={`https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => { track('Send to ChatGPT'); if (trialMode && !isPro) setTimeout(() => setShowPostCopyUpgrade(true), 800); }}
                  style={{
                    padding: isMobile ? '12px 24px' : '14px 32px', fontSize: isMobile ? '12px' : '13px', fontWeight: 600,
                    background: 'rgba(16,163,127,0.15)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16,163,127,0.3)',
                    borderRadius: '100px', color: '#34d399', cursor: 'pointer', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px',
                    boxShadow: '0 4px 24px rgba(16,163,127,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                  Use in ChatGPT <span style={{ opacity: 0.5, fontSize: '14px' }}>→</span>
                </a>
                <a href={`https://claude.ai/new?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => { track('Send to Claude'); if (trialMode && !isPro) setTimeout(() => setShowPostCopyUpgrade(true), 800); }}
                  style={{
                    padding: isMobile ? '12px 24px' : '14px 32px', fontSize: isMobile ? '12px' : '13px', fontWeight: 600,
                    background: 'rgba(212,162,127,0.12)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(212,162,127,0.25)',
                    borderRadius: '100px', color: '#e8b896', cursor: 'pointer', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px',
                    boxShadow: '0 4px 24px rgba(212,162,127,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                  Use in Claude <span style={{ opacity: 0.5, fontSize: '14px' }}>→</span>
                </a>
              </div>

              {/* ── SECONDARY — minimal ghost buttons ── */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: isMobile ? '16px' : '20px', flexWrap: 'wrap', animation: `fadeInUp 0.5s 0.9s ease-out both` }}>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I fused ${allSelected.map(m => m.name).join(' + ')} into one AI prompt\n\n⚡${totalPower} power • ${moduleCount} minds\n\nBuild yours free → skillcl.one`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '8px 18px', fontSize: '11px', fontWeight: 500,
                    background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px',
                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.3s ease',
                  }}>
                  𝕏 Share
                </a>
                <button onClick={() => { setShowFusion(false); setFusePhase(null); }} style={{
                  padding: '8px 18px', fontSize: '11px', fontWeight: 500,
                  background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '100px',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}>
                  ← Edit Squad
                </button>
                <button onClick={() => { setShowFusion(false); setFusePhase(null); setStage('landing'); setUserIntent(''); setSelectedModules({}); setTrialMode(false); setPackPicks(null); setPackIntent(''); }}
                  style={{ padding: '8px 18px', fontSize: '11px', fontWeight: 500, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'color 0.3s ease' }}>
                  New Clone
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UPGRADE MODAL — Apple / Levelsio tier */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '24px' }}
          onClick={() => setShowUpgrade(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', background: 'linear-gradient(180deg, rgba(18,18,30,0.98) 0%, rgba(8,8,14,0.99) 100%)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: isMobile ? '20px' : '24px', maxWidth: '400px', width: '100%', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)', animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1.2, 0.36, 1)' }}>

            {/* ── Hero gradient banner ── */}
            <div style={{ position: 'relative', padding: isMobile ? '28px 20px 24px' : '36px 28px 28px', background: 'linear-gradient(165deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.08) 50%, transparent 100%)', overflow: 'hidden' }}>
              {/* Decorative orb */}
              <div style={{ position: 'absolute', top: '-40px', right: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '-20px', left: '20%', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

              {/* Close */}
              <button onClick={() => setShowUpgrade(false)} aria-label="Close"
                style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

              {/* PRO badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px 4px 8px', borderRadius: '999px', background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.12))', border: '1px solid rgba(139,92,246,0.2)', marginBottom: '14px' }}>
                <Sparkles size={12} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c4b5fd' }}>Pro</span>
              </div>

              <h3 style={{ margin: 0, fontSize: isMobile ? '26px' : '32px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'white' }}>
                Unlimited geniuses.<br />
                <span style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Unlimited power.</span>
              </h3>
              <p style={{ margin: '10px 0 0', fontSize: '14px', lineHeight: 1.5, color: 'rgba(255,255,255,0.5)', maxWidth: '300px' }}>
                Build the exact council your mission needs. No cap, no limits.
              </p>
            </div>

            {/* ── Content ── */}
            <div style={{ padding: isMobile ? '16px 20px 20px' : '20px 28px 28px' }}>
              {/* Price + features compact */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontWeight: 600 }}>$24</span>
                    <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: 'white', lineHeight: 1 }}>$12</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: '2px' }}>/mo · launch price</div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  {['Unlimited genius selections', 'Custom minds with AI lore', 'Save & export squads', 'Wikipedia discovery'].map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <Check size={12} strokeWidth={3} style={{ color: '#a78bfa', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.2 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <a href={isCheckoutReady ? monthlyCheckoutUrl : undefined}
                onClick={() => { if (isCheckoutReady) track('Upgrade Click', { plan: 'monthly' }); }}
                aria-disabled={!isCheckoutReady}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '16px',
                  padding: '16px 18px', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em',
                  background: isCheckoutReady ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)' : 'rgba(99,102,241,0.3)',
                  border: 'none', borderRadius: '14px', color: 'white', cursor: isCheckoutReady ? 'pointer' : 'not-allowed',
                  textDecoration: 'none', boxSizing: 'border-box',
                  boxShadow: isCheckoutReady ? '0 12px 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                  opacity: isCheckoutReady ? 1 : 0.6,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => { if (isCheckoutReady) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'; }}}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isCheckoutReady ? '0 12px 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none'; }}>
                {isCheckoutReady ? 'Upgrade to Pro — $12/mo' : 'Stripe Link Missing'}
              </a>

              {!isCheckoutReady && (
                <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                  Set <code style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'ui-monospace, monospace' }}>VITE_STRIPE_MONTHLY_URL</code> to enable.
                </div>
              )}

              <button onClick={() => setShowUpgrade(false)}
                style={{ display: 'block', width: '100%', marginTop: '10px', padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDING — Fullscreen overlay on top of building view */}
      {stage === 'landing' && (
        <div className="landing-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden',
          background: 'transparent',
        }}>
          {/* SVG filter for jagged torn-paper edge on pack rip */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
            <defs>
              <filter id="tearEdge" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence type="turbulence" baseFrequency="0.04 0.15" numOctaves="4" seed="2" result="turbulence" />
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="12" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <div ref={heroCardRef} style={{ height: '1px' }} />

          {/* Cinematic intro veil — black, fades out */}
          <div className="intro-veil" style={{
            position: 'absolute', inset: 0, zIndex: 200,
            background: '#000', pointerEvents: 'none',
            opacity: introPlayed ? 0 : 1,
          }} />

          {/* Scrim — light veil for text readability, shader visible through */}
          <div className="landing-scrim" style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, rgba(7,5,13,0.25) 0%, rgba(5,4,10,0.4) 50%, rgba(3,2,7,0.55) 100%)',
            pointerEvents: 'none',
          }} />

          {/* ═══ LANDING CONTENT — centered pack + title ═══ */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: isMobile ? '40px 16px' : '0 20px',
            pointerEvents: deckDealing ? 'none' : undefined,
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: isMobile ? '32px' : '44px',
            }}>
              {/* Title — fades out when dealing starts */}
              <div style={{
                textAlign: 'center',
                opacity: deckDealing ? 0 : 1,
                transform: deckDealing ? 'translateY(-30px) scale(0.95)' : 'translateY(0) scale(1)',
                transition: 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <h1 className="intro-title" style={{ fontSize: isMobile ? '52px' : '80px', fontWeight: 300, margin: 0, letterSpacing: isMobile ? '-2px' : '-3px', lineHeight: 1 }}>
                  <span style={{ color: 'rgba(255,255,255,0.95)' }}>skill</span>
                  <span style={{ display: 'inline-block', paddingRight: '0.03em', background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 300 }}>clone</span>
                </h1>
                <p className="intro-subtitle" style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? '15px' : '19px', marginTop: '14px', fontWeight: 400, letterSpacing: '-0.2px', lineHeight: 1.5 }}>
                  {packPicks
                    ? <>Your pack is loaded. Slice it open.</>
                    : <>Legendary minds, one superhuman prompt.<br />Tell us what you're building — we'll deal the deck.</>
                  }
                </p>

                {/* Input — Apple/Shopify compact style */}
                <div className="intro-input" style={{ width: '100%', maxWidth: isMobile ? '300px' : '400px', margin: `${isMobile ? '12px' : '16px'} auto 0`,
                  opacity: packPicks ? 0 : 1, maxHeight: packPicks ? '0px' : '120px',
                  overflow: 'hidden', transition: 'opacity 0.4s ease, max-height 0.4s ease',
                  pointerEvents: packPicks ? 'none' : undefined,
                }}>
                  <form onSubmit={(e) => { e.preventDefault(); if (packIntent.trim() && !pickingGeniuses) pickAndDeal(); }}
                    style={{ display: 'flex', alignItems: 'center', position: 'relative',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      overflow: 'hidden',
                    }}>
                    <input
                      ref={packInputRef}
                      type="text"
                      value={packIntent}
                      onChange={(e) => setPackIntent(e.target.value)}
                      placeholder="What are you building?"
                      autoFocus={!isMobile}
                      className={packInputShake ? 'pack-input-shake' : ''}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: isMobile ? '11px 12px' : '12px 14px',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: 400,
                        color: 'white',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        letterSpacing: '-0.1px',
                      }}
                      onFocus={() => {
                        const form = packInputRef.current?.parentElement;
                        if (form) { form.style.borderColor = 'rgba(139,92,246,0.4)'; form.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15), 0 0 0 3px rgba(139,92,246,0.1)'; }
                      }}
                      onBlur={() => {
                        const form = packInputRef.current?.parentElement;
                        if (form) { form.style.borderColor = 'rgba(255,255,255,0.1)'; form.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)'; }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!packIntent.trim() || pickingGeniuses}
                      style={{
                        padding: isMobile ? '8px 14px' : '9px 18px',
                        margin: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        background: packIntent.trim() ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)' : 'rgba(255,255,255,0.06)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: packIntent.trim() ? 'pointer' : 'default',
                        opacity: packIntent.trim() ? 1 : 0.35,
                        transition: 'all 0.2s ease',
                        boxShadow: packIntent.trim() ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {pickingGeniuses ? '...' : 'Unlock'}
                    </button>
                  </form>
                </div>

                {/* ═══ SAMPLE DECKS — show the power ═══ */}
                {!packPicks && !deckDealing && (
                  <div className="intro-samples" style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
                    marginTop: isMobile ? '8px' : '12px',
                  }}>
                    {[
                      { label: 'AI calorie tracker' },
                      { label: 'Guitar learning app' },
                      { label: 'Freelancer marketplace' },
                      { label: 'Screenshot to code' },
                    ].map(sample => (
                      <button
                        key={sample.label}
                        onClick={() => {
                          setPackIntent(sample.label);
                          if (packInputRef.current) packInputRef.current.focus();
                        }}
                        style={{
                          padding: isMobile ? '5px 10px' : '6px 12px',
                          fontSize: isMobile ? '10px' : '11px',
                          fontWeight: 600,
                          color: 'rgba(167,139,250,0.8)',
                          background: 'rgba(139,92,246,0.08)',
                          border: '1px solid rgba(139,92,246,0.15)',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { e.target.style.background = 'rgba(139,92,246,0.15)'; e.target.style.borderColor = 'rgba(139,92,246,0.3)'; e.target.style.color = 'rgba(167,139,250,1)'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'rgba(139,92,246,0.08)'; e.target.style.borderColor = 'rgba(139,92,246,0.15)'; e.target.style.color = 'rgba(167,139,250,0.8)'; }}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* THE PACK — holographic booster pack, swipe to slice open */}
              <div
                ref={deckStackRef}
                className={`landing-deck-stack${packPicks ? ' pack-unlocked' : ''}`}
                onMouseDown={(e) => {
                  if (!packPicks) return; // locked until geniuses picked
                  sliceTapTime.current = Date.now();
                  sliceTapPos.current = { x: e.clientX, y: e.clientY };
                  handleSliceStart(e.clientX, e.clientY);
                }}
                onMouseUp={(e) => {
                  if (!packPicks) return;
                  // Quick tap fallback — if no significant movement and short press
                  if (!sliceActive.current && sliceTapTime.current && Date.now() - sliceTapTime.current < 300) {
                    const dx = Math.abs(e.clientX - (sliceTapPos.current?.x || 0));
                    if (dx < 10) startDeckDeal();
                  }
                  sliceTapTime.current = null;
                }}
                onTouchStart={(e) => {
                  if (!packPicks) return;
                  const t = e.touches[0];
                  sliceTapTime.current = Date.now();
                  sliceTapPos.current = { x: t.clientX, y: t.clientY };
                  handleSliceStart(t.clientX, t.clientY);
                }}
                onTouchEnd={(e) => {
                  if (!packPicks) return;
                  const t = e.changedTouches?.[0];
                  if (!sliceActive.current && sliceTapTime.current && Date.now() - sliceTapTime.current < 300) {
                    const dx = Math.abs((t?.clientX || 0) - (sliceTapPos.current?.x || 0));
                    if (dx < 10) startDeckDeal();
                  }
                  sliceTapTime.current = null;
                }}
                style={{
                  position: 'relative',
                  width: isMobile ? '240px' : '330px',
                  aspectRatio: '377 / 661',
                  cursor: deckDealing || !packPicks ? 'default' : `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'><line x1=\'4\' y1=\'28\' x2=\'28\' y2=\'4\' stroke=\'rgba(200,180,255,0.9)\' stroke-width=\'2\' stroke-linecap=\'round\'/><line x1=\'4\' y1=\'28\' x2=\'28\' y2=\'4\' stroke=\'white\' stroke-width=\'1\' stroke-linecap=\'round\'/><circle cx=\'28\' cy=\'4\' r=\'2\' fill=\'white\'/><line x1=\'26\' y1=\'3\' x2=\'22\' y2=\'7\' stroke=\'rgba(167,139,250,0.6)\' stroke-width=\'1\'/><line x1=\'29\' y1=\'6\' x2=\'25\' y2=\'10\' stroke=\'rgba(167,139,250,0.6)\' stroke-width=\'1\'/></svg>')}") 4 28, crosshair`,
                  opacity: 1,
                  filter: 'none',
                  transition: 'filter 0.6s ease',
                  pointerEvents: deckDealing ? 'none' : undefined,
                  zIndex: 20,
                  userSelect: 'none', WebkitUserSelect: 'none',
                  touchAction: 'none',
                  overflow: 'visible',
                }}>
                {/* ═══ PACK LOCK OVERLAY — visible until intent entered ═══ */}
                {!packPicks && !deckDealing && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();

                      // If user has typed an intent → UNLOCK! Click the pack = deal
                      if (packIntent.trim() && !pickingGeniuses) {
                        pickAndDeal();
                        return;
                      }

                      // No intent typed → "nope!" feedback
                      const packEl = deckStackRef.current;
                      const inputEl = packInputRef.current;
                      if (!inputEl) return;

                      // 1. Pack recoils — denied!
                      if (packEl) {
                        gsap.timeline()
                          .to(packEl, { scale: 0.92, rotation: -2, duration: 0.1, ease: 'power3.out' })
                          .to(packEl, { x: -8, duration: 0.06, ease: 'power2.out' })
                          .to(packEl, { x: 8, duration: 0.06, ease: 'power2.out' })
                          .to(packEl, { x: -5, duration: 0.05, ease: 'power2.out' })
                          .to(packEl, { x: 3, duration: 0.05, ease: 'power2.out' })
                          .to(packEl, { x: 0, scale: 1, rotation: 0, duration: 0.3, ease: 'elastic.out(1.2, 0.5)' });
                      }

                      // 2. Lock icon flashes red-ish then back
                      const lockCircle = packEl?.querySelector('.pack-lock-circle');
                      if (lockCircle) {
                        gsap.timeline()
                          .to(lockCircle, { scale: 1.3, boxShadow: '0 0 30px rgba(239,68,68,0.5), inset 0 0 15px rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.5)', duration: 0.15, ease: 'power2.out' })
                          .to(lockCircle, { scale: 1, boxShadow: '0 0 20px rgba(139,92,246,0.1), inset 0 0 12px rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.25)', duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                      }

                      // 3. Input glows bright violet — "type HERE!"
                      inputEl.focus();
                      gsap.timeline()
                        .to(inputEl, {
                          boxShadow: '0 4px 24px rgba(0,0,0,0.2), 0 0 0 3px rgba(139,92,246,0.5), 0 0 30px rgba(139,92,246,0.3), 0 0 60px rgba(139,92,246,0.15)',
                          borderColor: 'rgba(139,92,246,0.7)',
                          duration: 0.2,
                          ease: 'power2.out',
                        })
                        .to(inputEl, {
                          boxShadow: '0 4px 24px rgba(0,0,0,0.2), 0 0 0 2px rgba(139,92,246,0.15), 0 0 12px rgba(139,92,246,0.08)',
                          borderColor: 'rgba(139,92,246,0.3)',
                          duration: 1.2,
                          ease: 'power2.out',
                        });

                      // 4. Scroll input into view
                      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    style={{
                    position: 'absolute', inset: 0, zIndex: 30,
                    borderRadius: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: isMobile ? '8px' : '10px',
                    cursor: packIntent.trim()
                      ? `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><defs><linearGradient id='kg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23c084fc'/><stop offset='100%' stop-color='%23ec4899'/></linearGradient><filter id='glow'><feGaussianBlur stdDeviation='1' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><g filter='url(%23glow)'><circle cx='10' cy='8' r='5.5' fill='none' stroke='url(%23kg)' stroke-width='1.8'/><circle cx='10' cy='8' r='2' fill='none' stroke='url(%23kg)' stroke-width='1.2'/><line x1='10' y1='13.5' x2='10' y2='26' stroke='url(%23kg)' stroke-width='1.8' stroke-linecap='round'/><line x1='10' y1='19' x2='14.5' y2='19' stroke='url(%23kg)' stroke-width='1.5' stroke-linecap='round'/><line x1='10' y1='23' x2='13' y2='23' stroke='url(%23kg)' stroke-width='1.5' stroke-linecap='round'/></g></svg>`)}") 10 26, pointer`
                      : 'pointer',
                  }}>
                    {/* ═══ CHAINS — X wrapping around the pack, hugging edges ═══ */}
                    {(() => {
                      const linkSize = isMobile ? 9 : 12;
                      const sw = isMobile ? 2 : 2.5;
                      const packW = isMobile ? 240 : 330;
                      const packH = packW * (661 / 377);
                      const cx = packW / 2, cy = packH / 2;
                      // Wrap amount — how far past the corner the chain continues (behind the pack)
                      const wrap = isMobile ? 18 : 25;
                      const corners = [
                        { id: 'tl', x: -wrap, y: -wrap },
                        { id: 'tr', x: packW + wrap, y: -wrap },
                        { id: 'bl', x: -wrap, y: packH + wrap },
                        { id: 'br', x: packW + wrap, y: packH + wrap },
                      ];
                      return (
                        <svg className="pack-chains-svg" style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          pointerEvents: 'none', zIndex: 1,
                          overflow: 'hidden', // clips chains at pack edge — looks like they wrap behind
                          borderRadius: 'inherit',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
                        }} viewBox={`0 0 ${packW} ${packH}`} preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chainMetal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d0cce0" />
                              <stop offset="25%" stopColor="#a09ab0" />
                              <stop offset="50%" stopColor="#585068" />
                              <stop offset="75%" stopColor="#a09ab0" />
                              <stop offset="100%" stopColor="#d0cce0" />
                            </linearGradient>
                            <linearGradient id="chainHi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </linearGradient>
                          </defs>
                          {corners.map(({ id, x: cornerX, y: cornerY }) => {
                            const dx = cornerX - cx, dy = cornerY - cy;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            const linkCount = Math.floor(dist / (linkSize * 0.85)) + 2;
                            const startOff = isMobile ? 24 : 32;
                            return (
                              <g key={id} className="pack-chain" data-side={id}>
                                {Array.from({ length: linkCount }, (_, i) => {
                                  const t = (startOff + i * linkSize * 0.85) / dist;
                                  if (t > 1.15) return null;
                                  const lx = cx + dx * t;
                                  const ly = cy + dy * t;
                                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                                  const isVert = i % 2 === 0;
                                  const rx = isVert ? linkSize * 0.22 : linkSize * 0.38;
                                  const ry = isVert ? linkSize * 0.38 : linkSize * 0.22;
                                  return (
                                    <g key={i}>
                                      <ellipse cx={lx} cy={ly} rx={rx} ry={ry}
                                        transform={`rotate(${angle} ${lx} ${ly})`}
                                        fill="none" stroke="url(#chainMetal)" strokeWidth={sw}
                                        opacity="0.9"
                                      />
                                      <ellipse cx={lx} cy={ly - ry * 0.2} rx={rx * 0.6} ry={ry * 0.3}
                                        transform={`rotate(${angle} ${lx} ${ly - ry * 0.2})`}
                                        fill="none" stroke="url(#chainHi)" strokeWidth={0.8}
                                        opacity="0.6"
                                      />
                                    </g>
                                  );
                                })}
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}

                    {/* Realistic padlock — gold body, steel shackle, full detail */}
                    <div className="pack-lock-circle" style={{
                      position: 'relative',
                      width: isMobile ? '28px' : '36px',
                      height: isMobile ? '36px' : '46px',
                      zIndex: 2,
                      filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.8)) drop-shadow(0 1px 4px rgba(139,92,246,0.3))',
                      animation: 'lockPulse 3s ease-in-out infinite',
                    }}>
                      <svg width="100%" height="100%" viewBox="0 0 62 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          {/* Purple-metallic body */}
                          <linearGradient id="lockGold" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c8a0f0" />
                            <stop offset="12%" stopColor="#a67dd8" />
                            <stop offset="35%" stopColor="#7c52b8" />
                            <stop offset="50%" stopColor="#5e3a98" />
                            <stop offset="65%" stopColor="#7c52b8" />
                            <stop offset="85%" stopColor="#a07ad0" />
                            <stop offset="100%" stopColor="#5a3890" />
                          </linearGradient>
                          {/* Side highlight — left-to-right specular */}
                          <linearGradient id="lockGoldHi" x1="0" y1="0.3" x2="1" y2="0.7">
                            <stop offset="0%" stopColor="rgba(220,200,255,0.5)" />
                            <stop offset="30%" stopColor="rgba(200,180,240,0)" />
                            <stop offset="70%" stopColor="rgba(200,180,240,0)" />
                            <stop offset="100%" stopColor="rgba(220,200,255,0.2)" />
                          </linearGradient>
                          {/* Steel shackle outer */}
                          <linearGradient id="lockSteel" x1="0.2" y1="0" x2="0.8" y2="1">
                            <stop offset="0%" stopColor="#e0e0e8" />
                            <stop offset="20%" stopColor="#b0b0c0" />
                            <stop offset="45%" stopColor="#707080" />
                            <stop offset="55%" stopColor="#606070" />
                            <stop offset="80%" stopColor="#a0a0b0" />
                            <stop offset="100%" stopColor="#d0d0d8" />
                          </linearGradient>
                          {/* Steel inner line */}
                          <linearGradient id="lockSteelHi" x1="0.5" y1="0" x2="0.5" y2="1">
                            <stop offset="0%" stopColor="#c0c0d0" />
                            <stop offset="40%" stopColor="#808090" />
                            <stop offset="100%" stopColor="#a8a8b8" />
                          </linearGradient>
                          {/* Keyhole depth */}
                          <radialGradient id="lockKeyhole" cx="0.5" cy="0.4" r="0.5">
                            <stop offset="0%" stopColor="#0e0818" />
                            <stop offset="100%" stopColor="#1a1028" />
                          </radialGradient>
                          {/* Face plate around keyhole */}
                          <radialGradient id="lockFaceplate" cx="0.5" cy="0.45" r="0.5">
                            <stop offset="0%" stopColor="#9070c8" />
                            <stop offset="60%" stopColor="#7858b0" />
                            <stop offset="100%" stopColor="#6648a0" />
                          </radialGradient>
                        </defs>

                        {/* ── SHACKLE (steel) ── */}
                        <g className="lock-shackle" style={{ transformOrigin: '16px 44px' }}>
                          {/* Outer thick bar */}
                          <path d="M16 44 V20 A15 15 0 0 1 46 20 V44" stroke="url(#lockSteel)" strokeWidth="7" fill="none" strokeLinecap="square" />
                          {/* Dark inner edge */}
                          <path d="M16 43 V20 A15 15 0 0 1 46 20 V43" stroke="rgba(40,40,50,0.4)" strokeWidth="3" fill="none" />
                          {/* Center highlight line */}
                          <path d="M16 43 V20 A15 15 0 0 1 46 20 V43" stroke="url(#lockSteelHi)" strokeWidth="1.5" fill="none" />
                          {/* Top arc specular */}
                          <path d="M22 12 A10 10 0 0 1 40 12" stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />
                          {/* Left/right post bevels */}
                          <line x1="13.5" y1="44" x2="13.5" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                          <line x1="48.5" y1="44" x2="48.5" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                        </g>

                        {/* ── BODY (gold) ── */}
                        {/* Main shape */}
                        <rect x="5" y="38" width="52" height="38" rx="4" fill="url(#lockGold)" />
                        {/* Highlight overlay */}
                        <rect x="5" y="38" width="52" height="38" rx="4" fill="url(#lockGoldHi)" />
                        {/* Dark border for depth */}
                        <rect x="5" y="38" width="52" height="38" rx="4" fill="none" stroke="rgba(60,30,100,0.6)" strokeWidth="1.2" />
                        {/* Top edge bevel — bright */}
                        <line x1="9" y1="39.5" x2="53" y2="39.5" stroke="rgba(200,180,240,0.45)" strokeWidth="0.8" />
                        {/* Bottom edge bevel — dark */}
                        <line x1="9" y1="75" x2="53" y2="75" stroke="rgba(40,20,70,0.4)" strokeWidth="0.8" />
                        {/* Inner bevel rectangle */}
                        <rect x="9" y="42" width="44" height="30" rx="2" fill="none" stroke="rgba(140,100,200,0.2)" strokeWidth="0.7" />

                        {/* ── FACE PLATE (raised circle around keyhole) ── */}
                        <circle cx="31" cy="55" r="9" fill="url(#lockFaceplate)" />
                        <circle cx="31" cy="55" r="9" fill="none" stroke="rgba(50,30,80,0.5)" strokeWidth="0.8" />
                        <circle cx="31" cy="55" r="8" fill="none" stroke="rgba(200,180,240,0.2)" strokeWidth="0.5" />

                        {/* ── KEYHOLE ── */}
                        <circle cx="31" cy="53.5" r="3.5" fill="url(#lockKeyhole)" />
                        <path d="M29.5 54 L31 53 L32.5 54 L32 60 Q31 61 30 60 Z" fill="url(#lockKeyhole)" />
                        {/* Keyhole rim highlight */}
                        <path d="M28 52 A3.5 3.5 0 0 1 34 52" stroke="rgba(200,180,240,0.2)" strokeWidth="0.5" fill="none" />

                        {/* ── RIVETS (corner detail) ── */}
                        {[[11,43],[51,43],[11,71],[51,71]].map(([cx,cy], ri) => (
                          <g key={ri}>
                            <circle cx={cx} cy={cy} r="2.2" fill="rgba(100,70,160,0.6)" />
                            <circle cx={cx} cy={cy} r="1.4" fill="rgba(140,100,200,0.5)" />
                            <circle cx={cx-0.4} cy={cy-0.4} r="0.6" fill="rgba(200,180,240,0.3)" />
                          </g>
                        ))}

                        {/* ── AMBIENT SPECULAR — soft bloom top-left ── */}
                        <ellipse cx="18" cy="44" rx="12" ry="6" fill="rgba(200,180,240,0.06)" />
                      </svg>
                    </div>
                    <div style={{
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: 600,
                      color: 'rgba(167,139,250,0.5)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    }} className="pack-lock-text">Tell us what you're building</div>
                  </div>
                )}

                {/* Extended hit area — catches clicks/touches beyond the pack edges for slice start */}
                <div style={{
                  position: 'absolute',
                  left: '-25%', right: '-25%',
                  top: '5%', height: '30%',
                  zIndex: 16,
                  cursor: 'inherit',
                }} />

                {/* ═══ SLICE HERE — interactive cut guide with animated hint ═══ */}
                <div className="slice-here-line" style={{
                  position: 'absolute',
                  left: '-12%', right: '-12%',
                  top: '19%',
                  transform: 'rotate(-3deg)',
                  height: '1px',
                  zIndex: 15,
                  pointerEvents: 'none',
                  opacity: (deckDealing || !packPicks) ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                }}>
                  {/* Dashed cut line */}
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'repeating-linear-gradient(90deg, rgba(167,139,250,0.4) 0px, rgba(167,139,250,0.4) 5px, transparent 5px, transparent 11px)',
                    animation: 'sliceLinePulse 2.5s ease-in-out infinite',
                  }} />
                  {/* Animated sliding glow orb — traces the cut path like a finger guide */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '-4%',
                    width: '24px', height: '24px',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(167,139,250,0.6) 30%, rgba(139,92,246,0.2) 60%, transparent 80%)',
                    boxShadow: '0 0 12px 4px rgba(167,139,250,0.4), 0 0 24px 8px rgba(139,92,246,0.15)',
                    animation: 'sliceOrbSlide 2.8s ease-in-out infinite',
                  }} />
                  {/* Trailing shimmer behind the orb */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '-4%',
                    width: '60px', height: '4px',
                    transform: 'translateY(-50%)',
                    background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3) 40%, rgba(255,255,255,0.15) 100%)',
                    filter: 'blur(2px)',
                    animation: 'sliceOrbSlide 2.8s ease-in-out infinite',
                    opacity: 0.7,
                  }} />
                  {/* Soft glow bed behind the full line */}
                  <div style={{
                    position: 'absolute', inset: '-8px 0',
                    background: 'linear-gradient(90deg, transparent 5%, rgba(139,92,246,0.06) 25%, rgba(167,139,250,0.1) 50%, rgba(139,92,246,0.06) 75%, transparent 95%)',
                    filter: 'blur(6px)',
                    animation: 'sliceLinePulse 2.5s ease-in-out infinite',
                  }} />
                </div>

                {/* ═══ SPARK CANVAS — metal-cutting particle overlay ═══ */}
                <canvas ref={sparkCanvasRef} style={{
                  position: 'absolute',
                  left: '-50%', top: '-30%',
                  width: '200%', height: '350%',
                  pointerEvents: 'none', zIndex: 25,
                }} />

                {/* Pack shadow */}
                <div style={{
                  position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)',
                  width: '85%', height: '24px',
                  background: 'radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)',
                  filter: 'blur(14px)',
                  animation: 'deckShadowPulse 3s ease-in-out infinite',
                }} />

                {/* Pack interior — dark cavity visible through the rip, gives 3D depth */}
                <div className="pack-interior" style={{
                  position: 'absolute', inset: '8%',
                  zIndex: 0,
                  borderRadius: '4px',
                  background: 'linear-gradient(180deg, rgba(20,15,35,1) 0%, rgba(10,8,20,1) 40%, rgba(15,12,28,1) 100%)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), inset 0 0 60px rgba(139,92,246,0.08)',
                  overflow: 'hidden',
                }}>
                  {/* Inner shimmer — suggests cards inside */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(139,92,246,0.03) 3px, rgba(139,92,246,0.03) 4px)',
                    opacity: 0.5,
                  }} />
                </div>

                {/* ═══ CARD STACK — full-size front-face cards behind pack ═══ */}
                <div ref={dealContainerRef} className="pack-card-stack" style={{
                  position: 'absolute', inset: 0, zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'visible',
                }}>
                  {dealCards.map(({ catId, mod, cat }, i) => {
                    const color = cat.color;
                    const r2 = parseInt(color.slice(1,3),16);
                    const g2 = parseInt(color.slice(3,5),16);
                    const b2 = parseInt(color.slice(5,7),16);
                    const IconComp = CATEGORY_ICONS[cat.icon] || Star;
                    const pw = isMobile ? 195 : 270; // pack-sized width (85% of pack)
                    const ph = Math.round(pw * 1.4);
                    return (
                      <div key={mod.id} className="deal-card" data-idx={i} data-deal-genius={mod.id} style={{
                        position: 'absolute',
                        width: `${pw}px`, height: `${ph}px`,
                        borderRadius: isMobile ? '8px' : '10px',
                        overflow: 'hidden',
                        willChange: 'transform, opacity',
                        opacity: 0,
                      }}>
                        {/* FRONT FACE — shown during emerge, hidden before deal */}
                        <div className="deal-front" style={{
                          position: 'absolute', inset: 0,
                          borderRadius: 'inherit', overflow: 'hidden',
                          background: `linear-gradient(180deg, ${color}50 0%, rgba(${r2},${g2},${b2},0.25) 8%, rgba(22,22,30,0.98) 15%, rgba(18,18,26,0.99) 85%, rgba(${r2},${g2},${b2},0.25) 92%, ${color}50 100%)`,
                          padding: isMobile ? '2px' : '2.5px',
                          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 30px rgba(${r2},${g2},${b2},0.2), 0 0 60px rgba(${r2},${g2},${b2},0.08)`,
                        }}>
                          <div style={{
                            width: '100%', height: '100%', borderRadius: isMobile ? '4px' : '6px', overflow: 'hidden', position: 'relative',
                            background: `linear-gradient(180deg, rgba(${r2},${g2},${b2},0.08) 0%, rgba(10,10,16,0.99) 100%)`,
                            display: 'flex', flexDirection: 'column',
                          }}>
                            {/* Foil shimmer */}
                            <div className="card-foil" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: `linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.06) 42%, rgba(${r2},${g2},${b2},0.08) 50%, rgba(255,255,255,0.04) 58%, transparent 75%)`, backgroundSize: '200% 200%', pointerEvents: 'none', zIndex: 4 }} />
                            {/* Name banner */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: isMobile ? '4px 6px 3px' : '5px 7px 3px',
                              background: `linear-gradient(180deg, rgba(${r2},${g2},${b2},0.18) 0%, rgba(${r2},${g2},${b2},0.06) 100%)`,
                              borderBottom: `1px solid rgba(${r2},${g2},${b2},0.15)`,
                              minHeight: 0, zIndex: 2,
                            }}>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px', fontWeight: 800, color: 'rgba(255,255,255,0.92)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                flex: 1, letterSpacing: '-0.2px', textTransform: 'uppercase',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                              }}>{mod.name}</div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '9px', fontWeight: 900, color,
                                fontFamily: 'ui-monospace, monospace', lineHeight: 1, flexShrink: 0, marginLeft: '4px',
                                textShadow: `0 0 6px rgba(${r2},${g2},${b2},0.5)`,
                              }}>{mod.power}</div>
                            </div>
                            {/* Art box */}
                            <div style={{
                              flex: '1 1 auto', position: 'relative',
                              margin: isMobile ? '3px 4px' : '3px 5px',
                              borderRadius: '3px',
                              background: `radial-gradient(ellipse at 50% 40%, rgba(${r2},${g2},${b2},0.15) 0%, rgba(${r2},${g2},${b2},0.04) 50%, rgba(8,8,14,0.95) 100%)`,
                              border: `1px solid rgba(${r2},${g2},${b2},0.1)`,
                              overflow: 'hidden',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{ position: 'absolute', inset: 0, opacity: 0.3, background: `radial-gradient(circle at 30% 20%, rgba(${r2},${g2},${b2},0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(${r2},${g2},${b2},0.1) 0%, transparent 40%)`, pointerEvents: 'none' }} />
                              <div style={{
                                filter: `drop-shadow(0 0 ${isMobile ? '8px' : '14px'} rgba(${r2},${g2},${b2},0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
                                position: 'relative', zIndex: 1,
                              }}>
                                <CardIcon icon={IconComp} size={isMobile ? 28 : 38} color={color} />
                              </div>
                            </div>
                            {/* Type line */}
                            <div style={{
                              padding: isMobile ? '3px 6px' : '2px 7px',
                              background: `linear-gradient(180deg, rgba(${r2},${g2},${b2},0.1) 0%, rgba(${r2},${g2},${b2},0.04) 100%)`,
                              borderTop: `1px solid rgba(${r2},${g2},${b2},0.1)`,
                              borderBottom: `1px solid rgba(${r2},${g2},${b2},0.1)`,
                              display: 'flex', alignItems: 'center', gap: '3px', zIndex: 2,
                            }}>
                              <CardIcon icon={IconComp} size={isMobile ? 8 : 9} color={color} />
                              <div style={{
                                fontSize: isMobile ? '6.5px' : '7px', fontWeight: 600, color: `rgba(${r2},${g2},${b2},0.68)`,
                                letterSpacing: '0.3px', textTransform: 'uppercase',
                              }}>{cat.name}</div>
                            </div>
                            {/* Specs */}
                            <div style={{
                              padding: isMobile ? '4px 6px 5px' : '4px 7px 6px',
                              flex: '0 0 auto', minHeight: isMobile ? '24px' : '30px', zIndex: 2,
                              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '2px',
                            }}>
                              <div style={{
                                fontSize: isMobile ? '6.5px' : '7.5px', color: 'rgba(255,255,255,0.64)',
                                lineHeight: 1.25, overflow: 'hidden',
                                display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical',
                              }}>{mod.specs}</div>
                            </div>
                          </div>
                        </div>
                        {/* BACK FACE — matches grid tile design exactly */}
                        <div className="deal-back" style={{
                          position: 'absolute', inset: 0,
                          opacity: 0,
                          borderRadius: 'inherit', overflow: 'hidden',
                          background: `linear-gradient(180deg, rgba(${r2},${g2},${b2},0.25) 0%, rgba(30,30,40,0.7) 8%, rgba(18,18,26,0.98) 15%, rgba(14,14,22,0.99) 85%, rgba(30,30,40,0.7) 92%, rgba(${r2},${g2},${b2},0.2) 100%)`,
                          padding: '1px',
                          boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
                        }}>
                          <div style={{
                            width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden',
                            position: 'relative',
                            background: 'rgba(10,10,16,0.98)',
                            display: 'flex', flexDirection: 'column',
                          }}>
                            {/* Card-back geometric border */}
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
                              <div style={{ position: 'absolute', inset: '4px', borderRadius: '2px', border: `1px solid rgba(${r2},${g2},${b2},0.06)`, pointerEvents: 'none' }} />
                              <div style={{ position: 'absolute', inset: '7px', borderRadius: '1px', border: `1px solid rgba(${r2},${g2},${b2},0.03)`, pointerEvents: 'none' }} />
                            </div>
                            {/* Art box */}
                            <div style={{
                              flex: '1 1 auto', position: 'relative',
                              margin: '3px 3px 1px',
                              borderRadius: '2px',
                              background: `radial-gradient(ellipse at 50% 40%, rgba(${r2},${g2},${b2},0.1) 0%, rgba(${r2},${g2},${b2},0.03) 50%, rgba(8,8,14,0.95) 100%)`,
                              overflow: 'hidden',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{ position: 'absolute', inset: 0, opacity: 0.35, background: `radial-gradient(circle at 30% 25%, rgba(${r2},${g2},${b2},0.2) 0%, transparent 50%), radial-gradient(circle at 70% 75%, rgba(${r2},${g2},${b2},0.1) 0%, transparent 40%)`, pointerEvents: 'none' }} />
                              {/* Center gem */}
                              <div style={{ position: 'absolute', width: '28px', height: '28px', borderRadius: '4px', transform: 'rotate(45deg)', border: `1px solid rgba(${r2},${g2},${b2},0.06)`, pointerEvents: 'none', zIndex: 0 }} />
                              <div style={{
                                position: 'relative', zIndex: 1,
                                filter: `drop-shadow(0 0 6px rgba(${r2},${g2},${b2},0.25)) drop-shadow(0 1px 3px rgba(0,0,0,0.4))`,
                              }}>
                                <CardIcon icon={IconComp} size={isMobile ? 17 : 22} color={color} />
                              </div>
                              {/* Power badge top-right */}
                              <div style={{
                                position: 'absolute', top: '2px', right: '2px',
                                fontSize: '7px', fontWeight: 900, color,
                                fontFamily: 'ui-monospace, monospace', lineHeight: 1, zIndex: 3,
                                background: `rgba(${r2},${g2},${b2},0.15)`,
                                padding: '1px 3px', borderRadius: '3px',
                                textShadow: `0 0 4px rgba(${r2},${g2},${b2},0.4)`,
                              }}>{mod.power}</div>
                            </div>
                            {/* Name below art */}
                            <div style={{ padding: '1px 2px 3px', zIndex: 2, textAlign: 'center' }}>
                              <div style={{
                                fontSize: isMobile ? '8px' : '9px', fontWeight: 700,
                                color: 'rgba(255,255,255,0.8)',
                                lineHeight: 1.15, letterSpacing: '-0.2px',
                                textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word',
                              }}>{mod.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pack top flap — sliced off diagonally by the slash */}
                <div className="pack-half pack-top" style={{
                  position: 'absolute', inset: 0,
                  clipPath: 'polygon(0 0, 100% 0, 100% 17%, 0 22%)',
                  zIndex: 2,
                  willChange: 'transform, opacity',
                  filter: 'url(#tearEdge)',
                  transformOrigin: '80% 19%',
                  borderRadius: isMobile ? '10px' : '14px',
                  overflow: 'hidden',
                }}>
                  <img src="/pack.png" alt="" draggable={false} className="pack-img" style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: '175.5%', height: '57%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    objectFit: 'cover',
                    filter: 'brightness(1.05) contrast(1.1)',
                  }} />
                </div>

                {/* Pack body — stays in place, cards emerge from slash opening */}
                <div className="pack-half pack-bottom" style={{
                  position: 'absolute', inset: 0,
                  clipPath: 'polygon(0 22%, 100% 17%, 100% 100%, 0 100%)',
                  zIndex: 2,
                  willChange: 'transform, opacity',
                  borderRadius: isMobile ? '10px' : '14px',
                  overflow: 'hidden',
                }}>
                  <img src="/pack.png" alt="" draggable={false} className="pack-img" style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: '175.5%', height: '57%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    objectFit: 'cover',
                    filter: 'brightness(1.05) contrast(1.1)',
                  }} />
                </div>

                {/* Full unripped pack (visible before tear — covers the halves) */}
                <div className="pack-full" style={{
                  position: 'absolute', inset: 0,
                  zIndex: 3,
                  borderRadius: isMobile ? '10px' : '14px',
                  overflow: 'hidden',
                  background: '#0a0a12',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.1)',
                }}>
                  <img src="/pack.png" alt="SkillClone Pack" draggable={false} className="pack-img" style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: '175.5%', height: '57%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    objectFit: 'cover',
                    filter: 'brightness(1.05) contrast(1.1)',
                  }} />
                  {/* GLSL holographic foil — living Refik Anadol-style iridescence */}
                  <PackFoilShader />
                  {/* Breathing glow */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: 'inherit',
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 60%)',
                    animation: 'deckGlowBreathe 3s ease-in-out infinite',
                    pointerEvents: 'none',
                  }} />
                </div>

                {/* Tear line glow — energy along the diagonal slash */}
                <div className="pack-tear-glow" style={{
                  position: 'absolute', left: '-15%', right: '-15%',
                  top: '19.5%', transform: 'translateY(-50%) rotate(-3deg)',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.6) 20%, rgba(167,139,250,1) 40%, rgba(255,255,255,1) 50%, rgba(167,139,250,1) 60%, rgba(255,255,255,0.6) 80%, transparent 95%)',
                  filter: 'blur(1.5px)',
                  opacity: 0, zIndex: 5,
                  pointerEvents: 'none',
                }} />
                {/* Secondary wider glow behind the slash */}
                <div className="pack-tear-bloom" style={{
                  position: 'absolute', left: '-20%', right: '-20%',
                  top: '19.5%', transform: 'translateY(-50%) rotate(-3deg)',
                  height: '36px',
                  background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3) 30%, rgba(167,139,250,0.5) 50%, rgba(139,92,246,0.3) 70%, transparent)',
                  filter: 'blur(10px)',
                  opacity: 0, zIndex: 4,
                  pointerEvents: 'none',
                }} />

                {/* Energy burst — radial shockwave from top tear */}
                <div className="pack-burst" style={{
                  position: 'absolute', top: '20%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '250%', height: '250%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(167,139,250,0.2) 15%, rgba(139,92,246,0.08) 30%, transparent 55%)',
                  opacity: 0, zIndex: 1,
                  pointerEvents: 'none',
                }} />

                {/* Spark particles along the slash cut */}
                {Array.from({ length: 16 }).map((_, si) => (
                  <div key={si} className="pack-spark" style={{
                    position: 'absolute',
                    left: `${5 + (si / 15) * 90}%`,
                    top: `${22 - (si / 15) * 5}%`,
                    width: si % 3 === 0 ? '4px' : '3px',
                    height: si % 3 === 0 ? '4px' : '3px',
                    borderRadius: '50%',
                    background: si % 3 === 0 ? '#fff' : si % 3 === 1 ? '#c4b5fd' : '#93c5fd',
                    boxShadow: si % 2 === 0
                      ? '0 0 6px 2px rgba(255,255,255,0.9), 0 0 14px 4px rgba(167,139,250,0.5)'
                      : '0 0 5px 2px rgba(196,181,253,0.8)',
                    opacity: 0, zIndex: 12,
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* ═══ SLASH BLADE — diagonal energy cut ═══ */}
                <div className="pack-slash" style={{
                  position: 'absolute',
                  width: '200%', height: '3px',
                  left: '-120%', top: '19%',
                  transform: 'rotate(-3deg)',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.05) 10%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,1) 45%, rgba(200,180,255,1) 50%, rgba(255,255,255,1) 55%, rgba(255,255,255,0.4) 70%, rgba(167,139,250,0.05) 90%, transparent 100%)',
                  boxShadow: '0 0 8px 2px rgba(255,255,255,0.6), 0 0 20px 4px rgba(167,139,250,0.5), 0 0 50px 8px rgba(139,92,246,0.3), 0 0 100px 16px rgba(99,102,241,0.15)',
                  opacity: 0, zIndex: 10,
                  pointerEvents: 'none',
                }} />
                {/* Slash afterglow trail — wider, softer, fades slower */}
                <div className="pack-slash-trail" style={{
                  position: 'absolute',
                  width: '200%', height: '12px',
                  left: '-120%', top: '19%',
                  transform: 'rotate(-3deg) translateY(-4.5px)',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.02) 15%, rgba(139,92,246,0.15) 35%, rgba(167,139,250,0.3) 50%, rgba(139,92,246,0.15) 65%, rgba(167,139,250,0.02) 85%, transparent 100%)',
                  filter: 'blur(4px)',
                  opacity: 0, zIndex: 9,
                  pointerEvents: 'none',
                }} />
                {/* Slash impact flash — full-width white flash at cut */}
                <div className="pack-slash-flash" style={{
                  position: 'absolute',
                  left: '-10%', right: '-10%',
                  top: '15%', height: '12%',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 60%, transparent 100%)',
                  filter: 'blur(6px)',
                  opacity: 0, zIndex: 8,
                  pointerEvents: 'none',
                }} />

              </div>

              {/* CTA hint — only shows after pack is unlocked, before reveal */}
              {packPicks && !deckDealing && !cardReveal && (
                <div style={{
                  fontSize: isMobile ? '15px' : '18px', color: 'rgba(255,255,255,0.35)',
                  fontWeight: 400, letterSpacing: '-0.2px',
                  animation: 'fadeInUp 0.6s 0.3s ease-out both, deckHintPulse 2.5s 1.5s ease-in-out infinite',
                  textAlign: 'center',
                }}>
                  Slice to open
                </div>
              )}

              {/* Paste into — only shows after pack unlocked, before reveal */}
              {packPicks && !deckDealing && !cardReveal && (
                <div style={{ animation: 'fadeInUp 0.6s 0.5s ease-out both' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.18)', margin: 0, textAlign: 'center' }}>
                    Paste into <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>ChatGPT / Claude / Cursor</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CARD REVEAL PAGE — epic reveal after pack opens ═══ */}
      {cardReveal && stage === 'landing' && (() => {
        const revealCards = (packPicks || []).map(id => allGeniusCards.find(c => c.mod.id === id)).filter(Boolean);
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(10,7,22,0.55) 0%, rgba(5,3,12,0.45) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: isMobile ? '24px' : '36px',
            padding: isMobile ? '24px 16px' : '40px 20px',
            animation: 'fadeInUp 0.6s ease-out',
            overflow: 'auto',
          }}>
            {/* Title */}
            <div style={{ textAlign: 'center', animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: 'rgba(167,139,250,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Your Deck</div>
              <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: 300, color: 'white', margin: 0, letterSpacing: '-1px' }}>
                Meet your <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>geniuses</span>
              </h2>
            </div>

            {/* Cards — MTG-style frames matching the hand */}
            {(() => {
              const cardW = isMobile ? 140 : 220;
              const cardH = Math.round(cardW * 1.4);
              return (
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '10px' : '16px',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  perspective: '1200px',
                }}>
                  {revealCards.map(({ catId, mod, cat }, i) => {
                    const r = parseInt(cat.color.slice(1,3),16);
                    const g = parseInt(cat.color.slice(3,5),16);
                    const b = parseInt(cat.color.slice(5,7),16);
                    const handIconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
                    const HandIcon = CATEGORY_ICONS[handIconKey] || Star;
                    return (
                    <div key={mod.id}
                      className="hand-card"
                      style={{
                        '--hand-glow': `rgba(${r},${g},${b},0.2)`,
                        animation: `revealCardIn 0.6s ${0.15 + i * 0.15}s ease-out both`,
                        width: `${cardW}px`,
                        height: `${cardH}px`,
                        borderRadius: isMobile ? '7px' : '8px',
                        position: 'relative',
                        overflow: 'visible',
                        cursor: 'pointer',
                      }}
                      onMouseOver={(e) => {
                        if (isMobile) return;
                        e.currentTarget.style.transform = 'scale(1.12) translateY(-12px)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseOut={(e) => {
                        if (isMobile) return;
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.zIndex = '';
                      }}
                    >
                      {/* MTG-style card frame */}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden',
                        background: `linear-gradient(180deg, ${cat.color}50 0%, rgba(${r},${g},${b},0.25) 8%, rgba(22,22,30,0.98) 15%, rgba(18,18,26,0.99) 85%, rgba(${r},${g},${b},0.25) 92%, ${cat.color}50 100%)`,
                        padding: isMobile ? '2px' : '2.5px',
                      }}>
                        <div style={{
                          width: '100%', height: '100%', borderRadius: isMobile ? '4px' : '6px', overflow: 'hidden', position: 'relative',
                          background: `linear-gradient(180deg, rgba(${r},${g},${b},0.08) 0%, rgba(10,10,16,0.99) 100%)`,
                          display: 'flex', flexDirection: 'column',
                        }}>
                          {/* === NAME BANNER === */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '5px 7px 4px' : '6px 9px 5px',
                            background: `linear-gradient(180deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.06) 100%)`,
                            borderBottom: `1px solid rgba(${r},${g},${b},0.15)`,
                            minHeight: 0,
                          }}>
                            <div style={{
                              fontSize: isMobile ? '10px' : '12px', fontWeight: 800, color: 'rgba(255,255,255,0.92)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              flex: 1, letterSpacing: '-0.2px', textTransform: 'uppercase',
                              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                            }}>{mod.name}</div>
                            <div style={{
                              fontSize: isMobile ? '10px' : '11px', fontWeight: 900, color: cat.color,
                              fontFamily: 'ui-monospace, monospace', lineHeight: 1, flexShrink: 0, marginLeft: '4px',
                              textShadow: `0 0 6px rgba(${r},${g},${b},0.5)`,
                            }}>{mod.power}</div>
                          </div>

                          {/* === ART BOX === */}
                          <div style={{
                            flex: '1 1 auto', position: 'relative',
                            margin: isMobile ? '3px 4px' : '3px 5px',
                            borderRadius: '3px',
                            background: `radial-gradient(ellipse at 50% 40%, rgba(${r},${g},${b},0.15) 0%, rgba(${r},${g},${b},0.04) 50%, rgba(8,8,14,0.95) 100%)`,
                            border: `1px solid rgba(${r},${g},${b},0.1)`,
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.3, background: `radial-gradient(circle at 30% 20%, rgba(${r},${g},${b},0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(${r},${g},${b},0.1) 0%, transparent 40%)`, pointerEvents: 'none' }} />
                            <div style={{
                              filter: `drop-shadow(0 0 ${isMobile ? '8px' : '14px'} rgba(${r},${g},${b},0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
                              position: 'relative', zIndex: 1,
                            }}>
                              <CardIcon icon={HandIcon} size={isMobile ? 34 : 46} color={cat.color} />
                            </div>
                          </div>

                          {/* === TYPE LINE === */}
                          <div style={{
                            padding: isMobile ? '3px 7px' : '3px 9px',
                            background: `linear-gradient(180deg, rgba(${r},${g},${b},0.1) 0%, rgba(${r},${g},${b},0.04) 100%)`,
                            borderTop: `1px solid rgba(${r},${g},${b},0.1)`,
                            borderBottom: `1px solid rgba(${r},${g},${b},0.1)`,
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            <CardIcon icon={HandIcon} size={isMobile ? 9 : 11} color={cat.color} />
                            <div style={{
                              fontSize: isMobile ? '7.5px' : '9px', fontWeight: 600, color: `rgba(${r},${g},${b},0.68)`,
                              letterSpacing: '0.3px', textTransform: 'uppercase',
                            }}>{cat.name || (catId === 'custom' ? (mod._source === 'wikipedia' ? 'Discovered' : 'Custom') : catId)}</div>
                          </div>

                          {/* === TEXT BOX — specs === */}
                          <div style={{
                            padding: isMobile ? '5px 7px 6px' : '5px 9px 7px',
                            flex: '0 0 auto', minHeight: isMobile ? '28px' : '36px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '2px',
                          }}>
                            <div className="hand-card-specs" style={{
                              fontSize: isMobile ? '8px' : '9.5px', color: 'rgba(255,255,255,0.64)',
                              lineHeight: 1.3, overflow: 'hidden',
                              display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical',
                            }}>{mod.specs}</div>
                          </div>

                          {/* Foil shimmer overlay */}
                          <div className="hand-card-foil" style={{
                            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
                            background: `linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.06) 42%, rgba(${r},${g},${b},0.08) 50%, rgba(255,255,255,0.04) 58%, transparent 75%)`,
                            backgroundSize: '200% 200%', backgroundPosition: '-100% -100%',
                            opacity: 0, transition: 'opacity 0.2s ease',
                          }} />
                        </div>
                      </div>
                      {/* Card drop shadow */}
                      <div style={{
                        position: 'absolute', inset: '2px', top: '4px', borderRadius: 'inherit',
                        background: 'transparent', pointerEvents: 'none', zIndex: -1,
                        boxShadow: `0 4px 10px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.35), 0 0 20px rgba(${r},${g},${b},0.1)`,
                      }} />
                    </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* FUSE button — skip building, go straight to fusion */}
            <button
              onClick={() => {
                // Auto-select these geniuses and fuse immediately
                const newSelected = {};
                revealCards.forEach(({ catId, mod }) => {
                  if (!newSelected[catId]) newSelected[catId] = [];
                  newSelected[catId].push(mod);
                });
                setSelectedModules(newSelected);
                setCardReveal(false);
                setDeckDealt(true);
                setStage('building');
                // Pass modules directly — React state isn't committed yet
                setTimeout(() => generatePrompt(newSelected), 50);
              }}
              className="fuse-btn"
              style={{
                padding: isMobile ? '14px 44px' : '16px 56px',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 800,
                color: 'white',
                background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #8b5cf6 100%)',
                backgroundSize: '200% 200%',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(147,51,234,0.3), 0 0 40px rgba(236,72,153,0.15)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                animation: 'fadeInUp 0.6s 0.6s ease-out both',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.08)'; e.target.style.boxShadow = '0 6px 32px rgba(147,51,234,0.4), 0 0 60px rgba(236,72,153,0.25)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 24px rgba(147,51,234,0.3), 0 0 40px rgba(236,72,153,0.15)'; }}
            >
              Fuse 🧬
            </button>
            <button
              onClick={() => {
                const newSelected = {};
                revealCards.forEach(({ catId, mod }) => {
                  if (!newSelected[catId]) newSelected[catId] = [];
                  newSelected[catId].push(mod);
                });
                setSelectedModules(newSelected);
                setCardReveal(false);
                setDeckDealt(true);
                setStage('building');
              }}
              style={{
                marginTop: '8px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.3)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                cursor: 'pointer',
                animation: 'fadeInUp 0.6s 0.8s ease-out both',
              }}
            >
              Customize deck first
            </button>
          </div>
        );
      })()}

      {/* BUILDING — always rendered, landing overlays on top */}
      {(stage === 'building' || stage === 'landing') && (
        <div ref={buildingViewRef} style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1, opacity: stage === 'landing' ? 0 : 1, pointerEvents: stage === 'landing' ? 'none' : undefined }}>

          {/* LEFT SIDEBAR — SQUAD LIBRARY */}
          {!isMobile && (
            <div style={{
              position: 'fixed', left: 0, top: 0, bottom: 0,
              width: squadSidebarOpen ? '220px' : '44px',
              background: 'rgba(10,10,14,0.85)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
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
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: 'rgba(10,10,14,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px', overflowY: 'auto', fontFamily: 'ui-monospace, monospace' }}>
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
          <div style={{ flex: 1, padding: isMobile ? '12px' : '18px 22px', paddingLeft: !isMobile ? (squadSidebarOpen ? '240px' : '62px') : '12px', paddingRight: isMobile ? '12px' : '22px', paddingBottom: moduleCount > 0 ? (isMobile ? '160px' : '180px') : (isMobile ? '60px' : '18px'), transition: 'padding 0.2s' }}>

            {/* Trial mode banner — nudge to fuse */}
            {trialMode && !isPro && stage === 'building' && !fusePhase && moduleCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '10px' : '14px',
                padding: isMobile ? '12px 14px' : '14px 20px',
                marginBottom: isMobile ? '12px' : '16px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.05))',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: '14px',
                animation: 'fadeInUp 0.5s 0.8s ease-out both',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                    Your pack is ready to fuse
                  </div>
                  <div style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {moduleCount} geniuses selected for "{userIntent}" — see what they create together
                  </div>
                </div>
                <button onClick={generatePrompt}
                  style={{
                    padding: isMobile ? '10px 18px' : '10px 24px',
                    fontSize: isMobile ? '13px' : '14px', fontWeight: 800,
                    background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                    border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>
                  Fuse
                </button>
              </div>
            )}

            {/* Header: Mission + Search */}
            <div style={{ marginBottom: isMobile ? '14px' : '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(139,92,246,0.5)', textTransform: 'uppercase', letterSpacing: '3px' }}>MISSION</div>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }} />
                    {moduleCount > 0 && (
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                        {moduleCount} selected {'\u00B7'} {totalPower} pw
                      </div>
                    )}
                  </div>
                  {editingMission ? (
                    <input
                      ref={missionInputRef}
                      type="text"
                      value={missionDraft}
                      onChange={(e) => setMissionDraft(e.target.value)}
                      onBlur={commitMissionEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitMissionEdit();
                        if (e.key === 'Escape') {
                          setMissionDraft(userIntent);
                          setEditingMission(false);
                        }
                      }}
                      style={{ width: '100%', margin: 0, padding: isMobile ? '0 0 2px' : '0 0 3px', fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <h1 onClick={() => setEditingMission(true)}
                      style={{ margin: 0, fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', cursor: 'text', borderBottom: '1px solid transparent', transition: 'border-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                      {userIntent}
                    </h1>
                  )}
                  <div style={{ marginTop: '8px', height: '2px', width: isMobile ? '40px' : '60px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: '2px' }} />
                </div>
                <div style={{ position: 'relative', flex: '0 0 auto', width: isMobile ? '100%' : '260px', marginTop: isMobile ? '8px' : '12px' }}>
                  {isMobile ? (
                    <button onClick={() => { setShowCustomForm(true); sounds.click(); }}
                      style={{ width: '100%', padding: '10px 12px 10px 32px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                      Search geniuses or anyone...
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', display: 'flex' }}><Search size={13} strokeWidth={2} /></span>
                    </button>
                  ) : (
                    <>
                      <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchWikipedia(e.target.value); }}
                        placeholder="Search geniuses or anyone..."
                        className="glow-input"
                        style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', display: 'flex' }}><Search size={13} strokeWidth={2} /></span>
                    </>
                  )}

                  {/* Wikipedia Discovery Dropdown — desktop only */}
                  {!isMobile && (wikiResults.length > 0 || wikiSearching) && searchQuery.trim() && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#12121a', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '10px', overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#14b8a6', letterSpacing: '0.5px' }}>From Wikipedia</span>
                        {!isPro && <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(20,184,166,0.12)', borderRadius: '8px', color: '#14b8a6' }}>{wikiGeniusCount}/{FREE_WIKI_LIMIT} free</span>}
                      </div>
                      {wikiSearching && (
                        <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #14b8a6, #06b6d4, #14b8a6)', backgroundSize: '200% 100%', animation: 'loading 1.5s ease-in-out infinite alternate' }} />
                        </div>
                      )}
                      {wikiResults.map(r => {
                        const isAdding = wikiAdding === r.pageid;
                        const atLimit = !isPro && wikiGeniusCount >= FREE_WIKI_LIMIT;
                        return (
                          <div key={r.pageid} onClick={() => !isAdding && !atLimit && addWikiGenius(r)}
                            className="genius-item"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: atLimit ? 'default' : 'pointer', opacity: atLimit ? 0.5 : 1, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{r.title}</div>
                              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                dangerouslySetInnerHTML={{ __html: r.snippet.replace(/<[^>]+>/g, '').slice(0, 80) }} />
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); if (atLimit) { setShowUpgrade(true); } else if (!isAdding) { addWikiGenius(r); } }}
                              style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: atLimit ? 'rgba(255,255,255,0.06)' : 'rgba(20,184,166,0.15)', border: atLimit ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(20,184,166,0.3)', borderRadius: '6px', color: atLimit ? 'rgba(255,255,255,0.3)' : '#14b8a6', cursor: 'pointer', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                              {isAdding ? <span style={{ fontSize: '10px', animation: 'pulse 0.6s infinite' }}>...</span> : atLimit ? <Lock size={12} strokeWidth={2.5} /> : '+'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ marginBottom: '14px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', position: 'relative', maskImage: isMobile ? 'linear-gradient(90deg, black 85%, transparent 100%)' : 'none', WebkitMaskImage: isMobile ? 'linear-gradient(90deg, black 85%, transparent 100%)' : 'none' }}>
              <div style={{ display: 'flex', gap: isMobile ? '5px' : '6px', paddingBottom: '4px', minWidth: 'max-content', paddingRight: isMobile ? '20px' : 0 }}>
                {/* All tab */}
                <button onClick={() => setActiveCategory('all')}
                  style={{
                    padding: isMobile ? '5px 10px' : '6px 14px', fontSize: isMobile ? '10px' : '11px', fontWeight: 700, borderRadius: '20px', cursor: 'pointer',
                    background: activeCategory === 'all' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                    border: activeCategory === 'all' ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    color: activeCategory === 'all' ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                    boxShadow: activeCategory === 'all' ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  }}>
                  <span>All</span>
                  <span style={{ fontSize: '9px', padding: '1px 5px', background: activeCategory === 'all' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    {Object.values(GENIUS_CATEGORIES).reduce((sum, c) => sum + c.modules.length, 0) + customModules.length}
                  </span>
                </button>
                {CATEGORY_ORDER.map(catId => {
                  const meta = CATEGORY_META[catId];
                  if (!meta) return null;
                  const cat = GENIUS_CATEGORIES[catId];
                  const count = cat ? cat.modules.length : 0;
                  const isActive = activeCategory === catId;
                  return (
                    <button key={catId} onClick={() => setActiveCategory(catId)}
                      style={{
                        padding: isMobile ? '5px 9px' : '6px 12px', fontSize: isMobile ? '10px' : '11px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer',
                        background: isActive ? `${meta.color}20` : 'rgba(255,255,255,0.03)',
                        border: isActive ? `1px solid ${meta.color}60` : '1px solid rgba(255,255,255,0.06)',
                        color: isActive ? meta.color : 'rgba(255,255,255,0.45)',
                        boxShadow: isActive ? `0 0 12px ${meta.color}18` : 'none',
                        display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                      }}>
                      <CardIcon icon={CATEGORY_ICONS[meta.icon] || Star} size={11} color={isActive ? meta.color : 'rgba(255,255,255,0.36)'} />
                      <span>{meta.name}</span>
                      <span style={{ fontSize: '9px', padding: '1px 5px', background: isActive ? `${meta.color}20` : 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* === SUIT ROWS — glass cards on liquid === */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              padding: isMobile ? '12px 0 30px' : '20px 0 40px',
              minHeight: isMobile ? '250px' : '350px',
            }}>
            {(() => {
              const q = searchQuery.toLowerCase();
              const cats = activeCategory === 'all' ? CATEGORY_ORDER : [activeCategory];
              const visibleCats = cats.map(catId => {
                const cat = GENIUS_CATEGORIES[catId];
                if (!cat) return null;
                const mods = q ? cat.modules.filter(m => m.name.toLowerCase().includes(q) || m.specs.toLowerCase().includes(q)) : cat.modules;
                if (mods.length === 0) return null;
                return { catId, cat, mods };
              }).filter(Boolean);
              if (activeCategory === 'all' && customModules.length > 0) {
                const customMods = q ? customModules.filter(m => m.name.toLowerCase().includes(q) || m.specs.toLowerCase().includes(q)) : customModules;
                if (customMods.length > 0) visibleCats.push({ catId: 'custom', cat: { icon: 'custom', name: 'Custom', color: CUSTOM_GENIUS_COLOR, modules: customMods }, mods: customMods });
              }

              if (visibleCats.length === 0) return (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>🔍</div>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px 0' }}>No geniuses match "{searchQuery || activeCategory}"</p>
                  <button onClick={() => { setShowCustomForm(true); if (searchQuery) { setCustomDraft(d => ({ ...d, name: searchQuery })); setSearchQuery(''); } }}
                    style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 500, background: 'linear-gradient(135deg, #ffd56a, #ffbf5a)', border: 'none', borderRadius: '8px', color: 'black', cursor: 'pointer' }}>
                    + Create custom genius
                  </button>
                </div>
              );

              const isSingleSuit = activeCategory !== 'all';
              let globalIdx = 0;

              // Single suit filter → full grid spread
              if (isSingleSuit && visibleCats.length === 1) {
                const { catId, cat, mods } = visibleCats[0];
                const selCount = (selectedModules[catId] || []).length;
                return (
                  <div>
                    {/* Suit header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', marginBottom: '12px',
                      background: `linear-gradient(135deg, ${cat.color}10, transparent)`,
                      borderRadius: '8px',
                    }}>
                      <span style={{ filter: `drop-shadow(0 0 4px ${cat.color}40)` }}>
                        <CardIcon icon={CATEGORY_ICONS[cat.icon] || Star} size={18} color={cat.color} />
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: cat.color, letterSpacing: '0.5px' }}>{cat.name}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>{selCount}/{mods.length}</span>
                      <div style={{ flex: 1 }} />
                      <div style={{ width: '60px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(selCount / mods.length) * 100}%`, background: cat.color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                    {/* Full spread grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                      gap: isMobile ? '10px' : '14px',
                      justifyItems: 'center',
                      padding: '0 12px',
                    }}>
                      {mods.map(mod => renderGlassCard({ catId, mod, cat }, globalIdx++, { large: true }))}
                    </div>
                  </div>
                );
              }

              // All suits → column grid (mahjong tiles)
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
                  gap: isMobile ? '10px' : '14px',
                  overflowX: 'visible',
                  padding: '0 4px',
                }}>
                  {visibleCats.map(({ catId, cat, mods }) => {
                    const selCount = (selectedModules[catId] || []).length;
                    return (
                      <div key={catId} style={{ minWidth: 0, overflow: 'visible' }}>
                        {/* Column header */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 4px', marginBottom: '6px',
                          borderBottom: `1px solid ${cat.color}20`,
                        }}>
                          <span style={{ filter: `drop-shadow(0 0 3px ${cat.color}30)` }}>
                            <CardIcon icon={CATEGORY_ICONS[cat.icon] || Star} size={12} color={cat.color} />
                          </span>
                          <span style={{ fontSize: '8px', fontWeight: 800, color: cat.color, letterSpacing: '0.3px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}>{selCount}/{mods.length}</span>
                        </div>
                        {/* Tile row — horizontal scroll on mobile, grid on desktop */}
                        <div className={isMobile ? 'tile-scroll' : undefined} style={isMobile ? {
                          display: 'flex', gap: '6px', overflowX: 'auto', overflowY: 'hidden',
                          paddingBottom: '4px', scrollbarWidth: 'none',
                          WebkitOverflowScrolling: 'touch',
                        } : {
                          display: 'grid',
                          gridTemplateColumns: `repeat(auto-fill, minmax(86px, 1fr))`,
                          gap: '7px',
                        }}>
                          {mods.map(mod => renderGlassCard({ catId, mod, cat }, globalIdx++))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Miyamoto-style enlarged card inspect — tap card → it presents itself */}
            {inspectedCard && (() => {
              const { catId, mod, cat } = inspectedCard;
              const hColor = cat.color;
              const hr = parseInt(hColor.slice(1,3),16);
              const hg = parseInt(hColor.slice(3,5),16);
              const hb = parseInt(hColor.slice(5,7),16);
              const inDeck = isSelected(catId, mod.id);
              const iconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
              const IconComp = CATEGORY_ICONS[iconKey] || Star;
              const keyQuote = extractKeyQuotes(mod.prompt);
              return (
                <div
                  onClick={(e) => { if (e.target === e.currentTarget) setInspectedCard(null); }}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 600,
                    background: 'rgba(4,4,8,0.75)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeInUp 0.15s ease-out',
                    padding: isMobile ? '20px' : '40px',
                  }}
                >
                  <div
                    ref={inspectedCardRef}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: isMobile ? '260px' : '300px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: `linear-gradient(180deg, ${hColor}50 0%, rgba(${hr},${hg},${hb},0.2) 4%, rgba(18,18,26,0.99) 10%, rgba(14,14,22,0.99) 90%, rgba(${hr},${hg},${hb},0.2) 96%, ${hColor}50 100%)`,
                      padding: '1.5px',
                      boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(${hr},${hg},${hb},0.15), 0 0 120px rgba(${hr},${hg},${hb},0.06)`,
                      animation: 'cardInspectIn 0.2s cubic-bezier(0.34, 1.4, 0.64, 1)',
                    }}
                  >
                    <div style={{
                      width: '100%', borderRadius: '13px', overflow: 'hidden',
                      background: 'rgba(10,10,16,0.98)',
                      display: 'flex', flexDirection: 'column',
                    }}>
                      {/* Name banner */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px 8px',
                        background: `linear-gradient(180deg, rgba(${hr},${hg},${hb},0.2) 0%, rgba(${hr},${hg},${hb},0.06) 100%)`,
                        borderBottom: `1px solid rgba(${hr},${hg},${hb},0.15)`,
                      }}>
                        <div style={{
                          fontSize: '15px', fontWeight: 800, color: 'white',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1, letterSpacing: '-0.3px', textTransform: 'uppercase',
                          textShadow: `0 0 12px ${hColor}60`,
                        }}>{mod.name}</div>
                        <div style={{
                          fontSize: '13px', fontWeight: 900, color: 'white',
                          fontFamily: 'ui-monospace, monospace', lineHeight: 1, flexShrink: 0, marginLeft: '8px',
                          background: hColor, padding: '3px 8px', borderRadius: '6px',
                          boxShadow: `0 0 10px ${hColor}60`,
                        }}>{mod.power}</div>
                      </div>

                      {/* Art box */}
                      <div style={{
                        position: 'relative', height: isMobile ? '120px' : '140px',
                        margin: '6px 10px',
                        borderRadius: '8px',
                        background: `radial-gradient(ellipse at 50% 40%, rgba(${hr},${hg},${hb},0.18) 0%, rgba(${hr},${hg},${hb},0.03) 50%, rgba(8,8,14,0.95) 100%)`,
                        border: `1px solid rgba(${hr},${hg},${hb},0.12)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: `radial-gradient(circle at 30% 25%, rgba(${hr},${hg},${hb},0.25) 0%, transparent 50%), radial-gradient(circle at 70% 75%, rgba(${hr},${hg},${hb},0.12) 0%, transparent 40%)`, pointerEvents: 'none' }} />
                        <div style={{
                          position: 'relative', zIndex: 1,
                          filter: `drop-shadow(0 0 16px ${hColor}70) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
                        }}>
                          <CardIcon icon={IconComp} size={48} color="white" />
                        </div>
                        {inDeck && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: hColor, border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: `0 0 12px ${hColor}60` }}>
                            <Check size={10} color="white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Type line */}
                      <div style={{
                        padding: '4px 14px',
                        background: `linear-gradient(180deg, rgba(${hr},${hg},${hb},0.06) 0%, rgba(${hr},${hg},${hb},0.02) 100%)`,
                        borderTop: `1px solid rgba(${hr},${hg},${hb},0.06)`,
                        borderBottom: `1px solid rgba(${hr},${hg},${hb},0.06)`,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <CardIcon icon={IconComp} size={10} color={hColor} />
                        <div style={{ fontSize: '9px', fontWeight: 700, color: hColor, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.7 }}>{cat.name}</div>
                      </div>

                      {/* Specs */}
                      <div style={{ padding: '8px 14px 4px' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{mod.specs}</div>
                      </div>

                      {/* Key quotes — flavor text */}
                      {keyQuote && (
                        <div style={{ padding: '4px 14px 8px' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4, fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                            {keyQuote}
                          </div>
                        </div>
                      )}

                      {/* Action button */}
                      <div style={{ padding: '6px 14px 14px' }}>
                        <button
                          onClick={() => {
                            toggleModule(catId, mod);
                            if (!inDeck) {
                              lastSelectedCardRef.current = document.querySelector(`[data-genius="${mod.id}"]`);
                            }
                            // Don't dismiss — let them see the state change
                          }}
                          style={{
                            width: '100%', padding: '10px 16px',
                            fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px',
                            border: inDeck ? `1px solid rgba(${hr},${hg},${hb},0.3)` : 'none',
                            borderRadius: '8px', cursor: 'pointer',
                            background: inDeck
                              ? 'transparent'
                              : `linear-gradient(135deg, ${hColor}, ${hColor}cc)`,
                            color: inDeck ? hColor : 'white',
                            boxShadow: inDeck ? 'none' : `0 4px 20px ${hColor}40`,
                            transition: 'all 0.15s ease',
                            textTransform: 'uppercase',
                          }}
                        >
                          {inDeck ? 'Remove from deck' : 'Add to deck'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            </div>

            {/* ═══════════════════════════════════════════
                 ADD GENIUS LIGHTBOX — Spotlight-style search
                 ═══════════════════════════════════════════ */}
            {showCustomForm && (
              <div onClick={(e) => { if (e.target === e.currentTarget) { setShowCustomForm(false); setCustomDraft({ name: '', specs: '', prompt: '' }); setLoreError(''); } }}
                style={{ position: 'fixed', inset: 0, zIndex: 800, background: isMobile ? 'rgba(6,6,10,0.6)' : 'rgba(6,6,10,0.85)', backdropFilter: isMobile ? 'blur(12px)' : 'blur(20px)', WebkitBackdropFilter: isMobile ? 'blur(12px)' : 'blur(20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: isMobile ? '80px 16px 0' : '120px 24px 40px', animation: 'fadeInUp 0.2s ease-out' }}>
                <div style={{ width: '100%', maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                  {/* Search input */}
                  <div style={{ position: 'relative', marginBottom: '4px' }}>
                    <input
                      type="text"
                      value={customDraft.name}
                      onChange={(e) => { setCustomDraft(d => ({ ...d, name: e.target.value })); searchWikipedia(e.target.value); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setShowCustomForm(false); setCustomDraft({ name: '', specs: '', prompt: '' }); setLoreError(''); }
                        if (e.key === 'Enter' && customDraft.name.trim()) {
                          // If there's a matching database genius, add it
                          const q = customDraft.name.trim().toLowerCase();
                          const dbMatch = Object.entries(GENIUS_CATEGORIES).flatMap(([catId, cat]) =>
                            cat.modules.filter(m => m.name.toLowerCase() === q).map(m => ({ catId, mod: m }))
                          )[0];
                          if (dbMatch) { toggleModule(dbMatch.catId, dbMatch.mod); setShowCustomForm(false); setCustomDraft({ name: '', specs: '', prompt: '' }); }
                          else generateLore();
                        }
                      }}
                      autoFocus
                      placeholder="Search anyone..."
                      style={{
                        width: '100%', padding: isMobile ? '16px 16px 16px 44px' : '18px 20px 18px 48px',
                        fontSize: isMobile ? '16px' : '18px', fontWeight: 500,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        borderRadius: '16px', color: 'white', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.1)',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 30px rgba(139,92,246,0.1)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.1)'; }}
                    />
                    <span style={{ position: 'absolute', left: isMobile ? '14px' : '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'rgba(139,92,246,0.5)', pointerEvents: 'none' }}>+</span>
                    {customDraft.name && (
                      <button onClick={() => { setCustomDraft({ name: '', specs: '', prompt: '' }); setWikiResults([]); setLoreError(''); }}
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                    )}
                  </div>

                  {/* AI generating indicator */}
                  {isGeneratingLore && (
                    <div style={{ height: '2px', margin: '0 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)', backgroundSize: '200% 100%', animation: 'loading 1.5s ease-in-out infinite alternate', borderRadius: '2px' }} />
                    </div>
                  )}
                  {loreError && (
                    <p style={{ margin: '6px 16px 0', fontSize: '12px', color: '#ef4444', lineHeight: 1.3 }}>{loreError}</p>
                  )}

                  {/* Results panel */}
                  {customDraft.name.trim().length >= 1 && (
                    <div style={{
                      marginTop: '8px', background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px', overflow: 'hidden', maxHeight: isMobile ? '40vh' : '400px', overflowY: 'auto',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                      {/* Database matches */}
                      {(() => {
                        const q = customDraft.name.trim().toLowerCase();
                        const matches = Object.entries(GENIUS_CATEGORIES).flatMap(([catId, cat]) =>
                          cat.modules.filter(m => m.name.toLowerCase().includes(q) || m.specs.toLowerCase().includes(q))
                            .map(m => ({ catId, mod: m, cat }))
                        );
                        const customMatches = customModules.filter(m => m.name.toLowerCase().includes(q));
                        if (matches.length === 0 && customMatches.length === 0) return null;
                        return (
                          <>
                            <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(139,92,246,0.5)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Geniuses</div>
                            {matches.slice(0, 6).map(({ catId, mod, cat }) => {
                              const sel = isSelected(catId, mod.id);
                              return (
                                <div key={mod.id}
                                  onClick={() => { toggleModule(catId, mod); if (!sel) { sounds.select(); } }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    background: sel ? `rgba(${parseInt(cat.color.slice(1,3),16)},${parseInt(cat.color.slice(3,5),16)},${parseInt(cat.color.slice(5,7),16)},0.08)` : 'transparent',
                                    transition: 'background 0.1s ease',
                                  }}
                                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                    background: `linear-gradient(135deg, ${cat.color}25, rgba(20,20,28,0.9))`,
                                    border: `1px solid ${cat.color}${sel ? '60' : '30'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <CardIcon icon={CATEGORY_ICONS[cat.icon] || Star} size={14} color={cat.color} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: sel ? 'white' : 'rgba(255,255,255,0.85)' }}>{mod.name}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.specs}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: cat.color, opacity: 0.6 }}>{mod.power}</span>
                                    {sel ? (
                                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `${cat.color}30`, border: `1px solid ${cat.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: cat.color }}>✓</div>
                                    ) : (
                                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>+</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {customMatches.slice(0, 3).map(mod => {
                              const sel = isSelected('custom', mod.id);
                              return (
                                <div key={mod.id}
                                  onClick={() => { toggleModule('custom', mod); if (!sel) sounds.select(); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.1s' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CardIcon icon={mod._source === 'wikipedia' ? Globe : Star} size={14} color={CUSTOM_GENIUS_COLOR} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{mod.name}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.specs}</div>
                                  </div>
                                  {sel ? (
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(219,228,255,0.16)', border: '1px solid rgba(219,228,255,0.34)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: CUSTOM_GENIUS_COLOR }}>✓</div>
                                  ) : (
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>+</div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}

                      {/* Wikipedia results */}
                      {(wikiResults.length > 0 || wikiSearching) && (
                        <>
                          <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, color: 'rgba(20,184,166,0.5)', letterSpacing: '0.5px', textTransform: 'uppercase', borderTop: '1px solid rgba(255,255,255,0.04)' }}>Discover from Wikipedia</div>
                          {wikiSearching && (
                            <div style={{ height: '2px', margin: '0 14px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden', borderRadius: '2px' }}>
                              <div style={{ height: '100%', background: 'linear-gradient(90deg, #14b8a6, #06b6d4, #14b8a6)', backgroundSize: '200% 100%', animation: 'loading 1.5s ease-in-out infinite alternate' }} />
                            </div>
                          )}
                          {wikiResults.map(r => {
                            const isAdding = wikiAdding === r.pageid;
                            return (
                              <div key={r.pageid}
                                onClick={() => !isAdding && addWikiGenius(r)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.1s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#14b8a6' }}>W</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.title}</div>
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    dangerouslySetInnerHTML={{ __html: r.snippet.replace(/<[^>]+>/g, '').slice(0, 80) }} />
                                </div>
                                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: isAdding ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isAdding ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isAdding ? '10px' : '13px', color: isAdding ? '#14b8a6' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                                  {isAdding ? '...' : '+'}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Create custom option — always at bottom */}
                      {customDraft.name.trim().length >= 2 && (
                        <div
                          onClick={() => {
                            if (isGeneratingLore) return;
                            if (customDraft.specs || customDraft.prompt) {
                              addCustomModule();
                            } else {
                              generateLore();
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(139,92,246,0.04)', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.04)'; }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#a78bfa' }}>+</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                              {customDraft.specs ? `Add "${customDraft.name.trim()}"` : `Create "${customDraft.name.trim()}" with AI`}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.5)' }}>
                              {customDraft.specs || 'AI will generate their expertise and lore'}
                            </div>
                          </div>
                          {isGeneratingLore && <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.5)', animation: 'pulse 0.6s infinite' }}>Generating...</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hint */}
                  {!customDraft.name.trim() && (
                    <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                      Type a name to search geniuses or discover anyone from Wikipedia
                    </div>
                  )}

                  {/* Keyboard hint */}
                  <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.12)' }}>
                    esc to close
                  </div>
                </div>
              </div>
            )}
            {/* Old results page removed — results now render inside the fusion overlay with living helix */}

            {/* ═══ POST-COPY UPGRADE TAKEOVER — peak dopamine moment ═══ */}
            {showPostCopyUpgrade && trialMode && !isPro && (
              <div
                onClick={() => setShowPostCopyUpgrade(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 950,
                  background: 'rgba(4,4,8,0.88)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: isMobile ? '20px' : '24px',
                  animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1.2, 0.36, 1)',
                }}>
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: 'relative', maxWidth: '400px', width: '100%',
                  borderRadius: '24px', overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(18,18,30,0.98), rgba(8,8,14,0.99))',
                  border: '1px solid rgba(139,92,246,0.15)',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
                }}>
                  {/* Close */}
                  <button onClick={() => setShowPostCopyUpgrade(false)} style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>×</button>

                  {/* Success confirmation */}
                  <div style={{ padding: isMobile ? '32px 24px 8px' : '36px 32px 8px', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Check size={22} strokeWidth={3} style={{ color: '#22c55e' }} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(34,197,94,0.8)', marginBottom: '20px' }}>Prompt copied — go build something great</div>
                  </div>

                  {/* The pitch */}
                  <div style={{ padding: isMobile ? '0 24px 28px' : '0 32px 32px', textAlign: 'center' }}>
                    <div style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '8px' }}>
                      That was {moduleCount} minds.<br />
                      <span style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Imagine all 50+.</span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: '0 auto 20px', maxWidth: '300px' }}>
                      Unlimited geniuses. Custom minds. Save decks. Ship 10x faster.
                    </p>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontWeight: 600 }}>$24/mo</span>
                      <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: 'white', lineHeight: 1 }}>$12<span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>/mo</span></span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.6)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '18px' }}>Launch price — locked in forever</div>

                    <a href={isCheckoutReady ? monthlyCheckoutUrl : undefined}
                      onClick={() => { if (isCheckoutReady) track('Upgrade Click PostCopy', { plan: 'monthly' }); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                        padding: '16px 18px', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em',
                        background: isCheckoutReady ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6366f1 100%)' : 'rgba(99,102,241,0.3)',
                        border: 'none', borderRadius: '14px', color: 'white', cursor: isCheckoutReady ? 'pointer' : 'not-allowed',
                        textDecoration: 'none',
                        boxShadow: isCheckoutReady ? '0 12px 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => { if (isCheckoutReady) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'; }}}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isCheckoutReady ? '0 12px 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none'; }}>
                      Unlock All Geniuses
                    </a>

                    <button onClick={() => setShowPostCopyUpgrade(false)}
                      style={{ display: 'block', width: '100%', marginTop: '10px', padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '12px' }}>
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM HAND — fanned cards + action bar (all screens) */}
          {moduleCount > 0 && (
            <>
              {/* Expanded drawer overlay */}
              {mobileCartOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileCartOpen(false)}>
                  <div onClick={(e) => e.stopPropagation()}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '55vh', background: '#0c0c10', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px 16px 0 0', padding: '16px 16px 90px', overflowY: 'auto' }}>
                    <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 12px' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Your Squad</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isPro && <span style={{ fontSize: '9px', padding: '2px 7px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', borderRadius: '8px', fontWeight: 700 }}>PRO</span>}
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>⚡{totalPower}</span>
                      </div>
                    </div>
                    {/* Guidance */}
                    <div style={{ marginBottom: '10px', padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                      background: moduleCount <= 2 ? 'rgba(255,255,255,0.04)' : moduleCount <= 5 ? 'rgba(34,197,94,0.1)' : moduleCount <= 8 ? 'rgba(59,130,246,0.1)' : 'rgba(249,115,22,0.1)',
                      color: moduleCount <= 2 ? 'rgba(255,255,255,0.35)' : moduleCount <= 5 ? '#22c55e' : moduleCount <= 8 ? '#3b82f6' : '#f97316',
                      border: `1px solid ${moduleCount <= 2 ? 'rgba(255,255,255,0.06)' : moduleCount <= 5 ? 'rgba(34,197,94,0.2)' : moduleCount <= 8 ? 'rgba(59,130,246,0.2)' : 'rgba(249,115,22,0.2)'}`,
                    }}>
                      {moduleCount <= 2 ? 'Getting started...' : moduleCount <= 5 ? 'Sweet spot!' : moduleCount <= 8 ? 'Strong squad' : 'Getting crowded...'}
                    </div>
                    {/* Cards in drawer */}
                    {Object.entries(selectedModules).map(([catId, mods]) => {
                      const cat = GENIUS_CATEGORIES[catId] || { color: catId === 'custom' ? CUSTOM_GENIUS_COLOR : DISCOVERED_GENIUS_COLOR, icon: 'custom', name: 'Custom' };
                      return mods.map(mod => {
                        const drawerIconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
                        const DrawerIcon = CATEGORY_ICONS[drawerIconKey] || Star;
                        return (
                        <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px 8px 12px', marginBottom: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `3px solid ${cat.color}` }}>
                          <CardIcon icon={DrawerIcon} size={16} color={cat.color} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{mod.name}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.specs}</div>
                          </div>
                          <button onClick={() => toggleModule(catId, mod)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '16px', padding: '2px' }}>×</button>
                        </div>
                      );});
                    })}
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button onClick={() => { setSavingSquad(true); if (!squadSidebarOpen) setSquadSidebarOpen(true); setMobileCartOpen(false); }}
                        style={{ padding: '8px', fontSize: '11px', fontWeight: 500, background: 'none', border: '1px dashed rgba(139,92,246,0.25)', borderRadius: '6px', color: 'rgba(139,92,246,0.6)', cursor: 'pointer', width: '100%' }}>
                        💾 Save Squad
                      </button>
                      {!isPro && moduleCount >= UPGRADE_NUDGE_AT && (
                        <button onClick={() => { setMobileCartOpen(false); setShowUpgrade(true); }}
                          style={{ padding: '6px', fontSize: '11px', background: 'none', border: 'none', color: 'rgba(139,92,246,0.65)', cursor: 'pointer', textAlign: 'center' }}>
                          Go Pro for unlimited geniuses →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════
                   BOTTOM HAND — the emotional core
                   Premium card-game hand with framed cards
                   ═══════════════════════════════════════════ */}
              <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150, pointerEvents: 'none' }}>
                {/* Hand shelf — atmospheric glow + subtle felt-table edge */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: isMobile ? '240px' : '290px',
                  background: `linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.3) 30%, rgba(9,9,11,0.85) 70%, rgba(9,9,11,0.95) 100%)`,
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: `${Math.min(Math.max(moduleCount * 160, 380), 1200)}px`, height: isMobile ? '250px' : '240px',
                  background: `radial-gradient(ellipse 82% 72% at 50% 100%, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.04) 34%, transparent 72%)`,
                  pointerEvents: 'none', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
                {moduleCount > 0 && (
                  <>
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: isMobile ? '160px' : '160px',
                      transform: 'translateX(-50%)',
                      width: `${Math.min(Math.max(moduleCount * 110, isMobile ? 220 : 280), isMobile ? 340 : 760)}px`,
                      height: isMobile ? '18px' : '20px',
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.18) 20%, rgba(167,139,250,0.2) 50%, rgba(167,139,250,0.18) 80%, transparent 100%)',
                      opacity: focusedHandCard ? 0.6 : 0.4,
                      filter: 'blur(10px)',
                      pointerEvents: 'none',
                    }} />
                  </>
                )}

                {/* Fanned hand of cards */}
                <div style={{
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  paddingBottom: isMobile ? '56px' : '52px', perspective: '1200px',
                }}>
                  {(() => { const maxCards = isMobile ? 6 : 9; const handSlice = allSelected.slice(0, maxCards); return handSlice.map((mod, i) => {
                    const total = handSlice.length;
                    const maxSpread = isMobile ? 8 : 5.5;
                    const minSpread = isMobile ? 4 : 2.8;
                    const spread = total <= 3 ? maxSpread : Math.max(minSpread, maxSpread - (total - 3) * 0.5);
                    const rotation = (i - (total - 1) / 2) * spread;
                    const arcY = Math.pow((i - (total - 1) / 2), 2) * (isMobile ? 0.9 : 0.6);
                    const catEntry = Object.entries(selectedModules).find(([, mods]) => mods.some(m => m.id === mod.id));
                    const catId = catEntry ? catEntry[0] : 'custom';
                    const cat = GENIUS_CATEGORIES[catId] || { color: mod._source === 'wikipedia' ? DISCOVERED_GENIUS_COLOR : CUSTOM_GENIUS_COLOR, icon: 'custom' };
                    const handIconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
                    const HandIcon = CATEGORY_ICONS[handIconKey] || Star;
                    // Card size — Hearthstone-scale: big enough to read every word
                    const cardW = isMobile
                      ? (total <= 3 ? 140 : total <= 5 ? 120 : 104)
                      : (total <= 3 ? 220 : total <= 5 ? 190 : total <= 7 ? 165 : 146);
                    const cardH = Math.round(cardW * 1.4);
                    const overlap = total <= 3 ? (isMobile ? 6 : 8) : total <= 5 ? (isMobile ? -2 : -6) : total <= 7 ? (isMobile ? -10 : -18) : (isMobile ? -16 : -30);
                    const isFocused = focusedHandCard?.id === mod.id;
                    const focusedRotation = isFocused ? rotation * 0.22 : rotation;
                    const focusLift = isFocused ? (isMobile ? 30 : 42) : 0;
                    const focusScale = isFocused ? (isMobile ? 1.16 : 1.12) : 1;
                    const baseTransform = `rotate(${focusedRotation}deg) translateY(${arcY - focusLift}px) scale(${focusScale})`;
                    const r = parseInt(cat.color.slice(1,3),16);
                    const g = parseInt(cat.color.slice(3,5),16);
                    const b = parseInt(cat.color.slice(5,7),16);
                    return (
                      <div key={mod.id}
                        className="hand-card"
                        ref={(el) => {
                          if (isFocused) focusedHandCardRef.current = el;
                          else if (focusedHandCardRef.current === el) focusedHandCardRef.current = null;
                        }}
                        onClick={() => {
                          sounds.click();
                          setFocusedHandCard(prev => prev?.id === mod.id ? null : {
                            id: mod.id,
                            catId,
                            name: mod.name,
                            leftId: i > 0 ? handSlice[i - 1].id : null,
                            rightId: i < handSlice.length - 1 ? handSlice[i + 1].id : null,
                          });
                        }}
                        style={{
                          '--hand-glow': `rgba(${r},${g},${b},0.2)`,
                          width: `${cardW}px`, height: `${cardH}px`,
                          borderRadius: isMobile ? '7px' : '8px', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', flexShrink: 0, overflow: 'visible',
                          marginLeft: i === 0 ? 0 : `${overlap}px`,
                          transform: baseTransform,
                          transformOrigin: 'bottom center',
                          zIndex: isFocused ? 110 : i + 1,
                          animation: poofingCards.has(mod.id)
                            ? 'cardPoof 0.22s ease-out forwards'
                            : wobblingCards.has(mod.id)
                            ? 'neighborWobble 0.18s ease-out'
                            : undefined,
                        }}
                        onMouseOver={(e) => {
                          if (isMobile) return;
                          const card = e.currentTarget;
                          const hoverLift = isFocused ? 36 : 28;
                          const hoverScale = isFocused ? 1.18 : 1.1;
                          card.style.transform = `rotate(${focusedRotation * 0.12}deg) translateY(${arcY - focusLift - hoverLift}px) scale(${hoverScale})`;
                          card.style.zIndex = '120';
                        }}
                        onMouseOut={(e) => {
                          if (isMobile) return;
                          if (e.currentTarget.contains(e.relatedTarget)) return;
                          e.currentTarget.style.transform = baseTransform;
                          e.currentTarget.style.zIndex = `${isFocused ? 110 : i + 1}`;
                        }}>
                        {/* Remove strip — slides out below focused card */}
                        {isFocused && (
                          <button
                            className="hand-card-discard"
                            onClick={(e) => {
                              e.stopPropagation();
                              const leftId = i > 0 ? handSlice[i - 1].id : null;
                              const rightId = i < handSlice.length - 1 ? handSlice[i + 1].id : null;
                              removeHandCard(mod.id, catId, leftId, rightId);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: isMobile ? '-28px' : '-32px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: isMobile ? '64px' : '80px',
                              height: isMobile ? '22px' : '26px',
                              borderRadius: '0 0 8px 8px',
                              border: `1px solid rgba(${r},${g},${b},0.2)`,
                              borderTop: 'none',
                              background: `linear-gradient(180deg, rgba(${r},${g},${b},0.12) 0%, rgba(20,20,28,0.95) 100%)`,
                              color: `rgba(${r},${g},${b},0.7)`,
                              boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(${r},${g},${b},0.06)`,
                              zIndex: 240,
                              pointerEvents: 'auto',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: isMobile ? '8px' : '9px',
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase',
                              padding: 0,
                              animation: 'discardSlideIn 0.18s cubic-bezier(0.22, 1.2, 0.36, 1)',
                              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                            }}
                          >
                            <span style={{ fontSize: isMobile ? '10px' : '11px', lineHeight: 1, marginTop: '-1px' }}>−</span>
                            Remove
                          </button>
                        )}
                        {/* MTG-style card frame */}
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden',
                          background: `linear-gradient(180deg, ${cat.color}50 0%, rgba(${r},${g},${b},0.25) 8%, rgba(22,22,30,0.98) 15%, rgba(18,18,26,0.99) 85%, rgba(${r},${g},${b},0.25) 92%, ${cat.color}50 100%)`,
                          padding: isMobile ? '2px' : '2.5px',
                        }}>
                          <div style={{
                            width: '100%', height: '100%', borderRadius: isMobile ? '4px' : '6px', overflow: 'hidden', position: 'relative',
                            background: `linear-gradient(180deg, rgba(${r},${g},${b},0.08) 0%, rgba(10,10,16,0.99) 100%)`,
                            display: 'flex', flexDirection: 'column',
                          }}>
                            {/* === NAME BANNER — top bar like MTG === */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: isMobile ? '5px 7px 4px' : '6px 9px 5px',
                              background: `linear-gradient(180deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.06) 100%)`,
                              borderBottom: `1px solid rgba(${r},${g},${b},0.15)`,
                              minHeight: 0,
                            }}>
                              <div style={{
                                fontSize: isMobile ? '10px' : '12px', fontWeight: 800, color: 'rgba(255,255,255,0.92)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                flex: 1, letterSpacing: '-0.2px', textTransform: 'uppercase',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                              }}>{mod.name}</div>
                              <div style={{
                                fontSize: isMobile ? '10px' : '11px', fontWeight: 900, color: cat.color,
                                fontFamily: 'ui-monospace, monospace', lineHeight: 1, flexShrink: 0, marginLeft: '4px',
                                textShadow: `0 0 6px rgba(${r},${g},${b},0.5)`,
                              }}>{mod.power}</div>
                            </div>

                            {/* === ART BOX — icon with atmospheric background === */}
                            <div style={{
                              flex: '1 1 auto', position: 'relative',
                              margin: isMobile ? '3px 4px' : '3px 5px',
                              borderRadius: isMobile ? '3px' : '3px',
                              background: `radial-gradient(ellipse at 50% 40%, rgba(${r},${g},${b},0.15) 0%, rgba(${r},${g},${b},0.04) 50%, rgba(8,8,14,0.95) 100%)`,
                              border: `1px solid rgba(${r},${g},${b},0.1)`,
                              overflow: 'hidden',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {/* Atmospheric particles */}
                              <div style={{ position: 'absolute', inset: 0, opacity: 0.3, background: `radial-gradient(circle at 30% 20%, rgba(${r},${g},${b},0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(${r},${g},${b},0.1) 0%, transparent 40%)`, pointerEvents: 'none' }} />
                              <div style={{
                                filter: `drop-shadow(0 0 ${isMobile ? '8px' : '14px'} rgba(${r},${g},${b},0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
                                position: 'relative', zIndex: 1,
                              }}>
                                <CardIcon icon={HandIcon} size={isMobile ? 34 : 46} color={cat.color} />
                              </div>
                            </div>

                            {/* === TYPE LINE — category bar like MTG === */}
                            <div style={{
                              padding: isMobile ? '3px 7px' : '3px 9px',
                              background: `linear-gradient(180deg, rgba(${r},${g},${b},0.1) 0%, rgba(${r},${g},${b},0.04) 100%)`,
                              borderTop: `1px solid rgba(${r},${g},${b},0.1)`,
                              borderBottom: `1px solid rgba(${r},${g},${b},0.1)`,
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}>
                              <CardIcon icon={HandIcon} size={isMobile ? 9 : 11} color={cat.color} />
                              <div style={{
                                fontSize: isMobile ? '7.5px' : '9px', fontWeight: 600, color: `rgba(${r},${g},${b},0.68)`,
                                letterSpacing: '0.3px', textTransform: 'uppercase',
                              }}>{cat.name || (catId === 'custom' ? (mod._source === 'wikipedia' ? 'Discovered' : 'Custom') : catId)}</div>
                            </div>

                            {/* === TEXT BOX — specs/flavor like MTG === */}
                            <div style={{
                              padding: isMobile ? '5px 7px 6px' : '5px 9px 7px',
                              flex: '0 0 auto', minHeight: isMobile ? '28px' : '36px',
                              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '2px',
                            }}>
                              <div className="hand-card-specs" style={{
                                fontSize: isMobile ? '8px' : '9.5px', color: 'rgba(255,255,255,0.64)',
                                lineHeight: 1.3, overflow: 'hidden',
                                display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical',
                              }}>{mod.specs}</div>
                            </div>


                            {/* Foil shimmer overlay */}
                            <div className="hand-card-foil" style={{
                              position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
                              background: `linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.06) 42%, rgba(${r},${g},${b},0.08) 50%, rgba(255,255,255,0.04) 58%, transparent 75%)`,
                              backgroundSize: '200% 200%', backgroundPosition: '-100% -100%',
                              opacity: 0, transition: 'opacity 0.2s ease',
                            }} />
                          </div>
                        </div>
                        {/* Card drop shadow */}
                        <div style={{
                          position: 'absolute', inset: '2px', top: '4px', borderRadius: 'inherit',
                          background: 'transparent', pointerEvents: 'none', zIndex: -1,
                          boxShadow: isFocused
                            ? `0 10px 18px rgba(0,0,0,0.52), 0 18px 38px rgba(0,0,0,0.34), 0 0 28px rgba(${r},${g},${b},0.24)`
                            : `0 4px 10px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.35), 0 0 20px rgba(${r},${g},${b},0.1)`,
                        }} />
                      </div>
                    );
                  }); })()}
                  {allSelected.length > (isMobile ? 6 : 9) && (
                    <div style={{
                      width: isMobile ? '68px' : '96px', height: isMobile ? '96px' : '134px',
                      borderRadius: isMobile ? '7px' : '8px', marginLeft: '-6px', position: 'relative', zIndex: 0,
                      background: 'linear-gradient(170deg, rgba(139,92,246,0.2) 0%, rgba(14,14,20,0.95) 100%)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 0 8px rgba(139,92,246,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isMobile ? '11px' : '10px', fontWeight: 800, color: '#a78bfa',
                      pointerEvents: 'auto', cursor: 'pointer',
                    }} onClick={() => setMobileCartOpen(true)}>
                      +{allSelected.length - (isMobile ? 6 : 9)}
                    </div>
                  )}
                  {/* Add genius "+" card */}
                  <div
                    onClick={() => {
                      if (isMobile) { setShowCustomForm(true); sounds.click(); }
                      else if (searchInputRef.current) { searchInputRef.current.focus(); searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
                    }}
                    style={{
                      width: isMobile ? '68px' : '96px', height: isMobile ? '96px' : '134px',
                      borderRadius: isMobile ? '7px' : '8px', marginLeft: isMobile ? '6px' : '8px',
                      position: 'relative', zIndex: 0,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px dashed rgba(139,92,246,0.25)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      pointerEvents: 'auto', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    className="add-genius-card"
                  >
                    <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 300, color: 'rgba(139,92,246,0.4)', lineHeight: 1 }}>+</div>
                    <div style={{ fontSize: isMobile ? '7px' : '8px', fontWeight: 700, color: 'rgba(139,92,246,0.34)', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>Add<br/>Genius</div>
                  </div>
                </div>

                {/* Action bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: isMobile ? '0 12px 8px' : '0 16px 10px',
                  display: 'flex', gap: isMobile ? '6px' : '8px', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'auto',
                }}>
                  {/* Deck stats pill */}
                  <button onClick={() => setMobileCartOpen(!mobileCartOpen)}
                    style={{ padding: isMobile ? '6px 10px' : '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: isMobile ? '10px' : '11px', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: isMobile ? '5px' : '8px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{moduleCount}</span>
                    <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ color: 'rgba(139,92,246,0.7)', fontWeight: 700, fontSize: isMobile ? '11px' : '12px' }}>{totalPower}</span>
                  </button>
                  {!isMobile && (
                    <button onClick={() => { setSavingSquad(true); if (!squadSidebarOpen) setSquadSidebarOpen(true); }}
                      style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '12px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                      title="Save squad">Save</button>
                  )}
                  {/* FUSE — GLSL shader button */}
                  <button onClick={generatePrompt}
                    onMouseEnter={() => setFuseHover(true)}
                    onMouseLeave={() => setFuseHover(false)}
                    className="fuse-btn"
                    style={{
                      padding: isMobile ? '12px 22px' : '13px 32px', fontSize: isMobile ? '12px' : '14px', fontWeight: 800,
                      background: 'transparent',
                      border: `1px solid rgba(139,92,246,${0.25 + Math.min(moduleCount / 6, 1) * 0.3})`,
                      borderRadius: '12px', color: 'white', cursor: 'pointer',
                      boxShadow: `0 4px 20px rgba(139,92,246,${0.15 + Math.min(moduleCount / 6, 1) * 0.25}), 0 0 ${16 + Math.min(moduleCount / 6, 1) * 30}px rgba(139,92,246,${0.04 + Math.min(moduleCount / 6, 1) * 0.1})`,
                      letterSpacing: '0.8px', position: 'relative', overflow: 'hidden',
                      transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                      textTransform: 'uppercase',
                    }}>
                    <FuseButtonShader energy={Math.min(moduleCount / 6, 1)} hover={fuseHover} />
                    <span style={{ position: 'relative', zIndex: 2, textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 16px rgba(139,92,246,0.3)' }}>
                      Fuse {moduleCount}
                    </span>
                  </button>
                  <button onClick={() => { setStage('landing'); setTrialMode(false); setPackPicks(null); setPackIntent(''); setDeckDealt(false); setSelectedModules({}); }} style={{ padding: isMobile ? '6px 8px' : '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: isMobile ? '10px' : '11px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    {isMobile ? '←' : 'Back'}
                  </button>
                </div>
              </div>
            </>
          )}

          {moduleCount === 0 && stage === 'building' && !deckDealing && (
            <div onClick={() => { if (isMobile) { setShowCustomForm(true); sounds.click(); } else if (searchInputRef.current) { searchInputRef.current.focus(); searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }}
              style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '50px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.3s ease-out', cursor: 'pointer' }}>
              <Search size={14} color="rgba(139,92,246,0.5)" strokeWidth={2} />
              <span>Search geniuses or anyone...</span>
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', overflow: 'auto' }}
          onMouseMove={(e) => {
            const iframe = document.getElementById('result-helix');
            if (iframe?.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'mouse', x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }, '*');
            }
          }}
        >
          {/* Zen DNA Helix — living background */}
          <iframe
            id="result-helix"
            src="/zenhelix.html?minimal=1&mode=result"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', pointerEvents: 'none', zIndex: 0,
            }}
            title="DNA Helix"
          />
          {/* Vignette overlay for readability */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 20%, rgba(0,0,5,0.4) 55%, rgba(0,0,5,0.8) 100%)',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: isMobile ? '30px 16px' : '50px 20px',
            maxWidth: '720px', margin: '0 auto',
            animation: 'fadeInUp 0.5s ease-out',
          }}>
            {/* Cards row — genius cards at the top like zenhelix */}
            <div style={{
              display: 'flex', gap: isMobile ? '8px' : '12px', justifyContent: 'center', alignItems: 'center',
              marginBottom: isMobile ? '20px' : '28px',
              animation: 'fadeInUp 0.6s 0.2s ease-out both',
            }}>
              {Object.entries(selectedModules).flatMap(([catId, mods]) => {
                const cat = GENIUS_CATEGORIES[catId] || { color: catId === 'custom' && mods.some(m => m._source === 'wikipedia') ? DISCOVERED_GENIUS_COLOR : CUSTOM_GENIUS_COLOR, icon: 'custom' };
                return mods.map(mod => (
                  <div key={mod.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: isMobile ? '8px 12px' : '9px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.028)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  }}>
                    <div style={{
                      width: isMobile ? '24px' : '28px', height: isMobile ? '24px' : '28px',
                      borderRadius: '7px',
                      background: `rgba(${parseInt(cat.color.slice(1,3),16)},${parseInt(cat.color.slice(3,5),16)},${parseInt(cat.color.slice(5,7),16)},0.12)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CardIcon icon={CATEGORY_ICONS[catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon] || Star} size={isMobile ? 12 : 14} color={cat.color} />
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                        fontSize: isMobile ? '7px' : '7.5px', letterSpacing: '2.5px',
                        color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase',
                      }}>{mod.name}</div>
                    </div>
                    <div style={{
                      fontFamily: 'ui-monospace, monospace', fontSize: isMobile ? '9px' : '10px',
                      fontWeight: 300, color: cat.color, marginLeft: '3px',
                    }}>{mod.power}</div>
                  </div>
                ));
              })}
            </div>

            {/* Centre status */}
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '28px' }}>
              <h2 style={{
                margin: '0 0 6px 0', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, letterSpacing: '-0.5px',
                color: 'rgba(255,255,255,0.92)',
              }}>Your Skillclone is Ready</h2>
              <p style={{ margin: 0, fontSize: isMobile ? '12px' : '14px', color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>
                <span style={{ color: 'rgba(139,92,246,0.7)', fontWeight: 600 }}>{moduleCount}</span> minds fused • <span style={{ color: 'rgba(236,72,153,0.6)', fontWeight: 600 }}>⚡{totalPower}</span> power
              </p>
            </div>

            {/* Prompt card — glass over helix */}
            <div style={{
              position: 'relative', borderRadius: '14px', padding: '1px', marginBottom: '20px',
              background: copied
                ? 'linear-gradient(135deg, rgba(34,197,94,0.4), rgba(34,197,94,0.1))'
                : 'linear-gradient(135deg, rgba(236,72,153,0.14), rgba(139,92,246,0.2))',
            }}>
              <div style={{
                padding: isMobile ? '16px' : '20px 22px',
                background: 'rgba(6,2,18,0.65)',
                borderRadius: '13px',
                maxHeight: isMobile ? '220px' : '300px',
                overflowY: 'auto',
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                scrollbarWidth: 'none',
              }}>
                <div style={{
                  fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                  fontSize: isMobile ? '6px' : '6.5px', letterSpacing: '4px',
                  color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginBottom: '12px',
                  textTransform: 'uppercase',
                }}>YOUR FUSED PROMPT • ⚡ {totalPower}</div>
                <pre style={{
                  margin: 0, whiteSpace: 'pre-wrap',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                  fontSize: isMobile ? '9px' : '9.5px', lineHeight: 1.9,
                  color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1px',
                }}>{generatedPrompt}</pre>
              </div>
            </div>

            {/* Primary actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000); track('Copy Prompt'); }}
                style={{
                  fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                  fontSize: isMobile ? '7px' : '7.5px', letterSpacing: '3px',
                  padding: isMobile ? '10px 20px' : '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: copied ? '#22c55e' : 'linear-gradient(135deg, #9333ea, #ec4899)',
                  color: 'rgba(255,255,255,0.92)',
                  boxShadow: copied ? '0 0 18px rgba(34,197,94,0.3)' : '0 0 18px rgba(236,72,153,0.28)',
                  textTransform: 'uppercase',
                }}>
                {copied ? 'COPIED ✓' : 'COPY'}
              </button>
              <a href={`https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                  fontSize: isMobile ? '7px' : '7.5px', letterSpacing: '3px',
                  padding: isMobile ? '10px 20px' : '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10a37f, #1a7f64)',
                  color: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 18px rgba(16,163,127,0.28)',
                  textDecoration: 'none', textTransform: 'uppercase',
                }}>
                USE IN CHATGPT →
              </a>
              <a href={`https://claude.ai/new?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                  fontSize: isMobile ? '7px' : '7.5px', letterSpacing: '3px',
                  padding: isMobile ? '10px 20px' : '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #d4a27f, #c4856c)',
                  color: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 0 18px rgba(212,162,127,0.28)',
                  textDecoration: 'none', textTransform: 'uppercase',
                }}>
                USE IN CLAUDE →
              </a>
            </div>

            {/* Secondary */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I fused ${Object.values(selectedModules).flat().map(m => m.name).join(' + ')} into one AI prompt\n\n⚡${totalPower} power • ${moduleCount} minds\n\nBuild yours free → skillcl.one 🧬`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                  fontSize: isMobile ? '7px' : '7.5px', letterSpacing: '3px',
                  padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.30)', textDecoration: 'none', textTransform: 'uppercase',
                }}>
                𝕏 SHARE
              </a>
              <button onClick={() => setStage('building')} style={{
                fontFamily: 'ui-monospace, monospace', fontWeight: 300,
                fontSize: isMobile ? '7px' : '7.5px', letterSpacing: '3px',
                padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase',
              }}>← EDIT SQUAD</button>
            </div>

            <button onClick={() => { setStage('landing'); setUserIntent(''); setSelectedModules({}); setTrialMode(false); setPackPicks(null); setPackIntent(''); }}
              style={{ display: 'block', margin: '24px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '11px', fontFamily: 'ui-monospace, monospace', letterSpacing: '2px' }}>NEW CLONE</button>
          </div>
        </div>
      )}


      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes loading { 0% { width: 0; } 100% { width: 100%; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes float1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes float3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
        @keyframes meshGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes orbRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbRingReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealCardIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chainRattle {
          0% { transform: translateY(-50%) translateX(-1px) rotate(-0.3deg); }
          100% { transform: translateY(-50%) translateX(1px) rotate(0.3deg); }
        }
        @keyframes lockPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.1), inset 0 0 12px rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.25); }
          50% { box-shadow: 0 0 28px rgba(139,92,246,0.2), inset 0 0 16px rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.4); }
        }
        .pack-input-shake {
          animation: inputShakeGlow 0.5s ease-out !important;
          border-color: rgba(139,92,246,0.6) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2), 0 0 0 3px rgba(139,92,246,0.2), 0 0 20px rgba(139,92,246,0.15) !important;
        }
        @keyframes inputShakeGlow {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(1px); }
        }
        @keyframes packFoilSweep {
          0% { transform: translateX(-120%) skewX(-15deg); opacity: 0; }
          30% { opacity: 0.7; }
          100% { transform: translateX(120%) skewX(-15deg); opacity: 0; }
        }
        @keyframes packRainbowRotate {
          0% { transform: rotate(0deg) scale(1.4); }
          100% { transform: rotate(360deg) scale(1.4); }
        }
        @keyframes packSpecularDrift {
          0% { transform: translate(-30%, -20%) scale(1); opacity: 0.3; }
          50% { transform: translate(20%, 10%) scale(1.2); opacity: 0.6; }
          100% { transform: translate(-10%, 30%) scale(0.9); opacity: 0.25; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.15); }
          50% { box-shadow: 0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1); }
        }
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes orbCoreBreathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 20px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 30px rgba(167,139,250,0.7), 0 0 80px rgba(139,92,246,0.4), 0 0 140px rgba(139,92,246,0.12);
          }
        }
        @keyframes orbIris {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.06); opacity: 0.5; }
        }
        @keyframes fusionRing {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes fusionHelixStage {
          0%, 100% { transform: rotateX(10deg) rotateY(0deg) scale(1); }
          50% { transform: rotateX(15deg) rotateY(-6deg) scale(1.02); }
        }
        @keyframes fusionHelixNodeA {
          0% { transform: translate3d(calc(-50% - var(--node-span)), calc(-50% + var(--node-y)), calc(-1 * var(--node-depth))); opacity: 0.28; }
          25% { transform: translate3d(calc(-50% - 18px), calc(-50% + var(--node-y)), -18px); opacity: 0.54; }
          50% { transform: translate3d(calc(-50% + var(--node-span)), calc(-50% + var(--node-y)), var(--node-depth)) scale(1.14); opacity: 1; }
          75% { transform: translate3d(calc(-50% + 18px), calc(-50% + var(--node-y)), 14px) scale(0.95); opacity: 0.64; }
          100% { transform: translate3d(calc(-50% - var(--node-span)), calc(-50% + var(--node-y)), calc(-1 * var(--node-depth))); opacity: 0.28; }
        }
        @keyframes fusionHelixNodeB {
          0% { transform: translate3d(calc(-50% + var(--node-span)), calc(-50% + var(--node-y)), var(--node-depth)) scale(1.14); opacity: 1; }
          25% { transform: translate3d(calc(-50% + 18px), calc(-50% + var(--node-y)), 14px) scale(0.95); opacity: 0.64; }
          50% { transform: translate3d(calc(-50% - var(--node-span)), calc(-50% + var(--node-y)), calc(-1 * var(--node-depth))); opacity: 0.28; }
          75% { transform: translate3d(calc(-50% - 18px), calc(-50% + var(--node-y)), -18px); opacity: 0.54; }
          100% { transform: translate3d(calc(-50% + var(--node-span)), calc(-50% + var(--node-y)), var(--node-depth)) scale(1.14); opacity: 1; }
        }
        @keyframes fusionRungGlow {
          0%, 100% { opacity: 0.28; transform: translate(-50%, calc(-50% + var(--rung-y, 0px))) scaleX(0.92); }
          50% { opacity: 0.82; transform: translate(-50%, calc(-50% + var(--rung-y, 0px))) scaleX(1.05); }
        }
        @keyframes fusionSparkBlink {
          0%, 100% { opacity: 0.25; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes fusionCorePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes fusionFlash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes gradientBorder {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .genius-item { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .genius-item:hover { background: rgba(255,255,255,0.05) !important; transform: translateX(1px); }
        .mission-card {
          transition: transform 0.5s cubic-bezier(0.22, 1.2, 0.36, 1), background 0.35s ease, border-color 0.35s ease, box-shadow 0.5s cubic-bezier(0.22, 1, 0.36, 1) !important;
          transform-style: preserve-3d;
          will-change: transform, box-shadow;
        }
        .mission-card:hover {
          background: rgba(139,92,246,0.06) !important;
          border-color: rgba(139,92,246,0.3) !important;
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 8px 32px rgba(139,92,246,0.12), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .mission-card:active {
          transform: translateY(0px) scale(0.97);
          transition-duration: 0.1s;
        }
        .fusion-preset {
          --accent: #8b5cf6;
          transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
          will-change: transform, box-shadow;
        }
        .fusion-preset::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          background: linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 50%, rgba(236,72,153,0.04) 100%);
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .fusion-preset:hover::after { opacity: 1; }
        .fusion-preset:hover {
          background: rgba(255,255,255,0.035) !important;
          border-color: rgba(139,92,246,0.18) !important;
          box-shadow:
            0 12px 40px rgba(0,0,0,0.25),
            0 0 0 1px rgba(139,92,246,0.08),
            0 0 30px rgba(139,92,246,0.06),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .fusion-preset:active {
          transform: translateY(1px) scale(0.985) !important;
          transition: transform 0.1s ease !important;
        }
        .fusion-preset:hover .deck-cards-fan {
          transform: rotate(-2deg) scale(1.1);
        }
        .fusion-preset:hover .deck-power {
          transform: scale(1.12);
          filter: brightness(1.3);
        }
        .deck-cards-fan {
          transition: transform 0.55s cubic-bezier(0.22, 1.2, 0.36, 1);
        }
        .deck-power {
          transition: transform 0.55s cubic-bezier(0.22, 1.2, 0.36, 1), filter 0.4s ease;
        }
        .fusion-preset:hover .deck-glow {
          width: 140px !important;
          height: 140px !important;
          top: -40px !important;
          left: -30px !important;
          opacity: 2.5;
          filter: blur(4px);
        }
        .fusion-preset:hover .deck-shine {
          background-position: -50% 0 !important;
          transition: background-position 0.7s ease !important;
        }
        .fusion-preset .deck-label {
          transition: transform 0.45s cubic-bezier(0.22, 1.2, 0.36, 1), letter-spacing 0.4s ease;
        }
        .fusion-preset:hover .deck-label {
          transform: translateX(2px);
          letter-spacing: -0.1px;
        }
        .fusion-preset .deck-sub {
          transition: color 0.4s ease, transform 0.45s cubic-bezier(0.22, 1.2, 0.36, 1);
        }
        .fusion-preset:hover .deck-sub {
          color: rgba(255,255,255,0.45) !important;
          transform: translateX(2px);
        }
        .fuse-btn { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .fuse-btn:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 6px 28px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.15) !important; }
        .fuse-btn:active { transform: translateY(0) scale(0.97); }
        .fuse-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%); transform: translateX(-100%); animation: fuseShimmer 3.5s ease-in-out infinite; }
        @keyframes fuseShimmer { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
        .fusion-helix-stage { animation: fusionHelixStage 4.8s ease-in-out infinite; }
        .fusion-helix-node { transform-style: preserve-3d; will-change: transform, opacity; }
        .fusion-helix-node-a { animation: fusionHelixNodeA 2.45s linear infinite; }
        .fusion-helix-node-b { animation: fusionHelixNodeB 2.45s linear infinite; }
        .fusion-helix-rung { will-change: transform, opacity; animation: fusionRungGlow 2.45s ease-in-out infinite; }
        .fusion-spark { will-change: transform, opacity; animation: fusionSparkBlink 1.8s ease-in-out infinite; }
        .fusion-core-shell { will-change: transform; animation: fusionCorePulse 2.2s ease-in-out infinite; }
        .fusion-core-ring { animation: orbRing 7.5s linear infinite; }
        .fusion-core-ring-b { animation-direction: reverse; animation-duration: 9.5s; }
        .fusion-core-ring-c { animation-duration: 6.2s; }
        /* Hand card interactions — Miyamoto-level polish */
        .hand-card {
          transform-style: preserve-3d;
          transition: transform 0.45s cubic-bezier(0.22, 1.2, 0.36, 1), filter 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, filter;
        }
        .hand-card:hover .hand-card-specs { opacity: 1 !important; }
        .hand-card:hover {
          filter: brightness(1.12) saturate(1.08) drop-shadow(0 0 8px var(--hand-glow, rgba(139,92,246,0.15)));
        }
        .hand-card-discard:hover {
          background: linear-gradient(180deg, rgba(239,68,68,0.25) 0%, rgba(20,20,28,0.95) 100%) !important;
          color: rgba(239,68,68,0.9) !important;
          border-color: rgba(239,68,68,0.3) !important;
        }
        .hand-card-discard:active {
          transform: translateX(-50%) scale(0.95) !important;
        }
        @keyframes discardSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) scaleY(0); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scaleY(1); }
        }
        .hand-card::after {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: inherit;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
          border: 1px solid var(--hand-glow, rgba(139,92,246,0.15));
          box-shadow: 0 0 10px var(--hand-glow, rgba(139,92,246,0.1)), inset 0 0 8px var(--hand-glow, rgba(139,92,246,0.04));
          transition: opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          filter: blur(0.5px);
        }
        .hand-card:hover::after { opacity: 0.7; }
        .hand-card:active {
          transform: scale(0.95) translateY(4px) !important;
          filter: brightness(0.9) !important;
          transition: transform 0.08s ease, filter 0.08s ease !important;
        }
        .hand-card:hover .hand-card-foil { opacity: 1 !important; animation: handFoilSweep 1.8s ease-in-out infinite; }
        .add-genius-card:hover { background: rgba(139,92,246,0.08) !important; border-color: rgba(139,92,246,0.4) !important; transform: translateY(-4px); }
        @keyframes handFoilSweep { 0% { background-position: -100% -100%; } 100% { background-position: 200% 200%; } }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.06); }
        .glow-input:focus { border-color: rgba(139,92,246,0.4) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.1); }
        .btn-glow { transition: all 0.2s ease; }
        .btn-glow:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(139,92,246,0.3); }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cardInspectIn {
          from { opacity: 0; transform: scale(0.6) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        /* Deal animation handled by GSAP timeline */
        @keyframes cardCheckPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        /* Card flies from library toward hand — anticipation + arc */
        @keyframes selectFlyToHand {
          0% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; filter: brightness(1); }
          12% { transform: scale(0.92) translateY(3px) rotate(0deg); opacity: 1; filter: brightness(1); }
          40% { transform: scale(1.1) translateY(-20px) rotate(-4deg); opacity: 1; filter: brightness(1.3); }
          100% { transform: scale(0.4) translateY(50vh) rotate(8deg); opacity: 0.15; filter: brightness(1.4); }
        }
        /* Enhancement #3: Card lands into hand — spring overshoot with settle */
        @keyframes handCatchBounce {
          0% { transform: scale(0.2) translateY(-60px) rotate(-20deg); opacity: 0; filter: brightness(1.5); }
          35% { transform: scale(1.18) translateY(4px) rotate(2deg); opacity: 1; filter: brightness(1.2); }
          55% { transform: scale(0.94) translateY(-2px) rotate(-1deg); opacity: 1; filter: brightness(1.05); }
          75% { transform: scale(1.04) translateY(1px) rotate(0.5deg); opacity: 1; filter: brightness(1); }
          100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; filter: brightness(1); }
        }
        /* Reward screen — cards fan in with spring bounce */
        @keyframes rewardCardFan {
          0% { opacity: 0; filter: brightness(1.6); }
          40% { opacity: 1; filter: brightness(1.15); }
          100% { opacity: 1; filter: brightness(1); }
        }
        /* Card exits hand — scale down with slight upward drift */
        @keyframes cardPoof {
          0% { transform: scale(1) rotate(0deg) translateY(0); opacity: 1; }
          40% { transform: scale(1.08) rotate(3deg) translateY(-8px); opacity: 0.7; filter: brightness(1.2); }
          100% { transform: scale(0.3) rotate(8deg) translateY(-20px); opacity: 0; filter: brightness(1.4); }
        }
        /* Neighbors settle into new positions */
        @keyframes neighborWobble {
          0% { transform: translateX(0); }
          30% { transform: translateX(-4px); }
          60% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
        /* Enhancement #5: Sparkle burst particles (uses CSS custom props --sx, --sy) */
        @keyframes sparkle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx, 20px), var(--sy, -20px)) scale(0.3); opacity: 0; }
        }
        .genius-tile {
          transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), filter 0.18s ease, box-shadow 0.2s ease;
          transform-style: preserve-3d;
          will-change: transform, filter;
          contain: layout paint style;
        }
        .genius-tile.is-flipped {
          z-index: 50;
        }
        /* When flipped, a light bloom radiates outward */
        .genius-tile.is-flipped::after {
          opacity: 1 !important;
          animation: flipGlowPulse 1.8s ease-in-out infinite !important;
        }
        @keyframes flipGlowPulse {
          0%, 100% { box-shadow: 0 0 18px var(--tile-glow, rgba(139,92,246,0.2)), inset 0 0 18px var(--tile-glow, rgba(139,92,246,0.08)); }
          50% { box-shadow: 0 0 32px var(--tile-glow, rgba(139,92,246,0.35)), inset 0 0 24px var(--tile-glow, rgba(139,92,246,0.14)); }
        }
        .card-flipper {
          transform-style: preserve-3d;
          will-change: transform;
        }
        .card-back-face, .card-front-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .card-front-btn:hover {
          transform: scale(1.06);
          filter: brightness(1.15);
        }
        .card-front-btn:active {
          transform: scale(0.94);
        }
        /* Light-spot cursor follower */
        .genius-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.14), transparent 45%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.18s ease;
          z-index: 5;
        }
        /* Edge glow ring — blooms in on hover */
        .genius-tile::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
          border: 1.5px solid var(--tile-glow, rgba(139,92,246,0.25));
          box-shadow: 0 0 10px var(--tile-glow, rgba(139,92,246,0.1)), inset 0 0 8px var(--tile-glow, rgba(139,92,246,0.04));
          transition: opacity 0.18s ease, box-shadow 0.18s ease;
          filter: blur(0.5px);
        }
        .genius-tile:hover::before { opacity: 1; }
        .genius-tile:hover::after { opacity: 0.72; }
        .genius-tile:hover {
          z-index: 50;
          filter: brightness(1.06) saturate(1.03);
          overflow: visible;
        }
        .genius-tile:hover > .card-flipper > .card-back-face {
          box-shadow: 0 6px 18px rgba(0,0,0,0.42), 0 0 16px var(--tile-glow, rgba(139,92,246,0.14)) !important;
          transition: box-shadow 0.18s ease !important;
        }
        .genius-tile:active {
          transform: translateY(0px) scale(0.94) !important;
          filter: brightness(0.88);
          transition: transform 0.08s ease, filter 0.08s ease !important;
        }
        /* Selected card: breathing glow aura */
        .genius-tile[data-selected="true"]::after {
          opacity: 1;
          animation: selectedRingBreath 2.8s ease-in-out infinite;
        }
        @keyframes selectedRingBreath {
          0%, 100% { box-shadow: 0 0 14px var(--tile-glow, rgba(139,92,246,0.15)), inset 0 0 14px var(--tile-glow, rgba(139,92,246,0.06)); border-color: var(--tile-glow, rgba(139,92,246,0.25)); }
          50% { box-shadow: 0 0 24px var(--tile-glow, rgba(139,92,246,0.28)), inset 0 0 20px var(--tile-glow, rgba(139,92,246,0.1)); border-color: var(--tile-glow, rgba(139,92,246,0.4)); }
        }
        /* Select burst — one-shot pop */
        @keyframes selectPop {
          0% { transform: scale(0.9); filter: brightness(1.5) saturate(1.4); }
          35% { transform: scale(1.08); filter: brightness(1.2) saturate(1.15); }
          65% { transform: scale(0.97); filter: brightness(1.05) saturate(1.05); }
          100% { transform: scale(1); filter: brightness(1) saturate(1); }
        }
        .genius-tile.select-burst {
          animation: selectPop 0.5s cubic-bezier(0.22, 1.2, 0.36, 1) !important;
        }
        /* Enhancement #7: Holographic foil shimmer — smooth position sweep + hue shift */
        @keyframes cardFoilShimmer {
          0% { background-position: -200% -200%; filter: hue-rotate(0deg); }
          50% { background-position: 200% 200%; filter: hue-rotate(90deg); }
          100% { background-position: -200% -200%; filter: hue-rotate(0deg); }
        }
        @keyframes foilPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.14; }
        }
        /* ═══ LANDING DECK ANIMATIONS ═══ */
        @keyframes deckGlowBreathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes deckShadowPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50% { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
        }
        @keyframes deckHintPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.6; }
        }
        @keyframes sliceLinePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes sliceOrbSlide {
          0% { left: -4%; opacity: 0; }
          8% { opacity: 1; }
          70% { left: 104%; opacity: 1; }
          85% { left: 104%; opacity: 0; }
          100% { left: -4%; opacity: 0; }
        }
        .slice-here-line {
          transition: opacity 0.3s ease;
        }
        .landing-deck-stack.pack-unlocked:hover .slice-here-line {
          opacity: 1 !important;
        }
        .landing-deck-stack.pack-unlocked:hover .slice-here-line > div:first-child {
          background: repeating-linear-gradient(90deg, rgba(200,180,255,0.7) 0px, rgba(200,180,255,0.7) 5px, transparent 5px, transparent 11px) !important;
        }
        /* Deck fly-away handled by GSAP */
        .landing-deck-stack {
          transition: transform 0.4s cubic-bezier(0.22, 1.2, 0.36, 1);
        }
        .landing-deck-stack:hover {
          transform: translateY(-6px) scale(1.03);
        }
        .landing-deck-stack:hover .deck-top-card {
          border-color: rgba(167,139,250,0.5) !important;
          box-shadow: 0 12px 48px rgba(0,0,0,0.5), 0 0 80px rgba(139,92,246,0.15) !important;
        }
        .landing-deck-stack:hover .deck-shimmer {
          background-position: -50% 0 !important;
          transition: background-position 0.8s ease !important;
        }
        .landing-deck-stack:active {
          transform: translateY(0) scale(0.96) !important;
          transition: transform 0.1s ease !important;
        }
        .card-foil {
          animation: cardFoilShimmer 4s ease-in-out infinite;
        }
        .card-foil::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: inherit;
          animation: foilPulse 3s ease-in-out infinite;
          pointer-events: none;
        }
        .genius-tile:hover .card-foil {
          animation-duration: 2s;
        }
        /* Desktop CSS-driven hover flip — zero React re-renders */
        @media (hover: hover) and (pointer: fine) {
          .genius-tile:not(.is-large):hover > .card-flipper {
            transform: rotateY(180deg) !important;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          }
          .genius-tile:not(.is-large):not(:hover) > .card-flipper {
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        }
        .deck-scrollbar::-webkit-scrollbar { width: 3px; }
        .deck-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .tile-scroll::-webkit-scrollbar { display: none; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}
