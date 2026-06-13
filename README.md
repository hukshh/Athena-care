# AthenaCare AI 🏥

> AI-Powered Medical Tourism & Hospital Recommendation Platform

AthenaCare AI helps international patients find the best hospitals and doctors abroad based on their medical history, diagnosis, budget, country preference, urgency, and treatment requirements.

## 🚀 Features

- **AI Hospital Matching Engine** — ML-powered recommendations with semantic similarity
- **Medical Report Analyzer** — OCR + NLP extraction from PDFs and scanned documents
- **RAG Healthcare Chatbot** — LangChain + FAISS grounded AI assistant
- **Treatment Cost Predictor** — XGBoost ML models for cost estimation
- **Medical Travel Planner** — Visa, accommodation, and recovery timeline
- **Doctor Recommendation System** — Specialty-based matching with filters
- **Patient Dashboard** — Real-time health insights and journey tracking
- **Admin Panel** — Full platform management and analytics

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI (Python) |
| Database | MongoDB |
| AI/ML | Scikit-learn, XGBoost, HuggingFace Transformers |
| RAG | LangChain, FAISS |
| Auth | JWT |
| OCR | Tesseract, PyPDF2 |
| Deploy | Docker |

## 📁 Project Structure

```
athenacare-ai/
├── frontend/          # React.js application
├── backend/           # FastAPI application
├── ml/                # ML training scripts
├── data/              # Dummy datasets
├── docker-compose.yml
└── README.md
```

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB
- Docker (optional)

### Frontend
```bash
cd frontend
npm install
npm start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Docker
```bash
docker-compose up --build
```

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your values.

## 📊 ML Models

Run training scripts in `/ml` directory:
```bash
cd ml
python train_recommendation_model.py
python train_cost_predictor.py
```

## 🌐 API Documentation

Once running, visit: `http://localhost:8000/docs`

## 📄 License

MIT License — AthenaCare AI
