# CrushBot Backend Implementation Guide

## Overview
This document provides backend implementation examples for CrushBot when you're ready to add:
- Server-side scoring (ML models)
- Analytics dashboard
- User data persistence
- A/B testing

---

## Option 1: Node.js + Express + PostgreSQL

### Project Structure
```
crushbot-backend/
├── server.js           # Express app
├── routes/
│   ├── analyze.js      # POST /api/analyze
│   └── feedback.js     # POST /api/feedback
├── models/
│   ├── scoring.js      # Rule-based logic
│   └── ml-model.js     # Future ML integration
├── database/
│   └── schema.sql      # PostgreSQL schema
└── package.json
```

### Installation
```bash
npm init -y
npm install express cors pg body-parser dotenv
npm install --save-dev nodemon
```

### server.js
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const analyzeRoutes = require('./routes/analyze');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CrushBot API running on port ${PORT}`);
});
```

### routes/analyze.js
```javascript
const express = require('express');
const router = express.Router();
const { calculateScore, generateExplanation } = require('../models/scoring');

router.post('/', async (req, res) => {
  try {
    const { answers } = req.body;
    
    // Validate input
    if (!answers || Object.keys(answers).length !== 7) {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    // Calculate score
    const { score, category, kpis } = calculateScore(answers);
    
    // Generate AI explanation (call Claude API here)
    const explanation = await generateExplanation(score, category, kpis);

    // Log to database (optional)
    // await logAnalysis({ score, category, timestamp: new Date() });

    res.json({
      score,
      category,
      explanation,
      kpis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

module.exports = router;
```

