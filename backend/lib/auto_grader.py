import requests
import json
import os
from openai import OpenAI # Import the class directly

# Attempt to import Submission model - ensure Django is configured
# if this script runs standalone or called from specific management commands.
try:
    from groups.models import Submission
except ImportError as e:
    # Handle cases where Django models aren't ready or this script
    # runs outside a Django context where models are needed.
    # Depending on usage, you might raise a more specific error
    # or set Submission to None and add checks later.
    print(f"Warning: Could not import Submission model: {e}. Ensure Django is set up if models are needed.")
    Submission = None

# --- Configuration ---
# Use environment variables for URLs if possible for flexibility
PDFPARSE_URL = os.getenv("PDFPARSE_URL", "http://host.docker.internal:3000/api/pdfparse") # Assumes your FastAPI service is at :3000 and provides this route
PARSE_RUBRIC_URL = os.getenv("PARSE_RUBRIC_URL", "http://host.docker.internal:3000/api/parse-rubric")
SCORE_ESSAY_URL = os.getenv("SCORE_ESSAY_URL", "http://host.docker.internal:3000/api/huggingface")

REQUEST_TIMEOUT = 120 # Timeout for external API calls in seconds

# --- Helper for combining scores ---
def validate_score(flan: int, gpt: int, reason: str) -> tuple[int, str]:
    # --- MODIFICATION: Ensure flan is treated as an integer for comparison ---
    # Flan scores from HF API might be floats (e.g., 1.0), convert for comparison logic
    flan_int = round(flan) # Round to nearest integer for comparison logic
    # --- End Modification ---

    if flan_int == gpt:
        return flan_int, f"✅ Agreement. Score: {flan_int}"
    elif abs(flan_int - gpt) == 1:
        # Average the original float flan and int gpt for potentially finer granularity?
        # Or average the integers? Let's average integers for simplicity matching original intent.
        avg = round((flan_int + gpt) / 2)
        # Original reason from GPT is usually more detailed
        return avg, f"🔁 Averaged disagreement. (Flan: {flan}, GPT: {gpt}) → {avg}. Reason: {reason}"
    else:
        # Keep GPT's score and its reasoning when difference is large
        return gpt, f"⚠️ Overridden by GPT. (Flan: {flan}, GPT: {gpt}). Reason: {reason}"

# ---- 4. Scale to 0–100 final grade
def scale_to_100(trait_scores):
    # Ensure trait_scores are numbers (could be integers or floats after averaging)
    numeric_scores = [float(s) for s in trait_scores]
    if not numeric_scores:
         return 0.0 # Avoid division by zero if list is empty
    avg_score = sum(numeric_scores) / len(numeric_scores)  # Average score, potentially float, out of 3
    # Scale to 100
    # Ensure the scale (3.0) matches the max possible score from validate_score
    max_possible_score = 3.0 # Assuming the rubric scale is 0-3
    return round((avg_score / max_possible_score) * 100, 1)  # out of 100

