import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Optional: declare that this route does not parse the body
// If you are *not* using this for file uploads elsewhere and only sending JSON,
// you might consider removing this config block, although req.json() should work either way.
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @param {import('next/server').NextRequest} req
 */
export async function POST(req) {
  // Log entry into the function
  console.log("--- /api/parse-rubric POST request received ---");

  try { // <<< OUTER TRY BLOCK STARTS >>>
    // 1. Parse request body
    console.log("[1] Attempting req.json()..."); // ADDED LOG
    const body = await req.json();
    // Simple log to confirm parsing, avoid logging potentially large/sensitive bodies fully in production
    console.log("[2] req.json() completed. Body keys:", body ? Object.keys(body) : 'null/undefined'); // ADDED LOG

    // 2. Extract rubricText
    const rubricText = body.rubricText;
    console.log("[3] rubricText received? Length:", rubricText?.length || "null"); // Modified log

    // 3. Validate rubricText
    console.log("[4] Validating rubricText..."); // ADDED LOG
    const isRubricTextValid = !!rubricText && rubricText.length >= 10;
    console.log(`[4a] Is rubricText valid (exists and length >= 10)? ${isRubricTextValid}`); // ADDED LOG

    if (!isRubricTextValid) {
      console.log("[!] Rubric text is invalid or too short. Returning 400."); // ADDED LOG
      return NextResponse.json({ error: "Rubric text is empty or invalid" }, { status: 400 });
    }
    console.log("[5] Rubric text is valid."); // ADDED LOG

    // 4. Construct prompt
    const prompt = `
You are an expert rubric interpreter. Given a text rubric, extract a list of key traits used to evaluate student essays.

For each trait, return a JSON object where:
- Keys are the names of the traits (e.g., "Ideas", "Organization").
- Values are strings representing the rubric definition for that trait on a 0–3 point scale, formatted exactly like this (using escaped newlines):
  "3 = Excellent performance...\\n2 = Adequate performance...\\n1 = Needs improvement...\\n0 = Inadequate..."

Example output format:
{
  "Ideas": "3 = Strong ideas and details...\\n2 = Mostly clear...\\n1 = Weak or underdeveloped...\\n0 = No clear idea.",
  "Organization": "3 = Clear and logical...\\n2 = Somewhat logical...\\n1 = Disorganized...\\n0 = No structure."
}

Strictly output ONLY the JSON object. Do not include any introductory text, explanations, comments, or markdown formatting like \`\`\`json.

Rubric Text:
"""
${rubricText}
"""
    `;

    // --- This is the point execution wasn't reaching before ---
    console.log("[6] Sending request to OpenAI (gpt-4o)..."); // <<< YOUR PREVIOUSLY MISSING LOG >>>

    let rawText = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3, // Low temperature for more deterministic JSON structure
        response_format: { type: "json_object" }, // Use OpenAI's JSON mode (RECOMMENDED)
      });

      rawText = completion.choices?.[0]?.message?.content || "";
      console.log("[7] OpenAI response received. First 100 chars:", rawText.slice(0, 100)); // Modified log

    } catch (completionError) {
      console.error("[!] Error during OpenAI API completion:", completionError);
      // Provide more detail if possible
      const errorMessage = completionError instanceof Error ? completionError.message : "Unknown OpenAI error";
      return NextResponse.json({ error: `OpenAI request failed: ${errorMessage}` }, { status: 500 });
    }

    // 5. Parse the OpenAI response (which should be guaranteed JSON now)
    console.log("[8] Attempting to parse OpenAI response as JSON...");
    let traits;
    try {
      traits = JSON.parse(rawText);

      // Validate that we got an object, as requested in the prompt
      if (typeof traits !== 'object' || traits === null || Array.isArray(traits)) {
         console.error("[!] Parsed result is not a JSON object. Received:", typeof traits, traits);
         throw new Error("Expected a JSON object of traits, but received something else.");
      }
      console.log("[9] Parsed traits. Keys count:", Object.keys(traits).length); // Modified log

    } catch (e) {
      console.error("[!] Failed to parse GPT JSON response:", e);
      // Log the raw text that failed parsing *only if* it's not excessively large or sensitive
      if (rawText.length < 2000) { // Example length limit
         console.error("[!] Problematic OpenAI response. Preview:", rawText.slice(0, 100)); // Modified log
      } else {
         console.error("[!] Problematic rawText from OpenAI is too long to log fully. Length:", rawText.length);
      }
      // This specific error message is what your Python script was receiving
      return NextResponse.json({ error: "Invalid JSON format from GPT" }, { status: 500 });
    }

    // 6. Return the result
    // The prompt asks for an object: { "TraitName": "definition..." }
    // Your Python code seemed to expect {'traits': [{'name': ..., 'description': ...}]}
    // Decide which format you need. Returning the object directly is simpler here:
    console.log("[10] Traits extraction complete. Returning JSON."); // Modified log
    return NextResponse.json(traits, { status: 200 });

    /*
    // --- OPTION B: If Python absolutely needs the array format ---
    console.log("[10] Converting traits object to array and returning.");
    try {
        const traitsArray = Object.entries(traits).map(([name, description]) => ({ name, description }));
        return NextResponse.json({ traits: traitsArray }, { status: 200 });
    } catch (conversionError) {
        console.error("[!] Error converting traits object to array:", conversionError);
        return NextResponse.json({ error: "Server error converting traits to array" }, { status: 500 });
    }
    // --- End Option B ---
    */

  } catch (err) { // <<< OUTER CATCH BLOCK >>>
    // This catches errors from req.json(), accessing body properties before validation, or other unexpected errors
    console.error("[!] Error processing request in outer catch block:", err); // MODIFIED LOG
    const errorMessage = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: `Server error during initial processing: ${errorMessage}` }, { status: 500 });
  }
}