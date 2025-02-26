import React from "react";
import ImageAnalyzer from "./components/ImageAnalyzer";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-lg overflow-hidden">
        <header className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <h1 className="text-3xl font-bold text-center">Image Analyzer</h1>
          <p className="text-center mt-2 text-white/80">
            Upload an image to extract EXIF data and get AI-powered analysis
          </p>
        </header>
        <main className="p-6">
          <ImageAnalyzer />
        </main>
      </div>
    </div>
  );
}

export default App;
