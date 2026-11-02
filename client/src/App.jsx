import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import SettingsModal from './components/SettingsModal';
import ImageUpload from './components/ImageUpload';
import MarkdownRenderer from './components/MarkdownRenderer';
import HistoryDrawer from './components/HistoryDrawer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import confetti from 'canvas-confetti';
import {
  Send,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Printer,
  Volume2,
  VolumeX,
  MessageSquare,
  AlertCircle,
  Lightbulb,
  FileCheck,
  CheckCircle,
  GraduationCap,
  Mic,
  MicOff,
  ChevronDown,
  UserCheck
} from 'lucide-react';

const SAMPLE_PROBLEMS = [
  {
    title: '📐 Math: Quadratic Equation',
    subject: 'Mathematics',
    gradeLevel: 'High School (9-10)',
    checkMode: 'correction',
    text: `Please check my solution for the quadratic equation:
2x² + 5x - 3 = 0

My steps:
Step 1: a = 2, b = 5, c = -3
Step 2: Discriminant D = b² - 4ac = 5² - 4(2)(-3) = 25 - 24 = 1
Step 3: x = (-b ± √D) / 2a = (-5 ± 1) / 4
Step 4: x = (-5 + 1)/4 = -1  and  x = (-5 - 1)/4 = -1.5

Did I make any mistake in Step 2 or Step 4?`,
  },
  {
    title: '🍎 Physics: Kinematics Motion',
    subject: 'Physics',
    gradeLevel: 'Senior High (11-12)',
    checkMode: 'correction',
    text: `A car accelerates uniformly from rest to a speed of 20 m/s in 5 seconds.
Calculate the distance covered during this time.

My work:
Initial velocity u = 0 m/s
Final velocity v = 20 m/s
Time t = 5 s
Acceleration a = (v - u) / t = 20 / 5 = 4 m/s²
Distance s = v * t = 20 * 5 = 100 meters.

Is my distance calculation correct or did I use the wrong formula?`,
  },
  {
    title: '✍️ English: Essay Paragraph Check',
    subject: 'English & Essay',
    gradeLevel: 'High School (9-10)',
    checkMode: 'rubric',
    text: `Please proofread and grade my essay opening paragraph:
"Social media have a huge impact on students today. Most teenagers spends more than five hours daily on their phones which affects their academic grades. If student does not manage their time properly, they might suffers from stress and sleep deprivation."

Please suggest grammar improvements and vocabulary enhancements.`,
  },
  {
    title: '🧪 Chemistry: Chemical Balancing',
    subject: 'Chemistry',
    gradeLevel: 'High School (9-10)',
    checkMode: 'stepByStep',
    text: `Balance this equation and explain step by step:
Fe + O2 -> Fe2O3
Also calculate the molar mass of Fe2O3 (Fe = 56, O = 16).`,
  },
];

