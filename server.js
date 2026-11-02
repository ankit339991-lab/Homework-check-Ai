import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const APINEX_BASE_URL = process.env.APINEX_BASE_URL || 'https://api.apinex.bond/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'homework-check-ai-secret-key-2026';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lccomphvhmsjuechhvnx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_AAVL1JfRQ30Io0iWhEKVfQ_NW4MI463';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// In serverless environments (like Vercel), __dirname might be read-only (/var/task),
// so we use /tmp for fallback if writing to local fails
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([]), 'utf8');
  }
} catch (e) {
  console.warn('Storage init note:', e.message);
}

// Helpers for reading/writing JSON DB
const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

const readHistory = () => {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
};

const writeHistory = (history) => {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
};

// Supported default free models on APInex (with actual free/ prefix)
const CURATED_FREE_MODELS = [
  { id: 'free/gemini-3.8-flash', name: 'Gemini 3.8 Flash (Free & Fast Vision)', supportsVision: true, isFree: true },
  { id: 'free/qwen-3.8-max', name: 'Qwen 3.8 MAX (Free)', supportsVision: true, isFree: true },
  { id: 'free/kimi-k3', name: 'Kimi K3 (Free)', supportsVision: false, isFree: true },
  { id: 'free/deepseek-v4.1-flash', name: 'DeepSeek v4.1 Flash (Free & High Logic)', supportsVision: false, isFree: true },
  { id: 'free/glm-5.3-flash', name: 'GLM-5.3 Flash (Free)', supportsVision: false, isFree: true },
  { id: 'free/gpt-6-luna', name: 'GPT-6 Luna (Free Multimodal)', supportsVision: true, isFree: true },
  { id: 'free/claude-sonnet-4.6', name: 'Claude Sonnet 4.6 (Free Tier)', supportsVision: true, isFree: true },
  { id: 'free/gemini-3.1-pro', name: 'Gemini 3.1 Pro (Free Vision & Deep Logic)', supportsVision: true, isFree: true },
];

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth Middleware (Optional or Required for history)
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    req.user = null;
  }
  next();
};

app.use(authMiddleware);

// --- AUTH ENDPOINTS (Powered by Supabase Auth with seamless fallback) ---

// Signup: name, phone (mobile number), email, password
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Please enter your mobile number.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    let supabaseUser = null;
    let supabaseError = null;

    // 1. Try registering user on Supabase Auth
    try {
      const sbResult = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: cleanName,
            phone: cleanPhone,
          },
        },
      });
      if (sbResult.data?.user) {
        supabaseUser = sbResult.data.user;
      }
      if (sbResult.error) {
        supabaseError = sbResult.error.message;
        console.warn('[Supabase Auth warning]:', sbResult.error.message);
      }
    } catch (sbErr) {
      console.warn('[Supabase signup exception]:', sbErr.message);
    }

    const userId = supabaseUser?.id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    // 2. Direct insert into Supabase 'profiles' table
    try {
      const { error: profileErr } = await supabase.from('profiles').upsert([
        {
          id: userId,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          created_at: new Date().toISOString(),
        },
      ]);
      if (profileErr) {
        console.warn('[Supabase profiles upsert warning]:', profileErr.message);
      } else {
        console.log('[Supabase] Successfully saved profile for:', cleanEmail);
      }
    } catch (profEx) {
      console.warn('[Supabase profiles exception]:', profEx.message);
    }

    // 3. Also save to local user store for fast lookups & offline resilience
    const users = readUsers();
    if (users.some((u) => u.email === cleanEmail && !supabaseUser)) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: userId,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password: hashedPassword,
      supabaseConnected: true,
      createdAt: new Date().toISOString(),
    };

    // If existing local record, update it with supabase ID
    const existingIdx = users.findIndex((u) => u.email === cleanEmail);
    if (existingIdx !== -1) {
      users[existingIdx] = newUser;
    } else {
      users.push(newUser);
    }
    writeUsers(users);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      token,
      supabaseConnected: Boolean(supabaseUser),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed: ' + err.message });
  }
});

