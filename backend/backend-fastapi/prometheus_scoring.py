# prometheus_scoring.py

# Added UploadFile back for the extract_rubric_from_pdf function
from fastapi import APIRouter, Request, HTTPException, UploadFile
from pydantic import BaseModel
import json
import time
import re # For parsing score
import requests
import os

HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/prometheus-eval/prometheus-7b-v2.0"
HF_API_KEY = os.getenv("NEXT_PUBLIC_HF_API_KEY")

headers = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}

def query_prometheus(input_text, rubric):
    payload = {
        "inputs": f"[Rubric]: {rubric} [Essay]: {input_text}"
    }

    response = requests.post(HUGGINGFACE_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        return {"error": f"Failed to fetch from Hugging Face Inference API. Status code: {response.status_code}"}

    try:
        generated_text = response.json()[0]["generated_text"]
    except (KeyError, IndexError, ValueError) as e:
        return {"error": f"Invalid response format from Hugging Face: {str(e)}"}

    return {"score": generated_text}

# --- Kept the extract_rubric_from_pdf function as requested ---
# Note: This function is currently NOT called by the /score-essay endpoint above.
# It uses a hardcoded example rubric.
def extract_rubric_from_pdf(rubric_file: UploadFile):
    """
    Function to extract and convert the rubric from PDF to a JSON object.
    For simplicity, assuming the rubric is predefined in this example.
    Actual PDF parsing would be needed here if used.
    """
    print(f"⚠️ Function 'extract_rubric_from_pdf' called (currently uses hardcoded example). File: {rubric_file.filename}")
    # In a real implementation, you would add PDF parsing logic here
    # using libraries like pdfplumber, PyPDF2, etc. to extract data
    # from the uploaded 'rubric_file'.

    # Example hardcoded rubric structure:
    rubric = {
        "grammar": {
            "description": "Assesses grammatical accuracy...",
            "scale": {
                "0": "No grammatical errors",
                "1": "Few minor grammatical errors",
                "2": "Some errors, but understandable",
                "3": "Frequent errors...",
                "4": "Poor grammar..."
            },
            "weight": 0.2
        },
        "clarity": {
            "description": "Evaluates clarity...",
            "scale": {
                "0": "Exceptionally clear...",
                "1": "Generally clear...",
                "2": "Moderate clarity...",
                "3": "Unclear in many places..."
            },
            "weight": 0.2
        }
        # Add other criteria as needed based on your actual rubric structure
    }
    print("⚠️ Returning hardcoded example rubric.")
    return rubric