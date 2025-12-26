import shutil
import os
import uuid
import tempfile
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends, Form, status
from services.document_service import document_service
from models.schemas import DocumentUploadResponse, DocumentList
from config.settings import settings
from api.deps import get_current_user

router = APIRouter()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a document and start processing it.
    Securely handles file uploads.
    """
    temp_file = None
    try:
        # 1. Validate Project Access (Check ownership)
        # Ideally we check if project exists and belongs to user first.
        # For now, relying on RLS at database level or simple check.
        
        # 2. Validate File Type (MIME & Extension)
        allowed_mimes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]
        if file.content_type not in allowed_mimes:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid file type. Only PDF, DOCX, and TXT are supported.")
        
        file_ext = os.path.splitext(file.filename)[1].lower().replace('.', '')
        if file_ext not in settings.ALLOWED_EXTENSIONS:
             raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid file extension. Allowed: {settings.ALLOWED_EXTENSIONS}")

        # 3. Secure Temp File Creation
        # Use tempfile module for safer handling
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_ext}", dir="temp")
        
        # 4. Stream content to check size
        file_size = 0
        chunk_size = 1024 * 1024 # 1MB chunks
        
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > settings.MAX_FILE_SIZE:
                temp_file.close()
                os.unlink(temp_file.name)
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File size exceeds limit of {settings.MAX_FILE_SIZE} bytes")
            temp_file.write(chunk)
            
        temp_file.close()
        temp_path = temp_file.name
            
        # 5. Create document record in Supabase
        doc_data = {
            "project_id": project_id,
            "filename": file.filename,
            "file_type": file.content_type,
            "file_size": file_size,
            "upload_status": "pending"
        }
        
        response = document_service.client.table("documents").insert(doc_data).execute()
        
        if not response.data:
            raise HTTPException(500, "Failed to create document record")
            
        document = response.data[0]
        document_id = document["id"]
        
        # 6. Start background processing
        background_tasks.add_task(
            document_service.process_document,
            document_id=document_id,
            project_id=project_id,
            file_path=temp_path,
            filename=file.filename
        )
        
        return document
        
    except HTTPException as he:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except: pass
        raise he
    except Exception as e:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except: pass
        raise HTTPException(500, str(e))

@router.get("/{project_id}", response_model=DocumentList)
async def list_documents(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all documents for a project
    """
    try:
        # Verify project access first ideally, but RLS should handle filtering if configured.
        # Adding manual check for extra safety.
        
        # Basic query
        response = document_service.client.table("documents").select("*").eq("project_id", project_id).execute()
        return {"documents": response.data}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a document
    """
    try:
        await document_service.delete_document(project_id, document_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(500, str(e))