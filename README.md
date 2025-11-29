# 🏃‍♂️ Striven Web App

<p align="center">
  <img src="https://via.placeholder.com/120x120.png?text=Striven+Logo" alt="Striven Logo" width="120"/>
</p>

<p align="center">
  <strong>A comprehensive, privacy-first fitness companion & PWA</strong><br>
  Built with <code>React</code>, <code>Vite</code>, <code>Tailwind CSS</code>, and <code>AI</code>.
</p>

<p align="center">
  <a href="https://striven.netlify.app/"><img src="https://img.shields.io/badge/Live_Demo-Netlify-success?style=flat-square&logo=netlify"></a>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square">
  <img src="https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react&logoColor=white">
</p>

---

## 📘 Table of Contents
- [Overview](#-overview)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [PWA Highlights](#-progressive-web-app-pwa-highlights)
- [Future Enhancements](#-future-enhancements)
- [Project Objectives](#-project-objectives)
- [Installation & Local Setup](#️-installation--local-setup)
- [Deployment](#-deployment)
- [Live Demo](#-live-demo)
- [Acknowledgements](#-acknowledgements)

---

## 📘 Overview

**Striven** is a robust, non-commercial fitness application designed to run entirely in the browser. Unlike simple step counters, Striven is a full-featured workout companion that combines real-time activity tracking with advanced workout planning and AI-powered nutrition analysis.

It prioritizes **data sovereignty**: all user data (workouts, history, logs) is stored locally on the device using IndexedDB. No accounts, no cloud servers, and no tracking.

---

## 🚀 Core Features

### 👟 Activity Tracking
- **Real-Time Pedometer**: Uses `DeviceMotionEvent` and Generic Sensor APIs for accurate step counting.
- **Live Metrics**: Tracks distance, calories burned, and active duration.
- **Apple-Style Rings**: Visual daily progress for Move, Exercise, and Stand goals.

### 🏋️‍♂️ Workout Organizer
- **Custom Plans**: Create and manage weekly workout routines.
- **Session Mode**: "Today's Workout" interface with built-in rest timers and set logging.
- **PR Tracking**: Automatically tracks Personal Records (1RM) for every exercise.
- **History**: Detailed logs of sets, reps, and weights.

### 🍎 AI Food Scanner
- **Smart Recognition**: Snap a photo of your meal to identify it using **Google Gemini Vision AI**.
- **Fallback Systems**: robust error handling with **Hugging Face** and **OpenFoodFacts** database fallbacks.
- **Macro Estimation**: Instantly estimates calories, protein, carbs, and fats.

### 📚 Exercise Library
- **Visual Database**: Searchable library with GIFs/Videos for thousands of exercises.
- **Smart Instructions**: Parsed step-by-step guides and "Pro Tips".
- **Filtering**: Filter by body part, category, or equipment.

### 🔒 Data Management
- **Local Storage**: Powered by **Dexie.js** (IndexedDB wrapper) for high-performance local data.
- **Backup & Restore**: Full JSON export/import functionality to move data between devices.

---

## 🧩 Tech Stack

| Category | Technology |
|-----------|-------------|
| **Frontend** | React.js (Vite) |
| **Styling** | Tailwind CSS, Framer Motion (Animations) |
| **State/Logic** | React Context API, Custom Hooks |
| **Database** | Dexie.js (IndexedDB) |
| **AI & Vision** | Google Gemini API, Hugging Face Inference API |
| **External Data** | ExerciseDB (RapidAPI), OpenFoodFacts |
| **Sensors** | DeviceMotionEvent, Accelerometer API |
| **PWA** | Service Workers, Manifest for installability |

---

## 📱 Progressive Web App (PWA) Highlights

- 🌐 **Offline Capable**: Core features work without internet access.
- 📲 **Installable**: Add to Home Screen on iOS and Android.
- ⚡ **Performance**: GPU-accelerated animations and memoized components for 60fps performance.

---

## 🛠️ Installation & Local Setup

To run Striven locally, you will need API keys for the external services (Google Gemini, RapidAPI, HuggingFace).

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/striven.git
   cd striven
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_RAPIDAPI_KEY=your_rapidapi_key
   VITE_GOOGLE_API_KEY=your_gemini_key
   VITE_HUGGINGFACE_API_KEY=your_huggingface_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 🔮 Future Enhancements

- ☁️ Optional encrypted cloud sync.
- ⌚ WearOS / WatchOS companion app.
- 🥗 Detailed macro nutrient breakdown charts.
- 🏆 Gamification and achievement system.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👏 Acknowledgements

- **Rodney Austria** - Creator & Lead Developer
- **ExerciseDB** - For the comprehensive workout data.
- **OpenFoodFacts** - For the open nutrition database.
