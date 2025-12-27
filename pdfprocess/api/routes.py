from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from db.client import supabase_client
from config.settings import settings
import json
import asyncio
from fastapi.responses import StreamingResponse

# Define Router
router = APIRouter()

# --- Auth Schemas ---
class TokenExchangeRequest(BaseModel):
    access_token: str

class AuthResponse(BaseModel):
    access_token: str
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str

# --- Chat/RAG Schemas ---
class ChatRequest(BaseModel):
    project_id: str
    message: str
    session_history: List[Dict[str, str]] = []
    selected_documents: List[str] = []

class MCQRequest(BaseModel):
    project_id: str
    topic: str
    num_questions: int
    selected_documents: List[str] = []

class NotesRequest(BaseModel):
    project_id: str
    note_type: str
    topic: str
    selected_documents: List[str] = []

# --- AUTH ENDPOINTS ---

@router.post("/auth/google", response_model=AuthResponse)
async def google_auth(request: TokenExchangeRequest):
    """
    Exchanges a Google Access Token (from Supabase Frontend) for a Session.
    Since Frontend already authenticated with Supabase, we might just need to 
    verify the session or simply return the User object if we trust the token.
    
    In a strict flow, we would verify the JWT. 
    For this implementation, we assume the Frontend sends the SUPABASE ACCESS TOKEN.
    """
    try:
        # Verify the token with Supabase by getting the user
        user_response = supabase_client.auth.get_user(request.access_token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid Supabase Token")

        # Return the same token (or mint a new one if we had custom auth)
        # We also return the user object matchin Frontend expectation
        return {
            "access_token": request.access_token,
            "user": {
                "id": user_response.user.id,
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata
            }
        }
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication Failed")

@router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        response = supabase_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        if not response.session:
             raise HTTPException(status_code=401, detail="Login Failed")
             
        return {
            "access_token": response.session.access_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    try:
        response = supabase_client.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"full_name": request.full_name}
            }
        })
        # If email confirmation enabled, session might be None
        if not response.session and not response.user:
             raise HTTPException(status_code=400, detail="Signup Failed")
             
        # Handling case where email confirm is required (no session yet)
        token = response.session.access_token if response.session else ""
        
        return {
            "access_token": token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "user_metadata": response.user.user_metadata
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- CHAT / RAG ENDPOINTS (Simplified) ---

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming Chat Endpoint.
    1. Retrieve relevant chunks from Supabase (Vector Search).
    2. Construct Prompt.
    3. Stream LLM Response.
    """
    
    # 1. Dummy Retrieval (Replace with actual Vector Store logic later)
    # We query Supabase 'document_chunks' via RPC or Select
    # For now, we simulate retrieval to unblock the UI loop.
    
    # Mocking a stream generator
    async def event_generator():
        # Fake retrieval context
        sources = [
            {"id": "doc1", "filename": "example.pdf", "content": "Sample context content..."}
        ]
        
        # Send Sources First (Protocol expected by Frontend)
        yield f"__SOURCES__:{json.dumps(sources)}"
        
        # Stream Answer chunks
        response_text = f" This is a simulated response regarding your project {request.project_id}. logic is being rebuilt."
        
        for word in response_text.split(" "):
            yield word + " "
            await asyncio.sleep(0.05)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/chat/history/{project_id}")
async def get_chat_history(project_id: str):
    # Return empty history for now
    return []


# --- GENERATION ENDPOINTS (Simplified Stub) ---

@router.post("/mcq/generate")
async def generate_mcq(request: MCQRequest):
    return {
        "questions": [
            {
                "question": "Sample Question based on " + request.topic,
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_option": "Option A",
                "explanation": "Explanation here."
            }
        ]
    }

@router.get("/mcq/topics/{project_id}")
async def get_mcq_topics(project_id: str):
    return ["Topic 1", "Topic 2", "General Overview"]

@router.post("/notes/generate")
async def generate_notes(request: NotesRequest):
    return {
        "content": f"# Notes on {request.topic}\n\nGenerated notes content will appear here..."
    }