export default function App() {
  // App Config & Settings
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('APINEX_API_KEY') || '');
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('APINEX_MODEL');
    if (!saved || saved === 'gemini-2.5-flash') return 'free/gemini-3.8-flash';
    return saved;
  });
  const [curatedModels, setCuratedModels] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('APP_LANG') || 'hinglish');

  // User Auth State
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('USER_DATA');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('AUTH_TOKEN') || '');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Form State
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [subject, setSubject] = useState('Mathematics');
  const [gradeLevel, setGradeLevel] = useState('High School (9-10)');
  const [checkMode, setCheckMode] = useState('correction');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Results & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Follow-up Q&A
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Homework History (Cloud or LocalStorage)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('HOMEWORK_HISTORY');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Voice recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize server config on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.curatedModels) setCuratedModels(data.curatedModels);
        if (!apiKey && data.hasServerKey) {
          setApiKey('__SERVER_CONFIGURED__');
        }
        if (!localStorage.getItem('APINEX_MODEL') && data.defaultModel) {
          setSelectedModel(data.defaultModel);
        }
      })
      .catch((err) => console.log('Config check:', err));
  }, []);

  // Fetch user profile and user history if token exists
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token expired');
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('USER_DATA', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          // Token expired, clear
          setUser(null);
          setAuthToken('');
          localStorage.removeItem('AUTH_TOKEN');
          localStorage.removeItem('USER_DATA');
        });

      // Load user cloud history
      fetch('/api/user/history', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.history && Array.isArray(data.history)) {
            setHistory(data.history);
          }
        })
        .catch((err) => console.log('Could not load user cloud history:', err));
    }
  }, [authToken]);

  // Listen for global clipboard paste for images (Ctrl+V anywhere)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setImages((prev) => [
                ...prev,
                {
                  dataUrl: event.target.result,
                  name: 'Pasted Screenshot ' + (prev.length + 1),
                  size: Math.round(event.target.result.length * 0.75 / 1024) + ' KB',
                },
              ]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Setup Speech-to-Text if available
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = language === 'hindi' ? 'hi-IN' : 'en-US';

      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recog.onerror = () => setIsListening(false);
      recog.onend = () => setIsListening(false);

      recognitionRef.current = recog;
    }
  }, [language]);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('APINEX_API_KEY', key);
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    localStorage.setItem('APINEX_MODEL', model);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('APP_LANG', lang);
  };

  const loadSample = (sample) => {
    setText(sample.text);
    setSubject(sample.subject);
    setGradeLevel(sample.gradeLevel);
    setCheckMode(sample.checkMode);
    setImages([]);
  };

  const handleAuthSuccess = (loggedInUser, token) => {
    setUser(loggedInUser);
    setAuthToken(token);
    // Fetch cloud history for this user
    fetch('/api/user/history', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => {
        if (d.history) setHistory(d.history);
      })
      .catch(console.warn);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken('');
    localStorage.removeItem('AUTH_TOKEN');
    localStorage.removeItem('USER_DATA');
    setIsProfileOpen(false);
    // Reload local history
    try {
      const saved = localStorage.getItem('HOMEWORK_HISTORY');
      setHistory(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setHistory([]);
    }
  };

  const handleCheckHomework = async (e) => {
    if (e) e.preventDefault();

    if (!text.trim() && images.length === 0) {
      setError('Kripya apna homework text me likhein ya photo upload karein!');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setChatHistory([]);
    setActiveHistoryId(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (apiKey && apiKey !== '__SERVER_CONFIGURED__') {
        headers['x-api-key'] = apiKey;
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/check-homework', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          images: images.map((img) => img.dataUrl),
          subject,
          gradeLevel,
          checkMode,
          language,
          model: selectedModel,
          customInstructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.advice || 'Failed to check homework.');
      }

      setResult(data);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      const initialChat = [
        {
          role: 'user',
          content: `Subject: ${subject}, Level: ${gradeLevel}\nHomework: ${text}`,
        },
        {
          role: 'assistant',
          content: data.feedback,
        },
      ];
      setChatHistory(initialChat);

      if (data.historyItem) {
        setActiveHistoryId(data.historyItem.id);
        setHistory((prev) => [data.historyItem, ...prev]);
      } else {
        const localItem = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          subject,
          gradeLevel,
          checkMode,
          text,
          images: images.map((img) => ({ name: img.name, dataUrl: img.dataUrl })),
          feedback: data.feedback,
          modelUsed: data.modelUsed,
          chatHistory: initialChat,
        };
        const updated = [localItem, ...history.slice(0, 24)];
        setHistory(updated);
        localStorage.setItem('HOMEWORK_HISTORY', JSON.stringify(updated));
        setActiveHistoryId(localItem.id);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || isFollowUpLoading) return;

    const q = followUpQuestion.trim();
    setFollowUpQuestion('');
    setIsFollowUpLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey !== '__SERVER_CONFIGURED__') {
        headers['x-api-key'] = apiKey;
      }
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          history: chatHistory,
          question: q,
          model: selectedModel,
          historyId: activeHistoryId,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Follow-up failed');

      const updatedChat = [
        ...chatHistory,
        { role: 'user', content: q },
        { role: 'assistant', content: d.reply },
      ];
      setChatHistory(updatedChat);

      // If item was local, update local storage history too
      if (!authToken && activeHistoryId) {
        const updatedHistory = history.map((h) =>
          h.id === activeHistoryId ? { ...h, chatHistory: updatedChat } : h
        );
        setHistory(updatedHistory);
        localStorage.setItem('HOMEWORK_HISTORY', JSON.stringify(updatedHistory));
      }
    } catch (err) {
      alert('Could not get answer to follow-up: ' + err.message);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.feedback) return;
    navigator.clipboard.writeText(result.feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text to speech not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!result?.feedback) return;
      const cleanText = result.feedback.replace(/[#*_`$]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const restoreFromHistory = (item) => {
    setText(item.text || '');
    setSubject(item.subject || 'Mathematics');
    setGradeLevel(item.gradeLevel || 'High School (9-10)');
    setCheckMode(item.checkMode || 'correction');
    setImages(item.images || []);
    setActiveHistoryId(item.id);
    setResult({
      feedback: item.feedback,
      modelUsed: item.modelUsed,
      success: true,
    });
    setChatHistory(
      item.chatHistory && item.chatHistory.length > 0
        ? item.chatHistory
        : [
            { role: 'user', content: item.text },
            { role: 'assistant', content: item.feedback },
          ]
    );
  };

  const clearAllHistory = async () => {
    if (window.confirm('Are you sure you want to clear your checked homework history?')) {
      if (authToken) {
        try {
          await fetch('/api/user/history', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          });
        } catch (e) {
          console.warn(e);
        }
      }
      setHistory([]);
      localStorage.removeItem('HOMEWORK_HISTORY');
    }
  };

  const deleteHistoryItem = async (id) => {
    if (authToken) {
      try {
        await fetch(`/api/user/history/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        console.warn(e);
      }
    }
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    if (!authToken) {
      localStorage.setItem('HOMEWORK_HISTORY', JSON.stringify(updated));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar with Profile / Login button */}
      <Navbar
        selectedModel={selectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        language={language}
        onLanguageChange={handleLanguageChange}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
            <GraduationCap className="w-80 h-80" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Free AI Homework Tutor & Error Checker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Check Your Homework with Photo & Text
            </h1>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Upload a photo of your notebook or type your question. AI detects mistakes, explains the exact error, and gives step-by-step guidance powered by APInex free models.
            </p>

            {user && (
              <div className="pt-1 flex items-center gap-2 text-xs text-indigo-200">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Logged in as <b>{user.name}</b> • Homework checks are automatically saved to your account!</span>
              </div>
            )}
          </div>

          {/* Quick sample chips */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-indigo-200 font-medium">Try a sample:</span>
            {SAMPLE_PROBLEMS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(sample)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/10 shadow-2xs"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Check Error</p>
                <p className="text-xs mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout: Left Form, Right Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            
            <form onSubmit={handleCheckHomework} className="space-y-4">
              
              {/* Mode Selection Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                  Checking Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'correction', label: '🔍 Find Mistakes', desc: 'Step-by-step verification' },
                    { id: 'stepByStep', label: '🔢 Full Solver', desc: 'Clear solution from scratch' },
                    { id: 'hint', label: '💡 Socratic Hint', desc: 'Guide me without giving answer' },
                    { id: 'rubric', label: '📝 Teacher Grade', desc: 'Score & rubric evaluation' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCheckMode(m.id)}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                        checkMode === m.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject & Grade Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="subject-select" className="text-xs font-semibold text-slate-700 mb-1 block">Subject</label>
                  <select
                    id="subject-select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Mathematics">📐 Mathematics</option>
                    <option value="Physics">⚡ Physics</option>
                    <option value="Chemistry">🧪 Chemistry</option>
                    <option value="Biology">🧬 Biology</option>
                    <option value="English & Essay">✍️ English / Essay</option>
                    <option value="Computer Science">💻 Computer Science</option>
                    <option value="History">🏛️ History / Social</option>
                    <option value="General">📚 General Homework</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="grade-select" className="text-xs font-semibold text-slate-700 mb-1 block">Class / Grade</label>
                  <select
                    id="grade-select"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Elementary (Class 1-5)">Class 1 - 5 (Elementary)</option>
                    <option value="Middle School (Class 6-8)">Class 6 - 8 (Middle)</option>
                    <option value="High School (Class 9-10)">Class 9 - 10 (Secondary)</option>
                    <option value="Senior High (Class 11-12)">Class 11 - 12 (Higher Sec)</option>
                    <option value="College / University">College / University</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Component */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Homework Photo(s)</span>
                  <span className="text-[11px] font-normal text-slate-400">Optional if text provided</span>
                </label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  disabled={isLoading}
                />
              </div>

              {/* Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Question / Typed Solution / Doubt
                  </label>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Voice to text */}
                    <button
                      type="button"
                      onClick={toggleSpeech}
                      className={`p-1 rounded-lg text-xs flex items-center gap-1 transition ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      title={isListening ? 'Stop listening' : 'Speak homework'}
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{isListening ? 'Listening...' : 'Voice'}</span>
                    </button>

                    {text && (
                      <button
                        type="button"
                        onClick={() => setText('')}
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type the homework question, paste your essay, or describe what step you want checked..."
                  rows={4}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-y"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleCheckHomework();
                    }
                  }}
                />
              </div>

              {/* Advanced Options Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  <span>Custom instructions (e.g. strict teacher, exam rubric)</span>
                </button>

                {showAdvanced && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g. Focus on CBSE marking scheme, check sig figs, etc."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (!text.trim() && images.length === 0)}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] transition shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Homework...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Check Homework Now</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-sans border">Ctrl+Enter</kbd> to check anytime
              </p>

            </form>

          </div>

          {/* Right Panel: Result & Tutoring Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* If no check yet & not loading */}
            {!result && !isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Ready to Check Your Homework</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload a photo of your notebook or write your questions on the left. The AI will inspect every step, point out calculation or conceptual errors, and guide you clearly.
                  </p>
                </div>

                {/* Features highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left max-w-lg mx-auto">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                      <span>📸 Photo OCR</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Reads notebook handwriting, diagrams & prints</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <span>❌ Error Detection</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Explains why a mistake occurred and how to fix it</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-violet-600 font-bold text-xs flex items-center gap-1">
                      <span>⚡ Free APInex</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Uses free tier models with daily token allowance</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
                  <div className="h-6 bg-slate-200 rounded-full w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-5/6" />
                  <div className="h-4 bg-slate-200 rounded w-4/6" />
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div className="text-xs text-indigo-900 font-medium">
                    AI Homework Master is reading your homework & verifying mathematical formulas...
                  </div>
                </div>
                <div className="h-32 bg-slate-100 rounded-xl" />
              </div>
            )}

            {/* Result Content */}
            {result && !isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                
                {/* Result Header Bar */}
                <div className="p-4 sm:px-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-white">Homework Analysis & Solution</h2>
                      <p className="text-[11px] text-slate-300">
                        Generated by <span className="font-mono text-indigo-300">{result.modelUsed}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 no-print">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1"
                      title="Copy Solution"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleSpeak}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                        isSpeaking
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title={isSpeaking ? 'Stop voice' : 'Read aloud'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1"
                      title="Print or Save PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Print / PDF</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Feedback Body */}
                <div className="p-6 sm:p-8">
                  <MarkdownRenderer content={result.feedback} />
                </div>

                {/* Follow-up Q&A Chat */}
                <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4 no-print">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-xs text-slate-800">
                      Have a doubt about this step? Ask a follow-up question:
                    </h4>
                  </div>

                  {/* Previous conversation turns */}
                  {chatHistory.length > 2 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200">
                      {chatHistory.slice(2).map((msg, i) => (
                        <div
                          key={i}
                          className={`text-xs p-2.5 rounded-xl leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-indigo-50 text-indigo-900 font-semibold ml-6 border border-indigo-100'
                              : 'bg-slate-50 text-slate-800 mr-6 border border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                            {msg.role === 'user' ? 'You' : 'AI Tutor'}
                          </div>
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleFollowUp} className="flex gap-2">
                    <input
                      type="text"
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      placeholder="e.g. Why did you use negative sign in formula? Can you explain Step 3 again?"
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="submit"
                      disabled={isFollowUpLoading || !followUpQuestion.trim()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isFollowUpLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Ask Doubt</span>
                    </button>
                  </form>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
        historyCount={history.length}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        curatedModels={curatedModels}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={restoreFromHistory}
        onClearHistory={clearAllHistory}
        onDeleteHistoryItem={deleteHistoryItem}
        user={user}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          Built for Students & Educators • Integrated with APInex AI Gateway • Supports Photo & Text
        </div>
      </footer>

    </div>
  );
}
