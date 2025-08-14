# TDX360 Chatbot

A full-stack chatbot assistant built with a **Node.js backend** and a **React frontend**, using Hugging Face for AI-powered intent detection and Supabase as a vector database.

## 📂 Project Structure

```
TDX360-CHATBOT/
├── backend/               # Backend code
│   ├── data/              # Data seeds
│   ├── lib/               # Utility clients (Hugging Face, Supabase)
│   ├── services/          # Business logic
│   ├── .env               # Environment variables (not committed)
│   ├── index.js           # Backend entry point
│   ├── intents.js         # Intent detection logic
│   ├── prompts.js         # Prompt templates
│   ├── seed.js            # DB seeding script
│   └── package.json
│
├── frontend/              # Frontend code
│   ├── src/               # React components
│   ├── .env               # Environment variables (not committed)
│   ├── index.html         # Main HTML file
│   └── package.json
│
└── README.md              # Project documentation
```

## 🚀 Features
- AI-powered intent detection using Hugging Face models.
- Supabase vector database for semantic search.
- Frontend built with React for chatbot UI.
- Backend built with Node.js/Express.
- Modular service-based architecture.

## 🛠 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/tdx360-chatbot.git
cd tdx360-chatbot
```

### 2️⃣ Install dependencies

**Backend**
```bash
cd backend
npm install
```

**Frontend**
```bash
cd ../frontend
npm install
```

### 3️⃣ Environment Variables

Create `.env` files in **both backend** and **frontend** based on `.env.example`.

### 4️⃣ Run the project

**Backend**
```bash
cd backend
npm start
```

**Frontend**
```bash
cd frontend
npm run dev
```

## 📦 Seeding Data
To seed your vector database:
```bash
cd backend
node seed.js
```