// Login: email & password (or phone)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please provide email or mobile number.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Please provide password.' });
    }

    const identifier = email.trim().toLowerCase();

    // 1. Try Supabase Auth SignInWithPassword
    let sbSessionUser = null;
    try {
      const sbLogin = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });
      if (sbLogin.data?.user) {
        sbSessionUser = sbLogin.data.user;
      }
    } catch (e) {
      console.warn('[Supabase login notice]:', e.message);
    }

    // 2. Check local user database
    const users = readUsers();
    let user = users.find(
      (u) => u.email === identifier || u.phone === email.trim()
    );

    if (sbSessionUser && !user) {
      // Sync user profile from Supabase to local DB
      user = {
        id: sbSessionUser.id,
        name: sbSessionUser.user_metadata?.name || identifier.split('@')[0],
        phone: sbSessionUser.user_metadata?.phone || '',
        email: sbSessionUser.email,
        password: '',
        supabaseConnected: true,
        createdAt: sbSessionUser.created_at || new Date().toISOString(),
      };
      users.push(user);
      writeUsers(users);
    }

    if (!user && !sbSessionUser) {
      return res.status(400).json({ error: 'Account not found with this email/mobile number.' });
    }

    if (!sbSessionUser && user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect password. Please try again.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      supabaseConnected: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Current User Profile
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const users = readUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  });
});

// --- USER SAVED HOMEWORK / CHAT HISTORY ENDPOINTS ---

// Get user history
app.get('/api/user/history', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required to access saved history' });
  }
  const allHistory = readHistory();
  const userHistory = allHistory.filter((h) => h.userId === req.user.id);
  return res.json({ history: userHistory });
});

// Save homework item to user account
app.post('/api/user/history', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required to save history' });
  }
  const { id, subject, gradeLevel, checkMode, text, images, feedback, modelUsed, chatHistory } = req.body;

  const allHistory = readHistory();
  const newItem = {
    id: id || 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    userId: req.user.id,
    subject: subject || 'General',
    gradeLevel: gradeLevel || 'High School',
    checkMode: checkMode || 'correction',
    text: text || '',
    images: images || [],
    feedback: feedback || '',
    modelUsed: modelUsed || 'free/gemini-3.8-flash',
    chatHistory: chatHistory || [],
    timestamp: new Date().toISOString(),
  };

  allHistory.unshift(newItem);
  writeHistory(allHistory);

  return res.status(201).json({ success: true, item: newItem });
});

// Update chat conversation inside a history item
app.put('/api/user/history/:id/chat', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { id } = req.params;
  const { chatHistory } = req.body;

  const allHistory = readHistory();
  const index = allHistory.findIndex((h) => h.id === id && h.userId === req.user.id);
  if (index !== -1) {
    allHistory[index].chatHistory = chatHistory;
    writeHistory(allHistory);
    return res.json({ success: true, item: allHistory[index] });
  }
  return res.status(404).json({ error: 'History item not found' });
});

// Delete a history item
app.delete('/api/user/history/:id', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { id } = req.params;
  const allHistory = readHistory();
  const filtered = allHistory.filter((h) => !(h.id === id && h.userId === req.user.id));
  writeHistory(filtered);
  return res.json({ success: true });
});

// Clear all user history
app.delete('/api/user/history', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const allHistory = readHistory();
  const remaining = allHistory.filter((h) => h.userId !== req.user.id);
  writeHistory(remaining);
  return res.json({ success: true });
});

// --- SYSTEM & AI ENDPOINTS ---

// Health / Config endpoint
app.get('/api/config', (req, res) => {
  const hasKey = Boolean(process.env.APINEX_API_KEY && process.env.APINEX_API_KEY.trim().length > 0);
  const maskedKey = hasKey
    ? `${process.env.APINEX_API_KEY.slice(0, 7)}...${process.env.APINEX_API_KEY.slice(-4)}`
    : '';

  res.json({
    hasServerKey: hasKey,
    maskedKey,
    defaultModel: process.env.DEFAULT_MODEL || 'free/gemini-3.8-flash',
    baseUrl: APINEX_BASE_URL,
    curatedModels: CURATED_FREE_MODELS,
  });
});

