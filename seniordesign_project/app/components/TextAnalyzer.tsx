"use client";
interface TextAnalyzerProps {
  onEssayParsed: (text: string) => void;
  onRubricParsed: (text: string) => void;
}
import { useState } from "react";

export default function TextAnalyzer({ onEssayParsed, onRubricParsed }: TextAnalyzerProps) {
    const [inputText, setInputText] = useState<string>("");
    const [essayFile, setEssayFile] = useState<File | null>(null);
    const [rubricFile, setRubricFile] = useState<File | null>(null);
    const [result, setResult] = useState(null);
    const [rubricText, setRubricText] = useState<string>("");
    const [essayText, setEssayText] = useState<string>("");


    const [loadingText, setLoadingText] = useState(false);
    const [loadingEssayFile, setLoadingEssayFile] = useState(false);
    const [loadingRubricFile, setLoadingRubricFile] = useState(false);
    const [error, setError] = useState("");

    // handleSubmit looks fine for input text, but focus is on file uploads
    const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setLoadingText(true);
       setError("");
       setResult(null);

       try {
           const response = await fetch("/api/huggingface", { // Note: This calls /api/huggingface, not the scoring endpoint
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ text: inputText }),
           });

           const data = await response.json();

           if (response.ok) {
               // If /api/huggingface returns text under a different key, adjust here
               const plainText = data.text || ""; // Assuming /api/huggingface returns 'text'
               onEssayParsed(plainText);
               setEssayText(plainText);
               setResult(data);
           } else {
                setError(data.error || JSON.stringify(data));
                onEssayParsed("");
                setEssayText("");
                setResult(null);
           }
       } catch (err: any) {
           setError(err.message || "Failed to fetch results for text.");
           onEssayParsed("");
           setEssayText("");
           setResult(null);
       } finally {
           setLoadingText(false);
       }
    };

    // Handle essay PDF upload
    const handleEssayUpload = async () => {
        console.log("TextAnalyzer Debug: handleEssayUpload triggered");
        if (!essayFile) {
             console.log("TextAnalyzer Debug: essayFile is null, stopping upload.");
            setError("Please select a PDF file.");
            return;
        }
        setLoadingEssayFile(true);
        setError("");
        setResult(null);

        try {
            console.log(`TextAnalyzer Debug: Attempting to upload essay file: ${essayFile.name}`);
            const formData = new FormData();
            formData.append("file", essayFile);
            formData.append("type", "essay");

            const response = await fetch("/api/pdfparse", { // Assuming /api/pdfparse handles the PDF parsing
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("TextAnalyzer Debug: Response data from /api/pdfparse (essay):", data); // <--- Log

            if (response.ok) {
                // *** CORRECTED: Use data.generic_text ***
                const plainText = data.generic_text || ""; // Use generic_text from the response
                onEssayParsed(plainText); // Pass plain text to parent
                setEssayText(plainText); // Update local state
                setResult(data); // Keep result if needed for other purposes
                console.log("TextAnalyzer Debug: Essay upload successful, text parsed.");
            } else {
                 console.error("TextAnalyzer Debug: Essay upload API error:", data);
                 setError(data.error || JSON.stringify(data));
                 onEssayParsed("");
                 setEssayText("");
                 setResult(null);
            }
        } catch (err: any) {
            console.error("TextAnalyzer Debug: Error during essay upload fetch:", err);
            setError(err.message || "Failed to upload essay PDF.");
            onEssayParsed("");
            setEssayText("");
            setResult(null);
        } finally {
            setLoadingEssayFile(false);
             console.log("TextAnalyzer Debug: handleEssayUpload finished.");
        }
    };

    // Handle rubric PDF upload
    const handleRubricUpload = async () => {
        console.log("TextAnalyzer Debug: handleRubricUpload triggered");
        if (!rubricFile) {
             console.log("TextAnalyzer Debug: rubricFile is null, stopping upload.");
            setError("Please select a rubric PDF file.");
            return;
        }
        setLoadingRubricFile(true);
        setError("");

        try {
             console.log(`TextAnalyzer Debug: Attempting to upload rubric file: ${rubricFile.name}`);
            const formData = new FormData();
            formData.append("file", rubricFile);
            formData.append("type", "rubric");

            const response = await fetch("/api/pdfparse", { // Assuming /api/pdfparse handles PDF parsing
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("TextAnalyzer Debug: Response data from /api/pdfparse (rubric):", data); // <--- Log

            if (!response.ok) {
                 console.error("TextAnalyzer Debug: Rubric upload API error:", data);
                throw new Error(data.error || JSON.stringify(data) || "PDF parse failed");
            }

            // *** CORRECTED: Use data.generic_text ***
            const rawRubricText = data.generic_text || ""; // Use generic_text from the response
            onRubricParsed(rawRubricText); // Pass the plain string to parent (page.tsx)
            setRubricText(rawRubricText); // Update local state
            console.log("TextAnalyzer Debug: Rubric upload successful, text parsed.");

        } catch (err: any) {
            console.error("TextAnalyzer Debug: Error during rubric upload fetch:", err);
            setError(err.message || "Failed to upload and process rubric PDF.");
            onRubricParsed("");
            setRubricText("");
        } finally {
            setLoadingRubricFile(false);
             console.log("TextAnalyzer Debug: handleRubricUpload finished.");
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto border border-gray-300 rounded-lg shadow bg-blue-50 text-gray-900">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Text & PDF Analyzer</h2>

            {/* Essay PDF Upload */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Upload Essay PDF</h3>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                        console.log("TextAnalyzer Debug: Essay file input onChange fired");
                        if (e.target.files && e.target.files.length > 0) {
                            console.log("TextAnalyzer Debug: Essay file selected:", e.target.files[0].name);
                            setEssayFile(e.target.files[0]);
                            setError("");
                            setResult(null);
                            onEssayParsed("");
                            setEssayText("");
                        } else {
                             console.log("TextAnalyzer Debug: Essay file input cleared or no file selected.");
                             setEssayFile(null);
                        }
                    }}
                    className="block w-full text-gray-800"
                />
                <button
                    onClick={handleEssayUpload}
                    className={`bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg w-full transition duration-200 ${loadingEssayFile || !essayFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loadingEssayFile || !essayFile}
                >
                    {loadingEssayFile ? "Processing PDF..." : "Upload Essay PDF"}
                </button>
            </div>

            <hr className="my-4 border-gray-400" />

            {/* Rubric PDF Upload */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Upload Rubric PDF</h3>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                         console.log("TextAnalyzer Debug: Rubric file input onChange fired");
                        if (e.target.files && e.target.files.length > 0) {
                             console.log("TextAnalyzer Debug: Rubric file selected:", e.target.files[0].name);
                            setRubricFile(e.target.files[0]);
                            setError("");
                            onRubricParsed("");
                            setRubricText("");
                        } else {
                            console.log("TextAnalyzer Debug: Rubric file input cleared or no file selected.");
                            setRubricFile(null);
                        }
                    }}
                    className="block w-full text-gray-800"
                />
                <button
                    onClick={handleRubricUpload}
                    className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg w-full transition duration-200 ${loadingRubricFile || !rubricFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loadingRubricFile || !rubricFile}
                >
                    {loadingRubricFile ? "Processing Rubric..." : "Upload Rubric PDF"}
                </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-600 font-medium mt-3">{error}</p>}

            {/* Rubric Text Preview (Scrollable) - Shows raw extracted text */}
            {rubricText && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">Extracted Rubric Text:</h3>
                <pre className="p-4 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-sm overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {rubricText}
                </pre>
              </div>
            )}

            {/* Essay Text Preview (Scrollable) - Shows raw extracted text */}
            {essayText && (
               <div className="mt-4">
                 <h3 className="font-semibold text-gray-800 mb-1 text-sm">Extracted Essay Text:</h3>
                 <pre className="p-4 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-sm whitespace-pre-wrap overflow-x-auto max-h-40">
                   {essayText}
                 </pre>
               </div>
            )}
        </div>
    );
}