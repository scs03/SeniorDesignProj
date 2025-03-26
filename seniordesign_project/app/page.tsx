import Image from "next/image";
import TextAnalyzer from "./components/TextAnalyzer";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <TextAnalyzer />
        </div>
  );
}
