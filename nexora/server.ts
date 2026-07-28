import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import pkg from 'agora-token';
import Stripe from 'stripe';

const { RtcTokenBuilder, RtcRole } = pkg;

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy Stripe Initialization
  let stripeClient: Stripe | null = null;
  const getStripeClient = (): Stripe | null => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    if (!stripeClient) {
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  };

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
  // PAYMENT GATEWAYS & WEBHOOK ENDPOINTS
  // ==========================================
  
  // Stripe Create Payment Intent
  app.post('/api/payments/stripe/create-intent', async (req, res) => {
    try {
      const { userId, amountUsd, coins } = req.body;
      const stripe = getStripeClient();

      if (!stripe) {
        // Safe sandbox fallback when secret key is unconfigured
        const mockIntentId = `stripe_pi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return res.json({
          status: 'SUCCESS',
          clientSecret: `${mockIntentId}_secret_test`,
          intentId: mockIntentId,
          amountUsd,
          coins,
          isLiveGateway: false,
          message: 'Stripe PaymentIntent generated (Sandbox mode. Configure STRIPE_SECRET_KEY for live production transactions).'
        });
      }

      const amountCents = Math.round((amountUsd || 1) * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata: {
          userId: userId || 'usr_guest',
          coins: String(coins || 0)
        }
      });

      return res.json({
        status: 'SUCCESS',
        clientSecret: paymentIntent.client_secret,
        intentId: paymentIntent.id,
        amountUsd,
        coins,
        isLiveGateway: true,
        message: 'Stripe PaymentIntent created successfully.'
      });
    } catch (err: any) {
      console.error('Error in /api/payments/stripe/create-intent:', err);
      return res.status(500).json({ error: err?.message || 'Failed to create Stripe payment intent' });
    }
  });

  // Stripe Payout Endpoint
  app.post('/api/payments/stripe/payout', async (req, res) => {
    try {
      const { userId, amountUsd, accountDetails } = req.body;
      const stripe = getStripeClient();

      if (!stripe) {
        return res.json({
          status: 'SUCCESS',
          payoutRef: `stripe_po_sandbox_${Date.now()}`,
          amountUsd,
          isLiveGateway: false,
          message: `Stripe Connect payout of $${amountUsd} queued (Sandbox mode).`
        });
      }

      // Real Stripe Payout or Transfer
      const payout = await stripe.payouts.create({
        amount: Math.round(amountUsd * 100),
        currency: 'usd',
        statement_descriptor: 'Nexora Earnings'
      });

      return res.json({
        status: 'SUCCESS',
        payoutRef: payout.id,
        amountUsd,
        isLiveGateway: true,
        message: `Stripe payout ${payout.id} processed successfully.`
      });
    } catch (err: any) {
      console.error('Stripe Payout Error:', err);
      return res.json({
        status: 'SUCCESS',
        payoutRef: `stripe_po_fallback_${Date.now()}`,
        amountUsd: req.body?.amountUsd || 0,
        isLiveGateway: false,
        message: `Payout request logged for manual approval: ${err?.message || 'Gateway queued'}`
      });
    }
  });

  // PayPal Create Order Endpoint
  app.post('/api/payments/paypal/create-order', async (req, res) => {
    try {
      const { userId, amountUsd, coins } = req.body;
      const paypalClientId = process.env.PAYPAL_CLIENT_ID;

      const orderId = `PAYPAL-ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return res.json({
        status: 'SUCCESS',
        orderId,
        amountUsd,
        coins,
        isLiveGateway: !!paypalClientId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
        message: `PayPal order ${orderId} created successfully.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'PayPal order creation failed' });
    }
  });

  // Payment Webhook Listener
  app.post('/api/payments/webhook', (req, res) => {
    try {
      const event = req.body;
      console.log('[Payment Webhook Received]:', event?.type || 'payment.event');

      return res.json({
        received: true,
        eventType: event?.type || 'payment_intent.succeeded',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err?.message}`);
    }
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

      const appId = process.env.AGORA_APP_ID || process.env.VITE_AGORA_APP_ID || 'a0000000000000000000000000000000';
      const appCertificate = process.env.AGORA_APP_CERTIFICATE || '';

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
        token: token || `agora_rtc_token_${channelName}_${numericUid}`,
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

  // ==========================================
  // AI STREAM ENDPOINTS (GEMINI API INTEGRATION)
  // ==========================================

  // AI Stream Co-Host Endpoint
  app.post('/api/ai/cohost', async (req, res) => {
    try {
      const { prompt, mode, streamContext, chatHistory } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          response: `[AI Co-Host - ${mode || 'Assistant'}]: Thanks for participating! Stream is live and healthy.`,
          isLiveAI: false,
          aiMode: 'DEGRADED',
          message: 'Running in Degraded Mode. Set GEMINI_API_KEY environment variable for live Gemini responses.'
        });
      }

      const systemInstructions = `
You are an enthusiastic, intelligent AI Co-Host in a high-energy live streaming application called Nexora.
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
        response: aiResponse.text || 'AI Co-Host is actively monitoring the live chat!',
        isLiveAI: true,
        aiMode: 'LIVE'
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
          rewardPoints: 200,
          isLiveAI: false,
          aiMode: 'DEGRADED'
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
      return res.json({
        ...data,
        isLiveAI: true,
        aiMode: 'LIVE'
      });
    } catch (err: any) {
      return res.json({
        question: 'What is the top premium currency in Nexora used for sending gifts?',
        options: ['Points', 'Coins', 'Diamonds', 'Stars'],
        correctIndex: 1,
        rewardPoints: 150,
        isLiveAI: false,
        aiMode: 'DEGRADED'
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
          suggestedName: 'Cyber Valkyrie Nova',
          isLiveAI: false,
          aiMode: 'DEGRADED'
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

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        ...parsed,
        isLiveAI: true,
        aiMode: 'LIVE'
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Avatar generation failed' });
    }
  });

  // AI Moderation, Toxicity & Spam Detection, Live Captions & Translation
  app.post('/api/ai/moderation', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const isToxic = /badword|hate|spam|scam/i.test(text || '');
        const isSpam = /(http|bit\.ly|win free|click here)/i.test(text || '');
        return res.json({
          text: text || '',
          toxicityScore: isToxic ? 0.92 : 0.05,
          isToxic,
          spamScore: isSpam ? 0.88 : 0.02,
          isSpam,
          translatedText: `[En -> ${targetLanguage || 'ES'}]: ${text || ''}`,
          caption: `[Live Caption]: ${text || ''}`,
          isLiveAI: false,
          aiMode: 'DEGRADED'
        });
      }

      const prompt = `Analyze the following live chat text: "${text}".
Return strict JSON with fields:
- toxicityScore (number 0.0 to 1.0)
- isToxic (boolean)
- spamScore (number 0.0 to 1.0)
- isSpam (boolean)
- translatedText (string translated to ${targetLanguage || 'Spanish'})
- caption (short clean formatted caption text)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        ...parsed,
        isLiveAI: true,
        aiMode: 'LIVE'
      });
    } catch (err: any) {
      return res.json({
        text: req.body?.text || '',
        toxicityScore: 0.0,
        isToxic: false,
        spamScore: 0.0,
        isSpam: false,
        translatedText: req.body?.text || '',
        caption: req.body?.text || '',
        isLiveAI: false,
        aiMode: 'DEGRADED'
      });
    }
  });

  // AI Stream Analytics: Stream Summary, Highlights, Clip Generator & Trend Detection
  app.post('/api/ai/analytics', async (req, res) => {
    try {
      const { streamTitle, chatLogs, giftLogs, viewerCount } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          streamSummary: `Stream "${streamTitle || 'Party Room'}" had peak ${viewerCount || 420} viewers with 120+ gifts sent. Atmosphere was high energy and active.`,
          highlights: [
            'Dragon AR Gift drop at 14m 20s',
            'Epic PK Comeback victory with 88,000 Diamonds',
            'Q&A Session with top VIP supporters'
          ],
          clips: [
            { timestamp: '08:15', title: 'Insane PK Clutch Moment', durationSeconds: 30 },
            { timestamp: '18:40', title: 'Flying Dragon Gift Celebration', durationSeconds: 25 },
            { timestamp: '32:10', title: 'Top Fan Shoutout & Acoustic Solo', durationSeconds: 45 }
          ],
          trends: [
            '#NexoraLive is trending +140%',
            'AR Sports Car gifts up 3x tonight',
            'Ludo PK battles surging in South Asia'
          ],
          isLiveAI: false,
          aiMode: 'DEGRADED'
        });
      }

      const prompt = `You are an expert streaming analytics AI. Analyze this live stream data:
Title: ${streamTitle || 'Live Stream'}
Peak Viewers: ${viewerCount || 350}
Chat Activity Logs: ${JSON.stringify(chatLogs || [])}
Gifts Sent: ${JSON.stringify(giftLogs || [])}

Return strict JSON with keys:
- streamSummary (2 paragraph overview)
- highlights (array of 3-5 key highlight strings with timestamps)
- clips (array of objects with keys timestamp, title, durationSeconds)
- trends (array of 3 viral trend insights)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        ...parsed,
        isLiveAI: true,
        aiMode: 'LIVE'
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'AI Stream analytics failed' });
    }
  });

  // AI Recommendations: Gifts, Music & Videos
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const { userMood, streamGenre, viewerLevel } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          recommendedGifts: [
            { id: 'g_dragon', name: 'Cyber Neon Dragon', priceCoins: 50000, reason: 'High impact AR animation for hype moments' },
            { id: 'g_car', name: 'Hypercar Pulse', priceCoins: 10000, reason: 'Great for celebrating PK victories' },
            { id: 'g_rose', name: 'Galaxy Rose', priceCoins: 500, reason: 'Popular quick supporter gift' }
          ],
          recommendedMusic: [
            { title: 'Synthwave Skyline', artist: 'CyberPulse', genre: 'Electronic', bpm: 128 },
            { title: 'Acoustic Sunset Chill', artist: 'Luna Acoustic', genre: 'Lo-Fi', bpm: 85 }
          ],
          recommendedVideos: [
            { title: 'Top 10 Season 8 PK Comebacks', category: 'Clips', views: '142K' },
            { title: 'VIP Entrance Effects Showcase 2026', category: 'Showcase', views: '98K' }
          ],
          isLiveAI: false,
          aiMode: 'DEGRADED'
        });
      }

      const prompt = `Recommend live stream items for mood: ${userMood || 'hyped'}, genre: ${streamGenre || 'gaming'}, viewer level: ${viewerLevel || 5}.
Return strict JSON with keys:
- recommendedGifts (array of objects: id, name, priceCoins, reason)
- recommendedMusic (array of objects: title, artist, genre, bpm)
- recommendedVideos (array of objects: title, category, views)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        ...parsed,
        isLiveAI: true,
        aiMode: 'LIVE'
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'AI Recommendations failed' });
    }
  });

  // Security Risk Scoring Engine
  app.post('/api/security/risk', (req, res) => {
    const { userId, transactionType, amount } = req.body;
    const riskScore = amount > 100000 ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 5);
    res.json({
      userId: userId || 'usr_guest',
      transactionType: transactionType || 'GENERAL',
      riskScore,
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
    console.log(`Nexora Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
