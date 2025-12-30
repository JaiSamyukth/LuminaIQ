from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from db.client import supabase_client
from config.settings import settings
import json
import asyncio
from fastapi.responses import StreamingResponse

import uuid
import fitz # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

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

# --- Project/Doc Schemas ---
class CreateProjectRequest(BaseModel):
    name: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    created_at: str

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

# --- PROJECT ENDPOINTS ---

@router.post("/projects/", response_model=ProjectResponse)
async def create_project(request: CreateProjectRequest):
    """
    Creates a new project in Supabase 'projects' table.
    """
    try:
        # 1. Insert into Supabase
        # NOTE: This requires a 'projects' table in Supabase.
        # Structure: id (uuid), name (text), created_at (timestamptz)
        data = {
            "name": request.name,
            # "user_id": ... # In a real app, we get this from Auth Middleware
        }
        res = supabase_client.table("projects").insert(data).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create project in DB")
            
        project = res.data[0]
        return {
            "id": project.get("id"),
            "name": project.get("name"),
            "created_at": project.get("created_at")
        }
    except Exception as e:
        print(f"Project Create Error: {e}")
        # Fallback for when Table doesn't exist yet (Mocking success to not crash UI)
        # return {"id": str(uuid.uuid4()), "name": request.name, "created_at": "2024-01-01T00:00:00Z"}
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/")
async def get_projects():
    try:
        res = supabase_client.table("projects").select("*").execute()
        return res.data
    except Exception as e:
        print(f"Get Projects Error: {e}")
        return []

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    try:
        supabase_client.table("projects").delete().eq("id", project_id).execute()
        return {"message": "Project deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- DOCUMENT ENDPOINTS ---

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...), 
    project_id: str = Form(...)
):
    """
    Receives file, saves to temp, and processes using DocumentProcessor.
    """
    import os
    import shutil
    from services.document_processor import document_processor
    
    # Create temp directory if not exists
    os.makedirs("temp", exist_ok=True)
    temp_file_path = f"temp/{file.filename}"
    
    try:
        # 1. Save UploadFile to disk
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Insert Initial Record into Supabase
        file_stats = os.stat(temp_file_path)
        file_size = file_stats.st_size
        
        data = {
            "project_id": project_id,
            "filename": file.filename,
            "upload_status": "uploading",
            "file_size": file_size,
            "file_type": file.content_type or "application/pdf"
        }
        res = supabase_client.table("documents").insert(data).execute()
        
        if not res.data:
             raise HTTPException(status_code=500, detail="Failed to create document record")
             
        doc_id = res.data[0]['id']
        
        # 3. Process Document
        await document_processor.process_document(
            document_id=str(doc_id),
            project_id=project_id,
            file_path=temp_file_path,
            filename=file.filename
        )
        
        # 4. Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        return {"message": "File processed successfully", "id": doc_id}

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{project_id}")
async def get_documents(project_id: str):
    try:
        res = supabase_client.table("documents").select("*").eq("project_id", project_id).execute()
        return res.data
    except Exception as e:
         return []

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    try:
        supabase_client.table("documents").delete().eq("id", document_id).execute()
        return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- AUTH ENDPOINTS ---

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
        
        if not user_response or not user_response.user:
            print(f"Google Auth Error: Invalid user response")
            raise HTTPException(status_code=401, detail="Invalid or expired access token")

        # Return the same token (or mint a new one if we had custom auth)
        # We also return the user object matching Frontend expectation
        user_data = {
            "id": user_response.user.id,
            "email": user_response.user.email or "",
            "user_metadata": user_response.user.user_metadata or {}
        }
        
        return {
            "access_token": request.access_token,
            "user": user_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google Auth Error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

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
    
    from services.chat_service import chat_service
    
    return StreamingResponse(
        chat_service.chat_stream(
            project_id=request.project_id,
            message=request.message,
            history=request.session_history,
            selected_documents=request.selected_documents
        ),
        media_type="text/event-stream"
    )


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