// Save API key directly from web UI into .env
app.post('/api/save-key', (req, res) => {
  try {
    const { apiKey, model } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 5 || apiKey === '__SERVER_CONFIGURED__') {
      return res.status(400).json({ error: 'Valid API key is required' });
    }

    const cleanKey = apiKey.trim();
    const cleanModel = (model || process.env.DEFAULT_MODEL || 'free/gemini-3.8-flash').trim();

    process.env.APINEX_API_KEY = cleanKey;
    process.env.DEFAULT_MODEL = cleanModel;

    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const keyRegex = /^APINEX_API_KEY=.*$/m;
    const modelRegex = /^DEFAULT_MODEL=.*$/m;

    if (keyRegex.test(envContent)) {
      envContent = envContent.replace(keyRegex, `APINEX_API_KEY=${cleanKey}`);
    } else {
      envContent += `\nAPINEX_API_KEY=${cleanKey}`;
    }

    if (modelRegex.test(envContent)) {
      envContent = envContent.replace(modelRegex, `DEFAULT_MODEL=${cleanModel}`);
    } else {
      envContent += `\nDEFAULT_MODEL=${cleanModel}`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');

    return res.json({
      success: true,
      message: 'API Key successfully saved to server environment!',
      maskedKey: `${cleanKey.slice(0, 7)}...${cleanKey.slice(-4)}`,
      model: cleanModel,
    });
  } catch (err) {
    console.error('Error saving API key:', err);
    return res.status(500).json({ error: 'Failed to write .env file: ' + err.message });
  }
});

