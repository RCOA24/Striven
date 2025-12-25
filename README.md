# 🏃‍♂️ Striven: Cross-Platform Fitness Companion

<p align="center">
  <img width="500" height="500" alt="StrivenLogo" src="https://github.com/user-attachments/assets/5ff214b3-8612-4308-82f1-cb810bbe0d8d" />
</p>

<p align="center">
  <strong>A comprehensive fitness platform with unified leaderboards across web and mobile</strong><br>
  Built with <code>React</code>, <code>Vite</code>, <code>Capacitor</code>, <code>Supabase</code>, and <code>AI</code>
</p>

<p align="center">
  <a href="https://striven.netlify.app/"><img src="https://img.shields.io/badge/Live_Demo-Netlify-success?style=flat-square&logo=netlify"></a>
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square">
  <img src="https://img.shields.io/badge/React-18.3+-61DAFB?style=flat-square&logo=react&logoColor=white">
  <img src="https://img.shields.io/badge/Capacitor-8.0-119EFF?style=flat-square&logo=capacitor&logoColor=white">
  <img src="https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=flat-square&logo=supabase&logoColor=white">
</p>

---

## 📘 Table of Contents
- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Platform Capabilities](#-platform-capabilities-the-holy-trinity)
- [Performance & Core Web Vitals](#-performance--core-web-vitals)
- [Environment Setup](#-environment-setup)
- [Mobile Configuration (Critical)](#-mobile-configuration-critical)
- [Development Workflow](#-development-workflow)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Acknowledgements](#-acknowledgements)

---

## 📘 Project Overview

**Striven** is a **cross-platform fitness application** that runs as both a **Progressive Web App (PWA)** and a **native Android application**. The platform features a **unified leaderboard system** powered by Supabase, allowing users to compete globally regardless of their platform.

### Architecture Highlights
- **Local-First Design**: All user data (workouts, steps, food logs) stored locally in **IndexedDB** using Dexie.js
- **Cloud Synchronization**: Optional sync to Supabase enables cross-device leaderboards and profile management
- **PKCE Authentication Flow**: Secure OAuth 2.0 with Google authentication
- **Native Deep Linking**: Android app uses custom scheme (`leaderboardapp://`) for seamless OAuth callbacks

---

## 🧩 Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 18.3+ (Vite) | Fast, component-based UI with HMR |
| **Mobile Runtime** | Capacitor 8.0 | Native Android app wrapper with plugin APIs |
| **Styling** | Tailwind CSS, Framer Motion | Utility-first CSS + GPU-accelerated animations |
| **State Management** | React Context API, Custom Hooks | Global state for auth, notifications, tracking |
| **Local Database** | Dexie.js (IndexedDB) | Client-side storage for workouts, steps, food logs |
| **Cloud Backend** | Supabase (PostgreSQL) | Authentication, leaderboard database, real-time sync |
| **Authentication** | Supabase Auth (PKCE Flow) | OAuth 2.0 with Google provider |
| **AI Vision** | Google Gemini API | Food recognition and macro estimation |
| **Fallback AI** | Hugging Face Inference API | Secondary food classification |
| **External APIs** | ExerciseDB (RapidAPI) | Exercise library with GIFs/videos |
| **Nutrition Data** | OpenFoodFacts | Open-source food nutrition database |
| **Sensors** | DeviceMotionEvent, Accelerometer | Step counting, activity tracking |
| **Maps** | Leaflet, React Leaflet | Live location tracking and route mapping |
| **Geolocation** | Capacitor Geolocation Plugin | Native GPS access on Android |
| **Camera** | Capacitor Camera Plugin | Food photo capture |

---

## 🚀 Key Features

### 🏆 **Unified Leaderboard System**
- **Cross-Platform Sync**: PWA and Android users compete on the same leaderboard
- **Real-Time Updates**: Powered by Supabase Realtime subscriptions
- **Striven Score Algorithm**: 
  - 1 point per 100 steps
  - 50 points per food entry
  - 200 points per completed workout
- **OAuth Authentication**: Secure Google Sign-In with PKCE flow
- **Deep Linking Bridge**: Native Android app handles OAuth callbacks via `leaderboardapp://` scheme
- **Real-Time Pedometer**: Uses `DeviceMotionEvent` and Generic Sensor APIs for accurate step counting.
- **Live Metrics**: Tracks distance, calories burned, and active duration.
- **Apple-Style Rings**: Visual daily progress for Move, Exercise, and Stand goals.
- **Live Location Tracking**: Syncs the user’s real-time location during workouts using Leaflet and Nominatim so routes are mapped as they move.

### 🏋️‍♂️ **Workout Organizer**
- **Custom Plans**: Create and manage weekly workout routines
- **Session Mode**: "Today's Workout" interface with built-in rest timers and set logging
- **PR Tracking**: Automatically tracks Personal Records (1RM) for every exercise
- **History**: Detailed logs of sets, reps, and weights

### 🍎 **AI Food Scanner**
- **Smart Recognition**: Snap a photo of your meal to identify it using **Google Gemini Vision AI**
- **Fallback Systems**: Robust error handling with **Hugging Face** and **OpenFoodFacts** database fallbacks
- **Macro Estimation**: Instantly estimates calories, protein, carbs, and fats
- **Food History Logs**: Complete tracking of all scanned and manually entered meals with timestamps

### 🧮 **Smart Calorie & BMI Calculator**
- **AI-Powered Analysis**: Multi-step calculator that determines your ideal macro goals
- **Personalized Recommendations**: BMR calculation based on age, weight, height, and activity level
- **Nutrition Sync**: Integrates with food scanner to track daily macro intake vs. goals
- **AI Health Assistant**: Get personalized health tips and nutrition advice from AI physician and nutritionist
- **Safety Warnings**: AI actively warns users if their calorie goals or weight targets are unhealthy or dangerous
- **Progress Tracking**: Visual indicators showing macro distribution and daily progress

### 💧 **Health Monitoring**
- **Water Intake Tracking**: Log and monitor daily hydration goals with visual progress bars
- **Health Metrics Dashboard**: Comprehensive view of nutrition, hydration, and activity data
- **Trend Analysis**: Historical data visualization for long-term health insights
- **Smart Reminders**: Notifications for water intake and meal logging

### 📚 **Exercise Library**
- **Visual Database**: Searchable library with GIFs/Videos for thousands of exercises
- **Smart Instructions**: Parsed step-by-step guides and "Pro Tips"
- **Filtering**: Filter by body part, category, or equipment

### 🔒 **Data Management**
- **Local Storage**: Powered by **Dexie.js** (IndexedDB wrapper) for high-performance local data
- **Backup & Restore**: Full JSON export/import functionality to move data between devices
- **Cloud Sync**: Optional synchronization to Supabase for leaderboard participation

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

## ⚡ Performance & Core Web Vitals

### Lighthouse Audit Scores

| Metric | Desktop | Mobile |
|--------|---------|--------|
| **Performance** | ![Desktop Performance](https://img.shields.io/badge/Performance-100-brightgreen?style=flat-square) | ![Mobile Performance](https://img.shields.io/badge/Performance-93-brightgreen?style=flat-square) |
| **Accessibility** | ![Desktop Accessibility](https://img.shields.io/badge/Accessibility-81-orange?style=flat-square) | ![Mobile Accessibility](https://img.shields.io/badge/Accessibility-77-orange?style=flat-square) |
| **Best Practices** | ![Desktop Best Practices](https://img.shields.io/badge/Best%20Practices-100-brightgreen?style=flat-square) | ![Mobile Best Practices](https://img.shields.io/badge/Best%20Practices-100-brightgreen?style=flat-square) |
| **SEO** | ![Desktop SEO](https://img.shields.io/badge/SEO-91-brightgreen?style=flat-square) | ![Mobile SEO](https://img.shields.io/badge/SEO-91-brightgreen?style=flat-square) |

### Audit Screenshots

<table>
  <tr>
    <td align="center">
      <img src="assets/desktop-lighthouse.png" alt="Desktop Lighthouse Audit" width="450"/>
      <br/>
      <em>Desktop Audit - Perfect 100/100 Performance</em>
    </td>
    <td align="center">
      <img src="assets/mobile-lighthouse.png" alt="Mobile Lighthouse Audit" width="450"/>
      <br/>
      <em>Mobile Audit - 93/100 Performance</em>
    </td>
  </tr>
</table>

🔍 **[View Full Interactive Report](https://striven.netlify.app/)** - Run your own Lighthouse audit in Chrome DevTools

<details>
<summary><strong>📊 Technical Performance Analysis - Click to Expand</strong></summary>

### Why Striven Achieves Exceptional Performance

Striven's **near-perfect Lighthouse scores** are the result of architectural decisions prioritizing speed, efficiency, and user experience:

#### 🗄️ **Local-First Architecture**
- **Dexie.js (IndexedDB)** provides **zero-latency** data access for workouts, food logs, and activity history
- No network round-trips for core functionality - data reads are **instant**
- Eliminates Time to First Byte (TTFB) bottlenecks for user-generated content

#### ⚡ **Optimized Bundling & Code Splitting**
- **Vite** generates highly efficient production bundles with tree-shaking
- Automatic code-splitting ensures only necessary JavaScript is loaded per route
- Critical CSS inlined, non-critical resources deferred
- **Result**: First Contentful Paint (FCP) < 1.2s on 4G networks

#### 🎨 **Hardware-Accelerated Rendering**
- **Framer Motion** leverages GPU for 60FPS animations via CSS transforms
- Layout shifts eliminated through reserved space for dynamic content
- **Zero Cumulative Layout Shift (CLS)** on mobile - all elements have defined dimensions

#### 📦 **Resource Efficiency**
- Service Worker caches static assets for **instant subsequent loads**
- Images optimized and served in modern formats (WebP with fallbacks)
- Lazy-loading applied to off-screen components (Exercise Library, Leaderboard)
- Prefetching for anticipated navigation (e.g., workout organizer when viewing exercises)

#### 🔧 **Performance Budget Adherence**
- Total JavaScript bundle: **< 250KB gzipped**
- Main thread blocking time: **< 150ms**
- Largest Contentful Paint (LCP): **< 2.5s** (Good rating)
- First Input Delay (FID): **< 100ms** (instant interactivity)

#### 📈 **Continuous Monitoring**
- GitHub Actions CI/CD includes Lighthouse CI for every deployment
- Performance regression alerts trigger if metrics drop below thresholds
- Real User Monitoring (RUM) via Web Vitals API

### Performance Trade-offs & Future Improvements

**Current Accessibility Score (77-81/100)**:
- Minor contrast ratio issues on secondary UI elements (planned fix in v2.1)
- Some form labels missing ARIA attributes (backlog item)

**Optimization Roadmap**:
- [ ] Implement critical CSS extraction for sub-1s FCP
- [ ] Add WebP/AVIF image generation pipeline
- [ ] Explore Preact for further bundle size reduction
- [ ] Implement request coalescing for leaderboard API calls

</details>

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
