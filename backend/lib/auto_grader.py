import requests
import json
import os
from openai import OpenAI # Import the class directly
import traceback # Added for better error printing in main

# Attempt to import Submission model - ensure Django is configured
# if this script runs standalone or called from specific management commands.
try:
    from groups.models import Submission
except ImportError as e:
    # Handle cases where Django models aren't ready or this script
    # runs outside a Django context where models are needed.
    print(f"Warning: Could not import Submission model: {e}. Ensure Django is set up if models are needed.")
    Submission = None

# --- Configuration ---
# Use environment variables for URLs if possible for flexibility
PDFPARSE_URL = os.getenv("PDFPARSE_URL", "http://host.docker.internal:3000/api/pdfparse") # Assumes your FastAPI service is at :3000 and provides this route
PARSE_RUBRIC_URL = os.getenv("PARSE_RUBRIC_URL", "http://host.docker.internal:3000/api/parse-rubric")
SCORE_ESSAY_URL = os.getenv("SCORE_ESSAY_URL", "http://host.docker.internal:3000/api/huggingface")

REQUEST_TIMEOUT = 180 # Increased timeout for potentially longer LLM calls
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") # Get API Key once

# --- Helper for combining scores ---
def validate_score(flan: float, gpt: int, gpt_reasoning_or_feedback: str) -> tuple[int, str]:
    """
    Validates and combines scores from Flan (float) and GPT (int).
    Returns the final score and an INTERNAL comment about how it was derived.
    The gpt_reasoning_or_feedback is primarily used if GPT overrides.
    """
    flan_int = round(flan) # Round Flan score for comparison logic

    if flan_int == gpt:
        # Return the agreed score (using GPT's int version for consistency)
        return gpt, f"✅ Agreement. Score: {gpt}"
    elif abs(flan_int - gpt) == 1:
        # Average the integer scores when difference is 1
        avg = round((flan_int + gpt) / 2)
        # Internal comment notes the averaging
        return avg, f"🔁 Averaged disagreement. (Flan: {flan:.1f} ({flan_int}), GPT: {gpt}) → {avg}."
    else:
        # Keep GPT's score when difference is large. Internal comment notes override.
        # Include GPT score and rounded Flan score for clarity in logs.
        # Shorten the reason preview in the internal comment.
        reason_preview = gpt_reasoning_or_feedback.split('.')[0] # Get first sentence approx
        return gpt, f"⚠️ Overridden by GPT. (Flan: {flan:.1f} ({flan_int}), GPT: {gpt}). Reason Preview: {reason_preview}..."

# ---- Scale to 0–100 final grade ----
def scale_to_100(trait_scores: list, max_possible_score_per_trait: float) -> float:
    """
    Calculates the average of trait scores and scales it to 0-100.
    Args:
        trait_scores: List of final numeric scores for each trait.
        max_possible_score_per_trait: The maximum possible score for a single trait (e.g., 3.0).
    Returns:
        Scaled score (float) out of 100, rounded to 1 decimal place.
    """
    # Ensure trait_scores are numbers (could be integers or floats after averaging)
    numeric_scores = [float(s) for s in trait_scores if s is not None] # Filter out potential Nones
    if not numeric_scores or max_possible_score_per_trait <= 0:
         return 0.0 # Avoid division by zero or invalid states

    avg_score = sum(numeric_scores) / len(numeric_scores) # Average score, potentially float
    # Scale to 100
    return round((avg_score / max_possible_score_per_trait) * 100, 1)