### routes/feedback.js
```javascript
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

router.post('/', async (req, res) => {
  try {
    const { score, category, accurate } = req.body;

    const query = `
      INSERT INTO feedback (score, category, accurate, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;
    
    const result = await pool.query(query, [score, category, accurate]);

    res.json({ 
      success: true, 
      feedbackId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Analytics endpoint (admin only)
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN accurate = true THEN 1 ELSE 0 END) as accurate_count,
        ROUND(AVG(score), 2) as avg_score
      FROM feedback
      GROUP BY category
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
```

### models/scoring.js
```javascript
const WEIGHTS = {
  story_like_rate: 0.15,
  conversation_initiation_ratio: 0.20,
  reply_speed_score: 0.15,
  date_count_score: 0.20,
  gift_score: 0.10,
  emotional_interest_score: 0.15,
  future_plans_score: 0.05
};

const calculateScore = (answers) => {
  // Map answers to KPIs
  const kpis = {
    story_like_rate: answers.story_like,
    conversation_initiation_ratio: answers.conversation_init,
    reply_speed_score: answers.reply_speed,
    date_count_score: answers.dates,
    gift_score: answers.gifts,
    emotional_interest_score: answers.emotional,
    future_plans_score: answers.future_plans
  };

  // Calculate weighted score
  let total = 0;
  Object.keys(WEIGHTS).forEach(key => {
    total += (kpis[key] || 0) * WEIGHTS[key];
  });

  const score = Math.round(total * 100);
  
  let category;
  if (score < 30) category = 'low';
  else if (score < 65) category = 'mixed';
  else category = 'high';

  return { score, category, kpis };
};

const generateExplanation = async (score, category, kpis) => {
  // Call Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Tu ești CrushBot, un AI amuzant și empatic care analizează semnale de interes romantic.

Scor final: ${score}%
Categorie: ${category}
Detalii KPI: ${JSON.stringify(kpis, null, 2)}

Scrie un răspuns scurt (max 120 cuvinte) în română pentru utilizator.`
      }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
};

module.exports = { calculateScore, generateExplanation };
```

### database/schema.sql
```sql
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  category VARCHAR(10) NOT NULL CHECK (category IN ('low', 'mixed', 'high')),
  accurate BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  session_id VARCHAR(255), -- Optional: track sessions
  user_agent TEXT -- Optional: for analytics
);

CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Analytics view
CREATE OR REPLACE VIEW feedback_summary AS
SELECT 
  category,
  COUNT(*) as total_responses,
  SUM(CASE WHEN accurate = true THEN 1 ELSE 0 END) as accurate_count,
  ROUND(100.0 * SUM(CASE WHEN accurate = true THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_percent,
  ROUND(AVG(score), 2) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score
FROM feedback
GROUP BY category;
```

### .env
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/crushbot
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=development
```

### Deployment (Render.com)
1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: crushbot-api
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: crushbot-db
          property: connectionString

databases:
  - name: crushbot-db
    plan: starter
    databaseName: crushbot
    user: crushbot_user
```

2. Push to GitHub
3. Connect to Render
4. Deploy!

---

## Option 2: Python + FastAPI + MongoDB

### Project Structure
```
crushbot-backend/
├── main.py             # FastAPI app
├── models/
│   ├── schemas.py      # Pydantic models
│   └── scoring.py      # Scoring logic
├── routers/
│   ├── analyze.py
│   └── feedback.py
├── database.py         # MongoDB connection
└── requirements.txt
```

### Installation
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn motor anthropic pydantic python-dotenv
```

### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, feedback
from database import connect_db, close_db

app = FastAPI(title="CrushBot API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Events
@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

# Routes
app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### models/schemas.py
```python
from pydantic import BaseModel, Field
from typing import Dict

class AnswersRequest(BaseModel):
    answers: Dict[str, float] = Field(..., example={
        "story_like": 0.7,
        "conversation_init": 0.5,
        "reply_speed": 1.0,
        "dates": 0.7,
        "gifts": 0.4,
        "emotional": 0.8,
        "future_plans": 0.6
    })

class AnalysisResponse(BaseModel):
    score: int
    category: str
    explanation: str
    kpis: Dict[str, float]

class FeedbackRequest(BaseModel):
    score: int = Field(..., ge=0, le=100)
    category: str = Field(..., regex="^(low|mixed|high)$")
    accurate: bool
```

### routers/analyze.py
```python
from fastapi import APIRouter, HTTPException
from models.schemas import AnswersRequest, AnalysisResponse
from models.scoring import calculate_score, generate_explanation

router = APIRouter()

@router.post("/", response_model=AnalysisResponse)
async def analyze(request: AnswersRequest):
    try:
        # Calculate score
        score, category, kpis = calculate_score(request.answers)
        
        # Generate AI explanation
        explanation = await generate_explanation(score, category, kpis)
        
        return AnalysisResponse(
            score=score,
            category=category,
            explanation=explanation,
            kpis=kpis
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### models/scoring.py
```python
import os
from anthropic import AsyncAnthropic

WEIGHTS = {
    "story_like_rate": 0.15,
    "conversation_initiation_ratio": 0.20,
    "reply_speed_score": 0.15,
    "date_count_score": 0.20,
    "gift_score": 0.10,
    "emotional_interest_score": 0.15,
    "future_plans_score": 0.05
}

def calculate_score(answers: dict) -> tuple[int, str, dict]:
    # Map answers to KPIs
    kpis = {
        "story_like_rate": answers.get("story_like", 0),
        "conversation_initiation_ratio": answers.get("conversation_init", 0),
        "reply_speed_score": answers.get("reply_speed", 0),
        "date_count_score": answers.get("dates", 0),
        "gift_score": answers.get("gifts", 0),
        "emotional_interest_score": answers.get("emotional", 0),
        "future_plans_score": answers.get("future_plans", 0)
    }
    
    # Calculate weighted sum
    total = sum(kpis[key] * WEIGHTS[key] for key in WEIGHTS)
    score = round(total * 100)
    
    # Determine category
    if score < 30:
        category = "low"
    elif score < 65:
        category = "mixed"
    else:
        category = "high"
    
    return score, category, kpis

async def generate_explanation(score: int, category: str, kpis: dict) -> str:
    client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    prompt = f"""Tu ești CrushBot, un AI amuzant și empatic care analizează semnale de interes romantic.

Scor final: {score}%
Categorie: {category}
Detalii KPI: {kpis}

Scrie un răspuns scurt (max 120 cuvinte) în română pentru utilizator."""

    message = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return message.content[0].text
```

### database.py (MongoDB)
```python
from motor.motor_asyncio import AsyncIOMotorClient
import os

client = None
database = None

async def connect_db():
    global client, database
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    database = client.crushbot

async def close_db():
    global client
    if client:
        client.close()

def get_database():
    return database
```

### Deployment (Railway)
1. Create `railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

2. Add environment variables in Railway dashboard
3. Deploy via GitHub integration

---

## Option 3: Serverless (Vercel Functions)

### Project Structure
```
crushbot-app/
├── api/
│   ├── analyze.js      # Serverless function
│   └── feedback.js     # Serverless function
├── public/
│   └── index.html      # Frontend
└── vercel.json
```

### api/analyze.js
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { answers } = req.body;
  
  // Calculate score (same logic as frontend)
  const WEIGHTS = {
    story_like_rate: 0.15,
    conversation_initiation_ratio: 0.20,
    reply_speed_score: 0.15,
    date_count_score: 0.20,
    gift_score: 0.10,
    emotional_interest_score: 0.15,
    future_plans_score: 0.05
  };

  let total = 0;
  Object.keys(WEIGHTS).forEach(key => {
    total += (answers[key] || 0) * WEIGHTS[key];
  });

  const score = Math.round(total * 100);
  const category = score < 30 ? 'low' : score < 65 ? 'mixed' : 'high';

  // Generate AI explanation
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: `Prompt here...` }]
    })
  });

  const data = await response.json();
  const explanation = data.content[0].text;

  res.status(200).json({ score, category, explanation });
}
```

### vercel.json
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

---

## ML Model Integration (Future Phase)

### Training Data Collection
```python
# Collect from feedback table
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Load data
df = pd.read_sql("SELECT * FROM feedback WHERE accurate = true", connection)

# Features: KPIs
X = df[['story_like_rate', 'conversation_init', 'reply_speed', ...]]

# Target: category
y = df['category']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy}")

# Save model
import joblib
joblib.dump(model, 'crushbot_model.pkl')
```

### Replace Rule-Based with ML
```python
# In scoring.py
import joblib

model = joblib.load('crushbot_model.pkl')

def calculate_score_ml(answers: dict) -> tuple:
    kpis = [answers[key] for key in sorted(answers.keys())]
    prediction = model.predict([kpis])[0]
    proba = model.predict_proba([kpis])[0]
    
    score = int(max(proba) * 100)
    category = prediction
    
    return score, category, dict(zip(sorted(answers.keys()), kpis))
```

---

## Analytics Dashboard (Bonus)

### Simple HTML Dashboard
```html
<!DOCTYPE html>
<html>
<head>
  <title>CrushBot Analytics</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>CrushBot Analytics</h1>
  <canvas id="categoryChart"></canvas>
  <canvas id="accuracyChart"></canvas>

  <script>
    fetch('/api/feedback/stats')
      .then(res => res.json())
      .then(data => {
        new Chart(document.getElementById('categoryChart'), {
          type: 'bar',
          data: {
            labels: data.map(d => d.category),
            datasets: [{
              label: 'Total Responses',
              data: data.map(d => d.total)
            }]
          }
        });
      });
  </script>
</body>
</html>
```

---

## Testing

### Unit Tests (Jest)
```javascript
const { calculateScore } = require('./models/scoring');

describe('CrushBot Scoring', () => {
  test('High interest scenario', () => {
    const answers = {
      story_like: 1,
      conversation_init: 0.8,
      reply_speed: 1,
      dates: 1,
      gifts: 0.8,
      emotional: 1,
      future_plans: 0.6
    };
    
    const { score, category } = calculateScore(answers);
    expect(score).toBeGreaterThanOrEqual(65);
    expect(category).toBe('high');
  });
});
```

---

**Choose your path based on:**
- **Vercel Functions:** Quick MVP, serverless
- **Node.js/Express:** Full control, scalable
- **Python/FastAPI:** Best for future ML