# ==============================================================================
# --- MODIFIED FUNCTION: get_gpt_trait_score ---
# ==============================================================================
def get_gpt_trait_score(client, trait_name: str, trait_def: str, essay_text: str) -> tuple[int, str]:
    """
    Uses OpenAI to score a single trait, returns (score, reasoning).
    Parses the score more robustly by looking backwards for the first number.
    """
    # Added instruction to help guide the model, but parsing logic is primary fix
    prompt = f"Trait: {trait_name}\nRubric: {trait_def}\nEssay: {essay_text[:2000]}\n\nScore this trait on a scale of 0-3 based ONLY on the rubric provided. Provide your reasoning, then state the final integer score clearly at the end."
    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        content = completion.choices[0].message.content.strip()
        print(f"DEBUG: Raw GPT response for trait '{trait_name}': {content}")

        score = None
        found_score = False
        # Iterate through tokens in reverse order
        for token in reversed(content.split()):
            # Clean the token - remove common punctuation from ends
            cleaned_token = token.strip('.,;:!?()[]{}')
            # Check if the cleaned token consists ONLY of digits
            if cleaned_token.isdigit():
                try:
                    potential_score = int(cleaned_token)
                    # Optional: Add validation for expected score range (e.g., 0-3)
                    # Modify range based on your actual rubric scale
                    if 0 <= potential_score <= 3:
                        score = potential_score
                        print(f"DEBUG: Parsed score '{score}' from token '{token}'")
                        found_score = True
                        break # Found the first valid number in range from the end
                    else:
                       print(f"DEBUG: Token '{token}' is a number ({potential_score}) but outside expected range [0-3]. Continuing search.")
                       # Continue searching backwards if number is out of range
                except ValueError:
                    # This case should be rare if isdigit() is true, but handles edge cases
                    print(f"DEBUG: Token '{token}' looked like a digit but failed int conversion. Continuing search.")
                    continue

        if not found_score:
            print(f"ERROR: Could not parse valid GPT score (0-3) from response for trait '{trait_name}'. Raw content: {content}")
            # Decide how to handle: raise error, return default, etc.
            # Raising error is usually safest to indicate a problem.
            raise ValueError(f"Could not parse GPT score from response (no integer 0-3 found): {content}")

        # Return the found score and the original full content as reasoning
        return score, content

    except Exception as e:
        print(f"ERROR: An error occurred during the OpenAI API call for trait '{trait_name}': {e}")
        # Re-raise the exception to halt the process if the API call itself fails
        raise

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

    if Submission is None and isinstance(submission, int):
         # If model import failed, maybe submission is just an ID?
         # Add logic here if needed, otherwise expect a model instance.
         print(f"Warning: Submission model not imported. Received submission ID: {submission}")
         # Depending on design, you might fetch the object later if needed,
         # or raise an error if the instance is required for saving.

    print(f"Starting auto-grading for submission linked to essay: {essay_path}")

    # --- Step 1: Parse Essay PDF ---
    print(f"Parsing essay PDF from: {essay_path}")
    try:
        with open(essay_path, "rb") as ef:
            essay_response = requests.post(
                PDFPARSE_URL, # Using configured URL
                files={"file": ("essay.pdf", ef, "application/pdf")},
                timeout=REQUEST_TIMEOUT
            )
            essay_response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        essay_data = essay_response.json()
        # Consolidate potential keys from your pdfparse service
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
        print(f"ERROR: Failed to connect or communicate with PDF parsing service for essay: {e}")
        raise Exception(f"Essay PDF parsing service failed: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR: Failed to parse JSON response or get text from essay parsing service: {e}")
        raise Exception(f"Invalid response from essay parsing service: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error during essay parsing: {e}")
        raise # Reraise unexpected errors


    # --- Step 2: Parse Rubric PDF ---
    print(f"Parsing rubric PDF from: {rubric_path}")
    try:
        with open(rubric_path, "rb") as rf:
            rubric_parse_response = requests.post(
                PDFPARSE_URL, # Using configured URL
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
        print(f"ERROR: Failed to connect or communicate with PDF parsing service for rubric: {e}")
        raise Exception(f"Rubric PDF parsing service failed: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR: Failed to parse JSON response or get text from rubric parsing service: {e}")
        raise Exception(f"Invalid response from rubric parsing service: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error during rubric parsing: {e}")
        raise


    # --- Step 3: Parse Rubric Traits (using external service) ---
    print(f"Sending rubric text (length: {len(rubric_text)}) to trait parsing API: {PARSE_RUBRIC_URL}")
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

        traits = []
        for name, definition in rubric_data.items():
            traits.append({
                "name": str(name).strip(), # Ensure name is string and stripped
                "definition": str(definition).strip() # Ensure definition is string and stripped
            })

        if not traits:
            raise ValueError("No traits could be parsed from the rubric data.")

        print(f"Rubric traits parsed successfully ({len(traits)} traits):")
        for trait in traits[:3]: # Print preview of first few traits
            print(f" - {trait['name']}: {trait['definition'][:100]}...")
        if len(traits) > 3:
            print("  ...")
        print(f"Parsed trait names: {[trait['name'] for trait in traits]}")

    except requests.exceptions.RequestException as e:
        print(f"ERROR: Failed to connect or communicate with trait parsing service: {e}")
        raise Exception(f"Rubric trait parsing service failed: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"ERROR: Failed to parse JSON response or get valid traits from trait parsing service: {e}")
        raise Exception(f"Invalid response from trait parsing service: {e}")
    except Exception as e:
        print(f"ERROR: Unexpected error during rubric trait parsing: {e}")
        raise


    # --- Step 4: Score Essay with HuggingFace Model (using external service) ---
    # Proceed only if traits were successfully parsed
    if traits:
        print(f"Sending essay (length: {len(essay_text)}) and {len(traits)} traits to HF scoring API: {SCORE_ESSAY_URL}")
        try:
            score_response = requests.post(
                SCORE_ESSAY_URL,
                json={
                    "essay": essay_text,
                    "traits": traits # Sending list of {"name": N, "definition": D}
                },
                 headers={"Content-Type": "application/json"}, # Ensure correct header
                timeout=REQUEST_TIMEOUT
            )
            score_response.raise_for_status()
            score_json = score_response.json()

            # Check the structure of the response from SCORE_ESSAY_URL
            # Adjust based on actual API response structure
            if "scores" not in score_json or not isinstance(score_json["scores"], list):
                print(f"ERROR: Scoring response did not contain a valid 'scores' list: {score_json}")
                raise ValueError("AI scores not returned properly from scoring service")

            # Collect HF scores, ensuring they are floats
            hf_scores = []
            for s in score_json["scores"]:
                try:
                    # Ensure score is float, handle potential missing keys gracefully
                    trait_name = s.get("trait")
                    score_value = s.get("score")
                    if trait_name is not None and score_value is not None:
                         # Ensure the score value is float for calculations
                         hf_scores.append({"trait": str(trait_name), "score": float(score_value)})
                    else:
                         print(f"Warning: Skipping score entry due to missing data: {s}")
                except (ValueError, TypeError) as score_ex:
                    print(f"Warning: Could not parse score as float for entry {s}: {score_ex}")
                    continue # Skip this score entry
            print(f"HF scores collected ({len(hf_scores)} scores): {hf_scores}")

            if not hf_scores:
                 raise ValueError("No valid HuggingFace scores could be collected.")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to connect or communicate with HF scoring service: {e}")
            raise Exception(f"HF scoring service failed: {e}")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"ERROR: Failed to parse JSON response or get valid scores from HF scoring service: {e}")
            raise Exception(f"Invalid response from HF scoring service: {e}")
        except Exception as e:
            print(f"ERROR: Unexpected error during HF scoring: {e}")
            raise

        # --- Step 4.5: Combine HF and GPT trait scores ---
        print("Computing GPT scores for each trait and combining with HF scores...")
        # Get API key and initialize client (needed for GPT trait scoring)
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        if not OPENAI_API_KEY:
            raise RuntimeError("CRITICAL: Missing OPENAI_API_KEY in environment")
        # Ensure timeout is passed to the client
        client = OpenAI(api_key=OPENAI_API_KEY, timeout=REQUEST_TIMEOUT)

        combined_scores = []
        trait_final_scores = [] # List to hold final scores (out of 3) for overall average calculation
        max_possible_score = 3.0 # Define the max score per trait from the rubric (e.g., 0-3 scale)

        for entry in hf_scores:
            name = entry["trait"]
            flan_val = entry["score"] # This is a float from HF
            print(f"HF score for trait '{name}': {flan_val}")

            # Find corresponding trait definition
            trait_def = next((t["definition"] for t in traits if t["name"] == name), None)
            if trait_def is None:
                 print(f"Warning: Could not find definition for trait '{name}'. Skipping GPT scoring for this trait.")
                 continue # Skip this trait if definition is missing

            try:
                 # Get GPT score (now returns int) and full reasoning (string)
                 gpt_val, gpt_reasoning = get_gpt_trait_score(client, name, trait_def, essay_text)

                 # Combine scores using the validation logic
                 # Pass the float flan_val and int gpt_val
                 final_val, comment = validate_score(flan_val, gpt_val, gpt_reasoning)
                 print(f"Combined trait score for '{name}': {final_val}")

                 # Compute trait-level percentage (0–100) based on the final combined score
                 # Use max_possible_score (e.g., 3.0) as the denominator
                 percent = round((final_val / max_possible_score) * 100, 1)

                 combined_scores.append({
                    "trait": name,
                    "reasoning": gpt_reasoning,
                    "score": final_val,
                    "percent": percent
                 })
                 trait_final_scores.append(final_val) # Add the final score for this trait to list for overall average

                 print(f"Trait '{name}' percent (0–100): {percent}%")

            except ValueError as e:
                 # Handle errors from get_gpt_trait_score (like parsing failure)
                 print(f"ERROR: Failed to get or combine score for trait '{name}'. Error: {e}")
                 # Optionally decide whether to skip this trait or halt the entire process
                 # For now, let's print the error and continue with other traits
                 continue
            except Exception as e:
                 # Catch any other unexpected errors during GPT scoring or validation
                 print(f"ERROR: Unexpected error processing trait '{name}'. Error: {e}")
                 continue # Continue to next trait

        # --- Step 5: Calculate Final Normalized Score ---
        # Ensure we only proceed if some scores were successfully combined
        if not trait_final_scores:
             print("ERROR: No traits were successfully scored and combined. Cannot calculate final grade.")
             # Decide action: raise error, set grade to 0, etc.
             raise Exception("Pipeline halted: No combined trait scores available.")

        # Calculate final score using the scale_to_100 function
        normalized_score = scale_to_100(trait_final_scores)
        print(f"List of final trait scores (for averaging): {trait_final_scores}")
        print(f"Normalized final score (0–100): {normalized_score}")


        # --- Step 6: Persist Results ---
        if Submission is not None and hasattr(submission, 'save'):
            submission.ai_grade = normalized_score
            submission.graded_by_ai = True
            # Compose feedback by joining trait comments
            submission.feedback = "\n---\n".join(f"**{item['trait']}**: {item['reasoning']}" for item in combined_scores)
            submission.save()
            print(f"Final score ({submission.ai_grade}) and feedback saved successfully for submission.")
        else:
            print("Warning: Submission object not available or not savable. Skipping database update.")
            print(f"AI Grade calculated: {normalized_score}")
            print("Feedback:")
            for item in combined_scores:
                 print(f"**{item['trait']}**: Score {item['score']}/{int(max_possible_score)} ({item['percent']}%)\n{item['comment']}\n---")


    else:
        # This case should ideally not be reached if trait parsing raises errors
        print("ERROR: No traits were parsed, skipping HF scoring and OpenAI grading.")
        raise Exception("Pipeline halted: No rubric traits available.")

    print(f"Auto-grading pipeline completed for essay: {essay_path}")


# --- Example Usage (if running script directly for testing) ---
# Note: Requires Django setup or mocking the Submission model and paths
if __name__ == '__main__':
    print("Running auto_grader.py directly (requires setup for testing)")

    # This is placeholder logic - replace with actual testing setup if needed
    class MockSubmission:
        def __init__(self, id=1):
            self.id = id
            self.ai_grade = None
            self.graded_by_ai = False
            self.feedback = ""

        def save(self):
            print(f"MockSubmission {self.id}: SAVED Grade={self.ai_grade}, Graded={self.graded_by_ai}, Feedback='{self.feedback[:100]}...'")

    # IMPORTANT: Replace with ACTUAL paths accessible inside your Docker container
    # These paths likely come from your Django model/view logic in reality
    # Use environment variables or a config file for these in production
    test_essay_path = os.getenv("TEST_ESSAY_PATH", "/app/media/submissions/test_essay.pdf") # EXAMPLE PATH
    test_rubric_path = os.getenv("TEST_RUBRIC_PATH", "/app/media/rubrics/test_rubric.pdf") # EXAMPLE PATH

    # Check if placeholder files exist before running
    if os.path.exists(test_essay_path) and os.path.exists(test_rubric_path):
         print(f"Attempting test run with essay='{test_essay_path}', rubric='{test_rubric_path}'")
         try:
             # Ensure OPENAI_API_KEY is set in environment (e.g., via .env loaded by compose)
             if not os.getenv("OPENAI_API_KEY"):
                  print("Error: OPENAI_API_KEY environment variable not set for test run.")
             else:
                  mock_sub = MockSubmission(id=999)
                  trigger_auto_grading_pipeline(mock_sub, test_rubric_path, test_essay_path)
                  print("Test run finished.")
         except Exception as main_ex:
              print(f"Test run failed with exception: {main_ex}")
              # Print stack trace for debugging if needed
              import traceback
              traceback.print_exc()
    else:
         print(f"Skipping test run: Placeholder files not found.")
         print(f"Checked for: '{test_essay_path}' and '{test_rubric_path}'")
         print("Ensure these paths exist inside the container or update the __main__ block / environment variables.")