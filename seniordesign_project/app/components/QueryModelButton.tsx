import React, { useState } from "react";

interface DetailedTrait {
  name: string;
  description: string;
  // Corrected: scale can be string (if extraction failed) or an object (if parsed JSON)
  scale: string | { [key: string]: string | number }; // Adjust type based on expected parsed scale format
  weight: number;
}


interface QueryModelButtonProps {
  essayText: string;
  traits: DetailedTrait[]; // Expects traits in the DetailedTrait format
  onResult: (scores: any) => void;
}

const QueryModelButton: React.FC<QueryModelButtonProps> = ({ essayText, traits, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    console.log("QueryModelButton Debug - handleClick triggered"); // Added log
    console.log("QueryModelButton Debug - essayText prop received:", essayText);
    console.log("QueryModelButton Debug - traits prop received:", traits);

    setLoading(true);
    setError(null);

    try {
      // --- Transformation Step: Convert traits array to rubric dictionary ---
      const rubricDict: { [key: string]: any } = {};
      traits.forEach(trait => {
        let parsedScale: any = trait.scale;
        // *** CORRECTED: Attempt to parse the scale string into a JSON object ***
        if (typeof trait.scale === 'string') {
            try {
                parsedScale = JSON.parse(trait.scale);
            } catch (parseError) {
                console.error("QueryModelButton Error: Failed to parse scale string as JSON:", trait.scale, parseError);
                // Decide how to handle parsing errors - maybe keep as string or set to default
                parsedScale = {}; // Default to empty object on parse failure
            }
        }
        // *** End Correction ***


        rubricDict[trait.name] = {
            description: trait.description,
            scale: parsedScale, // Use the parsed scale
            weight: trait.weight,
        };
      });
      // --- End Transformation ---

      const input = {
        essayText: essayText,
        rubric: rubricDict, // Pass the transformed rubric dictionary
      };

      console.log("QueryModelButton Debug - Sending input to /api/score-essay:", input); // Log the final input before sending

      // Send request to the Next.js API route
      const response = await fetch('/api/score-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input), // Stringify the combined input object
      });

      const data = await response.json();
      console.log("QueryModelButton Debug - Received response data from API:", data);

      if (!response.ok) {
        console.error("QueryModelButton Debug: API returned non-OK status:", response.status, data); // Added log
        throw new Error(data.error || `Error ${response.status}: Unknown error from backend.`);
      }

      console.log("QueryModelButton Debug: API response OK. Data:", data); // Added log

      if (data && data.score !== undefined) {
           console.log("QueryModelButton Debug: Calling onResult with score:", data.score); // Added log
           onResult(data.score);
      } else {
           console.error("QueryModelButton Error: Backend returned OK but no 'score' key in body", data);
           throw new Error("Invalid response format from backend: 'score' key missing.");
      }


    } catch (err: any) {
      console.error("QueryModelButton Frontend Fetch Error:", err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
      console.log("QueryModelButton Debug - handleClick finished."); // Added log
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`font-semibold px-4 py-2 rounded-lg w-full transition duration-200
                   ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 text-white"}`}
      >
        {loading ? "Scoring Essay..." : "Score Essay"}
      </button>
      {error && (
        <p style={{ color: "red", marginTop: '10px', whiteSpace: 'pre-wrap' }}>
            Error: {error}
        </p>
      )}
    </div>
  );
};

export default QueryModelButton;