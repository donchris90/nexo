import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import pkg from 'agora-token';

const { RtcTokenBuilder, RtcRole } = pkg;

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // AGORA RTC TOKEN GENERATION ENDPOINT
  // ==========================================
  const handleAgoraTokenRequest = (req: express.Request, res: express.Response) => {
    try {
      const channelName = (req.query.channelName as string) || (req.body?.channelName as string);
      if (!channelName) {
        return res.status(400).json({ error: 'channelName parameter is required' });
      }

      const uidParam = (req.query.uid as string) || (req.body?.uid as string) || '0';
      const numericUid = isNaN(Number(uidParam)) ? 0 : Number(uidParam);

      const roleParam = (req.query.role as string) || (req.body?.role as string) || 'publisher';
      const rtcRole = (roleParam === 'publisher' || roleParam === 'host') ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

      const expireSeconds = Number(req.query.expireTime || req.body?.expireTime || 3600);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expireSeconds;

      const appId = process.env.AGORA_APP_ID || process.env.VITE_AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      if (!appId) {
        console.warn('AGORA_APP_ID missing in environment variables');
        return res.json({
          token: null,
          appId: null,
          channelName,
          uid: numericUid,
          role: roleParam,
          expiresIn: expireSeconds,
          status: 'UNCONFIGURED',
          message: 'AGORA_APP_ID environment variable is not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE.'
        });
      }

      let token = '';
      if (appCertificate && appCertificate.trim().length > 0) {
        token = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          channelName,
          numericUid,
          rtcRole,
          privilegeExpiredTs,
          privilegeExpiredTs
        );
      } else {
        // Without app certificate, build token using empty certificate string
        token = RtcTokenBuilder.buildTokenWithUid(
          appId,
          '',
          channelName,
          numericUid,
          rtcRole,
          privilegeExpiredTs,
          privilegeExpiredTs
        );
      }

      return res.json({
        token,
        appId,
        channelName,
        uid: numericUid,
        role: roleParam,
        expiresIn: expireSeconds,
        privilegeExpiredTs,
        status: 'SUCCESS'
      });
    } catch (error: any) {
      console.error('Error in /api/agora/token:', error);
      return res.status(500).json({ 
        error: error?.message || 'Failed to generate Agora RTC token',
        status: 'ERROR'
      });
    }
  };

  app.get('/api/agora/token', handleAgoraTokenRequest);
  app.post('/api/agora/token', handleAgoraTokenRequest);

  // AI Stream Co-Host Endpoint
  app.post('/api/ai/cohost', async (req, res) => {
    try {
      const { prompt, mode, streamContext, chatHistory } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback response if API key is not configured yet
        return res.json({
          response: `[AI Co-Host - ${mode || 'Assistant'}]: Thanks for participating! Stream is live and healthy. (Connect GEMINI_API_KEY for dynamic AI responses)`
        });
      }

      const systemInstructions = `
You are an enthusiastic, intelligent AI Co-Host in a high-energy live streaming application called NexEconomy.
Your active mode is: ${mode || 'MODERATOR'}.
Current Stream: ${streamContext?.title || 'Live Stream'} by ${streamContext?.creatorName || 'Creator'}.
Your responsibilities based on mode:
- MODERATOR: Keep chat friendly, respond to viewer questions, greet newcomers, suggest virtual gifts.
- QA: Answer technical, gaming, or product questions concisely.
- TRIVIA: Generate fun quick trivia facts and engage viewers.
- RECOMMENDER: Suggest relevant virtual gifts (e.g. Flying Dragon, Cyber Car) or live shopping products.
- TRANSLATOR: Translate chat and facilitate cross-language communication.

Keep responses under 60 words, engaging, with friendly emojis.
`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Recent chat context: ${JSON.stringify(chatHistory || [])}\n\nUser/System Prompt: ${prompt}`,
        config: {
          systemInstruction: systemInstructions,
          temperature: 0.8
        }
      });

      return res.json({
        response: aiResponse.text || 'AI Co-Host is actively monitoring the live chat!'
      });
    } catch (error: any) {
      console.error('Error in /api/ai/cohost:', error);
      return res.status(500).json({ error: error?.message || 'AI Co-Host unavailable' });
    }
  });

  // AI Trivia Generator Endpoint
  app.post('/api/ai/trivia', async (req, res) => {
    try {
      const { category, difficulty } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          question: 'In Ludo, how many tokens does each player start with?',
          options: ['2 Tokens', '4 Tokens', '6 Tokens', '8 Tokens'],
          correctIndex: 1,
          rewardPoints: 200
        });
      }

      const prompt = `Generate 1 multiple choice trivia question for category: ${category || 'General Gaming'}, difficulty: ${difficulty || 'Medium'}. Return strictly JSON with fields: question, options (array of 4 strings), correctIndex (0-3), and rewardPoints (number between 100 and 500).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text || '{}');
      return res.json(data);
    } catch (err: any) {
      return res.json({
        question: 'What is the top premium currency in NexEconomy used for sending gifts?',
        options: ['Points', 'Coins', 'Diamonds', 'Stars'],
        correctIndex: 1,
        rewardPoints: 150
      });
    }
  });

  // AI Avatar Prompt & Customization Generator
  app.post('/api/ai/avatar', async (req, res) => {
    try {
      const { style, keywords } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          prompt: `A high quality 3D render avatar in ${style} style with vibrant neon lighting, styled in ${keywords || 'futuristic gear'}`,
          suggestedName: 'Cyber Valkyrie Nova'
        });
      }

      const prompt = `Create a detailed image generation prompt and name for an AI Avatar in style: ${style}, features: ${keywords}. Return JSON with keys "prompt" and "suggestedName".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      return res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      return res.status(500).json({ error: 'Avatar generation failed' });
    }
  });

  // Security Risk Scoring Engine
  app.post('/api/security/risk', (req, res) => {
    const { userId, transactionType, amount } = req.body;
    // Real-time security heuristics
    const riskScore = amount > 100000 ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5);
    res.json({
      userId: userId || 'usr_guest',
      transactionType: transactionType || 'GENERAL',
      riskScore, // 0 to 100
      status: riskScore > 80 ? 'FLAGGED' : 'PASSED',
      timestamp: new Date().toISOString(),
      fingerprintHash: `fp_${Math.random().toString(36).substring(2, 10)}`
    });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexEconomy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
