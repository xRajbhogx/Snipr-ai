# PLEASE DONT EVALUATE THIS PROJECT NOW, IT IS ALMOST DONE, JUST FEW FINAL TOUCHES ARE LEFT MY EXAMS ARE GOING ON AND I WILL COMPLETE IT BEFORE THE DEADLINE(i will update this readme also before 3rd June, then you can review)... THANKS FOR UNDERSTANDING ;D


# Snipr AI — Mobile Snippet Companion 🚀

Snipr AI is an offline-first developer vault application designed specifically for mobile platforms (iOS and Android). It enables developers to store, categorize, search, manage, and synchronise reusable code snippets and technical resources directly from their mobile devices, functioning seamlessly without an internet connection.

---

## 🛠️ Tech Stack

| Technology | Category | Purpose |
| :--- | :--- | :--- |
| **Expo SDK 55** | Framework | Cross-platform mobile development (Android & iOS) |
| **React Native** | Core | Native UI components and logic wrapper |
| **Expo Router** | Navigation | File-system based router navigation & Stack layouts |
| **Expo SQLite** | Database | Local SQL database client running synchronous CRUD queries |
| **React Native Reanimated** | Animations | Fluid layout animations, scaling cards, and Toast notifications |
| **Expo FileSystem** | File Management | Storing, reading, and exporting raw snippet files and screenshot assets |
| **Expo Image** | Media | High-performance screenshot caching and preview layouts |
| **AsyncStorage / SecureStore** | Preferences | Storing key preferences and secure API provider credentials |

---

## 💾 Database Schema Explanation

Snipr AI leverages a local SQLite database setup on startup via [migrations.ts](file:///d:/Mobile%20Dev%20Cohort/Snipr/src/services/db/migrations.ts). The schema consists of the **`snippets`** table and query indices.

### Table: `snippets`
- **`id`** (INTEGER, Primary Key): Unique autoincremented identifier.
- **`title`** (TEXT, Not Null): Snippet title.
- **`description`** (TEXT): Short summary of the snippet's purpose.
- **`code`** (TEXT, Not Null): Raw code content.
- **`language`** (TEXT, Not Null): Programming language target.
- **`tags`** (TEXT): Comma-separated search tag filters.
- **`favorite`** (INTEGER): Boolean flag (`0` or `1`) representingstarred status.
- **`file_path`** (TEXT): Location of the locally exported file path.
- **`screenshot_path`** (TEXT): Location of the associated screenshot attachment.
- **`ai_summary`** (TEXT): Concise AI-generated 1-sentence descriptor.
- **`ai_explanation`** (TEXT): AI-generated logical explanation (stored as structured JSON).
- **`ai_improvement`** (TEXT): AI-generated optimization tips (stored as structured JSON).
- **`ai_improved_code`** (TEXT): AI-refactored code snippet.
- **`created_at`** (INTEGER): Unix timestamp representing creation date.
- **`updated_at`** (INTEGER): Unix timestamp representing update date.

### Performance Indices
To guarantee sub-millisecond retrieval speeds, indices are created for common filter targets:
- `idx_language` on `language`
- `idx_favorite` on `favorite`
- `idx_title` on `title`
- `idx_created_at` on `created_at`

---

## 📶 Offline-First Architecture

Snipr AI runs completely offline, ensuring data remains accessible anytime.
- **Database Client**: Leverages SQLite running natively on the device, executing synchronous queries using SQLite's high-speed embedded engine.
- **Local Asset Management**: File attachments (like screenshot uploads) are copied from system pickers and stored permanently inside the app's local documents directory (`Documents/`).
- **Offline Preferences Cache**: Keeps AI configs and theme selections locally cached.

---

## 🧠 AI Integration Workflow

The AI assistant offers structured Logical Breakdowns, Code Optimizations, and Refactored Code.
1. **JSON Output Mode**: Directs AI providers (Gemini, Claude, OpenAI) to output strictly structured JSON matching schemas for logic steps, complexity badges, and optimizations suggestions.
2. **REST Call Routing**: Custom provider callers fetch endpoints directly using keys cached inside `SecureStore` (avoiding heavy external dependencies).
3. **JSON Parsing & Fallback Layouts**:
   - The UI parses AI responses. If valid JSON is detected, it renders modern native components (Overview cards, logic sequence indicators, time/space complexity badge boxes).
   - If parsing fails, it falls back to a Markdown parser that renders formatting dynamically (blockquotes as styled callout cards, bullets as round dots, and headers with vertical accents).

---

## 📁 File Management Implementation

- **Export Pipeline**: Translates raw code snippets into physical files (e.g. `.ts`, `.py`, `.json`) using `expo-file-system` and saves them in the application's local sandbox documents group.
- **Attachment Pipeline**: Handles saving and sharing images, loading fullscreen modal screens, and managing temporary files to optimize system memory footprint.

---

## 🌟 Bonus Features

- **☁️ Turso Cloud Sync**: Architected sync flow to connect local SQLite database with cloud databases using Turso whenever network availability returns.
- **📷 OCR Code Scanner**: Simulated OCR parser in snippet creation. Users can upload screenshots of code, prompting the app to run code-extraction and autofill the snippet workspace.
- **🔍 Dedicated AI Search screen**: Planned custom stack screen configuration for semantic search queries.
- **💬 Natural language query input**: Interface support to filter developer tags and codebase parameters using natural wording.

---

## 🚀 Setup & Run Instructions

### Prerequisites
Make sure you have Node.js and Bun (or npm) installed on your system.

### 1. Install Dependencies
Install packages and dependencies:
```bash
bun install
# or
npm install
```

### 2. Launch Developer Server
Start the local Expo development CLI:
```bash
bun run start
# or
npm run start
```
Use the terminal prompt key shortcuts to launch the project:
- Press **`a`** to launch on an Android Emulator
- Press **`i`** to launch on an iOS Simulator
- Scan the QR code using the Expo Go mobile app to preview natively

### 3. Clean Setup Reset
To clear database tables, documents caches, and async storage for a fresh mount:
```bash
bun run reset-project
```
