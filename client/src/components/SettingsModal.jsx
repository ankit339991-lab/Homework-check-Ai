import React, { useState, useEffect } from 'react';
import { X, Key, Sparkles, RefreshCw, Check, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  selectedModel,
  onSelectModel,
  curatedModels = [],
}) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [modelChoice, setModelChoice] = useState(selectedModel || 'free/gemini-3.8-flash');
  const [customModel, setCustomModel] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [liveModels, setLiveModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [saveToServer, setSaveToServer] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setInputKey(apiKey || '');
    setModelChoice(selectedModel || 'free/gemini-3.8-flash');
    if (selectedModel && !curatedModels.some(m => m.id === selectedModel)) {
      setIsCustom(true);
      setCustomModel(selectedModel);
    }
  }, [apiKey, selectedModel, curatedModels, isOpen]);

  if (!isOpen) return null;

  const handleFetchLiveModels = async () => {
    setIsLoadingModels(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/models', {
        headers: {
          'x-api-key': inputKey.trim(),
        },
      });
      const data = await res.json();
      if (data.models && Array.isArray(data.models)) {
        setLiveModels(data.models);
        setStatusMessage({
          type: 'success',
          text: `Fetched ${data.models.length} models directly from APInex!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.warning || 'Could not fetch live models. Using default list.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to connect: ' + err.message,
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = async () => {
    const finalModel = isCustom ? customModel.trim() : modelChoice;
    if (!inputKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid APInex API key.' });
      return;
    }

    onSaveApiKey(inputKey.trim());
    onSelectModel(finalModel);

    if (saveToServer) {
      try {
        const res = await fetch('/api/save-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: inputKey.trim(), model: finalModel }),
        });
        const d = await res.json();
        if (d.success) {
          setStatusMessage({ type: 'success', text: 'Saved to .env and browser storage!' });
        }
      } catch (e) {
        console.warn('Could not save to .env file', e);
      }
    }

    setStatusMessage({ type: 'success', text: 'Settings updated successfully!' });
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const availableModels = liveModels.length > 0 ? liveModels : curatedModels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
              <Key className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">APInex API & Model Configuration</h3>
              <p className="text-xs text-slate-300">Set your API Key & select free models</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {statusMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>APInex API Key</span>
                <span className="text-rose-500">*</span>
              </label>
              <a
                href="https://apinex.bond"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                Get Key from APInex <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="sk-apx..."
                className="w-full pl-3 pr-16 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 font-medium px-1.5 py-0.5 rounded bg-slate-100"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Keys typically start with <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">sk-apx...</code>
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select APInex Free Model</span>
              </label>

              <button
                type="button"
                onClick={handleFetchLiveModels}
                disabled={isLoadingModels || !inputKey.trim()}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-50"
                title="Query APInex server for all models"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                <span>Fetch Live Models</span>
              </button>
            </div>

            {!isCustom ? (
              <select
                value={modelChoice}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustom(true);
                  } else {
                    setModelChoice(e.target.value);
                  }
                }}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.id} {m.isFree ? '• (Free Tier)' : ''} {m.supportsVision ? '📸 Vision' : ''}
                  </option>
                ))}
                <option value="__custom__">⚙️ Enter Custom Model Name...</option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. gemini-2.5-flash or deepseek-v4.1-flash"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustom(false)}
                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                  >
                    Back to List
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Type any model identifier exactly as shown in your APInex dashboard.
                </p>
              </div>
            )}

            {/* Recommended Model Hint */}
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
              <span className="font-bold">Tip:</span>
              <span>
                For checking handwritten homework from <b>photos</b>, use models with vision support like <b>gemini-2.5-flash</b> or <b>gpt-6-luna</b>. For text-only math & logic, <b>deepseek-v4.1-flash</b> is extremely strong.
              </span>
            </div>
          </div>

          {/* Save to .env server checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToServer}
                onChange={(e) => setSaveToServer(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Also save API Key permanently to project .env file
              </span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition shadow-md shadow-indigo-200 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>

      </div>
    </div>
  );
}

