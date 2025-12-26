from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from services.document_service import document_service
from config.settings import settings
from utils.logger import logger

router = APIRouter()


class WebhookPayload(BaseModel):
    document_id: str
    project_id: str
    chunk_count: int
    secret: str


class WebhookResponse(BaseModel):
    status: str
    message: str


@router.post("/document-ready", response_model=WebhookResponse)
async def document_ready_webhook(payload: WebhookPayload):
    """
    Webhook endpoint called by PDF service when document chunks are ready.
    Triggers embedding generation for the document.
    """
    try:
        # Verify webhook secret
        expected_secret = getattr(settings, 'WEBHOOK_SECRET', 'supersecretwebhook')
        if payload.secret != expected_secret:
            logger.warning(f"Invalid webhook secret for document {payload.document_id}")
            raise HTTPException(status_code=403, detail="Invalid webhook secret")
        
        logger.info(f"Received webhook for document {payload.document_id} with {payload.chunk_count} chunks")
        
        # Process chunks for embedding
        await document_service.process_chunks_from_db(
            document_id=payload.document_id,
            project_id=payload.project_id
        )
        
        return {
            "status": "success",
            "message": f"Started embedding generation for {payload.chunk_count} chunks"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