// Fetch live models from APInex
app.get('/api/models', async (req, res) => {
  const userKey = req.headers['x-api-key'] || process.env.APINEX_API_KEY;

  if (!userKey) {
    return res.json({
      models: CURATED_FREE_MODELS,
      source: 'offline_preset',
      message: 'No API key provided. Showing curated list of free models.',
    });
  }

  try {
    const response = await fetch(`${APINEX_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${userKey.trim()}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.json({
        models: CURATED_FREE_MODELS,
        source: 'fallback',
        warning: `Could not fetch live models from APInex (${response.status}): ${errText}`,
      });
    }

    const data = await response.json();
    const modelList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

    const formatted = modelList.map((m) => {
      const id = typeof m === 'string' ? m : m.id;
      const lower = id.toLowerCase();
      const isFree = lower.includes('free') || lower.includes('flash') || lower.includes('luna');
      const supportsVision = lower.includes('vision') || lower.includes('flash') || lower.includes('pro') || lower.includes('sonnet') || lower.includes('gpt-') || lower.includes('gemini') || lower.includes('max');
      return {
        id,
        name: id,
        supportsVision,
        isFree,
      };
    });

    return res.json({
      models: formatted.length > 0 ? formatted : CURATED_FREE_MODELS,
      source: 'live',
    });
  } catch (error) {
    return res.json({
      models: CURATED_FREE_MODELS,
      source: 'fallback',
      warning: error.message,
    });
  }
});

// Main Homework Checking Endpoint
app.post('/api/check-homework', async (req, res) => {
  try {
    const {
      text = '',
      images = [],
      subject = 'General',
      gradeLevel = 'High School',
      checkMode = 'correction',
      language = 'hinglish',
      apiKey,
      model,
      customInstructions = '',
    } = req.body;

    const activeApiKey = (apiKey || req.headers['x-api-key'] || process.env.APINEX_API_KEY || '').trim();

    if (!activeApiKey) {
      return res.status(401).json({
        error: 'APInex API Key missing. Please check your configuration in .env.',
        hint: 'You can get an API key from https://apinex.bond',
      });
    }

    if (!text.trim() && (!images || images.length === 0)) {
      return res.status(400).json({
        error: 'Please provide either a homework question in text or upload a photo/image of your homework.',
      });
    }

    let selectedModel = (model || process.env.DEFAULT_MODEL || 'free/gemini-3.8-flash').trim();
    // Auto-normalize if user passes legacy names without free/ prefix
    if (!selectedModel.startsWith('free/') && !selectedModel.startsWith('drex')) {
      const freeVariant = `free/${selectedModel}`;
      if (CURATED_FREE_MODELS.some((m) => m.id === freeVariant)) {
        selectedModel = freeVariant;
      }
    }

    const modeInstructions = {
      correction: 'Thoroughly review the student’s work. Identify every correct step and point out any error, explain why it happened, and provide the correct step-by-step resolution.',
      stepByStep: 'Solve the problem completely from scratch with clear, numbered, easy-to-understand steps, formulas, and explanations.',
      hint: 'Act as a Socratic tutor! Do NOT give the direct final answer immediately. Highlight where the student is right, point out where they went off track, and give hints/questions to help them solve it themselves.',
      rubric: 'Provide a teacher’s grading breakdown with a score out of 10, evaluating accuracy, method, presentation, and clarity, followed by actionable suggestions.',
    };

    const languageInstruction = {
      english: 'Respond in clear, encouraging, friendly English.',
      hindi: 'Respond in clear, polite Hindi (Devanagari script) with clear mathematical/technical terms.',
      hinglish: 'Respond in natural, conversational Hinglish (friendly Roman Urdu/Hindi mixed with English, commonly used by students in India), making it extremely engaging, polite, and easy to understand.',
    }[language] || 'Respond in natural, friendly Hinglish.';

    const systemPrompt = `You are "AI Homework Master", an expert, warm, patient, and world-class AI tutor and homework checker.
You can accurately read handwritten or typed homework from photos, solve complex math, physics, chemistry, biology, english essays, and computer science problems.

Subject: ${subject}
Grade/Class Level: ${gradeLevel}
Checking Mode: ${modeInstructions[checkMode] || modeInstructions.correction}
Language Style: ${languageInstruction}

${customInstructions ? `Special User Note: ${customInstructions}` : ''}

Output Format Requirements:
Use clean, beautiful Markdown formatting:
- Use KaTeX/LaTeX formatting for math: wrap inline formulas in $...$ and multi-line equations in $$...$$.
- Clearly organize your response into these sections:
  1. 📋 **Transcribed Question / Problem Summary**: What the homework is asking.
  2. 🎯 **Overall Assessment & Score**: Quick verdict (e.g., "10/10 Excellent", "7/10 Minor calculation mistake in Step 2", etc.).
  3. 🔍 **Step-by-Step Verification**: Walk through what the student wrote or what needs to be solved.
  4. ❌ **Mistakes & Misconceptions Found** (if any): Point out exactly which line/step has an issue and explain *why*.
  5. ✅ **Correct Full Solution**: Complete, clear, beautifully formatted solution with final boxed or bold answer.
  6. 💡 **Pro-Tips & Key Concepts**: 1-2 bullet points to remember for exams.

Be encouraging, respectful, and motivating! If handwriting in the photo is blurry or ambiguous, state what you interpreted and provide best guidance.`;

    const userContent = [];
    let promptText = '';
    if (text && text.trim()) {
      promptText += `Student Text / Question:\n${text.trim()}\n\n`;
    }
    if (images && images.length > 0) {
      promptText += `I have attached ${images.length} photo(s) of my homework. Please analyze the image(s) carefully, transcribe what is written, check my solution, and guide me.\n`;
    }
    userContent.push({
      type: 'text',
      text: promptText || 'Please check this homework problem.',
    });

    if (images && Array.isArray(images)) {
      for (const img of images) {
        let imageUrl = img;
        if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
          imageUrl = `data:image/jpeg;base64,${imageUrl}`;
        }
        userContent.push({
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        });
      }
    }

    const payload = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    };

    console.log(`[APInex Request] Calling ${APINEX_BASE_URL}/chat/completions with model: ${selectedModel}`);

    let apiResponse = null;
    let lastFetchError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        apiResponse = await fetch(`${APINEX_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeApiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        break;
      } catch (err) {
        lastFetchError = err;
        console.warn(`[APInex] Attempt ${attempt} failed: ${err.message}. ${attempt === 1 ? 'Retrying...' : ''}`);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    if (!apiResponse) {
      throw new Error(`Failed to reach APInex servers: ${lastFetchError?.message || 'Connection timeout'}`);
    }

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      let parsedError = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedError = errJson.error?.message || errJson.message || errorText;
      } catch (e) {
        // use raw text
      }

      console.error(`[APInex Error ${apiResponse.status}]:`, parsedError);

      let customAdvice = '';
      if (apiResponse.status === 401) {
        customAdvice = 'APInex API Key invalid ya expire ho chuka hai. Kripya apna sahi API key check karein.';
      } else if (apiResponse.status === 429) {
        customAdvice = 'Rate limit ya free quota reach ho gaya hai. Thodi der baad try karein ya koi doosra free model select karein.';
      } else if (apiResponse.status === 404 || parsedError.includes('model')) {
        customAdvice = `Model "${selectedModel}" is key par available nahi hai. Aap free models (jaise free/gemini-3.8-flash) select karein.`;
      }

      return res.status(apiResponse.status).json({
        error: parsedError,
        statusCode: apiResponse.status,
        advice: customAdvice,
      });
    }

    const completionData = await apiResponse.json();
    const resultText = completionData.choices?.[0]?.message?.content || 'No feedback could be generated.';

    // If user is logged in, auto-save to their server history
    let savedItem = null;
    if (req.user) {
      try {
        const allHistory = readHistory();
        savedItem = {
          id: 'hw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          userId: req.user.id,
          subject,
          gradeLevel,
          checkMode,
          text,
          images: images.map((img) => (typeof img === 'string' ? img.slice(0, 100) + '...' : img)),
          feedback: resultText,
          modelUsed: selectedModel,
          chatHistory: [
            { role: 'user', content: text || 'Homework photo checked' },
            { role: 'assistant', content: resultText },
          ],
          timestamp: new Date().toISOString(),
        };
        allHistory.unshift(savedItem);
        writeHistory(allHistory);
      } catch (saveErr) {
        console.warn('Failed to auto-save history:', saveErr);
      }
    }

    return res.json({
      success: true,
      modelUsed: selectedModel,
      feedback: resultText,
      historyItem: savedItem,
      usage: completionData.usage || null,
    });
  } catch (error) {
    console.error('Server error during homework check:', error);
    return res.status(500).json({
      error: 'Server error: ' + error.message,
    });
  }
});

