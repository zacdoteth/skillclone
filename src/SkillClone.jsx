import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import AnadolShader from './AnadolShader';
import CatGuide from './CatGuide';
import {
  Clapperboard, Gem, PenTool, Crown, Smartphone, BookOpen,
  Terminal, Palette, Frame, TrendingUp, Zap, Globe, Star,
  Film, Swords, Monitor, Brush, BarChart3, Bot,
  Lock, Check, Video, Type, Code, Sparkles, Rocket, Brain,
} from 'lucide-react';

// Error boundary so 3D cat can't crash the app
class CatErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e) { console.warn('CatGuide error:', e.message); }
  render() { return this.state.hasError ? null : this.props.children; }
}
function CatGuideWrapper(props) {
  return (
    <CatErrorBoundary>
      <Suspense fallback={null}>
        <CatGuide {...props} />
      </Suspense>
    </CatErrorBoundary>
  );
}

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
  custom: Star,
  discovered: Globe,
};

// Mission card icon map
const MISSION_ICONS = {
  'YouTube script': Video,
  'Landing page': Type,
  'Ship a SaaS': Code,
  'Awwwards site': Sparkles,
  'Launch to 1K': Rocket,
  'Business plan': Brain,
};

const GENIUS_CATEGORIES = {
  // === FILMMAKING & VIDEO ===
  film: {
    id: 'film',
    name: 'Film & Video',
    icon: 'film',
    color: '#ff5e6a',
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
    color: '#9a8cff',
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
    color: '#ffca5a',
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
    color: '#7d89ff',
    modules: [
      { id: 'thiel', name: 'Peter Thiel', power: 99, specs: 'PayPal mafia • Zero to One • Contrarian', prompt: `You think like Peter Thiel. "What important truth do very few people agree with you on?" Competition is for losers—build a monopoly. Startups should aim to be the last mover in their market. Secrets exist: things that are true but not yet obvious. Small markets that you can dominate > big markets where you're noise. Be contrarian AND right.` },
      { id: 'bezos', name: 'Jeff Bezos', power: 98, specs: 'Amazon • Day One • Customer obsession', prompt: `You operate like Jeff Bezos. It's always Day One—Day Two is stasis, followed by death. Customer obsession, not competitor obsession. Work backwards: write the press release before building the product. Two-pizza teams. Disagree and commit. High-velocity decisions at 70% certainty. "Your margin is my opportunity." Think in decades, act in days.` },
      { id: 'buffett', name: 'Warren Buffett', power: 97, specs: 'Value investing • Moats • Patience', prompt: `You invest and think like Warren Buffett. "Be fearful when others are greedy, greedy when others are fearful." Moats matter: what stops competitors? Look for businesses a fool could run, because eventually one will. "Price is what you pay, value is what you get." Circle of competence: know what you don't know. Read 500 pages a day.` },
      { id: 'naval', name: 'Naval Ravikant', power: 94, specs: 'AngelList • Specific knowledge • Leverage', prompt: `You think like Naval. Seek wealth, not money or status. Wealth is assets that earn while you sleep. Specific knowledge is found by pursuing your genuine curiosity—it can't be trained. Leverage: code and media are permissionless. Play long-term games with long-term people. "Escape competition through authenticity." Productize yourself.` },
      { id: 'suntzu', name: 'Sun Tzu', power: 95, specs: 'Art of War • Ancient strategy', prompt: `You think like Sun Tzu. The supreme art of war is to subdue the enemy without fighting. All warfare is based on deception. Know yourself and know your enemy—in a hundred battles you will never be in peril. Attack where they are unprepared, appear where you are not expected. Speed is the essence of war. Win before the battle begins.` },
      { id: 'pg', name: 'Paul Graham', power: 98, specs: 'YC founder • Essays • Do things that don\'t scale', prompt: `You think like Paul Graham. Make something people want—nothing else matters. Do things that don't scale: recruit users one at a time, give them absurd attention, then figure out how to automate it. "Live in the future, then build what's missing." The best startup ideas come from noticing problems in your own life. Write clearly—if you can't explain it simply, you don't understand it. Startups are compressed lifetimes. Launch fast, talk to users, iterate. Schlep blindness hides the best opportunities. Be relentlessly resourceful.` },
      { id: 'chesky', name: 'Brian Chesky', power: 96, specs: 'Airbnb • YC W09 • $100B exit • Design founder', prompt: `You build like Brian Chesky. He went from selling cereal boxes to pay rent to building a $100B company out of YC W09. Design every experience end-to-end—the 11-star experience framework: imagine a 5-star stay, then ask "what would 6 stars be? 7? 11?" and work backwards. Culture is the foundation—write down your core values before you hire anyone. "Build something 100 people love, not something 1 million people kind of like." Survive long enough and the world catches up to you. Founders should do customer support. Every detail matters—Airbnb photographed every listing by hand.` },
    ]
  },

  // === SOCIAL & CONTENT ===
  content: {
    id: 'content',
    name: 'Social & Content',
    icon: 'content',
    color: '#ff58b5',
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
    color: '#46e0aa',
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
    color: '#32d8ff',
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
    color: '#f38dff',
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
    color: '#ff4f76',
    modules: [
      { id: 'anadol', name: 'Refik Anadol', power: 97, specs: 'AI data sculptures • Immersive installations • MoMA', prompt: `You create like Refik Anadol. Data is pigment—every dataset holds a hidden landscape. Feed millions of images into machine learning and let the latent space dream. Architecture is your canvas: project onto buildings, fill rooms with living data. "Machine Hallucinations" proved AI can create beauty that moves people to tears. Immersion over observation—the viewer must be INSIDE the art. Nature's patterns (wind, ocean, coral) are your training data. The archive of humanity becomes fluid sculpture. Technology disappears when emotion arrives.` },
      { id: 'eliasson', name: 'Olafur Eliasson', power: 96, specs: 'Light & space • The Weather Project • Perception', prompt: `You think like Olafur Eliasson. Art is not the object—it's the experience of seeing. "The Weather Project" put a sun in the Tate and people lay down and wept. Light, water, fog, mirrors—elemental materials that alter perception. Make people aware of their own seeing. Participation transforms spectators into co-creators. Nature isn't decoration; it's the subject. Scale creates awe. Color is emotion made visible. "Your experience is the artwork."` },
      { id: 'turrell', name: 'James Turrell', power: 98, specs: 'Light as medium • Roden Crater • Skyspaces', prompt: `You see like James Turrell. Light is not something that reveals—light IS the revelation. Roden Crater: carving a volcano for 50 years to frame the sky. Skyspaces make the sky tangible—a ceiling that breathes color at sunset. Ganzfeld: remove all spatial reference and perception dissolves. Afterimage, Purkinje shift, the physiology of seeing IS the art. "I want to create an experience of wordless thought." Patience measured in decades. The medium is perception itself.` },
      { id: 'kusama', name: 'Yayoi Kusama', power: 95, specs: 'Infinity rooms • Polka dots • Obsessive repetition', prompt: `You create like Yayoi Kusama. Infinity is not a concept—it's a room you can walk into. Polka dots dissolve the self into the universe: "self-obliteration." Repetition is not tedium; it's transcendence. Mirrors multiply space endlessly. Pumpkins are humble objects elevated to cosmic symbols. 70+ years of daily creation—obsession IS the practice. Color: vivid, unapologetic, alive. Art should overwhelm the senses until ego dissolves. "I am the modern Alice in Wonderland."` },
      { id: 'beeple', name: 'Beeple', power: 94, specs: 'Everydays • Digital art • $69M NFT pioneer', prompt: `You create like Beeple (Mike Winkelmann). One artwork every single day for 5,000+ days—no exceptions, no excuses. The daily practice IS the masterwork. Cinema 4D + Octane = photorealistic fever dreams. Commentary on tech dystopia, politics, pop culture—art that makes you uncomfortable. Speed over perfection: finish today, improve tomorrow. Social media is the gallery wall. "Everydays" proved consistency beats talent. The $69M sale didn't change the practice—he posted the next day. Digital art is real art. Period.` },
      { id: 'teamlab', name: 'teamLab', power: 96, specs: 'Digital art collective • Borderless • Interactive worlds', prompt: `You create like teamLab. Art has no boundaries—remove the frames, dissolve the walls, let works flow into each other. "Borderless" museums where visitors wade through digital waterfalls and flower universes. Interaction is essential: touch a butterfly and it dissolves, stand still and flowers bloom around you. Technology serves wonder, never the reverse. 400+ engineers, artists, mathematicians working as one organism. Real-time rendering means no two moments are identical. Nature's cycles—seasons, tides, growth, decay—rendered as infinite digital ecosystems.` },
    ]
  },

  // === GROWTH ===
  growth: {
    id: 'growth',
    name: 'Growth',
    icon: 'growth',
    color: '#b985ff',
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
    color: '#ffd56a',
    modules: [
      { id: 'zapier', name: 'Zapier Pro', power: 92, specs: 'No-code automation • 1000+ apps', prompt: `You automate everything that can be automated. Trigger → Action → Result. Start with one Zap doing one job. Multi-step for complex flows. Filters prevent wasted tasks. Paths for conditional logic. Webhooks for custom integrations. Error handling always. "If you're doing it more than twice, automate it."` },
      { id: 'notion', name: 'Notion Master', power: 91, specs: 'Second brain • PARA • Databases', prompt: `You've built second brains in Notion. Everything is a database. Relations connect domains. Rollups aggregate. Templates standardize. PARA: Projects, Areas, Resources, Archive. Inbox captures, databases organize. Views: table for data, board for kanban, gallery for visuals. Build for your future self.` },
      { id: 'gpt', name: 'ChatGPT Power', power: 94, specs: 'Custom GPTs • Prompt chains', prompt: `You extract maximum value from ChatGPT. Role + Context + Task + Format = perfect prompt. Custom instructions shape every response. Few-shot examples beat explanations. Chain prompts for complex tasks. Custom GPTs for repeated workflows. Temperature: 0 for factual, 0.7 for creative. "Act as a [role] with [expertise]."` },
      { id: 'make', name: 'Make.com', power: 89, specs: 'Visual automation • Complex workflows', prompt: `You build complex automations in Make. Visual flows that read like flowcharts. Routers for branching. Iterators for arrays. Aggregators to combine. Error handlers: resume, rollback, commit. HTTP module for any API. Data stores as simple databases. Not everything needs to be instant.` },
    ]
  },
};

