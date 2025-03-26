"use client";
import { useState } from "react";

export default function TextAnalyzer() {
    const [inputText, setInputText] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState(null);
    const [loadingText, setLoadingText] = useState(false);
    const [loadingFile, setLoadingFile] = useState(false);
    const [error, setError] = useState("");

    // Handle text inference (Hugging Face API)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingText(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch("/api/huggingface", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: inputText }),
            });

            const data = await response.json();
            if (response.ok) {
                setResult(data);
            } else {
                setError(data.error || "Unexpected API error");
            }
        } catch (err) {
            setError("Failed to fetch results.");
        } finally {
            setLoadingText(false);
        }
    };

    // Handle PDF upload (FastAPI PDF parsing)
    const handleFileUpload = async () => {
        if (!file) {
            setError("Please select a PDF file.");
            return;
        }
        setLoadingFile(true);
        setError("");
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/pdfparse", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setResult(data); 
            } else {
                setError(data.error || "Unexpected API error");
            }
        } catch (err) {
            setError("Failed to upload PDF.");
        } finally {
            setLoadingFile(false);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto border border-gray-300 rounded-lg shadow bg-blue-50 text-gray-900">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Text & PDF Analyzer</h2>

            {/* Text Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full p-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    rows={4}
                />
                <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg w-full transition duration-200"
                    disabled={loadingText}
                >
                    {loadingText ? "Processing Text..." : "Analyze Text"}
                </button>
            </form>

            <hr className="my-4 border-gray-400" />

            {/* PDF Upload Section */}
            <div className="space-y-3">
                <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            setFile(e.target.files[0]); // Fixes "null" issue
                        }
                    }}
                    className="block w-full text-gray-800"
                />
                <button 
                    onClick={handleFileUpload} 
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg w-full transition duration-200"
                    disabled={loadingFile}
                >
                    {loadingFile ? "Processing PDF..." : "Upload PDF"}
                </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-600 font-medium mt-3">{error}</p>}

            {/* Result Display */}
            {result && (
                <pre className="mt-4 p-4 bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}