import { OpenAI } from "openai";
import fs from "fs";
import os from "os";
import path from "path";
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
    const formData = await req.formData();
    const file = formData.get("rubric");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
    fs.writeFileSync(tempPath, buffer);

    // Convert buffer to string (for .txt or simple PDF content)
    const rubricText = buffer.toString("utf-8");

    if (!rubricText || rubricText.length < 10) {
      return NextResponse.json({ error: "Rubric text is empty or invalid" }, { status: 400 });
    }

    const prompt = `
You are an expert grader. Below is a grading rubric. Your task is to extract the specific grading traits or scoring dimensions (such as Organization, Conventions, Word Choice, etc.) used to evaluate the writing.

Rubric:
"""
${rubricText}
"""

Return the traits as a bullet point list using dashes, like:
- Trait 1: ...
- Trait 2: ...
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const rawText = completion.choices?.[0]?.message?.content || "";

    console.log("GPT raw response:", rawText);

    const traits = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.replace(/^[-–•]\s*(Trait\s*\d*:)?\s*/i, ""));

    return NextResponse.json({ traits }, { status: 200 });
  } catch (err) {
    console.error("Error parsing rubric:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}