# LuminaIQ - Quick Start Guide

## 🚀 How to Run LuminaIQ Locally

### **Option 1: Start Everything (Recommended)**

Just **double-click**: `START.bat`

This will:
- ✅ Check if Node.js and Python are installed
- ✅ Start backend server (port 8001)
- ✅ Start frontend server (port 5173)
- ✅ Open browser automatically

### **Option 2: Start Individually**

**Backend Only**: Double-click `START_BACKEND.bat`
**Frontend Only**: Double-click `START_FRONTEND.bat`

---

## 📋 What You'll See

When you run `START.bat`, three windows will open:

1. **Main Window** - Shows startup progress
2. **Backend Window** - Shows FastAPI logs (yellow text)
3. **Frontend Window** - Shows Vite logs (blue text)

Your browser will open automatically at: http://localhost:5173

---

## 🛑 How to Stop

**Option 1**: Close the terminal windows
**Option 2**: Press `Ctrl+C` in each terminal window

---

## 🔧 First Time Setup

If this is your first time running LuminaIQ:

### 1. **Install Dependencies**

**Frontend:**
```bash
cd index
npm install
```

**Backend:**
```bash
cd pdfprocess
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. **Configure Environment**

Make sure these files exist with correct values:
- `index/.env` - Frontend environment variables
- `pdfprocess/.env` - Backend environment variables

### 3. **Run for the First Time**

Double-click `START.bat`

---

## 📊 Server URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main application |
| **Backend API** | http://localhost:8001 | PDF processing service |
| **API Docs** | http://localhost:8001/docs | Swagger documentation |
| **Health Check** | http://localhost:8001/health | Check if backend is running |

---

## ❗ Troubleshooting

### "Node.js is not installed"
**Solution**: Install from https://nodejs.org/

### "Python is not installed"
**Solution**: Install from https://www.python.org/

### "Virtual environment not found"
**Solution**: Run these commands:
```bash
cd pdfprocess
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### "Dependencies not installed" (Frontend)
**Solution**: Run:
```bash
cd index
npm install
```

### Port already in use
**Solution**: 
- Check if another instance is running
- Kill the process using the port
- Or change the port in the batch files

---

## 🎯 Next Steps

1. **Use Locally**: Create projects, upload PDFs, test features
2. **Deploy**: Follow [COMPLETE_DEPLOYMENT_GUIDE.md](./COMPLETE_DEPLOYMENT_GUIDE.md)
3. **Configure OAuth**: Follow [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

---

**Happy Learning with LuminaIQ!** 🎉
