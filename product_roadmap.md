# Field Sales AI - Product Vision & Roadmap

## Business Context
**Goal:** Build a B2B SaaS product to bring "Call Center Intelligence" to "Face-to-Face Field Sales".
**Target Markets:** 
1.  **Used Car Dealerships** (Immediate Pilot)
2.  **New Car Dealerships** (Massive Scale)
3.  **Real Estate / Insurance** (Future Expansion)

**Pilot Case:** Used Car Dealership (User's business).
- **Volume:** ~25 walk-ins/day.
- **Team:** 9 Sales Reps.
- **Problem:** Data black hole in F2F interactions. Manual CRM entry is unreliable.

## Value Pillars
1.  **Monitoring:** QA for every interaction (compliance, script adherence).
2.  **Training:** "Game Tape" for sales coaching. Identify top performer patterns.
3.  **Automation:** Auto-fill CRM fields (Name, Budget, Stage) from voice. Eliminate data entry.

## Technical Architecture (The "Product" Version)

### 1. The Input (Mobile App)
*Current MVP: Manual file upload.*
**Future Product:**
- **Mobile App (iOS/Android):** Essential for field reps.
- **One-Tap Record:** Rep opens app -> Presses "New Walk-in" -> Recording starts.
- **Hardware Requirement (Critical):**
    - The phone's mic is mono and far away.
    - **Recommendation:** Bluetooth Lapel Mics (e.g., Rode Wireless) or dual-phone recording to ensure **Stereo Audio** (Rep on Left, Customer on Right). This solves the "Interruption/Diarization" problem definitively.

### 2. The Processing (Cloud Backend)
*Current MVP: Local Python Script.*
**Future Product:**
- **API Server:** FastAPI/Django to receive audio uploads securely.
- **Queue System:** Celery/Redis to handle 100s of simultaneous uploads without crashing.
- **Pipeline:**
    1.  **Ingest:** Receive Audio + Rep ID.
    2.  **Transcribe:** Deepgram (Hindi/English Model).
    3.  **Analyze:** GPT-4o (Extract JSON, Score Conversation 1-10, Flag "Missed Upsells").
    4.  **Sync:** Push JSON data to CRM (HubSpot, Salesforce, or Custom).

### 3. The Output (Admin Dashboard)
- **Rep Leaderboard:** Who handles the most walk-ins? Who has the highest sentiment score?
- **Deal Rooms:** Click a lead -> See the transcript + summary instantly.
- **Coaching Moments:** Auto-flag moments where the Rep missed a key question (e.g., "Did not ask for budget").

## Roadmap Phase 2 (Next Steps)
1.  **Backend API:** Move `main.py` logic into a simple API (`FastAPI`).
2.  **Database:** Set up a database (`PostgreSQL`) to save transcripts and analytics over time.
3.  **Frontend MVP:** A simple web page to view the list of analyzed calls.

## Business Model & API Economy
**Concern:** "Can I resell this if it uses OpenAI/Deepgram?"
**Answer:** **YES.** This is exactly how they make money.
- **Infrastructure vs. Product:** OpenAI and Deepgram are "Infrastructure" (like AWS or Electricity). You pay them for raw access.
- **Your Product:** You are selling the **Solution** (The App, The CRM Sync, The Dashboard, The Custom Prompts).
- **Value Add:** Your customers (other dealers) don't want to write Python scripts or manage API keys. They want a "Log Sales" button. You charge them a subscription ($X/month) that covers the API costs ($0.0X/call) + your profit.
