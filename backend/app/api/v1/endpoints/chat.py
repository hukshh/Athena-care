"""
RAG-based Healthcare Chatbot endpoint
Uses LangChain + FAISS for grounded responses
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_database
from app.core.security import get_current_user
from app.services.rag_chatbot import RAGChatbot

router = APIRouter()
_chatbot = None

def get_chatbot() -> RAGChatbot:
    global _chatbot
    if _chatbot is None:
        _chatbot = RAGChatbot()
    return _chatbot


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    session_id: Optional[str] = None


@router.post("/message")
async def send_message(
    request: ChatRequest,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """
    Send a message to the RAG healthcare chatbot.
    Uses LangChain + FAISS for grounded, context-aware responses.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if len(request.message) > 2000:
        raise HTTPException(status_code=400, detail="Message too long (max 2000 chars)")

    # Get AI response
    chatbot = get_chatbot()
    response = await chatbot.get_response(
        message=request.message,
        history=[(m.role, m.content) for m in (request.history or [])],
        user_id=current_user["id"],
    )

    # Save to chat history
    if db is not None:
        await db.chat_history.insert_many([
            {
                "user_id": current_user["id"],
                "role": "user",
                "content": request.message,
                "timestamp": datetime.utcnow(),
            },
            {
                "user_id": current_user["id"],
                "role": "assistant",
                "content": response["answer"],
                "sources": response.get("sources", []),
                "timestamp": datetime.utcnow(),
            },
        ])

    return {
        "answer": response["answer"],
        "sources": response.get("sources", []),
        "confidence": response.get("confidence", 0.85),
    }


@router.get("/history")
async def get_chat_history(
    limit: int = 50,
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Get chat history for current user"""
    if db is None:
        return {"messages": [], "total": 0}

    cursor = db.chat_history.find(
        {"user_id": current_user["id"]}
    ).sort("timestamp", -1).limit(limit)

    messages = []
    async for msg in cursor:
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        messages.append(msg)

    return {"messages": list(reversed(messages)), "total": len(messages)}


@router.delete("/history")
async def clear_chat_history(
    db=Depends(get_database),
    current_user=Depends(get_current_user),
):
    """Clear chat history for current user"""
    if db is None:
        return {"message": "Database unavailable"}

    result = await db.chat_history.delete_many({"user_id": current_user["id"]})
    return {"message": f"Cleared {result.deleted_count} messages"}
