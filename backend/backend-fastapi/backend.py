# backend.py

import json
import httpx # Keep httpx if needed for other external calls, but not for calling /score-essay
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
import pdfplumber
import fitz  # PyMuPDF
import pytesseract
# pdf2image might require poppler path configuration depending on OS
# from pdf2image import convert_from_path
import cv2
import numpy as np
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import ctypes
import os
import traceback # For detailed error printing

load_dotenv()


# --- Import the Prometheus Scoring Function (Hugging Face API version) ---
try:
    # Assuming prometheus_scoring.py is in the same directory as backend.py
    from prometheus_scoring import query_prometheus
except ImportError as e:
    print(f"Error importing prometheus_router or query_prometheus: {e}")
    print("Please ensure 'prometheus_scoring.py' is in the same directory as 'backend.py'.")
    raise e

# --- Create FastAPI App ---
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PDF Extraction Functions ---
# (These functions remain unchanged)
def extract_text_pymupdf(pdf_path):
    extracted_text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc: extracted_text += page.get_text("text") + "\n"
        doc.close()
    except Exception as e: print(f"PyMuPDF extraction failed: {e}")
    return extracted_text.strip()

def extract_text_pdfplumber(pdf_path):
    extracted_text = ""
    extracted_tables = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text();
                if text: extracted_text += text + "\n"
                tables = page.extract_tables();
                for table in tables: extracted_tables.append([[cell or "" for cell in row] for row in table])
    except Exception as e: print(f"pdfplumber extraction failed: {e}")
    return extracted_text.strip(), extracted_tables

def preprocess_image(img):
    img_np = np.array(img)
    if len(img_np.shape) == 3 and img_np.shape[2] == 4: img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2RGB)
    img_gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    img_bin = cv2.threshold(img_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    return Image.fromarray(img_bin)

def extract_text_ocr(pdf_path):
    extracted_text = ""
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path)
        for img in images:
            img_processed = preprocess_image(img);
            text = pytesseract.image_to_string(img_processed, config="--psm 6");
            extracted_text += text + "\n"
    except ImportError: print("OCR failed: pdf2image/poppler not installed/configured.")
    except Exception as e: print(f"OCR extraction failed: {e}")
    return extracted_text.strip()
# --- End PDF Functions ---


# --- PDF Text Extraction Endpoint ---
# (This endpoint remains unchanged)
@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...), type: str = Form("text")):
    print(f"\n--- Received request to /extract-text/ for type: {type} ---")
    temp_dir = Path("temp_uploads"); temp_dir.mkdir(exist_ok=True)
    safe_filename = Path(file.filename).name; temp_pdf_path = temp_dir / safe_filename
    try:
        with temp_pdf_path.open("wb") as buffer: shutil.copyfileobj(file.file, buffer)
        print(f"Temporarily saved uploaded file to: {temp_pdf_path}")
        text = extract_text_pymupdf(temp_pdf_path); tables = []
        if not text or not text.strip(): text, tables = extract_text_pdfplumber(temp_pdf_path)
        if not text or not text.strip(): text = extract_text_ocr(temp_pdf_path); tables = []
        json_output = {"generic_text": text, "generic_tables": tables}
        print("--- /extract-text/ Extraction Result ---")
        print(f"Text Snippet: {text[:200]}{'...' if len(text)>200 else ''}")
        print(f"Tables extracted: {len(tables)}")
        print("-------------------------------------\n")
        return json_output
    except Exception as e:
        print(f"\n--- /extract-text/ Error: {e} ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process PDF file: {e}")
    finally:
        if temp_pdf_path.exists():
            try: temp_pdf_path.unlink(); print(f"Deleted temporary file: {temp_pdf_path}")
            except OSError as e: print(f"Error deleting temp file {temp_pdf_path}: {e}")
# --- End PDF Extraction Endpoint ---


# --- /api/score-essay Endpoint ---
from fastapi import Request

@app.post("/api/score-essay")
async def score_essay(request: Request):
    data = await request.json()
    input_text = data.get("input_text")
    rubric = data.get("rubric")

    if input_text is None or rubric is None:
        return {"error": "Missing input_text or rubric"}

    result = query_prometheus(input_text, rubric)
    return result
# --- End /api/score-essay Endpoint ---




# --- Root Endpoint ---
@app.get("/")
async def read_root():
    # Provide more status info since model/tokenizer loading is removed
    status = "API is running. Model loading has been removed; only PDF extraction and scoring endpoints are active."
    return {"message": status}
# --- End Root Endpoint ---

print("--- FastAPI app configured ---")

# To run: uvicorn backend:app --reload --host 0.0.0.0 --port 8000