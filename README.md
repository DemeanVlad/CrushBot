# 💘 CrushBot - AI Romantic Interest Analyzer

**Entertainment-only web app** that analyzes romantic interest signals using rule-based scoring + AI-powered explanations.

---

## 🎯 Features

### ✨ User Experience
- **Chat-style interface** - Natural conversation flow, one question at a time
- **No text input** - Tap-friendly options & sliders only
- **7 quick questions** - Complete analysis in under 60 seconds
- **Smooth animations** - Premium feel with CSS animations
- **AI-powered explanations** - Personalized insights using Claude API
- **Persistent feedback** - Anonymous data collection for improvement

### 📊 Flow
```
Intro Screen → Questions (7) → Loading Animation → Result + AI Analysis → Feedback → Thank You
```

---

## 🏗️ Architecture

### Frontend (React)
- **Single-file artifact** - All HTML/CSS/JS in one `.jsx` file
- **State management** - React hooks (`useState`, `useRef`)
- **Responsive design** - Mobile-first with Tailwind-inspired custom CSS
- **Animations** - CSS keyframes for smooth UX

### Scoring Logic (Rule-Based)
```javascript
// KPIs (each 0-1)
const WEIGHTS = {
  story_like_rate: 0.15,
  conversation_initiation_ratio: 0.20,
  reply_speed_score: 0.15,
  date_count_score: 0.20,
  gift_score: 0.10,
  emotional_interest_score: 0.15,
  future_plans_score: 0.05
};

// Final score = Σ(weight × KPI) × 100
```

**Categories:**
- `0-29%` → **Low** interest 💭
- `30-64%` → **Mixed** signals 🤔
- `65-100%` → **High** interest 🔥

### AI Layer (Anthropic Claude API)
- **Model:** `claude-sonnet-4-20250514`
- **Purpose:** Generate empathetic, personalized explanations
- **Input:** Score, category, KPI breakdown
- **Output:** 120-word Romanian response (fun, practical, shareable)
- **Fallback:** Static messages if API fails

### Data Storage (Browser Persistent Storage)
- **Anonymous feedback** collection
- **Shared data** for analytics (optional)
- **Key format:** `feedback_${timestamp}`
- **No personal info** stored

---

## 📁 Project Structure

```
crushbot/
├── crushbot.jsx          # Main React component (this file)
├── README.md            # Documentation
└── package.json         # Dependencies (if using npm)
```

### Questions Mapping

| Question | KPI | Weight |
|----------|-----|--------|
| Story likes frequency | `story_like_rate` | 15% |
| Conversation initiation | `conversation_initiation_ratio` | 20% |
| Reply speed | `reply_speed_score` | 15% |
| Going out together | `date_count_score` | 20% |
| Gifts/gestures | `gift_score` | 10% |
| Emotional behavior | `emotional_interest_score` | 15% |
| Future plans mentions | `future_plans_score` | 5% |

---

## 🚀 Deployment

### Option 1: Claude Artifact (Recommended for MVP)
1. **Copy `crushbot.jsx` content**
2. **Paste into Claude.ai** chat
3. **Request:** "Create an artifact with this React component"
4. **Done!** - Shareable link, instant hosting

### Option 2: Local Development
```bash
# Create React app
npx create-react-app crushbot-app
cd crushbot-app

# Install dependencies
npm install lucide-react

# Replace src/App.js with crushbot.jsx content
# Rename component export to App

# Start dev server
npm start
```

### Option 3: Vercel Deployment
```bash
# Build production version
npm run build

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 4: Standalone HTML (No Build Tools)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrushBot</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="crushbot.jsx"></script>
  <script type="text/babel">
    ReactDOM.render(<CrushBot />, document.getElementById('root'));
  </script>
</body>
</html>
```

---

## 🔐 Legal & Ethics

### Disclaimers (Built-in)
✅ **"For entertainment only"** - Displayed on intro screen  
✅ **"Nu înlocuiește comunicarea reală"** - Clear warning  
✅ **No real names** - Voluntary, anonymous data entry  
✅ **No social media scraping** - User self-reports only  
✅ **Reset option** - Data can be cleared anytime  

### GDPR Compliance
- ✅ No personal identifiable information collected
- ✅ Voluntary participation
- ✅ Data stored in browser (user control)
- ✅ Shared feedback is anonymous

### Recommended Additional Measures
1. **Terms of Service** page with:
   - "This is entertainment, not relationship advice"
   - "Results are estimates, not guarantees"
   - "Consult professionals for serious concerns"
2. **Privacy Policy** (if storing server-side data later)
3. **Age gate** (18+ recommended due to romantic content)

