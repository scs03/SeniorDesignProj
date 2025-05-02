# prometheus_scoring.py

# Added UploadFile back for the extract_rubric_from_pdf function
from fastapi import APIRouter, Request, HTTPException, UploadFile
from pydantic import BaseModel
import json
import time
import re # For parsing score
# Removed: requests, os, Body, File (unless extract_rubric_from_pdf needs File)

# --- Access Model and Tokenizer from backend.py ---
# This assumes 'model' and 'tokenizer' are loaded and accessible
# (e.g., as globals) in your main backend.py file.
# Adjust the import path if your structure is different.
# Consider using Dependency Injection for a more robust solution.
try:
    # Import the model and tokenizer loaded in backend.py
    # Ensure backend.py defines these before this module is imported
    # or use FastAPI's lifespan events / dependency injection.
    from backend import model, tokenizer

    # Optional: Import types for hinting if available/desired
    # from transformers import AutoTokenizer # Example
    # from hqq.models.hf.base import AutoHQQHFModel # Example

except ImportError:
    # Handle case where backend hasn't loaded them yet or structure is wrong
    # For now, we'll print a warning and rely on a check within the endpoint.
    print("⚠️ Warning: Could not import model/tokenizer from backend.py initially.")
    print("Ensure backend.py loads them before requests hit this endpoint.")
    model = None
    tokenizer = None

# --- Pydantic Model for Incoming Data ---
class EssayInput(BaseModel):
    essayText: str
    rubric: dict # Expecting the structured rubric object directly

# --- APIRouter Instance ---
router = APIRouter()

# --- Refactored Scoring Endpoint ---
@router.post("/score-essay/")
async def score_essay_endpoint(request: Request, data: EssayInput):
    """
    Receives essay text and rubric, formats a prompt for scoring,
    calls the loaded LLM directly, parses the result, and returns score/feedback.
    """
    global model, tokenizer # Reference globals if using that method
    print("\n✅ Entered score_essay_endpoint (Refactored for Direct LLM Call)")

    # --- Optional: Raw Request Logging ---
    try:
        body_bytes = await request.body()
        body_str = body_bytes.decode('utf-8')
        print("--- Received Raw Request Body ---")
        print(f"Body Length: {len(body_bytes)}")
        print(f"Body Content (Snippet): {body_str[:500]}{'...' if len(body_str) > 500 else ''}")
        print("---------------------------------\n")
    except Exception as e:
        print(f"--- Error reading raw request body: {e} ---\n")
    # --- End Optional Logging ---

    # --- Log Parsed Data ---
    print("📦 Data received (after Pydantic parsing)")
    print(f"📦 Essay Text Snippet: {data.essayText[:200]}...")
    if isinstance(data.rubric, dict):
        print(f"📦 Rubric Keys: {list(data.rubric.keys())}")
    else:
        print("⚠️ Rubric data is not a dictionary after parsing:", data.rubric)
        raise HTTPException(status_code=400, detail="Invalid rubric format received.")
     # --- End Data Logging ---

    # --- Check if model/tokenizer were loaded ---
    if model is None or tokenizer is None:
         try:
             from backend import model as backend_model, tokenizer as backend_tokenizer
             model = backend_model
             tokenizer = backend_tokenizer
             if model is None or tokenizer is None:
                 raise ImportError("Model or tokenizer still None after re-import attempt")
             print("✅ Successfully accessed model/tokenizer on second attempt.")
         except ImportError as e:
              print("❌ CRITICAL: Model or Tokenizer not loaded/accessible from backend.py")
              raise HTTPException(status_code=500, detail=f"Model/Tokenizer not available: {e}")

    # --- 1. Format Scoring Prompt ---
    system_prompt = """###Task Description:
An instruction (might include an Input inside it), a response to evaluate, a reference answer that gets a score of 5, and a score rubric representing a evaluation criteria are given.
1. Write a detailed feedback that assess the quality of the response strictly based on the given score rubric, not evaluating in general.
2. After writing a feedback, write a score that is an integer between 1 and 5. You should refer to the score rubric.
3. The output format should look as follows: \"Feedback: (write a feedback for criteria) [RESULT] (an integer number between 1 and 5)\"
4. Please do not generate any other opening, closing, and explanations."""

    try:
        rubric_str = json.dumps(data.rubric, indent=2)
    except TypeError as e:
        print(f"❌ Error converting rubric to JSON: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid rubric structure: {e}")

    user_prompt = f"""###The instruction to evaluate:
{data.rubric.get("instruction", "Evaluate the following essay based on the rubric.")}

###Response to evaluate:
{data.essayText}

###Reference Answer (Score 5):
{data.rubric.get("reference_answer", "N/A")}

###Score Rubrics:
{rubric_str}

###Feedback:"""

    # --- 2. Call LLM Directly ---
    generated_score_feedback = ""
    llm_duration = -1.0
    try:
        model_device = getattr(model, 'device', 'unknown')
        print(f"🔵 Preparing input for scoring (Device: {model_device})...")
        inputs = tokenizer(user_prompt, return_tensors="pt", truncation=True, max_length=4096)
        input_ids = inputs["input_ids"].to(model_device)
        attention_mask = inputs["attention_mask"].to(model_device)

        print(f"🔵 Generating score/feedback (Input Length: {input_ids.shape[1]})...")
        start_time = time.time()
        outputs = model.generate(
            input_ids,
            attention_mask=attention_mask,
            max_new_tokens=256,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )
        end_time = time.time()
        llm_duration = end_time - start_time
        print(f"✅ LLM generation took {llm_duration:.2f} seconds")

        output_ids = outputs[0][input_ids.shape[1]:]
        generated_score_feedback = tokenizer.decode(output_ids, skip_special_tokens=True).strip()
        print(f"✅ Raw LLM Output Snippet: {generated_score_feedback[:200]}...")

    except AttributeError as e:
        print(f"❌ Error accessing model device or calling generate: {e}")
        raise HTTPException(status_code=500, detail=f"Model object error: {e}")
    except Exception as e:
        print(f"❌ Error during LLM scoring call: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error during LLM generation: {e}")

    # --- 3. Parse LLM Output ---
    score = None
    feedback = generated_score_feedback
    try:
        result_marker = "[RESULT]"
        if result_marker in generated_score_feedback:
            parts = generated_score_feedback.split(result_marker, 1)
            feedback_part = parts[0].replace("Feedback:", "").strip()
            score_part = parts[1].strip()
            score_match = re.search(r'\d+', score_part)
            if score_match:
                 extracted_score = int(score_match.group())
                 if 1 <= extracted_score <= 5:
                     score = extracted_score
                     feedback = feedback_part
                     print(f"✅ Successfully parsed score: {score}")
                 else:
                     print(f"⚠️ Parsed score {extracted_score} out of range (1-5).")
            else:
                 print("⚠️ Could not find numerical score after [RESULT].")
        else:
            print("⚠️ Marker [RESULT] not found in LLM output.")
    except Exception as e:
        print(f"❌ Error parsing LLM output: {e}")
        score = None # Ensure score is None if parsing failed

    print(f"✅ Final Score: {score}")
    print(f"✅ Final Feedback Snippet: {feedback[:100]}...")

    # --- 4. Return Parsed Result ---
    return {"score": score, "feedback": feedback, "llm_duration_sec": round(llm_duration, 2)}


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