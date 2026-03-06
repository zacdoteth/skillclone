# 🧬 SkillClone

> Clone the masters. Become yourself.

Fuse legendary minds into one AI prompt. Jobs. Spielberg. Ogilvy. Miyamoto. 50+ masters.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run dev server
npm run dev
```

Then open http://localhost:5173

## Environment Variables

Set these in `.env` (local) and Vercel project settings (production):

- `ANTHROPIC_API_KEY` — required for `/api/generate-fusion` and `/api/generate-lore`
- `VITE_STRIPE_MONTHLY_URL` — Stripe Payment Link for Skillclone Pro

## Build for Production

```bash
npm run build
```

Output will be in `dist/` folder. Deploy to Vercel, Netlify, etc.

## Deploy to Vercel

```bash
npx vercel
```

## Features

- 🧬 50+ legendary geniuses across 10 categories
- ✨ AI-powered recommendations based on your mission
- 🔊 Sound effects for satisfying UX
- 💰 Freemium: 3 free / ∞ pro
- 📋 One-click copy to clipboard

## Categories

- 🎬 Film & Video — Spielberg, Kubrick, Tarantino, MrBeast, Nolan
- 💎 Product & Tech — Steve Jobs, Miyamoto, Jony Ive, Elon Musk
- ✍️ Copywriting — Ogilvy, Gary Halbert, Schwartz, Hormozi
- ♟️ Strategy — Thiel, Bezos, Buffett, Naval, Sun Tzu
- 📱 Social & Content — Twitter, Newsletter, TikTok, YouTube
- 📖 Writing — Stephen King, Sorkin, Pixar, Hemingway
- 💻 Engineering — Carmack, Torvalds, Levelsio, AI Engineer
- 🎨 Design — Dieter Rams, Linear, Awwwards, Bruno Simon
- 📈 Growth — Uber, Duolingo, Launch Expert, SEO, Ads
- ⚡ Automation — Zapier, Notion, ChatGPT, Make.com

## License

MIT