// Follow-up chat endpoint
app.post('/api/follow-up', async (req, res) => {
  try {
    const { history = [], question, apiKey, model, historyId } = req.body;
    const activeApiKey = (apiKey || req.headers['x-api-key'] || process.env.APINEX_API_KEY || '').trim();

    if (!activeApiKey) {
      return res.status(401).json({ error: 'API Key missing' });
    }
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let selectedModel = (model || process.env.DEFAULT_MODEL || 'free/gemini-3.8-flash').trim();
    if (!selectedModel.startsWith('free/') && !selectedModel.startsWith('drex')) {
      const freeVariant = `free/${selectedModel}`;
      if (CURATED_FREE_MODELS.some((m) => m.id === freeVariant)) {
        selectedModel = freeVariant;
      }
    }

    const messages = [
      {
        role: 'system',
        content: 'You are AI Homework Master continuing a tutoring session with a student. Answer their follow-up questions clearly, encouragingly, and use LaTeX math formatting ($...$) for equations.',
      },
      ...history,
      {
        role: 'user',
        content: question,
      },
    ];

    const response = await fetch(`${APINEX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeApiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.4,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No reply.';

    // If user is logged in and historyId is provided, update chat in DB
    if (req.user && historyId) {
      try {
        const allHistory = readHistory();
        const item = allHistory.find((h) => h.id === historyId && h.userId === req.user.id);
        if (item) {
          item.chatHistory = [...(item.chatHistory || []), { role: 'user', content: question }, { role: 'assistant', content: reply }];
          writeHistory(allHistory);
        }
      } catch (dbErr) {
        console.warn('Could not update history chat:', dbErr);
      }
    }

    return res.json({
      reply,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Serve frontend if client/dist exists
const distPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Homework Check AI Server running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:5000`);
    console.log(`🔗 APInex Gateway: ${APINEX_BASE_URL}`);
    console.log(`===============================================`);
  });
}

export default app;
