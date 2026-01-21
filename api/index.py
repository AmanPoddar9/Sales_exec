from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import logging
from main import validate_env, transcribe_audio, analyze_conversation
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity in this setup
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        logger.info(f"Received file: {file.filename}")
        
        # Validate keys first
        deepgram_key, openai_key = validate_env()
        
        # Read file content
        content = await file.read()
        
        # 1. Transcribe
        # Pass content directly as bytes
        transcript = transcribe_audio(content, deepgram_key)
        
        if not transcript.strip():
            return {
                "transcription": "",
                "analysis": None,
                "error": "No speech detected or transcription failed."
            }
            
        # 2. Analyze
        analysis_json_str = analyze_conversation(transcript, openai_key)
        
        # Parse JSON safely
        try:
            analysis_data = json.loads(analysis_json_str)
        except json.JSONDecodeError:
            # Fallback for naive string
            analysis_data = {"raw_output": analysis_json_str}
            
        return {
            "transcription": transcript,
            **analysis_data
        }

    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
