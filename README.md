# LuminaIQ Platform

AI-Powered Learning Platform - Transform your documents into interactive learning experiences.

## Project Structure

```
LuminaIQ/
├── index/          # Frontend (React + Vite)
├── pdfprocess/     # Backend PDF Processing Service (FastAPI)
└── DEPLOYMENT.md   # Deployment guide
```

## Quick Start

### Local Development

**Frontend:**
```bash
cd index
npm install
npm run dev
# Opens at http://localhost:5173
```

**Backend:**
```bash
cd pdfprocess
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# Opens at http://localhost:8001
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step guide to deploy on Render.

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[Complete Documentation](https://github.com/YOUR_USERNAME/luminaiq/docs)** - Full technical reference

## Features

- 📄 **Document Upload** - PDF, DOCX, TXT, HTML, MD
- 💬 **AI Chat** - Ask questions about your documents
- 📝 **Quiz Generation** - Create MCQ tests automatically
- 📚 **Notes Generation** - Generate structured study notes
- 🎯 **Q&A Tests** - Subjective question evaluation

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: FastAPI, Python 3.11
- **Database**: Supabase (PostgreSQL)
- **AI**: Together AI, LangChain

## License

[Add your license here]
