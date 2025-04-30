import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Optional: declare that this route does not parse the body
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
  try {
    const body = await req.json();
    const rubricText = body.rubricText;

    if (!rubricText || rubricText.length < 10) {
      return NextResponse.json({ error: "Rubric text is empty or invalid" }, { status: 400 });
    }

    // Adjusted prompt to align with the required output structure
    const prompt = `
      Respond with ONLY the JSON object; do NOT include any explanatory text or markdown.
      You are an expert grader and rubric analyzer. Given the rubric text below, identify the key writing traits or scoring dimensions used to evaluate student essays.

      For each identified trait, return a JSON-style structure with the following:
      1. The trait name.
      2. A description explaining the trait.
      3. A scale with score ranges (0 to 5, for example) and feedback for each range.
      4. An optional weight (between 0 and 1) representing how important the trait is.

      Format:
      {
        "trait_name": {
          "description": "A brief explanation of the trait.",
          "scale": {
            "0": "Feedback for low score range.",
            "1": "Feedback for medium score range.",
            "2": "Feedback for high score range."
          },
          "weight": 0.2
        },
        ...
      }

      Rubric:
      """
      ${rubricText}
      """
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const rawText = completion.choices?.[0]?.message?.content || "";
    // Convert tuple-style `(0.0, 0.34, "text")` to JSON arrays `[0.0, 0.34, "text"]`
    const jsonString = rawText.replace(/\((\s*[\d.]+\s*,\s*[\d.]+,\s*"[^"]*"\s*)\)/g, '[$1]');

    console.log("GPT raw response:", rawText);

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse GPT raw response as JSON:", e);
      return NextResponse.json({ error: "Invalid JSON from GPT" }, { status: 500 });
    }

    // Return the traits with names, descriptions, scale, and weight
    const traits = Object.entries(parsed).map(([name, data]) => ({
      name,
      description: data.description,
      scale: JSON.stringify(data.scale),
      weight: data.weight || 0.2, // Default weight if not provided
    }));

    return NextResponse.json({ traits }, { status: 200 });
  } catch (err) {
    console.error("Error parsing rubric:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}