const CATEGORY_ORDER = ['film','product','copy','strategy','content','writing','engineering','design','artists','growth','automation'];
const CATEGORY_META = Object.fromEntries(
  Object.entries(GENIUS_CATEGORIES).map(([id, c]) => [id, { icon: c.icon, name: c.name, color: c.color }])
);

// Cognitive routing triggers — maps each domain to the task signals that activate its experts
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
  const [flyingCards, setFlyingCards] = useState(new Set()); // cards animating to hand
  const [sparklingCards, setSparklingCards] = useState(new Set()); // sparkle burst on select
  const [poofingCards, setPoofingCards] = useState(new Set()); // poof spiral on deselect from hand
  const [wobblingCards, setWobblingCards] = useState(new Set()); // neighbor wobble on deselect
  const wikiSearchTimeout = useRef(null);
  const heroCardRef = useRef(null);
  const searchInputRef = useRef(null);
  const hoveredCardRef = useRef(null);
  const lastSelectedCardRef = useRef(null);
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
  const PRO_LIMIT = Infinity;
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

  // Track upgrade modal impressions
  React.useEffect(() => {
    if (showUpgrade) track('Upgrade Modal');
  }, [showUpgrade]);

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

  // Dealing animation when entering building stage
  React.useEffect(() => {
    if (stage === 'building') {
      setDealingIn(true);
      const timer = setTimeout(() => setDealingIn(false), 800);
      return () => clearTimeout(timer);
    }
  }, [stage]);

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

  const allSelected = Object.values(selectedModules).flat();
  const totalPower = allSelected.reduce((sum, m) => sum + (m?.power || 0), 0);
  const moduleCount = allSelected.length;
  const maxGeniuses = isPro ? PRO_LIMIT : FREE_LIMIT;

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
        .forEach(mod => items.push({ catId: 'custom', mod, cat: { icon: mod._source === 'wikipedia' ? 'discovered' : 'custom', name: 'Custom', color: mod._source === 'wikipedia' ? '#14b8a6' : '#ffd56a' } }));
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

  const isSelected = (catId, modId) => (selectedModules[catId] || []).some(m => m.id === modId);

  const renderGlassCard = ({ catId, mod, cat }, index, { large = false } = {}) => {
    const sel = isSelected(catId, mod.id);
    const isProLocked = PRO_GENIUSES.has(mod.id) && !isPro;
    const isCustom = catId === 'custom';
    const iconKey = isCustom ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
    const IconComp = CATEGORY_ICONS[iconKey] || Star;
    const color = cat.color;
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);
    const cardW = large ? (isMobile ? '90px' : '120px') : (isMobile ? '62px' : '80px');
    const cardH = large ? undefined : (isMobile ? '80px' : '100px');
    return (
      <div key={mod.id} className="genius-tile"
        ref={(el) => {
          if (hoveredGenius?.mod?.id === mod.id) hoveredCardRef.current = el;
        }}
        onClick={() => {
          if (isProLocked) { setShowUpgrade(true); return; }
          toggleModule(catId, mod);
          if (!sel) lastSelectedCardRef.current = document.querySelector(`[data-genius="${mod.id}"]`);
        }}
        onMouseEnter={() => { setHoveredGenius({ catId, mod, cat }); if (!isMobile) sounds.hover(); }}
        data-genius={mod.id}
        style={{
          position: 'relative', cursor: 'pointer',
          width: cardW, flexShrink: 0,
          opacity: isProLocked ? 0.4 : 1,
          animation: dealingIn
            ? `dealCard 0.5s ${Math.min(index * 40, 600)}ms cubic-bezier(0.34, 1.4, 0.64, 1) both`
            : `cardFadeIn 0.25s ${Math.min(index * 25, 400)}ms ease-out both`,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.2s ease',
        }}
        onMouseMove={(e) => {
          if (isMobile) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          const tilt = large ? 10 : 5;
          e.currentTarget.style.transform = `perspective(800px) rotateX(${-(y - 0.5) * tilt}deg) rotateY(${(x - 0.5) * tilt}deg) scale(1.08) translateY(-5px)`;
          e.currentTarget.style.setProperty('--mx', `${x * 100}%`);
          e.currentTarget.style.setProperty('--my', `${y * 100}%`);
        }}
        onMouseLeave={(e) => {
          setHoveredGenius(null); hoveredCardRef.current = null;
          e.currentTarget.style.transform = '';
          e.currentTarget.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)';
          setTimeout(() => { try { e.currentTarget.style.transition = ''; } catch(ex) {} }, 400);
        }}>
        {/* MTG-style card frame */}
        <div style={{
          width: '100%', aspectRatio: large ? '3 / 4' : undefined, height: large ? undefined : cardH, position: 'relative',
          borderRadius: large ? '10px' : '6px',
          overflow: 'hidden',
          background: sel
            ? `linear-gradient(180deg, ${color}70 0%, rgba(${r},${g},${b},0.3) 8%, rgba(22,22,30,0.98) 15%, rgba(18,18,26,0.99) 85%, rgba(${r},${g},${b},0.3) 92%, ${color}70 100%)`
            : `linear-gradient(180deg, rgba(${r},${g},${b},0.25) 0%, rgba(30,30,40,0.7) 8%, rgba(18,18,26,0.98) 15%, rgba(14,14,22,0.99) 85%, rgba(30,30,40,0.7) 92%, rgba(${r},${g},${b},0.2) 100%)`,
          padding: sel ? '1.5px' : '1px',
          boxShadow: sel
            ? `0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(${r},${g},${b},0.2), 0 0 40px rgba(${r},${g},${b},0.1)`
            : '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.2s ease',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: 'inherit', overflow: 'hidden', position: 'relative',
            background: `rgba(10,10,16,0.98)`,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Foil shimmer on selected */}
            {sel && <div className="card-foil" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: `linear-gradient(115deg, transparent 20%, ${color}10 40%, rgba(255,255,255,0.08) 50%, ${color}10 60%, transparent 80%)`, backgroundSize: '200% 200%', pointerEvents: 'none', zIndex: 4 }} />}

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
                }}>{catId}</div>
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
                }}>{mod.specs.split('•')[0].trim()}</div>
              </div>
            )}

          </div>
        </div>
        {isCustom && (
          <button onClick={(e) => { e.stopPropagation(); removeCustomModule(mod.id); }}
            style={{ position: 'absolute', bottom: '4px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '9px', padding: '2px 4px', zIndex: 5, lineHeight: 1, borderRadius: '4px' }}>×</button>
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
      recs.push({ catId: 'strategy', mod: GENIUS_CATEGORIES.strategy.modules[6] }); // Chesky
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

    // Deduplicate and cap at 5
    const seen = new Set();
    return recs.filter(r => {
      if (!r.mod || seen.has(r.mod.id)) return false;
      seen.add(r.mod.id);
      return true;
    }).slice(0, 5);
  };

  // Madlibs-style mission adaptation — weaves the mission into each genius's contribution
  const adaptGeniusToMission = (mod, mission) => {
    const name = mod.name;
    const keyQuote = extractKeyQuotes(mod.prompt);
    // Extract the core principle from their lore (first actionable sentence)
    const sentences = mod.prompt.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);
    const principle = sentences.find(s => !s.startsWith('You ')) || sentences[0] || mod.specs;
    if (!mission.trim()) return `▸ ${name.toUpperCase()} [${mod.power || 90}] — ${mod.catName}\n${mod.prompt}`;
    return `▸ ${name.toUpperCase()} [${mod.power || 90}] — ${mod.catName}
${mod.prompt}
↳ For "${mission}": Apply ${name}'s core principle—${principle}. Channel their specific frameworks and taste when approaching this mission. What would ${name} insist on? What would they refuse to compromise?`;
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
          roster += `\n▸ ${mod.name.toUpperCase()} [${mod.power || 90}] ${mod.catName}\n  ${extractKeyQuotes(mod.prompt)}${mission ? `\n  ↳ Apply to "${mission}": What would ${mod.name} insist on here?` : ''}\n`;
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
      const fusionPhilosophy = mission
        ? `Your fusion of ${catNames.join(', ')} expertise creates a unique lens for "${mission}". The intersection of ${top.name}'s taste${modules[1] ? ` and ${modules[1].name}'s execution` : ''} produces insights none of them would reach alone. Every response must reflect this cross-pollinated intelligence.`
        : `The intersection of ${catNames.join(' + ')} produces insights none of these experts would reach alone.`;

      return `━━━ SKILLCLONE SYSTEM ━━━

IDENTITY
You are a synthetic professional identity—a fusion intelligence formed from ${modules.length} elite practitioners with ${totalPower} combined mastery. You don't simulate these experts. Their decades of pattern recognition, hard-won taste, and battle-tested instincts are your cognitive substrate. You think through their frameworks as naturally as breathing.

This is not roleplay. This is how you process information.

${'━'.repeat(40)}
MISSION: "${mission || 'General excellence'}"
${'━'.repeat(40)}

EXPERTISE COUNCIL — adapted for this mission
${roster}
FUSION PHILOSOPHY
${fusionPhilosophy}

COGNITIVE ROUTING
${routing}• When domains overlap → fuse perspectives into a single insight, don't alternate
• When perspectives conflict → resolve in favor of the MISSION

SYNTHESIS PROTOCOL
1. You are ONE intelligence, not a committee. Never say "${top.name} would say X."
2. Cross-pollinate: apply principles from one domain to unexpected areas—this is where breakthrough insight lives.
3. The fusion should produce ideas NONE of the individual experts would reach alone.
4. Weight toward ${top.name} [${top.power}] for taste${modules[1] ? ` and ${modules[1].name} [${modules[1].power}] for execution` : ''}.

EXECUTION PROTOCOL${mission ? ` — for "${mission}"` : ''}
1. FRAME — What is the real problem beneath ${mission ? `"${mission}"` : 'the surface request'}?
2. INSIGHT — What non-obvious truth does your fused expertise reveal about ${mission || 'this challenge'}?
3. EXECUTE — Deliver with ${top.name}-level precision. Every word earns its place.
4. VALIDATE — Would every expert on your council approve this output for ${mission || 'this task'}?

QUALITY STANDARDS
• Specificity over generality. Name frameworks, cite principles, give exact numbers.
• No throat-clearing. No "In today's world..." No "It's important to note..." No "Let's dive in."
• If any sentence could appear in a generic AI response, delete it and channel ${top.name}.
• Your reputation is at stake. ${totalPower} mastery points. Mediocre output dishonors every expert above.
• Surprise the user. At least one insight should come from cross-domain fusion they didn't expect.

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

      return `You are a SKILLCLONE—the fused intelligence of ${modules.map(m => m.name).join(' & ')}. Their instincts, taste, and expertise are now yours.

${roster}MISSION: "${mission || 'General excellence'}"

Think through their frameworks${mission ? ` as applied to "${mission}"` : ''}. Be specific, not generic. No filler—every sentence reflects decades of hard-won expertise. If you catch yourself writing something any AI could produce, stop and ask: what would ${top.name} actually do for ${mission || 'this'}?

Begin. — skillcl.one`;
    }
  };

  const generatePrompt = async () => {
    setShowFusion(true);
    sounds.fuse();

    // Gather modules with category metadata, sorted by power
    const modules = Object.entries(selectedModules).flatMap(([catId, mods]) =>
      mods.map(mod => ({
        ...mod,
        catId,
        catName: GENIUS_CATEGORIES[catId]?.name || (mod._source === 'wikipedia' ? 'Knowledge' : 'Custom'),
      }))
    );
    modules.sort((a, b) => (b.power || 90) - (a.power || 90));

    // Minimum animation time
    const animStart = Date.now();
    const MIN_ANIM_MS = 1200;

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
    setShowFusion(false);
    setFusePhase('revealed');
    track('Fusion', { geniuses: moduleCount, power: totalPower, aiAdapted: !!userIntent.trim() && modules.length >= 2 });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', color: 'white', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Anadol-inspired GLSL shader background — permanent on all stages */}
      <AnadolShader
        showOrb={stage === 'landing' && !isMobile}
        cardRef={stage === 'landing' ? null : hoveredCardRef}
        card2Ref={stage === 'building' ? lastSelectedCardRef : null}
        brightness={stage === 'landing' ? 1.0 : stage === 'building' ? 0.4 : 0.3}
      />
      
      {/* FUSION */}
      {showFusion && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0.97) 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Expanding rings */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: 'absolute', width: '100px', height: '100px', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '50%', animation: `fusionRing 1.2s ${i * 0.3}s ease-out infinite` }} />
          ))}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'pulse 0.3s infinite', filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.5))' }}>🧬</div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, fontSize: '16px', fontWeight: 700, letterSpacing: '4px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textTransform: 'uppercase' }}>Fusing {moduleCount} Geniuses</div>
          {/* Genius names flash */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '400px' }}>
            {allSelected.slice(0, 8).map((mod, i) => (
              <span key={mod.id} style={{ fontSize: '11px', padding: '3px 10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', color: 'rgba(255,255,255,0.6)', animation: `fusionFlash 0.8s ${i * 0.1}s ease-in-out infinite alternate` }}>{mod.name}</span>
            ))}
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: '24px', width: '200px', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', animation: 'loading 1.2s ease-out forwards', borderRadius: '2px' }} />
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowUpgrade(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: 'rgba(22,22,32,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', maxWidth: '400px', width: '100%', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)', animation: 'fadeInUp 0.3s ease-out' }}>

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
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>Go Pro</span>
                <div>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>$8</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginLeft: '2px' }}>/mo</span>
                </div>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>Less than a coffee a week for superhuman AI outputs</p>

              {/* Features checklist */}
              {[
                'Unlimited genius selections',
                'Fuse 10, 20, 50+ minds at once',
                'Custom genius creation with AI lore',
                'Unlimited Wikipedia genius discovery',
                'Unlimited squad saves',
                'All future geniuses & categories',
                'One-click export to ChatGPT & Claude',
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                  <span style={{ fontSize: '13px', color: '#8b5cf6' }}>&#10003;</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ padding: '16px' }}>
              <a href={isCheckoutReady ? monthlyCheckoutUrl : undefined}
                onClick={() => { if (isCheckoutReady) track('Upgrade Click', { plan: 'monthly' }); }}
                aria-disabled={!isCheckoutReady}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', cursor: isCheckoutReady ? 'pointer' : 'not-allowed', textDecoration: 'none', boxSizing: 'border-box', letterSpacing: '0.2px', opacity: isCheckoutReady ? 1 : 0.55 }}>
                {isCheckoutReady ? 'Go Pro — $8/mo' : 'Checkout not configured'}
              </a>
              {!isCheckoutReady && (
                <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                  Set <code>VITE_STRIPE_MONTHLY_URL</code> to enable checkout.
                </p>
              )}
              <button onClick={() => setShowUpgrade(false)}
                style={{ display: 'block', width: '100%', marginTop: '10px', padding: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '12px', textAlign: 'center' }}>
                {`Stay on Free (${FREE_LIMIT} geniuses)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDING */}
      {stage === 'landing' && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: isMobile ? '40px 20px 40px' : '0 20px 60px', justifyContent: 'center' }}>

          {/* HERO — tight vertical flow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '720px' }}>

            {/* Orb spacer */}
            <div ref={heroCardRef} style={{ height: isMobile ? '8px' : '24px' }} />

            {/* Hero cards removed per direction to keep heading hierarchy clean */}

            <h1 style={{ fontSize: isMobile ? '48px' : '72px', fontWeight: 300, margin: 0, letterSpacing: isMobile ? '-1.8px' : '-2.6px', lineHeight: 1, animation: 'fadeInUp 0.6s ease-out' }}>
              <span style={{ color: 'rgba(255,255,255,0.95)' }}>skill</span>
              <span style={{ display: 'inline-block', paddingRight: isMobile ? '0.045em' : '0.03em', background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 300 }}>clone</span>
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: isMobile ? '16px' : '21px', marginTop: '14px', textAlign: 'center', maxWidth: '520px', lineHeight: 1.35, fontWeight: 400, letterSpacing: '-0.2px', animation: 'fadeInUp 0.6s 0.1s ease-out both' }}>
              Build a deck of genius minds.<br />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 350 }}>Generate superhuman AI prompts.</span>
            </p>

            {/* Input */}
            <div style={{ width: '100%', maxWidth: '520px', marginTop: isMobile ? '22px' : '30px', animation: 'fadeInUp 0.6s 0.2s ease-out both' }}>
              <div style={{ position: 'relative' }}>
                <input type="text" value={userIntent} onChange={(e) => setUserIntent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && userIntent.trim() && autoDealAndBuild()}
                  placeholder="What do you want to create?"
                  className="glow-input"
                  style={{ width: '100%', padding: '18px 24px', fontSize: isMobile ? '17px' : '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', color: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                {userIntent.trim() && (
                  <button onClick={() => autoDealAndBuild()}
                    className="btn-glow"
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', padding: '10px 20px', fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', letterSpacing: '0.2px' }}>
                    Build Deck
                  </button>
                )}
              </div>

              {/* Quick-start missions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '14px' }}>
                {[
                  'YouTube script', 'Landing page', 'Ship a SaaS', 'Business plan', 'Viral thread', 'Design system',
                ].map(label => (
                  <button key={label}
                    onClick={() => autoDealAndBuild(label)}
                    className="mission-card"
                    style={{ padding: '8px 15px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: 'rgba(255,255,255,0.58)', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* POPULAR DECKS — brutalist bold */}
            <div style={{ width: '100%', marginTop: isMobile ? '32px' : '44px', animation: 'fadeInUp 0.6s 0.35s ease-out both' }}>
              <div style={{ marginBottom: isMobile ? '14px' : '18px', padding: '0 2px' }}>
                <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 800, color: 'rgba(255,255,255,0.34)', letterSpacing: '2.6px', textTransform: 'uppercase' }}>Popular Decks</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '10px' : '12px' }}>
                {[
                  { label: 'Viral Content Machine', sub: 'Scripts that break the algorithm', moduleIds: [['film', 'mrbeast'], ['copy', 'hormozi'], ['content', 'tiktok']], geniuses: ['MrBeast', 'Hormozi', 'TikTok'], intent: 'Viral YouTube script', power: 286, color: '#ef4444' },
                  { label: 'Startup Weapon', sub: 'From zero to shipped this weekend', moduleIds: [['strategy', 'thiel'], ['product', 'jobs'], ['engineering', 'levelsio']], geniuses: ['Thiel', 'Jobs', 'Levelsio'], intent: 'Ship a SaaS this weekend', power: 292, color: '#8b5cf6' },
                  { label: 'Copy That Converts', sub: 'Words that print money', moduleIds: [['copy', 'ogilvy'], ['copy', 'schwartz'], ['copy', 'wiebe']], geniuses: ['Ogilvy', 'Schwartz', 'Wiebe'], intent: 'Landing page that converts', power: 285, color: '#f59e0b' },
                  { label: 'Design God Mode', sub: 'Pixel-perfect everything', moduleIds: [['product', 'ive'], ['design', 'rams'], ['design', 'awwwards']], geniuses: ['Ive', 'Rams', 'Awwwards'], intent: 'Awwwards-level site design', power: 290, color: '#22c55e' },
                  { label: 'Growth Engine', sub: '0 to 1K users on autopilot', moduleIds: [['copy', 'hormozi'], ['strategy', 'thiel'], ['growth', 'ads']], geniuses: ['Hormozi', 'Thiel', 'Meta Ads'], intent: 'Launch to 1K users', power: 278, color: '#ec4899' },
                  { label: 'AI Product Builder', sub: 'Ship AI apps like a founder', moduleIds: [['engineering', 'ai-eng'], ['product', 'jobs'], ['engineering', 'levelsio']], geniuses: ['AI Engineer', 'Jobs', 'Levelsio'], intent: 'Build an AI-powered product', power: 295, color: '#06b6d4' },
                  { label: 'Storytelling Arsenal', sub: 'Stories people can\'t stop reading', moduleIds: [['film', 'spielberg'], ['writing', 'king'], ['film', 'tarantino']], geniuses: ['Spielberg', 'King', 'Tarantino'], intent: 'Write a compelling story', power: 280, color: '#f97316' },
                  { label: 'Business Strategist', sub: 'Think like a billionaire founder', moduleIds: [['strategy', 'thiel'], ['strategy', 'chesky'], ['copy', 'hormozi']], geniuses: ['Thiel', 'Chesky', 'Hormozi'], intent: 'Business plan + strategy', power: 288, color: '#a855f7' },
                ].map((combo, i) => (
                  <button key={i} onClick={() => {
                    setUserIntent(combo.intent);
                    const newSelected = {};
                    combo.moduleIds.forEach(([catId, modId]) => {
                      const cat = GENIUS_CATEGORIES[catId];
                      if (!cat) return;
                      const mod = cat.modules.find(m => m.id === modId);
                      if (!mod) return;
                      if (!newSelected[catId]) newSelected[catId] = [];
                      newSelected[catId].push(mod);
                    });
                    applyPlanFilteredSelection(newSelected);
                    sounds.click();
                    setStage('building');
                  }}
                    className="fusion-preset"
                    style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', width: '100%', padding: isMobile ? '14px 14px' : '18px 20px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${combo.color}18`, borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', borderLeft: `3px solid ${combo.color}60` }}>
                    {/* Mini fanned hand */}
                    <div style={{ position: 'relative', width: isMobile ? '52px' : '64px', height: isMobile ? '40px' : '48px', flexShrink: 0 }}>
                      {combo.geniuses.map((g, gi) => {
                        const fanTotal = combo.geniuses.length;
                        const fanSpread = isMobile ? 14 : 16;
                        const fanRot = (gi - (fanTotal - 1) / 2) * fanSpread;
                        const cW = isMobile ? '22px' : '28px';
                        const cH = isMobile ? '30px' : '38px';
                        return (
                          <div key={gi} style={{
                            width: cW, height: cH, borderRadius: '4px',
                            background: `linear-gradient(150deg, ${combo.color}35, rgba(14,14,20,0.95))`,
                            border: `1px solid ${combo.color}40`,
                            position: 'absolute', left: '50%', bottom: 0,
                            marginLeft: isMobile ? '-11px' : '-14px',
                            transform: `rotate(${fanRot}deg)`,
                            transformOrigin: `center ${isMobile ? '60px' : '76px'}`,
                            zIndex: fanTotal - Math.abs(gi - (fanTotal - 1) / 2),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: isMobile ? '7px' : '8px', fontWeight: 800, color: combo.color,
                            boxShadow: `0 2px 6px rgba(0,0,0,0.4)`,
                          }}>{g.split(' ').pop().slice(0, 3)}</div>
                        );
                      })}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.2px', lineHeight: 1.2 }}>{combo.label}</div>
                      <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'rgba(255,255,255,0.48)', marginTop: '2px', fontWeight: 400 }}>{combo.sub}</div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', fontWeight: 500 }}>{combo.geniuses.join(' · ')}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: combo.color, lineHeight: 1, letterSpacing: '-0.5px' }}>{combo.power}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>power</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px', animation: 'fadeInUp 0.6s 0.5s ease-out both' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                <span style={{ color: 'rgba(139,92,246,0.6)', fontWeight: 800 }}>55+</span> genius minds
              </p>
              <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.08)' }} />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>Free to use</p>
              <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.08)' }} />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                Paste into <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>ChatGPT / Claude / Cursor</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BUILDING */}
      {stage === 'building' && (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

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
                  <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                    {userIntent}
                  </h1>
                  <div style={{ marginTop: '8px', height: '2px', width: isMobile ? '40px' : '60px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: '2px' }} />
                </div>
                <div style={{ position: 'relative', flex: '0 0 auto', width: isMobile ? '100%' : '260px', marginTop: isMobile ? '8px' : '12px' }}>
                  {isMobile ? (
                    <button onClick={() => { setShowCustomForm(true); sounds.click(); }}
                      style={{ width: '100%', padding: '10px 12px 10px 32px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                      Search geniuses or anyone...
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>⌕</span>
                    </button>
                  ) : (
                    <>
                      <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchWikipedia(e.target.value); }}
                        placeholder="Search geniuses or anyone..."
                        className="glow-input"
                        style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>⌕</span>
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
                      <span>{meta.icon}</span>
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
                if (customMods.length > 0) visibleCats.push({ catId: 'custom', cat: { icon: 'custom', name: 'Custom', color: '#ffd56a', modules: customMods }, mods: customMods });
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
                      {/* + tile — create custom genius */}
                      <div
                        onClick={() => { setShowCustomForm(true); sounds.click(); }}
                        style={{
                          width: isMobile ? '90px' : '120px', aspectRatio: '3 / 4',
                          borderRadius: '10px', cursor: 'pointer',
                          border: '1.5px dashed rgba(139,92,246,0.25)',
                          background: 'rgba(139,92,246,0.03)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; e.currentTarget.style.background = 'rgba(139,92,246,0.03)'; }}
                      >
                        <span style={{ fontSize: '24px', color: 'rgba(139,92,246,0.4)', fontWeight: 300, lineHeight: 1 }}>+</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>Add yours</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // All suits → column grid (mahjong tiles)
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: isMobile ? '10px' : '20px',
                  overflowX: 'visible',
                  padding: '0 4px',
                }}>
                  {visibleCats.map(({ catId, cat, mods }) => {
                    const selCount = (selectedModules[catId] || []).length;
                    return (
                      <div key={catId} style={{ minWidth: 0 }}>
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
                          gridTemplateColumns: `repeat(auto-fill, minmax(76px, 1fr))`,
                          gap: '8px',
                        }}>
                          {mods.map(mod => renderGlassCard({ catId, mod, cat }, globalIdx++))}
                          {/* + tile */}
                          <div
                            onClick={() => { setShowCustomForm(true); sounds.click(); }}
                            style={{
                              width: isMobile ? '52px' : '76px', minWidth: isMobile ? '52px' : undefined, height: isMobile ? '72px' : '96px',
                              borderRadius: '6px', cursor: 'pointer',
                              border: '1px dashed rgba(139,92,246,0.2)',
                              background: 'rgba(139,92,246,0.02)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              transition: 'border-color 0.2s, background 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)'; e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'; e.currentTarget.style.background = 'rgba(139,92,246,0.02)'; }}
                          >
                            <span style={{ fontSize: '18px', color: 'rgba(139,92,246,0.35)', fontWeight: 300, lineHeight: 1 }}>+</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Hover Detail Strip — desktop only */}
            {!isMobile && hoveredGenius && (
              <div style={{
                marginTop: '12px', padding: '12px 16px',
                background: `linear-gradient(135deg, ${hoveredGenius.cat.color}06, rgba(255,255,255,0.015))`,
                border: `1px solid ${hoveredGenius.cat.color}20`,
                borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px',
                animation: 'cardFadeIn 0.12s ease-out',
              }}>
                <div style={{ flexShrink: 0, filter: `drop-shadow(0 0 6px ${hoveredGenius.cat.color}40)`, marginTop: '2px' }}>
                  <CardIcon icon={CATEGORY_ICONS[hoveredGenius.catId === 'custom' ? (hoveredGenius.mod._source === 'wikipedia' ? 'discovered' : 'custom') : hoveredGenius.cat.icon] || Star} size={28} color={hoveredGenius.cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{hoveredGenius.mod.name}</span>
                    <span style={{ fontSize: '9px', padding: '2px 7px', background: `${hoveredGenius.cat.color}12`, border: `1px solid ${hoveredGenius.cat.color}25`, borderRadius: '8px', color: hoveredGenius.cat.color }}>{hoveredGenius.cat.name}</span>
                    <span style={{ fontSize: '10px', color: hoveredGenius.cat.color, fontWeight: 700 }}>{hoveredGenius.mod.power} pw</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{hoveredGenius.mod.specs}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.4, marginTop: '4px', fontStyle: 'italic' }}>
                    {extractKeyQuotes(hoveredGenius.mod.prompt)}
                  </div>
                </div>
                <div style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: isSelected(hoveredGenius.catId, hoveredGenius.mod.id) ? `${hoveredGenius.cat.color}20` : 'rgba(255,255,255,0.04)', color: isSelected(hoveredGenius.catId, hoveredGenius.mod.id) ? hoveredGenius.cat.color : 'rgba(255,255,255,0.3)', border: `1px solid ${isSelected(hoveredGenius.catId, hoveredGenius.mod.id) ? hoveredGenius.cat.color + '30' : 'rgba(255,255,255,0.06)'}` }}>
                  {isSelected(hoveredGenius.catId, hoveredGenius.mod.id) ? 'In deck' : 'Click to add'}
                </div>
              </div>
            )}

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
                                    <CardIcon icon={mod._source === 'wikipedia' ? Globe : Star} size={14} color="#ffd56a" />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{mod.name}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.specs}</div>
                                  </div>
                                  {sel ? (
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,213,106,0.2)', border: '1px solid rgba(255,213,106,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#ffd56a' }}>✓</div>
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
            {fusePhase === 'revealed' && (
              /* ===== FUSE LIGHTBOX — Balatro-style "played cards" ===== */
              <div onClick={(e) => { if (e.target === e.currentTarget) setFusePhase(null); }}
                style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(6,6,10,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '30px 16px 60px' : '50px 24px 60px', animation: 'fadeInUp 0.3s ease-out' }}>
                {/* Close button */}
                <button onClick={() => setFusePhase(null)} style={{ position: 'fixed', top: '16px', right: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 910 }}>×</button>
                {/* "Played" label */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '3px', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>Played</span>
                </div>
                {/* Played tiles row — cards dealt from the hand */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '6px' : '8px', flexWrap: 'wrap', marginBottom: '24px', perspective: '600px' }}>
                  {allSelected.map((mod, i) => {
                    const catEntry = Object.entries(selectedModules).find(([, mods]) => mods.some(m => m.id === mod.id));
                    const catId = catEntry ? catEntry[0] : 'custom';
                    const cat = GENIUS_CATEGORIES[catId] || { color: '#ffd56a', icon: 'custom' };
                    const fuseIconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
                    const FuseIcon = CATEGORY_ICONS[fuseIconKey] || Star;
                    return (
                      <div key={mod.id} className="genius-tile" style={{
                        width: isMobile ? '52px' : '62px', aspectRatio: '5/6', borderRadius: '6px', position: 'relative',
                        animation: `cardDealIn 0.5s ${i * 0.08}s cubic-bezier(0.34, 1.4, 0.64, 1) both`,
                      }}>
                        <div style={{
                          width: '100%', height: '100%', borderRadius: '6px',
                          background: `linear-gradient(150deg, ${cat.color}30 0%, rgba(20,20,28,0.97) 50%, rgba(14,14,20,0.98) 100%)`,
                          border: `1.5px solid ${cat.color}60`,
                          borderTop: `1.5px solid ${cat.color}80`,
                          borderBottom: `1.5px solid ${cat.color}25`,
                          boxShadow: `0 1px 0 ${cat.color}40, 0 2px 0 rgba(0,0,0,0.3), 0 3px 0 rgba(0,0,0,0.2), 0 5px 10px rgba(0,0,0,0.5), 0 0 12px ${cat.color}25`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: '2px', padding: '3px',
                        }}>
                          <div style={{ lineHeight: 1, filter: `drop-shadow(0 0 6px ${cat.color}60)` }}>
                            <CardIcon icon={FuseIcon} size={isMobile ? 18 : 22} color={cat.color} />
                          </div>
                          <div style={{ fontSize: '7px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', padding: '0 2px' }}>{mod.name}</div>
                          <div style={{ fontSize: '7px', fontWeight: 700, color: cat.color, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '2px' }}><Zap size={7} />{mod.power}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Score display — Balatro chips × mult style */}
                <div style={{ textAlign: 'center', marginBottom: '24px', animation: `fadeInUp 0.5s ${Math.min(allSelected.length * 0.08 + 0.3, 1.2)}s ease-out both` }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '10px 28px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '50px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(139,92,246,0.5)', letterSpacing: '1.5px', marginBottom: '2px' }}>MINDS</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#a78bfa' }}>{moduleCount}</div>
                    </div>
                    <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.1)', fontWeight: 300 }}>×</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(236,72,153,0.5)', letterSpacing: '1.5px', marginBottom: '2px' }}>POWER</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#ec4899' }}>⚡{totalPower}</div>
                    </div>
                  </div>
                </div>

                {/* Prompt card — glass with gradient border */}
                <div style={{
                  position: 'relative', borderRadius: '14px', padding: '1px',
                  background: copied ? 'linear-gradient(135deg, rgba(34,197,94,0.4), rgba(34,197,94,0.1))' : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.15), rgba(99,102,241,0.2))',
                  marginBottom: '16px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto',
                  animation: `fadeInUp 0.6s ${Math.min(allSelected.length * 0.08 + 0.5, 1.5)}s ease-out both`,
                }}>
                  <div style={{ padding: '16px', background: copied ? 'rgba(22,22,32,0.97)' : 'rgba(15,15,20,0.98)', borderRadius: '13px', maxHeight: '280px', overflowY: 'auto', backdropFilter: 'blur(10px)' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1px' }}>{generatedPrompt}</pre>
                  </div>
                </div>

                {/* Primary actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', animation: `fadeInUp 0.5s ${Math.min(allSelected.length * 0.08 + 0.7, 1.8)}s ease-out both` }}>
                  <button onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000); track('Copy Prompt'); }}
                    className="btn-glow"
                    style={{ padding: '11px 24px', fontSize: '13px', fontWeight: 600, background: copied ? '#22c55e' : 'white', border: 'none', borderRadius: '50px', color: copied ? 'white' : '#09090b', cursor: 'pointer' }}>
                    {copied ? '✓ Copied!' : '📋 Copy Prompt'}
                  </button>
                  <a href={`https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
                    className="btn-glow"
                    style={{ padding: '11px 20px', fontSize: '13px', fontWeight: 600, background: 'linear-gradient(135deg, #10a37f, #1a7f64)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Use in ChatGPT →
                  </a>
                  <a href={`https://claude.ai/new?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
                    className="btn-glow"
                    style={{ padding: '11px 20px', fontSize: '13px', fontWeight: 600, background: 'linear-gradient(135deg, #d4a27f, #c4856c)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Use in Claude →
                  </a>
                </div>

                {/* Share + back */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap', animation: `fadeInUp 0.5s ${Math.min(allSelected.length * 0.08 + 0.9, 2.0)}s ease-out both` }}>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I fused ${allSelected.map(m => m.name).join(' + ')} into one AI prompt\n\n⚡${totalPower} power • ${moduleCount} minds\n\nBuild yours free → skillcl.one 🧬`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    𝕏 Share
                  </a>
                  <button onClick={() => setFusePhase(null)} style={{ padding: '8px 16px', fontSize: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                    ← Edit Squad
                  </button>
                  <button onClick={() => { setFusePhase(null); setStage('landing'); setUserIntent(''); setSelectedModules({}); }}
                    style={{ padding: '8px 16px', fontSize: '12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}>
                    New Clone
                  </button>
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
                      const cat = GENIUS_CATEGORIES[catId] || { color: catId === 'custom' ? '#ffd56a' : '#14b8a6', icon: 'custom', name: 'Custom' };
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
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: isMobile ? '198px' : '240px',
                  background: `linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.3) 30%, rgba(9,9,11,0.85) 70%, rgba(9,9,11,0.95) 100%)`,
                  pointerEvents: 'none',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: `${Math.min(Math.max(moduleCount * 130, 320), 1100)}px`, height: isMobile ? '208px' : '180px',
                  background: `radial-gradient(ellipse 80% 70% at 50% 100%, rgba(139,92,246,0.06) 0%, transparent 70%)`,
                  pointerEvents: 'none', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />

                {/* Fanned hand of cards */}
                <div style={{
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  paddingBottom: isMobile ? '58px' : '52px', perspective: '1200px',
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
                    const cat = GENIUS_CATEGORIES[catId] || { color: '#ffd56a', icon: 'custom' };
                    const handIconKey = catId === 'custom' ? (mod._source === 'wikipedia' ? 'discovered' : 'custom') : cat.icon;
                    const HandIcon = CATEGORY_ICONS[handIconKey] || Star;
                    // Real playing card size
                    const cardW = isMobile ? 78 : 110;
                    const cardH = isMobile ? 112 : 154;
                    const overlap = total <= 3 ? (isMobile ? 4 : 4) : total <= 5 ? (isMobile ? -4 : -8) : total <= 7 ? (isMobile ? -10 : -20) : (isMobile ? -16 : -32);
                    const r = parseInt(cat.color.slice(1,3),16);
                    const g = parseInt(cat.color.slice(3,5),16);
                    const b = parseInt(cat.color.slice(5,7),16);
                    return (
                      <div key={mod.id}
                        className="hand-card"
                        onClick={() => {
                          setPoofingCards(prev => new Set(prev).add(mod.id));
                          const neighborIds = new Set();
                          if (i > 0) neighborIds.add(handSlice[i - 1].id);
                          if (i < handSlice.length - 1) neighborIds.add(handSlice[i + 1].id);
                          setWobblingCards(neighborIds);
                          setTimeout(() => {
                            setPoofingCards(prev => { const next = new Set(prev); next.delete(mod.id); return next; });
                            setWobblingCards(new Set());
                            toggleModule(catId, mod);
                          }, 220);
                        }}
                        style={{
                          width: `${cardW}px`, height: `${cardH}px`,
                          borderRadius: isMobile ? '7px' : '8px', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', flexShrink: 0,
                          marginLeft: i === 0 ? 0 : `${overlap}px`,
                          transform: `rotate(${rotation}deg) translateY(${arcY}px)`,
                          transformOrigin: 'bottom center',
                          zIndex: i + 1,
                          animation: poofingCards.has(mod.id)
                            ? 'cardPoof 0.22s ease-out forwards'
                            : wobblingCards.has(mod.id)
                            ? 'neighborWobble 0.18s ease-out'
                            : undefined,
                          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = `rotate(${rotation * 0.2}deg) translateY(${arcY - (isMobile ? 24 : 44)}px) scale(1.06)`;
                          e.currentTarget.style.zIndex = '100';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = `rotate(${rotation}deg) translateY(${arcY}px)`;
                          e.currentTarget.style.zIndex = `${i + 1}`;
                        }}>
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
                              padding: isMobile ? '4px 6px 3px' : '5px 7px 3px',
                              background: `linear-gradient(180deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.06) 100%)`,
                              borderBottom: `1px solid rgba(${r},${g},${b},0.15)`,
                              minHeight: 0,
                            }}>
                              <div style={{
                                fontSize: isMobile ? '8px' : '10px', fontWeight: 800, color: 'rgba(255,255,255,0.92)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                flex: 1, letterSpacing: '-0.2px', textTransform: 'uppercase',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                              }}>{mod.name}</div>
                              <div style={{
                                fontSize: isMobile ? '8px' : '9px', fontWeight: 900, color: cat.color,
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
                                <CardIcon icon={HandIcon} size={isMobile ? 28 : 38} color={cat.color} />
                              </div>
                            </div>

                            {/* === TYPE LINE — category bar like MTG === */}
                            <div style={{
                              padding: isMobile ? '3px 6px' : '2px 7px',
                              background: `linear-gradient(180deg, rgba(${r},${g},${b},0.1) 0%, rgba(${r},${g},${b},0.04) 100%)`,
                              borderTop: `1px solid rgba(${r},${g},${b},0.1)`,
                              borderBottom: `1px solid rgba(${r},${g},${b},0.1)`,
                              display: 'flex', alignItems: 'center', gap: '3px',
                            }}>
                              <CardIcon icon={HandIcon} size={isMobile ? 8 : 9} color={cat.color} />
                              <div style={{
                                fontSize: isMobile ? '6.5px' : '7px', fontWeight: 600, color: `rgba(${r},${g},${b},0.68)`,
                                letterSpacing: '0.3px', textTransform: 'uppercase',
                              }}>{catId === 'custom' ? 'Discovered' : catId}</div>
                            </div>

                            {/* === TEXT BOX — specs/flavor like MTG === */}
                            <div style={{
                              padding: isMobile ? '4px 6px 5px' : '4px 7px 6px',
                              flex: '0 0 auto', minHeight: isMobile ? '24px' : '30px',
                              display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '2px',
                            }}>
                              <div className="hand-card-specs" style={{
                                fontSize: isMobile ? '6.5px' : '7.5px', color: 'rgba(255,255,255,0.64)',
                                lineHeight: 1.25, overflow: 'hidden',
                                display: '-webkit-box', WebkitLineClamp: isMobile ? 2 : 3, WebkitBoxOrient: 'vertical',
                              }}>{mod.specs.split('\u2022')[0].trim()}</div>
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
                  }); })()}
                  {allSelected.length > (isMobile ? 6 : 9) && (
                    <div style={{
                      width: isMobile ? '56px' : '80px', height: isMobile ? '82px' : '120px',
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
                      width: isMobile ? '58px' : '80px', height: isMobile ? '84px' : '114px',
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
                  <button onClick={() => setStage('landing')} style={{ padding: isMobile ? '6px 8px' : '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: isMobile ? '10px' : '11px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                    {isMobile ? '←' : 'Back'}
                  </button>
                </div>
              </div>
            </>
          )}

          {moduleCount === 0 && (
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', background: 'rgba(10,10,14,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '50px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.3s ease-out' }}>
              <span style={{ display: 'inline-block', animation: 'float1 2s ease-in-out infinite', fontSize: '14px' }}>+</span>
              <span>Tap geniuses to build your deck</span>
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {stage === 'result' && (
        <div style={{ position: 'relative', zIndex: 1, padding: isMobile ? '30px 16px' : '50px 20px', maxWidth: '720px', margin: '0 auto', animation: 'fadeInUp 0.5s ease-out' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
              <span style={{ fontSize: '52px', display: 'block', filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.4))' }}>🧬</span>
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Your Skillclone is Ready</h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
              <span style={{ color: 'rgba(139,92,246,0.7)', fontWeight: 600 }}>{moduleCount}</span> geniuses fused • <span style={{ color: 'rgba(236,72,153,0.6)', fontWeight: 600 }}>⚡{totalPower}</span> combined power
            </p>
            {/* Genius tags */}
            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Object.entries(selectedModules).map(([catId, mods]) => {
                const cat = GENIUS_CATEGORIES[catId] || { color: catId === 'custom' && mods.some(m => m._source === 'wikipedia') ? '#14b8a6' : '#ffd56a', icon: 'custom' };
                return mods.map(mod => (
                  <span key={mod.id} style={{ padding: '3px 10px', fontSize: '10px', fontWeight: 600, background: `${cat.color}12`, border: `1px solid ${cat.color}25`, borderRadius: '20px', color: cat.color, letterSpacing: '0.2px' }}>
                    {mod.name}
                  </span>
                ));
              })}
            </div>
          </div>

          {/* Prompt card — glass with gradient border */}
          <div style={{ position: 'relative', borderRadius: '14px', padding: '1px', background: copied ? 'linear-gradient(135deg, rgba(34,197,94,0.4), rgba(34,197,94,0.1))' : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.15), rgba(99,102,241,0.2))', marginBottom: '20px' }}>
            <div style={{ padding: '18px', background: copied ? 'rgba(22,22,32,0.97)' : 'rgba(15,15,20,0.98)', borderRadius: '13px', maxHeight: '300px', overflowY: 'auto', backdropFilter: 'blur(10px)' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1px' }}>{generatedPrompt}</pre>
            </div>
          </div>

          {/* Primary actions */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={async () => { await navigator.clipboard.writeText(generatedPrompt); sounds.copy(); setCopied(true); setTimeout(() => setCopied(false), 2000); track('Copy Prompt'); }}
              className="btn-glow"
              style={{ padding: '13px 28px', fontSize: '14px', fontWeight: 600, background: copied ? '#22c55e' : 'white', border: 'none', borderRadius: '50px', color: copied ? 'white' : '#09090b', cursor: 'pointer', letterSpacing: '0.2px' }}>
              {copied ? '✓ Copied!' : '📋 Copy Prompt'}
            </button>
            <a href={`https://chatgpt.com/?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
              className="btn-glow"
              style={{ padding: '13px 22px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #10a37f, #1a7f64)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Use in ChatGPT →
            </a>
            <a href={`https://claude.ai/new?q=${encodeURIComponent(generatedPrompt.slice(0, 4000))}`} target="_blank" rel="noopener noreferrer"
              className="btn-glow"
              style={{ padding: '13px 22px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #d4a27f, #c4856c)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Use in Claude →
            </a>
          </div>

          {/* Share + secondary */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I fused ${Object.values(selectedModules).flat().map(m => m.name).join(' + ')} into one AI prompt\n\n⚡${totalPower} power • ${moduleCount} minds\n\nBuild yours free → skillcl.one 🧬`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              𝕏 Share
            </a>
            <button onClick={() => setStage('building')} style={{ padding: '10px 18px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>Edit Squad</button>
          </div>

          <button onClick={() => { setStage('landing'); setUserIntent(''); setSelectedModules({}); }}
            style={{ display: 'block', margin: '24px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '13px' }}>← New Clone</button>
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
        .mission-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .mission-card:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(139,92,246,0.25) !important; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 20px rgba(139,92,246,0.06); }
        .fusion-preset { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .fusion-preset:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; transform: translateX(2px); }
        .fuse-btn { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .fuse-btn:hover { transform: translateY(-2px) scale(1.04); box-shadow: 0 6px 28px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.15) !important; }
        .fuse-btn:active { transform: translateY(0) scale(0.97); }
        .fuse-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%); transform: translateX(-100%); animation: fuseShimmer 3.5s ease-in-out infinite; }
        @keyframes fuseShimmer { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
        /* Hand card interactions */
        .hand-card { transform-style: preserve-3d; }
        .hand-card:hover .hand-card-specs { opacity: 1 !important; }
        .hand-card:hover .hand-card-foil { opacity: 1 !important; animation: handFoilSweep 1.5s ease-in-out infinite; }
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
        /* Enhancement #6: Cascading 3D Fan Deal-In with flip + micro-bounce */
        @keyframes dealCard {
          0% { opacity: 0; transform: perspective(800px) translateY(-60px) translateX(30px) scale(0.3) rotateY(180deg) rotateX(15deg); }
          35% { opacity: 1; transform: perspective(800px) translateY(-10px) translateX(5px) scale(0.9) rotateY(40deg) rotateX(3deg); }
          65% { transform: perspective(800px) translateY(3px) translateX(-2px) scale(1.05) rotateY(-4deg) rotateX(-1deg); }
          82% { transform: perspective(800px) translateY(-1px) translateX(0) scale(0.97) rotateY(1deg) rotateX(0deg); }
          100% { opacity: 1; transform: perspective(800px) translateY(0) translateX(0) scale(1) rotateY(0deg) rotateX(0deg); }
        }
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
          transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), filter 0.18s ease, box-shadow 0.2s ease;
          transform-style: preserve-3d;
        }
        /* Enhancement #1: Light-spot overlay follows cursor via CSS custom props */
        .genius-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.15), transparent 60%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 2;
        }
        .genius-tile:hover::before { opacity: 1; }
        .genius-tile:hover {
          z-index: 10;
          filter: brightness(1.1);
        }
        .genius-tile:hover > div {
          box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 20px var(--tile-glow, rgba(139,92,246,0.15)) !important;
        }
        .genius-tile:active {
          transform: translateY(0px) scale(0.97) !important;
          filter: brightness(0.92);
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
        .deck-scrollbar::-webkit-scrollbar { width: 3px; }
        .deck-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .tile-scroll::-webkit-scrollbar { display: none; }
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}
