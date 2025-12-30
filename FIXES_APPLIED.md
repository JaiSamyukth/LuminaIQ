# Fixes Applied to LuminaIQ

This document outlines the fixes applied to resolve issues with Google Sign-In, book embeddings, and chunking functionality.

## Issues Fixed

### 1. Google Sign-In Not Working Properly

**Problem:**
- Google OAuth login was experiencing failures and login loops
- Backend token validation was not handling edge cases properly
- Frontend had potential race conditions during token exchange

**Solution:**
- **Backend (`pdfprocess/api/routes.py`):**
  - Enhanced error handling in `/auth/google` endpoint
  - Added better logging for debugging authentication issues
  - Improved null checks and error messages
  - Added detailed exception handling with traceback

- **Frontend (`index/src/context/AuthContext.jsx`):**
  - Added `isExchangingToken` flag to prevent race conditions
  - Enhanced logging for auth state changes
  - Better error handling during token exchange
  - Proper cleanup of localStorage on auth failures
  - More detailed error messages for debugging

### 2. Book Embeddings Issues

**Problem:**
- Embeddings were being generated but not stored properly
- Database schema was missing the `embedding` column
- No vector search functionality was set up

**Solution:**
- **Database Schema (`pdfprocess/db/schema.sql`):**
  - Added `embedding vector(768)` column to `document_chunks` table
  - Enabled pgvector extension for vector similarity search
  - Created IVFFlat index for efficient vector searches
  - Dimension matches the BAAI/bge-base-en-v1.5 model (768 dimensions)

- **Migration File (`pdfprocess/db/migration_add_embeddings.sql`):**
  - Created migration SQL to add embeddings to existing databases
  - Includes RPC function `match_documents` for vector similarity search
  - Safe to run multiple times (checks for existing columns/indexes)

### 3. Book Chunking Issues

**Problem:**
- Text chunking had incomplete parameter passing when creating temporary splitters
- Missing `length_function` and `is_separator_regex` parameters

**Solution:**
- **Text Chunker (`pdfprocess/utils/text_chunker.py`):**
  - Added missing `length_function=len` parameter
  - Added missing `is_separator_regex=False` parameter
  - Ensures consistent behavior when dynamically creating splitters

## How to Apply These Fixes

### For New Installations:

1. The schema in `pdfprocess/db/schema.sql` now includes all necessary columns
2. Run the schema SQL in your Supabase SQL Editor
3. Deploy the updated code

### For Existing Installations:

1. **Update Database:**
   ```sql
   -- Run this in your Supabase SQL Editor
   -- File: pdfprocess/db/migration_add_embeddings.sql
   ```
   This will add the embedding column and vector search functionality

2. **Deploy Backend:**
   - The backend code in `pdfprocess/` has been updated
   - Redeploy your backend service (e.g., on Render)

3. **Deploy Frontend:**
   - The frontend code in `index/` has been updated
   - Rebuild and redeploy your frontend

4. **Verify:**
   - Test Google Sign-In
   - Upload a document and verify embeddings are generated
   - Test chat/search functionality

## Technical Details

### Embedding Model
- Model: `BAAI/bge-base-en-v1.5`
- Dimensions: 768
- Provider: Together AI (via OpenAI-compatible API)

### Chunking Configuration
- Chunk Size: 1000 characters (configurable in `config/settings.py`)
- Chunk Overlap: 200 characters (configurable in `config/settings.py`)
- Splitter: RecursiveCharacterTextSplitter from LangChain

### Vector Search
- Extension: pgvector
- Index Type: IVFFlat with cosine distance
- Search Function: `match_documents` RPC in Supabase

## Environment Variables Required

Make sure these are set in your backend `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
TOGETHER_API_KEY=your_together_api_key
```

And in your frontend `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BACKEND_API_URL=your_backend_url
```

## Testing Recommendations

1. **Google Sign-In:**
   - Clear browser cache and localStorage
   - Try signing in with Google
   - Check browser console for detailed logs

2. **Document Processing:**
   - Upload a PDF document
   - Check Supabase `document_chunks` table for embeddings
   - Verify embedding column has values (not NULL)

3. **Chat/Search:**
   - Try asking questions about uploaded documents
   - Verify relevant context is being retrieved
   - Check backend logs for vector search results

## Troubleshooting

### Google Sign-In Still Not Working:
1. Check Supabase Auth settings (Google OAuth configured)
2. Verify redirect URLs are correct
3. Check backend logs for detailed error messages
4. Ensure backend can reach Supabase API

### Embeddings Not Generated:
1. Verify Together AI API key is valid
2. Check backend logs for embedding generation errors
3. Verify Supabase has the embedding column
4. Check document_chunks table structure

### Vector Search Not Working:
1. Verify pgvector extension is enabled in Supabase
2. Check if `match_documents` RPC function exists
3. Verify embeddings are not NULL in database
4. Check index was created successfully