# ==============================================================================
# --- MODIFIED FUNCTION: get_gpt_trait_score ---
# ==============================================================================
def get_gpt_trait_score(client: OpenAI, trait_name: str, trait_def: str, essay_text: str) -> tuple[int | None, str]:
    """
    Uses OpenAI to score a single trait and generate constructive feedback.
    Returns (score, constructive_feedback_string). Score is None if parsing fails.
    Parses the score robustly by looking backwards for the first number.
    """
    # --- MODIFIED PROMPT ---
    # Instruct the AI to act as a teaching assistant and provide constructive feedback
    # based *only* on the rubric, mentioning essay parts if relevant, THEN give the score.
    prompt = f"""You are an AI teaching assistant evaluating a student's essay based on a specific rubric trait.

Trait Being Assessed: {trait_name}

Rubric Definition for '{trait_name}':
{trait_def}

Student's Essay Text (relevant portion):
---
{essay_text[:2500]} # Provide sufficient context
---

Instructions for AI Assistant:
1. Carefully read the Rubric Definition for '{trait_name}'.
2. Analyze the provided Student's Essay Text based *only* on that definition.
3. Write constructive feedback for the student about their performance on the '{trait_name}' trait. Explain *why* they received the score you are about to give, referencing the rubric criteria. If possible, mention specific examples or general areas in their writing that demonstrate strengths or weaknesses related to this trait. Use a helpful, encouraging, and teacher-like tone. Aim for 2-4 sentences of feedback.
4. After writing the feedback, clearly state the final integer score (from 0 to 3) for this trait based *strictly* on the rubric. The score must be the absolute last part of your response, with no other text or punctuation following it. Example ending: "...improve this aspect.\n3"

Constructive Feedback and Final Score:"""
    # --- END MODIFIED PROMPT ---

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1 # Keep low for consistency, slight increase for natural language
        )
        full_response_content = completion.choices[0].message.content.strip()
        print(f"DEBUG: Raw GPT response for trait '{trait_name}': {full_response_content}")

        score = None
        feedback_text = full_response_content # Default feedback is the whole response initially
        found_score = False

        # Iterate through tokens in reverse order to find score first
        split_response = full_response_content.split()
        for i in range(len(split_response) - 1, -1, -1):
            token = split_response[i]
            # More aggressive cleaning for potential score token
            cleaned_token = ''.join(filter(str.isdigit, token))

            if cleaned_token.isdigit(): # Check if the *cleaned* token is purely digits
                try:
                    potential_score = int(cleaned_token)
                    if 0 <= potential_score <= 3: # Check if score is in valid range
                        # Perform a quick check to ensure it's likely the intended score at the end
                        # If the original token had non-digit chars, it might be embedded (e.g., "section_3")
                        # We rely heavily on the prompt asking for score *last*.
                        if token == cleaned_token: # Only consider if the original token was *just* the number
                            score = potential_score
                            print(f"DEBUG: Parsed score '{score}' from token '{token}'")
                            # Extract the feedback part (everything before the score token)
                            feedback_text = " ".join(split_response[:i]).strip()
                            # Clean up potential trailing noise before the number
                            feedback_text = feedback_text.rstrip('.,;:!?()[]{}<>\n\t ')
                            found_score = True
                            break # Found the last valid number in range
                        else:
                            print(f"DEBUG: Token '{token}' contains digits yielding '{cleaned_token}', but original token differs. Likely embedded, continuing search.")

                    else:
                        print(f"DEBUG: Token '{token}' yielded number {potential_score} but outside expected range [0-3]. Continuing search.")
                except ValueError:
                     # Should not happen if cleaned_token.isdigit() is true, but for safety
                     print(f"DEBUG: Token '{token}' (cleaned: '{cleaned_token}') failed int conversion unexpectedly. Continuing search.")
                     continue
            # Stop searching if we encounter common text patterns unlikely to precede final score
            if token.lower() in ["feedback:", "score:", "trait:", "rubric:"]:
                 print(f"DEBUG: Encountered indicative text token '{token}'. Stopping reverse search for score.")
                 break

        if not found_score:
            print(f"ERROR: Could not parse valid GPT score (0-3) reliably from the end of the response for trait '{trait_name}'. Raw content: {full_response_content}")
            # Return None for score to indicate failure, but keep the text
            return None, f"Error: Could not automatically extract score. Raw AI response: {full_response_content}"


        # Return the found score and the extracted constructive feedback string
        print(f"DEBUG: Extracted Feedback for '{trait_name}': {feedback_text[:200]}...")
        return score, feedback_text

    except Exception as e:
        print(f"ERROR: An error occurred during the OpenAI API call for trait '{trait_name}': {e}")
        # Return None for score and an error message as feedback
        return None, f"Error during OpenAI API call: {e}"

