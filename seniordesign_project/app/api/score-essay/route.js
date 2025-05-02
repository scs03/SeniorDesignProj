export async function POST(req) {
  console.log("--- New API Request Received ---");
  let body;
  try {
      body = await req.json();
      console.log("Parsed request body:", body);
  } catch (error) {
      console.error("Failed to parse request body as JSON:", error);
      return new Response(JSON.stringify({ error: 'Invalid request body format.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
      });
  }


  const { essayText, rubric } = body;
  console.log("Destructured essayText:", essayText);
  console.log("Destructured rubric:", rubric);


  // We removed the early check here previously, keep it removed/commented out.
  // console.log("Pre-check passed (or skipped), proceeding to backend fetch.");


  try {
    const requestBodyData = { essayText, rubric };
    const requestBodyToBackend = JSON.stringify(requestBodyData); // Stringify the data


    // --- ADD THESE LOGS ---
    console.log("Sending to backend (JSON string):", requestBodyToBackend); // Log the full string
    console.log("Sending to backend (String Length):", requestBodyToBackend.length); // Log the length
    // Log the last 500 characters to check for truncation issues
    console.log("Sending to backend (Last 500 chars):", requestBodyToBackend.substring(Math.max(0, requestBodyToBackend.length - 500)));
    // --- END ADDITION ---


    const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/score-essay/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBodyToBackend, // Use the stringified body
    });

    // --- Your improved error handling code (keep this) ---

    if (!backendRes.ok) {
      let errorData = { error: `Backend returned status ${backendRes.status}` };
      try {
        errorData = await backendRes.json();
        console.error("Backend error response (parsed):", errorData); // This logs the 422 detail
      } catch (jsonError) {
        const errorText = await backendRes.text();
        console.error("Failed to parse backend error response as JSON, raw text:", errorText);
        errorData.error = `Backend error (${backendRes.status}): Could not parse response as JSON. Raw: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`;
      }

      return new Response(JSON.stringify(errorData), {
        status: backendRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const data = await backendRes.json();
      console.log("Successfully parsed backend OK response:", data);

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (jsonParseError) {
      const rawText = await backendRes.text();
      console.error("Failed to parse backend OK response as JSON, raw text:", rawText);
      return new Response(JSON.stringify({
        error: 'Failed to parse backend OK response as JSON',
        raw: rawText.substring(0, 200) + (rawText.length > 200 ? '...' : '')
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- End of your improved error handling code ---

  } catch (error) {
    console.error("Error in try block before fetch:", error);
    return new Response(JSON.stringify({ error: `Error communicating with backend: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}