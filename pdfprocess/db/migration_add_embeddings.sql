-- Migration: Add embeddings column and vector search support
-- Run this in your Supabase SQL Editor to add embeddings to existing database

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to document_chunks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_chunks' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE document_chunks ADD COLUMN embedding vector(768);
        RAISE NOTICE 'Added embedding column to document_chunks table';
    ELSE
        RAISE NOTICE 'embedding column already exists in document_chunks table';
    END IF;
END $$;

-- Create index for vector similarity search if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create or replace the match_documents RPC function for vector search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_project_id uuid
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    project_id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.project_id,
        dc.chunk_text as content,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM document_chunks dc
    WHERE dc.project_id = filter_project_id
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO service_role;
