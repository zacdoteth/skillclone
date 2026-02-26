import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function anthropicProxy() {
  let apiKey;
  return {
    name: 'anthropic-proxy',
    configureServer(server) {
      const env = loadEnv('', process.cwd(), '');
      apiKey = env.ANTHROPIC_API_KEY;

      server.middlewares.use('/api/generate-lore', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { name } = JSON.parse(body);

            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env file' }));
              return;
            }

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
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }));
              return;
            }

            const data = await response.json();
            const text = data.content[0].text;
            const parsed = JSON.parse(text);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), anthropicProxy()],
})
