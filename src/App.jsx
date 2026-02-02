import React, { useState, useEffect, useRef } from 'react';
import { Heart, Sparkles, Send, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';

// ============================================================================
// SCORING LOGIC & WEIGHTS
// ============================================================================

const WEIGHTS = {
  story_like_rate: 0.15,
  conversation_initiation_ratio: 0.20,
  reply_speed_score: 0.15,
  date_count_score: 0.20,
  gift_score: 0.10,
  emotional_interest_score: 0.15,
  future_plans_score: 0.05
};

const calculateFinalScore = (kpis) => {
  let total = 0;
  Object.keys(WEIGHTS).forEach(key => {
    total += (kpis[key] || 0) * WEIGHTS[key];
  });
  return Math.round(total * 100);
};

const getCategoryFromScore = (score) => {
  if (score < 30) return 'low';
  if (score < 65) return 'mixed';
  return 'high';
};

// ============================================================================
// QUESTIONS CONFIGURATION
// ============================================================================

const QUESTIONS = [
  {
    id: 'story_like',
    text: 'Cât de des îți dă like la story-uri? 👀',
    type: 'options',
    kpi: 'story_like_rate',
    options: [
      { label: 'Aproape niciodată', value: 0 },
      { label: 'Doar când sunt foarte interesante', value: 0.3 },
      { label: 'Destul de des', value: 0.7 },
      { label: 'La fiecare story!', value: 1 }
    ]
  },
  {
    id: 'conversation_init',
    text: 'Cine inițiază conversațiile mai des?',
    type: 'slider',
    kpi: 'conversation_initiation_ratio',
    leftLabel: 'Eu mereu',
    rightLabel: 'El/Ea mereu',
    min: 0,
    max: 1,
    step: 0.1
  },
  {
    id: 'reply_speed',
    text: 'Cât de repede răspunde la mesajele tale? ⚡',
    type: 'options',
    kpi: 'reply_speed_score',
    options: [
      { label: 'Ore sau zile...', value: 0 },
      { label: 'În câteva ore', value: 0.4 },
      { label: 'În 30 min - 1 oră', value: 0.7 },
      { label: 'Instant sau sub 10 min!', value: 1 }
    ]
  },
  {
    id: 'dates',
    text: 'Ați ieșit în oraș împreună? 🎭',
    type: 'options',
    kpi: 'date_count_score',
    options: [
      { label: 'Niciodată', value: 0 },
      { label: 'O dată', value: 0.3 },
      { label: 'Câteva ori', value: 0.7 },
      { label: 'Destul de des!', value: 1 }
    ]
  },
  {
    id: 'gifts',
    text: 'Ți-a oferit vreodată flori, cadouri sau gesturi speciale? 🎁',
    type: 'options',
    kpi: 'gift_score',
    options: [
      { label: 'Niciodată', value: 0 },
      { label: 'O dată, ceva mic', value: 0.4 },
      { label: 'De câteva ori', value: 0.8 },
      { label: 'Da, des!', value: 1 }
    ]
  },
  {
    id: 'emotional',
    text: 'Cum se poartă cu tine când sunteți împreună? 💫',
    type: 'options',
    kpi: 'emotional_interest_score',
    options: [
      { label: 'Distant, ca un prieten', value: 0 },
      { label: 'Prietenos, dar nimic special', value: 0.3 },
      { label: 'Atent și carismatic', value: 0.7 },
      { label: 'Super afectuos și interesat', value: 1 }
    ]
  },
  {
    id: 'future_plans',
    text: 'Vorbește despre planuri viitoare cu tine? 🗓️',
    type: 'options',
    kpi: 'future_plans_score',
    options: [
      { label: 'Niciodată', value: 0 },
      { label: 'Rar', value: 0.3 },
      { label: 'Ocazional', value: 0.6 },
      { label: 'Da, des!', value: 1 }
    ]
  }
];

// ============================================================================
// AI EXPLANATION GENERATOR
// ============================================================================

const generateAIExplanation = async (score, category, kpis) => {
  const prompt = `Tu ești CrushBot, un AI amuzant și empatic care analizează semnale de interes romantic.

Scor final: ${score}%
Categorie: ${category}
Detalii KPI:
- Story likes: ${(kpis.story_like_rate * 100).toFixed(0)}%
- Inițiază conversații: ${(kpis.conversation_initiation_ratio * 100).toFixed(0)}%
- Viteză răspuns: ${(kpis.reply_speed_score * 100).toFixed(0)}%
- Date count: ${(kpis.date_count_score * 100).toFixed(0)}%
- Cadouri: ${(kpis.gift_score * 100).toFixed(0)}%
- Interes emoțional: ${(kpis.emotional_interest_score * 100).toFixed(0)}%
- Planuri viitoare: ${(kpis.future_plans_score * 100).toFixed(0)}%

Scrie un răspuns scurt (max 120 cuvinte) în română pentru utilizator:
1. Începe cu un hook emoțional (emoji fun)
2. Explică ce arată semnalele (2-3 puncte cheie)
3. Dă un sfat practic sau încurajare
4. Termină playful și optimist

Ton: prietenos, empatic, ușor flirty, cu umor subtil. NU fi condescendent. NU folosi clișee gen "nu-ți pierde speranța".`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content.map(item => item.type === 'text' ? item.text : '').join('\n').trim();
  } catch (error) {
    console.error('AI explanation error:', error);
    // Fallback explanation
    if (category === 'high') {
      return '🔥 Wow! Semnalele sunt puternice! Persoana asta pare să fie cu adevărat interesată de tine. Fie că răspunde rapid, inițiază conversații sau face gesturi speciale, toate indică o conexiune autentică. Sfatul meu? Fii tu însuți și comunică deschis. Șansele sunt de partea ta! 💫';
    } else if (category === 'mixed') {
      return '🤔 Situația e în zona "mixed signals". Sunt câteva semne pozitive, dar și zone de incertitudine. Poate sunt timid(ă), sau încă vă cunoașteți. Comunicarea deschisă e cheia – întreabă direct dacă simți că e momentul potrivit. Nu te grăbi, dar nici nu sta pe loc! ✨';
    } else {
      return '💭 Hmm, semnalele par destul de slabe momentan. Asta nu înseamnă că e cazul pierdut, dar poate nu sunteți pe aceeași lungime de undă. Gândește-te dacă investiția ta emoțională e reciprocată. Merită să explorezi alte conexiuni care îți oferă energia pe care o dai. Tu meriți cineva care e la fel de entuziasmat(ă)! 💪';
    }
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CrushBot() {
  const [stage, setStage] = useState('intro'); // intro, questions, loading, result, feedback
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [kpis, setKpis] = useState({});
  const [finalScore, setFinalScore] = useState(null);
  const [category, setCategory] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [sliderValue, setSliderValue] = useState(0.5);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const chatEndRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQuestionIndex, stage]);

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    const newKpis = { ...kpis, [currentQuestion.kpi]: value };
    
    setAnswers(newAnswers);
    setKpis(newKpis);

    setTimeout(() => {
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSliderValue(0.5); // Reset slider
      } else {
        // Finish questionnaire
        setStage('loading');
        processResults(newKpis);
      }
    }, 300);
  };

  const processResults = async (finalKpis) => {
    const score = calculateFinalScore(finalKpis);
    const cat = getCategoryFromScore(score);
    
    setFinalScore(score);
    setCategory(cat);

    // Generate AI explanation
    const explanation = await generateAIExplanation(score, cat, finalKpis);
    setAiExplanation(explanation);
    
    setTimeout(() => {
      setStage('result');
    }, 2000);
  };

  const handleFeedback = async (isAccurate) => {
    setShowThankYou(true);
    
    // Store feedback in persistent storage
    try {
      const feedbackId = `feedback_${Date.now()}`;
      await window.storage.set(feedbackId, JSON.stringify({
        score: finalScore,
        category,
        accurate: isAccurate,
        timestamp: new Date().toISOString()
      }), true); // shared data for analytics
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }

    setTimeout(() => {
      setShowThankYou(false);
      setStage('feedback');
    }, 1500);
  };

  const handleReset = () => {
    setStage('intro');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setKpis({});
    setFinalScore(null);
    setCategory(null);
    setAiExplanation('');
    setSliderValue(0.5);
    setShowThankYou(false);
  };

  // ============================================================================
  // RENDER STAGES
  // ============================================================================

  if (stage === 'intro') {
    return (
      <div className="crush-bot">
        <div className="intro-container">
          <div className="intro-content">
            <div className="logo-container">
              <Heart className="logo-heart" />
              <Sparkles className="logo-sparkle" />
            </div>
            <h1 className="intro-title">CrushBot</h1>
            <p className="intro-tagline">Află dacă crush-ul tău e interesat(ă)! 💘</p>
            <p className="intro-description">
              Răspunde la 7 întrebări rapide și descoperă ce spun semnalele.
              <br />
              <span className="disclaimer">⚠️ Doar pentru entertainment • Nu înlocuiește comunicarea reală</span>
            </p>
            <button className="start-button" onClick={() => setStage('questions')}>
              <Sparkles size={18} />
              Începe analiza
              <Send size={18} />
            </button>
          </div>
        </div>
        <style jsx>{`
          .crush-bot {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            position: relative;
            overflow: hidden;
          }

          .crush-bot::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
              radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%);
            animation: float 20s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-20px, -20px) rotate(5deg); }
          }

          .intro-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
            z-index: 1;
          }

          .intro-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 32px;
            padding: 3rem 2.5rem;
            max-width: 480px;
            text-align: center;
            box-shadow: 
              0 20px 60px rgba(0,0,0,0.3),
              0 0 0 1px rgba(255,255,255,0.2) inset;
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
          }

          .logo-container {
            position: relative;
            width: 80px;
            height: 80px;
            margin: 0 auto 1.5rem;
          }

          .logo-heart {
            width: 80px;
            height: 80px;
            color: #e74c3c;
            filter: drop-shadow(0 4px 12px rgba(231, 76, 60, 0.4));
            animation: heartbeat 1.5s ease-in-out infinite;
          }

          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            10%, 30% { transform: scale(0.9); }
            20%, 40% { transform: scale(1.1); }
          }

          .logo-sparkle {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 28px;
            height: 28px;
            color: #f39c12;
            animation: sparkle 2s ease-in-out infinite;
          }

          @keyframes sparkle {
            0%, 100% { opacity: 1; transform: rotate(0deg) scale(1); }
            50% { opacity: 0.5; transform: rotate(180deg) scale(0.8); }
          }

          .intro-title {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 0.5rem;
            letter-spacing: -0.5px;
          }

          .intro-tagline {
            font-size: 1.25rem;
            color: #2c3e50;
            margin: 0 0 1.5rem;
            font-weight: 600;
          }

          .intro-description {
            color: #555;
            line-height: 1.6;
            margin: 0 0 2rem;
            font-size: 0.95rem;
          }

          .disclaimer {
            display: block;
            margin-top: 1rem;
            font-size: 0.8rem;
            color: #e67e22;
            font-weight: 600;
          }

          .start-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 1rem 2.5rem;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .start-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
          }

          .start-button:active {
            transform: translateY(0);
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'questions') {
    return (
      <div className="crush-bot">
        <div className="chat-container">
          <div className="chat-header">
            <div className="header-content">
              <Heart size={24} className="header-icon" />
              <div>
                <div className="header-title">CrushBot</div>
                <div className="header-subtitle">
                  Întrebarea {currentQuestionIndex + 1} din {QUESTIONS.length}
                </div>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="chat-messages">
            <div className="message bot-message">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble bot-bubble">
                {currentQuestion.text}
              </div>
            </div>

            {currentQuestion.type === 'options' && (
              <div className="options-container">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    className="option-button"
                    onClick={() => handleAnswer(option.value)}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'slider' && (
              <div className="slider-container">
                <div className="slider-labels">
                  <span>{currentQuestion.leftLabel}</span>
                  <span>{currentQuestion.rightLabel}</span>
                </div>
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  step={currentQuestion.step}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(parseFloat(e.target.value))}
                  className="slider-input"
                />
                <div className="slider-value">
                  {sliderValue === 0 ? 'Eu mereu' : 
                   sliderValue === 1 ? 'El/Ea mereu' : 
                   'Cam egal'}
                </div>
                <button
                  className="slider-submit"
                  onClick={() => handleAnswer(sliderValue)}
                >
                  Continuă
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <style jsx>{`
          .chat-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            flex-direction: column;
          }

          .chat-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 1.25rem 1.5rem 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .header-icon {
            color: #e74c3c;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }

          .header-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #2c3e50;
          }

          .header-subtitle {
            font-size: 0.85rem;
            color: #7f8c8d;
            font-weight: 500;
          }

          .progress-bar {
            height: 4px;
            background: rgba(102, 126, 234, 0.2);
            border-radius: 2px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .chat-messages {
            flex: 1;
            padding: 2rem 1.5rem;
            overflow-y: auto;
          }

          .message {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            animation: messageSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes messageSlide {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
          }

          .message-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            flex-shrink: 0;
          }

          .message-bubble {
            background: white;
            padding: 1rem 1.25rem;
            border-radius: 20px;
            max-width: 80%;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          }

          .bot-bubble {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2c3e50;
            border-bottom-left-radius: 4px;
          }

          .options-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin: 1rem 0 0 3.25rem;
          }

          .option-button {
            background: white;
            border: 2px solid rgba(102, 126, 234, 0.2);
            padding: 1rem 1.5rem;
            border-radius: 16px;
            font-size: 1rem;
            font-weight: 600;
            color: #2c3e50;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: left;
            animation: optionAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          @keyframes optionAppear {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
          }

          .option-button:hover {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-color: transparent;
            transform: translateX(4px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }

          .slider-container {
            margin: 1.5rem 0 0 3.25rem;
            background: white;
            padding: 1.5rem;
            border-radius: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            animation: messageSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            font-weight: 600;
            color: #7f8c8d;
          }

          .slider-input {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            outline: none;
            -webkit-appearance: none;
            margin: 1rem 0;
          }

          .slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 3px solid #667eea;
          }

          .slider-input::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 3px solid #667eea;
          }

          .slider-value {
            text-align: center;
            font-size: 1rem;
            font-weight: 700;
            color: #667eea;
            margin: 0.5rem 0 1rem;
          }

          .slider-submit {
            width: 100%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 0.875rem;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .slider-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'loading') {
    return (
      <div className="crush-bot">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-hearts">
              <Heart className="heart h1" />
              <Heart className="heart h2" />
              <Heart className="heart h3" />
            </div>
            <h2 className="loading-text">Analizez semnalele...</h2>
            <p className="loading-subtext">Calculez compatibilitatea 💫</p>
          </div>
        </div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .loading-content {
            text-align: center;
          }

          .loading-hearts {
            position: relative;
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
          }

          .heart {
            position: absolute;
            width: 60px;
            height: 60px;
            color: white;
            opacity: 0;
          }

          .h1 {
            top: 0;
            left: 30px;
            animation: heartFloat 1.5s ease-in-out infinite;
          }

          .h2 {
            top: 30px;
            left: 0;
            animation: heartFloat 1.5s ease-in-out 0.5s infinite;
          }

          .h3 {
            top: 30px;
            right: 0;
            animation: heartFloat 1.5s ease-in-out 1s infinite;
          }

          @keyframes heartFloat {
            0%, 100% {
              opacity: 0;
              transform: translateY(0) scale(0.8);
            }
            50% {
              opacity: 1;
              transform: translateY(-20px) scale(1.2);
            }
          }

          .loading-text {
            color: white;
            font-size: 1.75rem;
            font-weight: 700;
            margin: 0 0 0.5rem;
          }

          .loading-subtext {
            color: rgba(255,255,255,0.9);
            font-size: 1.1rem;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'result') {
    const getScoreColor = () => {
      if (category === 'high') return '#27ae60';
      if (category === 'mixed') return '#f39c12';
      return '#e74c3c';
    };

    const getScoreEmoji = () => {
      if (category === 'high') return '🔥';
      if (category === 'mixed') return '🤔';
      return '💭';
    };

    return (
      <div className="crush-bot">
        <div className="result-container">
          <div className="result-card">
            <div className="result-emoji">{getScoreEmoji()}</div>
            <h1 className="result-title">Rezultatul tău</h1>
            
            <div className="score-display" style={{ background: getScoreColor() }}>
              <div className="score-number">{finalScore}%</div>
              <div className="score-label">șanse de interes romantic</div>
            </div>

            <div className="ai-explanation">
              <div className="ai-badge">
                <Sparkles size={14} />
                Analiză AI
              </div>
              <p className="ai-text">{aiExplanation}</p>
            </div>

            <div className="feedback-section">
              <p className="feedback-question">A fost analiza corectă?</p>
              <div className="feedback-buttons">
                <button 
                  className="feedback-btn accurate"
                  onClick={() => handleFeedback(true)}
                >
                  <ThumbsUp size={18} />
                  Da, e corect!
                </button>
                <button 
                  className="feedback-btn inaccurate"
                  onClick={() => handleFeedback(false)}
                >
                  <ThumbsDown size={18} />
                  Nu prea...
                </button>
              </div>
            </div>

            {showThankYou && (
              <div className="thank-you">
                <Sparkles size={20} />
                Mulțumim pentru feedback!
              </div>
            )}
          </div>

          <button className="reset-button" onClick={handleReset}>
            <RotateCcw size={18} />
            Încearcă din nou
          </button>
        </div>

        <style jsx>{`
          .result-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1.5rem;
          }

          .result-card {
            background: white;
            border-radius: 32px;
            padding: 2.5rem 2rem;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: resultAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes resultAppear {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
          }

          .result-emoji {
            font-size: 4rem;
            text-align: center;
            margin-bottom: 1rem;
            animation: emojiPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
          }

          @keyframes emojiPop {
            from {
              transform: scale(0);
              opacity: 0;
            }
            60% {
              transform: scale(1.2);
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          .result-title {
            text-align: center;
            font-size: 1.75rem;
            font-weight: 800;
            color: #2c3e50;
            margin: 0 0 1.5rem;
          }

          .score-display {
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
            animation: scoreReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
          }

          @keyframes scoreReveal {
            from {
              opacity: 0;
              transform: scaleY(0);
            }
          }

          .score-number {
            font-size: 4rem;
            font-weight: 900;
            color: white;
            line-height: 1;
            text-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }

          .score-label {
            color: rgba(255,255,255,0.95);
            font-size: 0.95rem;
            font-weight: 600;
            margin-top: 0.5rem;
          }

          .ai-explanation {
            background: #f8f9fa;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            animation: explanationSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;
          }

          @keyframes explanationSlide {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
          }

          .ai-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 0.375rem 0.875rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
          }

          .ai-text {
            color: #2c3e50;
            line-height: 1.7;
            margin: 0;
            font-size: 0.95rem;
          }

          .feedback-section {
            border-top: 2px solid #ecf0f1;
            padding-top: 1.5rem;
          }

          .feedback-question {
            text-align: center;
            font-weight: 600;
            color: #7f8c8d;
            margin: 0 0 1rem;
            font-size: 0.95rem;
          }

          .feedback-buttons {
            display: flex;
            gap: 0.75rem;
          }

          .feedback-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem;
            border-radius: 12px;
            border: 2px solid;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .accurate {
            background: white;
            border-color: #27ae60;
            color: #27ae60;
          }

          .accurate:hover {
            background: #27ae60;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
          }

          .inaccurate {
            background: white;
            border-color: #e74c3c;
            color: #e74c3c;
          }

          .inaccurate:hover {
            background: #e74c3c;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
          }

          .thank-you {
            margin-top: 1rem;
            text-align: center;
            color: #27ae60;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            animation: thankYouFade 0.4s ease-in-out;
          }

          @keyframes thankYouFade {
            from { opacity: 0; transform: scale(0.9); }
          }

          .reset-button {
            margin-top: 1.5rem;
            background: white;
            color: #667eea;
            border: none;
            padding: 0.875rem 2rem;
            border-radius: 50px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.3);
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'feedback') {
    return (
      <div className="crush-bot">
        <div className="feedback-complete-container">
          <div className="feedback-complete-card">
            <Sparkles size={60} color="#f39c12" />
            <h2>Mulțumim! 💛</h2>
            <p>Feedback-ul tău ne ajută să îmbunătățim CrushBot.</p>
            <button className="home-button" onClick={handleReset}>
              <Heart size={18} />
              Înapoi la start
            </button>
          </div>
        </div>
        <style jsx>{`
          .feedback-complete-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .feedback-complete-card {
            background: white;
            border-radius: 24px;
            padding: 3rem 2rem;
            text-align: center;
            max-width: 400px;
            animation: fadeIn 0.5s ease-in-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
          }

          .feedback-complete-card h2 {
            margin: 1.5rem 0 1rem;
            font-size: 2rem;
            color: #2c3e50;
          }

          .feedback-complete-card p {
            color: #7f8c8d;
            margin-bottom: 2rem;
            line-height: 1.6;
          }

          .home-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
          }

          .home-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
          }
        `}</style>
      </div>
    );
  }

  return null;
}
