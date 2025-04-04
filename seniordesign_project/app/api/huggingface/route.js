export async function POST(req) {
    try {
      const { text } = await req.json();
      if (!text) {
        return new Response(JSON.stringify({ error: "Text input is required" }), { status: 400 });
      }
      
      const response = await fetch("https://api-inference.huggingface.co/models/google-bert/bert-base-uncased", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          inputs: text,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
      console.error("Hugging Face API error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }