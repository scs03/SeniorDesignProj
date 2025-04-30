"use client"; // Make sure this directive is at the very top

import { useState } from "react";

// Define the detailed structure expected for each trait
// This interface should match the DetailedTrait interface in page.tsx
interface DetailedTrait {
  name: string;
  description: string;
  scale: string; // Or the actual type if not always a stringified JSON
  weight: number;
}

interface UploadRubricProps {
  rubricText: string;
  // Callback expects an array of DetailedTrait objects
  onTraitsExtracted?: (traits: DetailedTrait[]) => void;
}

export default function UploadRubric({ rubricText, onTraitsExtracted }: UploadRubricProps) {
  // Local state to hold the extracted traits within this component
  // This state also uses the DetailedTrait interface
  const [traits, setTraits] = useState<DetailedTrait[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Use null for no error

  const handleUpload = async () => {
    // Only proceed if there is rubric text to send
    if (!rubricText.trim()) {
        setError("Rubric text is empty.");
        return;
    }

    setLoading(true);
    setError(null); // Clear previous error
    setTraits([]); // Clear previous traits


    try {
      // Assuming /api/parse-rubric takes raw rubric text and returns { traits: DetailedTrait[] }
      const res = await fetch("/api/parse-rubric", { // Check this endpoint's purpose/response
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rubricText }), // Send the raw rubric text
      });

      const data = await res.json();

      // Check if the HTTP response status was successful
      if (!res.ok) {
        // If response not ok, data should contain error info
        throw new Error(data.error || JSON.stringify(data) || "Something went wrong during trait extraction.");
      }

      // Assuming data.traits is an array of objects matching the DetailedTrait structure
      // Add a check here to ensure data.traits is an array, just for robustness
      if (!Array.isArray(data.traits)) {
           console.error("API /api/parse-rubric did not return an array for data.traits:", data);
           throw new Error("Invalid data format from trait extraction API.");
      }

      // Update local state and call the parent callback with the extracted traits
      setTraits(data.traits); // Set local state
      onTraitsExtracted?.(data.traits); // Call parent callback

    } catch (err: any) { // Added type annotation for err
      console.error("UploadRubric Frontend Fetch Error:", err); // Log fetch error
      setError(err.message || "Unknown error occurred during trait extraction.");
      setTraits([]); // Clear local state on error
      onTraitsExtracted?.([]); // Clear traits in parent on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {/* Button is enabled only if not loading and rubricText is not empty */}
      <button
        onClick={handleUpload}
        disabled={loading || !rubricText.trim()} // Disable if loading or rubricText is empty
        className={`w-full text-sm font-medium py-2 rounded transition duration-200 ${loading || !rubricText.trim() ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
      >
        {loading ? "Extracting Traits..." : "Extract Traits"}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mt-2">
          ❌ {error}
        </p>
      )}

      {/* Display Extracted Traits */}
      {traits.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-800 mb-1 text-sm">Extracted Traits:</h3>
           {/* Use a scrollable container if the list can get long */}
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded">
            {traits.map((trait, i) => (
              <li key={i} className="break-words"> {/* Added break-words for long descriptions/scales */}
                <strong>{trait.name}:</strong> {trait.description} <br />
                <strong>Scale:</strong> {trait.scale} <br />
                <strong>Weight:</strong> {trait.weight} <br />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}