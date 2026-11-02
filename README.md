# 📚 Homework Check AI (Photo & Text) - APInex Edition

AI-powered Homework Checker & Tutor web application built with **React**, **Express**, **Tailwind CSS**, and **APInex API Gateway** (`https://api.apinex.bond/v1`).

---

## ✨ Features

- 📸 **Photo & Handwriting OCR**:
  - Drag & drop notebook photos, textbook problems, or question papers.
  - Paste screenshots directly with `Ctrl + V`.
  - Mobile & webcam snapshot support.
  - Automatic client-side image optimization and preview zoom.
- ✍️ **Text & Question Input**:
  - Type or paste questions and solutions.
  - Speech-to-Text (Voice input) for asking questions orally.
- ⚡ **APInex Free Tier Models**:
  - Pre-configured with APInex free models:
    - `gemini-2.5-flash` *(Free & Fast Vision - Recommended for photos)*
    - `deepseek-v4.1-flash` *(Free & Advanced Reasoning for Math & Logic)*
    - `gpt-6-luna` *(Free Multimodal)*
    - `claude-4.6-sonnet` *(Free Tier)*
    - `gemini-3.1-pro` *(Vision & Deep Step Reasoning)*
  - Live model fetcher (`Fetch Live Models`) to pull available free models directly from APInex.
  - Custom model ID support.
- 🎯 **Flexible Checking Modes**:
  - 🔍 **Find Mistakes**: Identifies line-by-line errors, explains why, and provides correct resolution.
  - 🔢 **Full Solver**: Solves problems completely step-by-step from scratch.
  - 💡 **Socratic Tutor**: Gives hints and questions without giving away the direct answer immediately.
  - 📝 **Teacher Grade & Rubric**: Scores out of 10 with actionable feedback.
- 🧮 **LaTeX / KaTeX Math Rendering**:
  - Crisp rendering of formulas, fractions, square roots, integrals, and scientific notation.
- 💬 **Follow-up Doubts Chat**:
  - Ask follow-up questions about any step of the solution.
- 💾 **Local History & Export**:
  - Saves checked homework to browser LocalStorage.
  - Copy solution, Print / Save as PDF, and Text-to-Speech (Listen aloud).
- 🌐 **Multi-language Support**:
  - Hinglish (Roman Hindi/English), Pure Hindi, and English.

---

## 🚀 Quick Start

### 1. Configure APInex API Key
You can add your key in one of two ways:

#### Option A: In the Web UI (Easiest)
1. Open the website at `http://localhost:5000`.
2. Click **"Enter APInex Key"** in the top right.
3. Paste your key (`sk-apx...`) and click **Save & Apply** (it will also automatically update your `.env` file).

#### Option B: In the `.env` file
Open `.env` in the root folder and add your key:
```env
APINEX_API_KEY=your_actual_apinex_key_here
APINEX_BASE_URL=https://api.apinex.bond/v1
DEFAULT_MODEL=gemini-2.5-flash
PORT=5000
```

---

### 2. Start the Server
Run:
```bash
npm start
```
Then open your browser at:
👉 **`http://localhost:5000`**

---

### 3. Development Mode (with Live Hot-Reloading)
If you wish to edit frontend code with instant Vite hot-reload:
```bash
npm run dev
```
- Frontend dev server: `http://localhost:5173`
- Backend API server: `http://localhost:5000`

