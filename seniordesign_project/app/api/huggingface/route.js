export async function POST(req) {
  try {
    const { essay, traits } = await req.json();

    if (!essay || !traits || !Array.isArray(traits)) {
      return new Response(JSON.stringify({ error: "Essay and traits are required" }), { status: 400 });
    }

    const results = [];

    for (const trait of traits) {
      const input = `Evaluate this essay based on the trait '${trait.name}': ${essay}`;

      let response, rawBody;
      for (let attempt = 0; attempt < 3; attempt++) {
        response = await fetch("https://api-inference.huggingface.co/models/srutiii/flan-t5-base-pt2", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: input })
        });

        rawBody = await response.text();
        if (response.status !== 503 && !rawBody.startsWith("&lt;!DOCTYPE html&gt;") && !rawBody.startsWith("<!DOCTYPE html>")) {
          break;
        }

        console.warn(`Retrying HF request for trait '${trait.name}' due to status ${response.status} or HTML response`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 seconds before retrying
      }

      console.log(`HF fetch for trait '${trait.name}' returned status ${response.status} ${response.statusText}`);
      console.log(`HF raw response for trait '${trait.name}' (first 100 chars):`, rawBody.substring(0, 100));

      let data;
      try {
        data = JSON.parse(rawBody);
        if (data.error) {
          console.error(`Hugging Face returned error field for trait '${trait.name}':`, data.error);
        }
        // If HF returns an array of generations, pick the first element
        if (Array.isArray(data) && data.length > 0) {
          console.log(`HF returned array for trait '${trait.name}', using first element`);
          data = data[0];
        }
      } catch (e) {
        console.error(`Failed to parse JSON from Hugging Face API for trait '${trait.name}'. Raw response snippet:`, rawBody.substring(0, 100));
        throw new Error(`Invalid JSON from Hugging Face API for trait '${trait.name}': ${e.message}`);
      }

      console.log("HF status:", response.status);
      console.log("HF JSON keys:", Object.keys(data));
      console.log("HF response preview:", rawBody.substring(0, 300));

      if (!response.ok) {
        throw new Error(`HF error (status ${response.status}) on trait '${trait.name}': ${JSON.stringify(data)}`);
      }

      if (!data.generated_text) {
        console.error(`Full HF response for trait '${trait.name}':`, data);
        throw new Error(`Missing 'generated_text' in HF response for trait '${trait.name}'`);
      }

      // normalize HF output to a plain number
      const rawText = data.generated_text;
      // attempt to extract first numeric value
      const match = rawText.match(/-?\d+(\.\d+)?/);
      const scoreValue = match ? parseFloat(match[0]) : null;
      if (scoreValue === null) {
        console.error(`Cannot parse numeric score from "${rawText}" for trait '${trait.name}'`);
        throw new Error(`Invalid score format for trait '${trait.name}': ${rawText}`);
      }

      results.push({ trait: trait.name, score: scoreValue });
    }

    // Log each individual trait score
    results.forEach(({ trait, score }) => {
      console.log(`Trait '${trait}' scored: ${score}`);
    });
    return new Response(JSON.stringify({ scores: results }), { status: 200 });

  } catch (error) {
    console.error("Hugging Face API error caught in route.js:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}