# ==============================================================================
# --- End MODIFIED FUNCTION ---
# ==============================================================================


# --- Main Grading Function ---

def trigger_auto_grading_pipeline(submission, rubric_path, essay_path):
    """
    Executes the full auto-grading pipeline for a given submission.

    Args:
        submission: The Submission model instance (or relevant identifier).
        rubric_path (str): Absolute path to the rubric PDF file inside the container.
        essay_path (str): Absolute path to the essay PDF file inside the container.

    Raises:
        Exception: If any critical step in the pipeline fails.
    """
    global OPENAI_API_KEY # Access the global API key variable

    if not OPENAI_API_KEY:
        raise RuntimeError("CRITICAL: Missing OPENAI_API_KEY in environment variables. Grading cannot proceed.")
    # Initialize OpenAI client here, once API key is confirmed
    client = OpenAI(api_key=OPENAI_API_KEY, timeout=REQUEST_TIMEOUT) # Use increased timeout


    if Submission is None and isinstance(submission, int):
         print(f"Warning: Submission model not imported. Received submission ID: {submission}")
         # Add logic here if needed (e.g., fetch submission by ID), or raise if instance is required.

    print(f"Starting auto-grading for submission linked to essay: {essay_path}")

    # --- Step 1: Parse Essay PDF ---
    print(f"Parsing essay PDF from: {essay_path}")
    essay_text = "" # Initialize essay_text
    try:
        with open(essay_path, "rb") as ef:
            essay_response = requests.post(
                PDFPARSE_URL,
                files={"file": ("essay.pdf", ef, "application/pdf")},
                timeout=REQUEST_TIMEOUT
            )
            essay_response.raise_for_status()
        essay_data = essay_response.json()
        essay_text = (
            essay_data.get("extracted_text")
            or essay_data.get("text")
            or essay_data.get("generic_text")
            or ""
        ).strip()
        print(f"Essay parsed. Text length: {len(essay_text)}. Preview: {essay_text[:150].replace(os.linesep, ' ')}...")
        if not essay_text:
            raise ValueError("Essay parsing returned empty text.")
    except FileNotFoundError:
        print(f"ERROR: Essay file not found at {essay_path}")
        raise Exception(f"Essay file not found: {essay_path}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to connect/communicate with PDF parsing service for essay: {e}")
        raise Exception(f"Essay PDF parsing service failed: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR: Failed to parse response or get text from essay parsing service: {e}")
        raise Exception(f"Invalid response/empty text from essay parsing service: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error during essay parsing: {e}")
        raise

    # --- Step 2: Parse Rubric PDF ---
    print(f"Parsing rubric PDF from: {rubric_path}")
    rubric_text = "" # Initialize rubric_text
    try:
        with open(rubric_path, "rb") as rf:
            rubric_parse_response = requests.post(
                PDFPARSE_URL,
                files={"file": ("rubric.pdf", rf, "application/pdf")},
                timeout=REQUEST_TIMEOUT
            )
            rubric_parse_response.raise_for_status()
        rubric_text_data = rubric_parse_response.json()
        rubric_text = (
            rubric_text_data.get("extracted_text")
            or rubric_text_data.get("text")
            or rubric_text_data.get("generic_text")
            or ""
        ).strip()
        print(f"Rubric parsed. Text length: {len(rubric_text)}. Preview: {rubric_text[:150].replace(os.linesep, ' ')}...")
        if not rubric_text:
             raise ValueError("Rubric parsing returned empty text.")
    except FileNotFoundError:
        print(f"ERROR: Rubric file not found at {rubric_path}")
        raise Exception(f"Rubric file not found: {rubric_path}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to connect/communicate with PDF parsing service for rubric: {e}")
        raise Exception(f"Rubric PDF parsing service failed: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR: Failed to parse response or get text from rubric parsing service: {e}")
        raise Exception(f"Invalid response/empty text from rubric parsing service: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error during rubric parsing: {e}")
        raise

    # --- Step 3: Parse Rubric Traits (using external service) ---
    print(f"Sending rubric text (length: {len(rubric_text)}) to trait parsing API: {PARSE_RUBRIC_URL}")
    traits = [] # Initialize traits
    try:
        rubric_response = requests.post(
            PARSE_RUBRIC_URL,
            json={"rubricText": rubric_text},
            headers={"Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT
        )
        rubric_response.raise_for_status()
        print(f"Trait parsing API returned status: {rubric_response.status_code}. Response preview: {rubric_response.text[:300]}...")
        rubric_data = rubric_response.json()
        if not isinstance(rubric_data, dict) or not rubric_data:
             raise ValueError("Trait parsing service returned invalid or empty data.")
        for name, definition in rubric_data.items():
            traits.append({
                "name": str(name).strip(),
                "definition": str(definition).strip()
            })
        if not traits:
            raise ValueError("No traits could be parsed from the rubric data.")
        print(f"Rubric traits parsed successfully ({len(traits)} traits):")
        for trait in traits[:3]: print(f" - {trait['name']}: {trait['definition'][:100]}...")
        if len(traits) > 3: print("  ...")
        print(f"Parsed trait names: {[trait['name'] for trait in traits]}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to connect/communicate with trait parsing service: {e}")
        raise Exception(f"Rubric trait parsing service failed: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR: Failed to parse response or get valid traits from trait parsing service: {e}")
        raise Exception(f"Invalid response from trait parsing service: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error during rubric trait parsing: {e}")
        raise


    # --- Step 4: Score Essay with HuggingFace Model (using external service) ---
    # Proceed only if traits were successfully parsed
    hf_scores = [] # Initialize hf_scores
    if traits and essay_text: # Ensure we have traits and essay text
        print(f"Sending essay (length: {len(essay_text)}) and {len(traits)} traits to HF scoring API: {SCORE_ESSAY_URL}")
        try:
            score_response = requests.post(
                SCORE_ESSAY_URL,
                json={"essay": essay_text, "traits": traits},
                headers={"Content-Type": "application/json"},
                timeout=REQUEST_TIMEOUT
            )
            score_response.raise_for_status()
            score_json = score_response.json()
            if "scores" not in score_json or not isinstance(score_json["scores"], list):
                print(f"ERROR: Scoring response missing valid 'scores' list: {score_json}")
                raise ValueError("AI scores not returned properly from HF scoring service")

            for s in score_json["scores"]:
                try:
                    trait_name = s.get("trait")
                    score_value = s.get("score")
                    if trait_name is not None and score_value is not None:
                         hf_scores.append({"trait": str(trait_name), "score": float(score_value)})
                    else:
                         print(f"Warning: Skipping HF score entry due to missing data: {s}")
                except (ValueError, TypeError) as score_ex:
                    print(f"Warning: Could not parse HF score as float for entry {s}: {score_ex}")
                    continue
            print(f"HF scores collected ({len(hf_scores)} scores): {hf_scores}")
            if not hf_scores:
                 raise ValueError("No valid HuggingFace scores could be collected.")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to connect/communicate with HF scoring service: {e}")
            raise Exception(f"HF scoring service failed: {e}")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"ERROR: Failed to parse response or get valid scores from HF scoring service: {e}")
            raise Exception(f"Invalid response from HF scoring service: {e}")
        except Exception as e:
            print(f"ERROR: Unexpected error during HF scoring: {e}")
            raise

        # --- Step 4.5: Combine HF and GPT trait scores & Generate Feedback ---
        print("Computing GPT scores/feedback for each trait and combining with HF scores...")

        combined_scores_data = [] # Renamed to avoid confusion with hf_scores
        trait_final_numeric_scores = [] # List to hold final scores (out of 3) for overall average
        # --- IMPORTANT: Define Max Score Here ---
        # This MUST match the scale used in your rubric and GPT prompt (e.g., 0-3)
        max_possible_score_per_trait = 3.0
        # ---

        for entry in hf_scores:
            name = entry["trait"]
            flan_val = entry["score"] # Float from HF

            trait_def = next((t["definition"] for t in traits if t["name"] == name), None)
            if trait_def is None:
                 print(f"Warning: Could not find definition for trait '{name}'. Skipping GPT scoring & combination for this trait.")
                 # Decide how to handle this: skip trait, use only HF score? Skipping is safer for now.
                 continue

            try:
                 # Get GPT score (int | None) and CONSTRUCTIVE FEEDBACK (string)
                 gpt_val, gpt_constructive_feedback = get_gpt_trait_score(client, name, trait_def, essay_text)

                 # Check if GPT scoring failed (returned None score)
                 if gpt_val is None:
                     print(f"ERROR: GPT failed to provide a score for trait '{name}'. Skipping combination for this trait.")
                     # Store error info if needed, but don't proceed with validation/averaging
                     combined_scores_data.append({
                        "trait": name,
                        "score": None, # Indicate score failure
                        "comment": "GPT scoring failed.", # Internal comment
                        "percent": None,
                        "student_feedback": gpt_constructive_feedback # Store the error message from GPT function
                     })
                     continue # Skip to the next trait

                 # --- Score Combination ---
                 # Combine scores using the validation logic. Pass the constructive feedback
                 # as the 'reason' argument for context in case of override logging.
                 final_val, internal_comment = validate_score(flan_val, gpt_val, gpt_constructive_feedback)
                 print(f"Combined trait score for '{name}': {final_val}. Internal logic: {internal_comment}")

                 # Calculate percentage for this specific trait
                 percent = round((final_val / max_possible_score_per_trait) * 100, 1) if max_possible_score_per_trait > 0 else 0

                 combined_scores_data.append({
                    "trait": name,
                    "score": final_val,           # The final combined score (int or float)
                    "comment": internal_comment,  # Internal status/reason (NOT FOR STUDENT)
                    "percent": percent,           # Trait percentage
                    "student_feedback": gpt_constructive_feedback # The teacher-like feedback FOR STUDENT
                 })
                 trait_final_numeric_scores.append(final_val) # Add the numeric score for final grade calculation

                 print(f"Trait '{name}' percent (0–100): {percent}%")

            except Exception as e:
                 # Catch any other unexpected errors during GPT scoring or validation for this trait
                 print(f"ERROR: Unexpected error processing trait '{name}'. Error: {e}")
                 traceback.print_exc() # Print stack trace for debugging
                 # Store error info for this trait
                 combined_scores_data.append({
                        "trait": name,
                        "score": None,
                        "comment": f"Unexpected error: {e}",
                        "percent": None,
                        "student_feedback": f"An unexpected error occurred while generating feedback for this trait: {e}"
                 })
                 continue # Continue to next trait

        # --- Step 5: Calculate Final Normalized Score ---
        if not trait_final_numeric_scores:
             print("ERROR: No traits were successfully scored and combined. Cannot calculate final grade.")
             # Set grade to 0 or specific error value? Setting to 0 for now.
             normalized_score = 0.0
             final_feedback = "Automated grading could not be completed because no rubric traits were successfully scored."
             # Optionally raise Exception("Pipeline halted: No combined trait scores available.") if preferred
        else:
            # Calculate final score using the list of combined numeric scores
            normalized_score = scale_to_100(trait_final_numeric_scores, max_possible_score_per_trait)
            print(f"List of final numeric trait scores (for averaging): {trait_final_numeric_scores}")
            print(f"Normalized final score (0–100): {normalized_score}")

            # --- Step 6: Compose Final Feedback and Persist Results ---
            print("Composing final feedback message...")
            feedback_parts = []
            feedback_parts.append(f"Overall AI Assessed Grade: {normalized_score:.1f}%")
            feedback_parts.append("---")
            feedback_parts.append("Detailed Feedback per Rubric Trait:")

            for item in combined_scores_data:
                trait_name = item['trait']
                trait_score = item['score'] # Could be None if scoring failed
                trait_percent = item['percent'] # Could be None
                student_msg = item['student_feedback'] # The constructive feedback or error message

                if trait_score is not None and trait_percent is not None:
                    score_display = f"{trait_score}/{int(max_possible_score_per_trait)} ({trait_percent}%)"
                else:
                    score_display = "[Scoring Incomplete]" # Indicate if score couldn't be determined

                feedback_parts.append(f"\n**{trait_name}** ({score_display}):")
                # Indent the feedback for readability
                feedback_parts.append(f"> {student_msg.replace(os.linesep, ' ' + os.linesep + '> ')}") # Indent multi-line feedback

            final_feedback = "\n".join(feedback_parts)

            # Persist results
            if Submission is not None and hasattr(submission, 'save'):
                submission.ai_grade = normalized_score
                submission.graded_by_ai = True
                submission.feedback = final_feedback # Use the composed teacher-like feedback
                submission.save()
                print(f"Final score ({submission.ai_grade}) and feedback saved successfully for submission.")
            else:
                print("Warning: Submission object not available or not savable. Skipping database update.")
                print(f"AI Grade calculated: {normalized_score}")
                print("\n--- Final Compiled Feedback ---")
                print(final_feedback)
                print("--- End Feedback ---")

    else:
        # Handle cases where prerequisites are missing
        if not traits:
             message = "ERROR: No traits were parsed, skipping scoring."
             print(message)
             raise Exception("Pipeline halted: No rubric traits available.")
        if not essay_text:
             message = "ERROR: Essay text is empty, skipping scoring."
             print(message)
             raise Exception("Pipeline halted: Essay text is empty.")
        if not hf_scores: # Added check in case HF scoring failed before GPT step
             message = "ERROR: No valid scores were received from the initial scoring service (HF)."
             print(message)
             raise Exception("Pipeline halted: Initial scoring service failed.")

    print(f"Auto-grading pipeline completed for essay: {essay_path}")


