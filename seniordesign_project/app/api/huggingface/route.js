export async function POST(req) {
  try {
    const { essay, traits } = await req.json();

    if (!essay || !traits || !Array.isArray(traits)) {
      return new Response(JSON.stringify({ error: "Essay and traits are required" }), { status: 400 });
    }

    const results = [];

    for (const trait of traits) {
      const input = `Trait: ${trait.name}\nRubric: ${trait.definition}\nEssay: ${essay}`;

      const response = await fetch("https://api-inference.huggingface.co/models/hanthattal/essay-flan-model", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: input })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error scoring trait: ${trait.name}`);
      }

      results.push({ trait: trait.name, score: data[0]?.generated_text || "N/A" });
    }

    return new Response(JSON.stringify({ scores: results }), { status: 200 });

  } catch (error) {
    console.error("Hugging Face API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}