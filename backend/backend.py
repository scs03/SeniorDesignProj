import json
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile
import pdfplumber
import fitz  # PyMuPDF
import pytesseract
from pdf2image import convert_from_path
import cv2
import numpy as np
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to extract text using PyMuPDF (fitz)
def extract_text_pymupdf(pdf_path):
    extracted_text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            extracted_text += page.get_text("text") + "\n"
    except Exception as e:
        print("PyMuPDF extraction failed:", e)

    return extracted_text.strip()

# Function to extract text using pdfplumber
def extract_text_pdfplumber(pdf_path):
    extracted_text = ""
    extracted_tables = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"

                tables = page.extract_tables()
                for table in tables:
                    cleaned_table = [[cell if cell else "" for cell in row] for row in table]
                    extracted_tables.append(cleaned_table)
    except Exception as e:
        print("pdfplumber extraction failed:", e)

    return extracted_text.strip(), extracted_tables

# Preprocess image for OCR
def preprocess_image(img):
    img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)  # Convert to grayscale
    img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]  # Binarization
    return Image.fromarray(img)

# Function to extract text using OCR
def extract_text_ocr(pdf_path):
    extracted_text = ""
    
    try:
        images = convert_from_path(pdf_path)  # Convert PDF pages to images
        for img in images:
            img = preprocess_image(img)  # Preprocess image
            text = pytesseract.image_to_string(img, config="--psm 6")  # OCR with mode 6
            extracted_text += text + "\n"
    except Exception as e:
        print("OCR extraction failed:", e)
    
    return extracted_text.strip()

@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    temp_dir = Path("temp_uploads")
    temp_dir.mkdir(exist_ok=True)
    temp_pdf_path = temp_dir / file.filename

    with open(temp_pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Try PyMuPDF first
    text = extract_text_pymupdf(temp_pdf_path)

    # If PyMuPDF fails, try pdfplumber
    if not text.strip():
        text, tables = extract_text_pdfplumber(temp_pdf_path)
    else:
        tables = []

    # If both fail, try OCR
    if not text.strip():
        text = extract_text_ocr(temp_pdf_path)

    # Delete the file after processing
    temp_pdf_path.unlink()

    json_output = {
        "rubric_text": text,
        "rubric_tables": tables
    }

    print("\n🔹 Extracted JSON Output:")
    print(json.dumps(json_output, indent=4))

    return json.dumps(json_output, indent=4)