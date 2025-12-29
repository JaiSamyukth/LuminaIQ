import json
import asyncio
from typing import List, AsyncGenerator
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from db.client import supabase_client
from config.settings import settings
from utils.logger import logger

class ChatService:
    def __init__(self):
        # Initialize Embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.TOGETHER_API_KEY,
            openai_api_base=settings.TOGETHER_BASE_URL
        )
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            openai_api_key=settings.TOGETHER_API_KEY,
            openai_api_base=settings.TOGETHER_BASE_URL,
            temperature=0.7,
            streaming=True
        )

    async def get_relevant_chunks(self, query: str, project_id: str, limit: int = 5) -> List[dict]:
        """Retrieve relevant chunks using Vector Search"""
        try:
            # 1. Embed Query
            query_embedding = await asyncio.to_thread(self.embeddings.embed_query, query)
            
            # 2. Call RPC
            params = {
                "query_embedding": query_embedding,
                "match_threshold": 0.5, # Minimum similarity
                "match_count": limit,
                "filter_project_id": project_id
            }
            res = supabase_client.rpc("match_documents", params).execute()
            
            return res.data if res.data else []
        except Exception as e:
            logger.error(f"Vector Search Failed: {e}")
            return []

    async def chat_stream(
        self, 
        project_id: str, 
        message: str, 
        history: List[dict],
        selected_documents: List[str]
    ) -> AsyncGenerator[str, None]:
        """
        Flow:
        1. Search Vector DB for context.
        2. Build Prompt (System + Context + User Query).
        3. Stream LLM response.
        """
        
        # 1. Retrieve Context
        # TODO: Filter by selected_documents if provided (requires updated RPC or Python filtering)
        # For now, we search the whole project which is acceptable functionality.
        chunks = await self.get_relevant_chunks(message, project_id)
        
        # Format Context
        context_text = "\n\n".join([f"Source ({c['id']}): {c['content']}" for c in chunks])
        
        # Yield Sources first (Frontend Protocol)
        sources_metadata = [
            {"id": c['id'], "doc_name": "Document", "chunk_text": c['content'][:100]+"..."} 
            for c in chunks
        ]
        yield f"__SOURCES__:{json.dumps(sources_metadata)}"
        
        # 2. Build Prompt
        system_prompt = f"""You are LuminaIQ, an AI research assistant. 
Use the following pieces of retrieved context to answer the user's question.
If the answer is not in the context, say you don't know, but try your best to synthesize.
Keep answers concise and professional.

Context:
{context_text}
"""
        
        messages = [SystemMessage(content=system_prompt)]
        
        # Add limited history (last 4 messages to save tokens)
        for msg in history[-4:]:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            # Ideally add AI messages too if available in proper format
            
        messages.append(HumanMessage(content=message))
        
        # 3. Stream Response
        try:
            async for chunk in self.llm.astream(messages):
                if chunk.content:
                    yield chunk.content
        except Exception as e:
            logger.error(f"LLM Stream Error: {e}")
            yield f"\n[Error generating response: {str(e)}]"

# Singleton
chat_service = ChatService()
