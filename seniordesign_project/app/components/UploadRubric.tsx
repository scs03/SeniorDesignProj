"use client";

import { useState } from "react";

export default function UploadRubric() {
  const [file, setFile] = useState<File | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("rubric", file);

    setLoading(true);
    setError(null);
    setTraits([]);

    try {
      const res = await fetch("/api/parse-rubric", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setTraits(data.traits || []);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload a Rubric</h2>

      <input
        type="file"
        accept=".pdf,.txt"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-3 block w-full text-sm text-gray-900 border border-gray-300 rounded px-2 py-1"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded disabled:opacity-50"
      >
        {loading ? "Parsing..." : "Upload & Parse Rubric"}
      </button>

      {error && (
        <p className="mt-3 text-red-600 text-sm">
          ❌ {error}
        </p>
      )}

      {traits.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">Extracted Traits:</h3>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            {traits.map((trait, i) => (
              <li key={i}>{trait}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}   