"use client";
import { useState } from "react";
import TextAnalyzer from "./components/TextAnalyzer";
import UploadRubric from "./components/UploadRubric";
import QueryModelButton from "./components/QueryModelButton";

// Define the detailed structure expected by QueryModelButton and the backend
interface DetailedTrait {
  name: string;
  description: string;
  scale: string; // Or the actual type if not always a stringified JSON
  weight: number;
}

export default function Home() {
  // State for the plain essay text (needs to be a plain string from TextAnalyzer)
  const [essayText, setEssayText] = useState<string>("");
  console.log("DEBUG - essayText (should be plain string):", essayText);

  // State for the raw rubric text from the file (if needed separately)
  const [rubricText, setRubricText] = useState<string>("");

  // State for the extracted traits, using the DetailedTrait interface
  const [traits, setTraits] = useState<DetailedTrait[]>([]);
  console.log("traits.length:", traits.length);
  console.log("traits data:", traits); // Log the traits data structure

  // State for the model's final output score/feedback
  const [modelOutput, setModelOutput] = useState<string>(""); // Assuming output is a string

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 bg-gray-50 space-y-8">
      {/*
        TextAnalyzer should parse the essay and call onEssayParsed with a PLAIN STRING.
        It might also parse initial rubric text and call onRubricParsed.
      */}
      <TextAnalyzer
        onEssayParsed={setEssayText} // TextAnalyzer must pass a plain string here
        onRubricParsed={setRubricText} // TextAnalyzer must pass a plain string here
      />

      <div className="p-6 max-w-lg mx-auto border border-gray-300 bg-white rounded-lg shadow-md space-y-4">
        {rubricText && (
          // UploadRubric should extract traits in the DetailedTrait format
          <UploadRubric
            rubricText={rubricText}
            // The callback type now expects DetailedTrait[]
            onTraitsExtracted={(newTraits: DetailedTrait[]) => {
                console.log("UploadRubric Debug - received traits:", newTraits);
                setTraits(newTraits); // Set the state with the detailed traits
            }}
          />
        )}
        {traits.length > 0 && (
          // QueryModelButton receives the detailed traits array
          <QueryModelButton
            essayText={essayText} // This state variable should now be a plain string
            traits={traits}       // This state variable is now the DetailedTrait[]
            onResult={setModelOutput}
          />
        )}
      </div>

      {modelOutput && (
        <div className="max-w-2xl bg-white border border-gray-300 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
          <h3 className="text-lg font-semibold mb-2">Model Output:</h3>
          {modelOutput}
        </div>
      )}
    </div>
  );
}

// The duplicate export default function Home() block below this comment is likely a copy-paste error
// and should be removed. I've included the first one with corrections.
/*
"use client";
import { useState } from "react";
import TextAnalyzer from "./components/TextAnalyzer";
import UploadRubric from "./components/UploadRubric";
import QueryModelButton from "./components/QueryModelButton";

export default function Home() {
  // ... rest of duplicate code
}
*/