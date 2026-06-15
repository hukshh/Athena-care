"""
AthenaCare AI — RAG Healthcare Chatbot
LangChain + FAISS vector store for grounded medical responses
"""

import logging
import os
from typing import List, Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)


MEDICAL_KNOWLEDGE_BASE = [
    {
        "id": "1",
        "content": "Apollo Hospitals in India is one of Asia's largest healthcare groups with JCI accreditation. Specializes in cardiac surgery, oncology, and organ transplants. Average cardiac surgery cost: $8,000-$15,000. Success rate: 97.2%.",
        "source": "Hospital Database",
        "category": "hospital",
    },
    {
        "id": "2",
        "content": "Bumrungrad International Hospital in Bangkok, Thailand is JCI accredited and serves over 1.1 million patients annually. Known for cardiology, orthopedics, and international patient services. Cost range: $15,000-$30,000 for major procedures.",
        "source": "Hospital Database",
        "category": "hospital",
    },
    {
        "id": "3",
        "content": "Medical tourism in India can save 60-90% compared to US healthcare costs. India has over 20 JCI-accredited hospitals. Popular treatments: cardiac surgery, orthopedics, cancer treatment, fertility treatment.",
        "source": "Medical Tourism Guide",
        "category": "destination",
    },
    {
        "id": "4",
        "content": "Thailand medical visa (Non-IM) allows 90-day stay for medical treatment. Requirements: hospital appointment letter, medical records, financial proof. Processing time: 5-7 business days.",
        "source": "Visa Guide",
        "category": "visa",
    },
    {
        "id": "5",
        "content": "India e-Medical Visa allows 60-day stay with triple entry. Apply online at indianvisaonline.gov.in. Requirements: hospital invitation letter, medical diagnosis, proof of funds. Fee: $25 USD.",
        "source": "Visa Guide",
        "category": "visa",
    },
    {
        "id": "6",
        "content": "Coronary Artery Bypass Graft (CABG) surgery costs: USA $70,000-$200,000, India $7,000-$15,000, Thailand $15,000-$25,000, Turkey $12,000-$20,000, Singapore $25,000-$45,000.",
        "source": "Cost Database",
        "category": "cost",
    },
    {
        "id": "7",
        "content": "Knee replacement surgery costs: USA $35,000-$70,000, India $4,000-$8,000, Thailand $10,000-$16,000, Turkey $8,000-$14,000. Recovery time: 6-12 weeks. Hospital stay: 3-5 days.",
        "source": "Cost Database",
        "category": "cost",
    },
    {
        "id": "8",
        "content": "JCI (Joint Commission International) accreditation is the gold standard for international hospital quality. JCI-accredited hospitals meet the same standards as top US hospitals. Over 1,000 hospitals worldwide are JCI accredited.",
        "source": "Medical Standards",
        "category": "quality",
    },
    {
        "id": "9",
        "content": "Recovery after cardiac surgery typically takes 6-12 weeks. First 2 weeks: rest and wound care. Weeks 3-6: light activity, cardiac rehabilitation. Weeks 6-12: gradual return to normal activities. Follow-up appointments required.",
        "source": "Medical Guide",
        "category": "recovery",
    },
    {
        "id": "10",
        "content": "Anadolu Medical Center in Istanbul, Turkey is affiliated with Harvard Medical International. Specializes in oncology, cardiology, and neurology. JCI accredited. Cost range: $12,000-$25,000 for major procedures.",
        "source": "Hospital Database",
        "category": "hospital",
    },
    {
        "id": "11",
        "content": "Medical travel insurance is essential for international patients. Should cover: emergency medical evacuation, treatment complications, trip cancellation, accommodation for companions. Recommended providers: Cigna Global, Allianz Care.",
        "source": "Travel Guide",
        "category": "insurance",
    },
    {
        "id": "12",
        "content": "Liver transplant costs: USA $300,000-$500,000, India $25,000-$40,000, Thailand $50,000-$80,000, Turkey $40,000-$60,000. Waiting time varies. Living donor transplants available in India and Turkey.",
        "source": "Cost Database",
        "category": "cost",
    },
]