# --- Example Usage (if running script directly for testing) ---
if __name__ == '__main__':
    print("Running auto_grader.py directly (requires setup for testing)")

    # Mock Submission for testing if Django models aren't available
    class MockSubmission:
        def __init__(self, id=1):
            self.id = id
            self.ai_grade = None
            self.graded_by_ai = False
            self.feedback = ""

        def save(self):
            print(f"\n--- MockSubmission {self.id}: SAVING ---")
            print(f"  AI Grade: {self.ai_grade}")
            print(f"  Graded by AI: {self.graded_by_ai}")
            print(f"  Feedback Preview: {self.feedback[:500]}...")
            print(f"--- Mock Save Complete ---\n")

    # IMPORTANT: Replace with ACTUAL paths accessible inside your Docker container
    # These paths likely come from your Django model/view logic in reality
    # Use environment variables or a config file for these in production
    # Ensure these env vars are set where you run this script/container
    test_essay_path = os.getenv("TEST_ESSAY_PATH", "/app/media/submissions/test_essay.pdf") # EXAMPLE
    test_rubric_path = os.getenv("TEST_RUBRIC_PATH", "/app/media/rubrics/test_rubric.pdf") # EXAMPLE

    # Check if placeholder files exist before running
    if os.path.exists(test_essay_path) and os.path.exists(test_rubric_path):
         print(f"Attempting test run with essay='{test_essay_path}', rubric='{test_rubric_path}'")
         try:
             # Check for API key at the start of the test run
             if not os.getenv("OPENAI_API_KEY"):
                  print("\nCRITICAL ERROR: OPENAI_API_KEY environment variable not set for test run.\n")
             else:
                  print("OpenAI API Key found in environment.")
                  mock_sub = MockSubmission(id=999)
                  trigger_auto_grading_pipeline(mock_sub, test_rubric_path, test_essay_path)
                  print("\nTest run finished.")
         except Exception as main_ex:
              print(f"\n--- TEST RUN FAILED ---")
              print(f"Test run failed with exception: {main_ex}")
              print("--- Stack Trace ---")
              traceback.print_exc() # Print full traceback for debugging
              print("--- End Trace ---")
    else:
         print(f"\nSkipping test run: Placeholder files not found.")
         print(f"Checked for Essay : '{test_essay_path}' (Exists: {os.path.exists(test_essay_path)})")
         print(f"Checked for Rubric: '{test_rubric_path}' (Exists: {os.path.exists(test_rubric_path)})")
         print("Ensure these paths exist inside the container or update the __main__ block / environment variables.")