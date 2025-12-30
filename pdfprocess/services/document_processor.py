import asyncio
import httpx
from typing import Optional
from db.client import supabase_client
from config.settings import settings
from utils.file_parser import FileParser
from utils.text_chunker import TextChunker
from utils.logger import logger

from langchain_openai import OpenAIEmbeddings

class DocumentProcessor:
    def __init__(self):
        self.client = supabase_client
        self.file_parser = FileParser()
        self.text_chunker = TextChunker(
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP
        )
        # Initialize Embeddings (Together AI)
        print(f"Initializing Embeddings with Model: {settings.EMBEDDING_MODEL}")
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.TOGETHER_API_KEY,
            openai_api_base=settings.TOGETHER_BASE_URL
        )
    
    async def process_document(
        self,
        document_id: str,
        project_id: str,
        file_path: str,
        filename: str
    ):
        """Process uploaded document: extract text, chunk, and store in Supabase"""
        try:
            # Update status to processing
            await self._update_document_status(document_id, "processing")
            
            loop = asyncio.get_running_loop()

            # 1. Extract text (Run in thread pool to avoid blocking)
            logger.info(f"Extracting text from {filename}")
            print(f"DEBUG: Starting text extraction for {filename}")
            await self._update_document_status(document_id, "processing", "Extracting text...")
            text = await loop.run_in_executor(None, self.file_parser.extract_text, file_path)
            
            print(f"DEBUG: Extracted text length: {len(text) if text else 0}")
            
            if not text:
                await self._update_document_status(document_id, "failed", "Failed to extract text")
                return
            
            # 2. Chunk text (Run in thread pool to avoid blocking)
            logger.info(f"Chunking text from {filename}")
            print(f"DEBUG: Starting text chunking")
            await self._update_document_status(document_id, "processing", "Chunking text...")
            chunks = await loop.run_in_executor(
                None, 
                lambda: self.text_chunker.chunk_text(text)
            )
            
            print(f"DEBUG: Generated {len(chunks)} chunks")
            
            if not chunks:
                await self._update_document_status(document_id, "failed", "No chunks generated")
                return
            
            # 3. Store chunks in Supabase
            logger.info(f"Storing {len(chunks)} chunks in database")
            await self._update_document_status(document_id, "processing", f"Storing {len(chunks)} chunks...")
            await self._store_chunks(document_id, project_id, chunks)
            
            # 4. Update status to chunks_ready (ready for embedding by main API)
            await self._update_document_status(document_id, "chunks_ready")
            logger.info(f"Document {filename} chunks stored successfully")
            
            # 5. Notify main API via webhook
            await self._notify_main_api(document_id, project_id, len(chunks))
            
        except Exception as e:
            logger.error(f"Error processing document {filename}: {str(e)}")
            await self._update_document_status(document_id, "failed", str(e))
    
    async def _store_chunks(
        self,
        document_id: str,
        project_id: str,
        chunks: list
    ):
        """Store text chunks + embeddings in document_chunks table"""
        try:
            # Generate Embeddings for the whole batch
            logger.info(f"Generating embeddings for {len(chunks)} chunks...")
            print(f"DEBUG: Generating embeddings for {len(chunks)} chunks...")
            # Run in thread pool to avoid blocking async loop since it's a sync call or IO heavy
            loop = asyncio.get_running_loop()
            embeddings_list = await loop.run_in_executor(
                None, 
                lambda: self.embeddings.embed_documents(chunks)
            )
            
            print(f"DEBUG: Generated {len(embeddings_list)} embeddings, first dim: {len(embeddings_list[0]) if embeddings_list else 'N/A'}")
            
            # Prepare chunk records
            chunk_records = [
                {
                    "document_id": document_id,
                    "project_id": project_id,
                    "chunk_index": idx,
                    "chunk_text": chunk_text,
                    "embedding": embeddings_list[idx]
                }
                for idx, chunk_text in enumerate(chunks)
            ]
            
            # Insert in batches of 100
            batch_size = 100
            for i in range(0, len(chunk_records), batch_size):
                batch = chunk_records[i:i + batch_size]
                print(f"DEBUG: Inserting batch {i // batch_size + 1}, {len(batch)} chunks")
                self.client.table("document_chunks").insert(batch).execute()
                logger.info(f"Inserted chunk batch {i // batch_size + 1}")
                
        except Exception as e:
            logger.error(f"Error storing chunks: {str(e)}")
            print(f"DEBUG: Error storing chunks: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    async def _update_document_status(
        self,
        document_id: str,
        status: str,
        message: Optional[str] = None
    ):
        """Update document processing status in database"""
        try:
            update_data = {"upload_status": status}
            if status == "chunks_ready" or status == "completed":
                 update_data["error_message"] = None
            elif message:
                update_data["error_message"] = message
            
            self.client.table("documents").update(update_data).eq(
                "id", document_id
            ).execute()
            
        except Exception as e:
            logger.error(f"Error updating document status: {str(e)}")

    async def _notify_main_api(
        self,
        document_id: str,
        project_id: str,
        chunk_count: int
    ):
        """Notify main API that document chunks are ready for embedding"""
        try:
            webhook_url = settings.MAIN_API_WEBHOOK_URL
            
            payload = {
                "document_id": document_id,
                "project_id": project_id,
                "chunk_count": chunk_count,
                "secret": settings.MAIN_API_WEBHOOK_SECRET
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully notified main API for document {document_id}")
                else:
                    logger.warning(f"Main API webhook returned {response.status_code}: {response.text}")
                    
        except Exception as e:
            # Don't fail the whole process if webhook fails
            # Main API can poll for chunks_ready status as fallback
            logger.error(f"Failed to notify main API: {str(e)}")

document_processor = DocumentProcessor()