---

## 🛠️ Customization Guide

### Change Scoring Weights
```javascript
// In crushbot.jsx, modify WEIGHTS object
const WEIGHTS = {
  story_like_rate: 0.20,        // Increase importance
  reply_speed_score: 0.10,      // Decrease importance
  // ... adjust as needed
};
```

### Modify Questions
```javascript
// In QUESTIONS array, add/edit questions
{
  id: 'new_question',
  text: 'New question text?',
  type: 'options', // or 'slider'
  kpi: 'new_kpi_name',
  options: [
    { label: 'Option 1', value: 0 },
    { label: 'Option 2', value: 1 }
  ]
}
```

### Change AI Prompt
```javascript
// In generateAIExplanation() function
const prompt = `Tu ești CrushBot...
// Modify tone, style, language, or instructions
`;
```

### Adjust Color Scheme
```css
/* Find gradient definitions in inline styles */
background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
/* Replace with your brand colors */
```

---

## 📊 Future Enhancements (Roadmap)

### Phase 2: ML Integration
- [ ] Collect feedback data → train ML model
- [ ] Replace rule-based scoring with supervised learning
- [ ] A/B test ML vs. rules performance

### Phase 3: Social Features
- [ ] Share results (screenshot generator)
- [ ] Compare with friends (anonymous aggregate stats)
- [ ] Compatibility quiz for couples

### Phase 4: Monetization (Optional)
- [ ] Premium AI explanations (deeper insights)
- [ ] Relationship advice chatbot
- [ ] Compatibility reports (PDF export)

### Phase 5: Internationalization
- [ ] Multi-language support (EN, ES, FR, DE)
- [ ] Cultural adaptation (dating norms vary!)

---

## 🐛 Troubleshooting

### AI Explanations Not Working?
**Issue:** API calls fail  
**Solution:**
1. Check browser console for errors
2. Verify Claude API is accessible (no CORS issues in artifacts)
3. Use fallback explanations (already implemented)

### Storage Not Persisting?
**Issue:** Feedback data lost on reload  
**Solution:**
1. Ensure `window.storage` API is available (Claude artifacts only)
2. For local dev, implement `localStorage` alternative:
```javascript
// Replace window.storage.set with:
localStorage.setItem(feedbackId, JSON.stringify(data));
```

### Animations Laggy?
**Issue:** Performance on low-end devices  
**Solution:**
1. Reduce animation complexity in CSS
2. Use `will-change` property sparingly
3. Test on target devices

---

## 🤝 Contributing

### Want to Improve CrushBot?
1. **Report bugs** - Describe issue + reproduction steps
2. **Suggest features** - Explain use case + expected behavior
3. **Submit feedback** - Use in-app feedback buttons!

### Development Workflow
```bash
# Fork repo
git clone your-fork-url
cd crushbot

# Create feature branch
git checkout -b feature/awesome-feature

# Make changes
# Test thoroughly

# Commit & push
git commit -m "Add awesome feature"
git push origin feature/awesome-feature

# Open pull request
```

---

## 📜 License

**MIT License** - Free for personal & commercial use

**Attribution appreciated but not required:**
> "Powered by CrushBot AI"

---

## 🙏 Credits

- **Design inspiration:** Modern dating apps + AI chat interfaces
- **Icons:** Lucide React
- **AI Model:** Anthropic Claude Sonnet 4
- **Font recommendation:** DM Sans (or any clean sans-serif)

---

## 📞 Support

### Need Help?
- 📧 Email: support@crushbot.example (replace with real contact)
- 💬 Discord: [Community link]
- 📖 Docs: [Documentation site]

### FAQ
**Q: Is this a real relationship advisor?**  
A: No! Pure entertainment. Talk to real people for real advice.

**Q: Can I use this commercially?**  
A: Yes, MIT license allows it. Consider ethics & local laws.

**Q: How accurate is it?**  
A: It's a fun estimator, not a scientific tool. Real relationships are complex!

---

## 🎨 Design Philosophy

**CrushBot avoids:**
- ❌ Generic "AI slop" aesthetics
- ❌ Purple gradients everywhere (we use them intentionally!)
- ❌ Overused fonts (Inter, Roboto)
- ❌ Predictable layouts

**CrushBot embraces:**
- ✅ Playful, romantic vibes
- ✅ Smooth micro-interactions
- ✅ Memorable emoji usage
- ✅ Chat-first UX
- ✅ Distinctive visual identity

---

**Built with ❤️ for people navigating the confusing world of crushes!**

*Remember: The best way to know if someone likes you? Ask them. 😊*