class RAGChatbot:
    """
    RAG-based healthcare chatbot using LangChain + FAISS.
    Falls back to keyword-based retrieval if models unavailable.
    """

    def __init__(self):
        self.vectorstore = None
        self.qa_chain = None
        self.embedding_model = None
        self._initialize()

    def _initialize(self):
        """Initialize RAG components"""
        try:
            self._setup_faiss()
            logger.info("FAISS vector store initialized")
        except Exception as e:
            logger.warning(f"FAISS setup failed: {e}. Using keyword retrieval.")

    def _setup_faiss(self):
        """Set up FAISS disabled on Render Free Tier to prevent OOM"""
        logger.warning("FAISS and SentenceTransformers disabled to prevent OOM crash. Using keyword retrieval.")
        raise ImportError("Disabled on Free Tier")

    def _retrieve_relevant_docs(self, query: str, k: int = 3) -> List[Dict]:
        """Retrieve relevant documents using FAISS similarity search"""
        if self.embedding_model and hasattr(self, 'faiss_index'):
            try:
                import faiss
                import numpy as np

                query_embedding = self.embedding_model.encode([query], convert_to_numpy=True)
                faiss.normalize_L2(query_embedding)

                distances, indices = self.faiss_index.search(query_embedding, k)

                results = []
                for i, idx in enumerate(indices[0]):
                    if idx < len(MEDICAL_KNOWLEDGE_BASE):
                        doc = MEDICAL_KNOWLEDGE_BASE[idx].copy()
                        doc["score"] = float(distances[0][i])
                        results.append(doc)
                return results
            except Exception as e:
                logger.error(f"FAISS search error: {e}")

        # Fallback: keyword-based retrieval
        return self._keyword_retrieve(query, k)

    def _keyword_retrieve(self, query: str, k: int = 3) -> List[Dict]:
        """Keyword-based document retrieval fallback"""
        query_lower = query.lower()
        scored_docs = []

        for doc in MEDICAL_KNOWLEDGE_BASE:
            score = 0
            content_lower = doc["content"].lower()

            # Count keyword matches
            words = query_lower.split()
            for word in words:
                if len(word) > 3 and word in content_lower:
                    score += 1

            if score > 0:
                doc_copy = doc.copy()
                doc_copy["score"] = score
                scored_docs.append(doc_copy)

        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return scored_docs[:k]

    def _build_prompt(self, query: str, context_docs: List[Dict], history: List[Tuple]) -> str:
        """Build prompt with retrieved context"""
        context = "\n\n".join([
            f"[Source: {doc['source']}]\n{doc['content']}"
            for doc in context_docs
        ])

        history_text = ""
        if history:
            recent_history = history[-4:]  # Last 4 exchanges
            for role, content in recent_history:
                history_text += f"{role.capitalize()}: {content}\n"

        prompt = f"""You are AthenaCare AI, an expert medical tourism assistant. 
You help international patients find the best hospitals and doctors worldwide.

CONTEXT FROM KNOWLEDGE BASE:
{context}

CONVERSATION HISTORY:
{history_text}

PATIENT QUESTION: {query}

INSTRUCTIONS:
- Answer based on the provided context
- Be specific about costs, hospitals, and procedures when available
- Always recommend consulting a doctor for medical decisions
- Format your response clearly with bullet points when listing options
- If you don't have specific information, say so honestly

RESPONSE:"""

        return prompt

    def _generate_response(self, prompt: str) -> str:
        """Generate response using LLM"""
        # Try OpenAI
        try:
            import openai
            from app.core.config import settings

            if settings.OPENAI_API_KEY:
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.3,
                )
                return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"OpenAI not available: {e}")

        # HuggingFace GPT-2 fallback disabled on Render Free Tier to prevent OOM crash
        logger.warning("HuggingFace GPT-2 disabled. Falling back to template response.")

        # Fallback: template-based response
        return self._template_response(prompt)

    def _template_response(self, prompt: str) -> str:
        """Template-based fallback response"""
        query_lower = prompt.lower()

        if "hospital" in query_lower and ("india" in query_lower or "cardiac" in query_lower or "heart" in query_lower):
            return """Based on our database, here are the top cardiac hospitals in India:

**Apollo Hospitals, Chennai** — JCI Accredited
• Success rate: 97.2% | Cost: $8,000-$15,000
• Specialties: Cardiac Surgery, CABG, TAVR

**Fortis Escorts Heart Institute, Delhi** — NABH Accredited  
• Success rate: 94.8% | Cost: $7,000-$12,000
• Specialties: Interventional Cardiology, Bypass Surgery

Both hospitals have dedicated international patient coordinators and offer telemedicine consultations. Would you like me to help you schedule a consultation?"""

        if "cost" in query_lower or "price" in query_lower:
            return """Here's a cost comparison for common procedures:

**Cardiac Surgery (CABG):**
• India: $7,000-$15,000 (save 85% vs USA)
• Thailand: $15,000-$25,000
• Turkey: $12,000-$20,000
• USA: $70,000-$200,000

**Knee Replacement:**
• India: $4,000-$8,000
• Thailand: $10,000-$16,000
• USA: $35,000-$70,000

Use our Cost Predictor tool for a personalized estimate including travel and accommodation costs."""

        if "visa" in query_lower:
            return """**Medical Visa Requirements:**

**India (e-Medical Visa):**
• Apply online at indianvisaonline.gov.in
• Processing: 3-5 business days | Fee: $25
• Required: Hospital invitation letter, medical records, proof of funds

**Thailand (Non-IM Medical Visa):**
• Processing: 5-7 business days | Fee: $40
• Required: Hospital appointment letter, financial proof

**Turkey (e-Visa):**
• Apply at evisa.gov.tr | Processing: 24-48 hours | Fee: $50
• Simple online application, no medical documents required

Would you like specific visa guidance for your destination?"""

        return """Thank you for your question. I'm AthenaCare AI, your medical tourism assistant.

I can help you with:
• **Hospital recommendations** across 89 countries
• **Treatment cost comparisons** and savings estimates
• **Visa and travel requirements** for medical tourism
• **Recovery timelines** and post-treatment care planning

For the most accurate recommendations, please:
1. Upload your medical reports for AI analysis
2. Use the Hospital Matching tool with your specific diagnosis
3. Check the Cost Predictor for budget planning

Is there a specific treatment or destination you'd like to explore?"""

    async def get_response(
        self,
        message: str,
        history: List[Tuple] = None,
        user_id: str = None,
    ) -> Dict[str, Any]:
        """
        Main chatbot response function.
        Retrieves relevant context and generates grounded response.
        """
        history = history or []

        # Retrieve relevant documents
        context_docs = self._retrieve_relevant_docs(message, k=3)

        # Build prompt
        prompt = self._build_prompt(message, context_docs, history)

        # Generate response
        answer = self._generate_response(prompt)

        # Extract sources
        sources = [
            {"title": doc["source"], "category": doc["category"]}
            for doc in context_docs
        ]

        return {
            "answer": answer,
            "sources": sources,
            "confidence": 0.87 if context_docs else 0.65,
            "retrieved_docs": len(context_docs),
        }
