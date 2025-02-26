import * as React from "react";
import { extractExifData } from "../services/exifService";
import { analyzeImageWithGemini, FileTooLargeError } from "../services/geminiService";
import type { AnalysisResult, ImageAnalysis } from "../types";
import ExifDataDisplay from "./ExifDataDisplay";
import AIAnalysisDisplay from "./AIAnalysisDisplay";

// Add a function to handle viewport meta tag
const setViewportMeta = () => {
  // Check if we're in the browser environment
  if (typeof document !== "undefined") {
    // Look for an existing viewport meta tag
    let meta = document.querySelector('meta[name="viewport"]');

    // If it doesn't exist, create it
    if (!meta) {
      meta = document.createElement("meta");
      (meta as HTMLMetaElement).name = "viewport";
      document.head.appendChild(meta);
    }

    // Set the content attribute
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
  }
};

/**
 * Resizes an image to fit within the maximum file size limit
 * @param file The original image file
 * @param maxSizeMB Maximum size in MB
 * @returns Promise with the resized image file
 */
const resizeImage = (file: File, maxSizeMB = 19): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        // Start with original dimensions
        let width = img.width;
        let height = img.height;
        const quality = 0.9;

        // If image is very large, reduce dimensions first
        const MAX_DIMENSION = 3000;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = width / height;
          if (width > height) {
            width = MAX_DIMENSION;
            height = Math.round(width / ratio);
          } else {
            height = MAX_DIMENSION;
            width = Math.round(height * ratio);
          }
        }

        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality setting
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create image blob"));
              return;
            }

            // Create new file from blob
            const newFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(newFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Error loading image"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
  });
};

const ImageAnalyzer: React.FC = () => {
  // Call the function to set viewport meta tag
  setViewportMeta();

  // State for managing the uploaded image and analysis results
  const [result, setResult] = React.useState<AnalysisResult>({
    imageUrl: null,
    exifData: {},
    aiAnalysis: null,
    isLoading: false,
    error: null,
  });

  // State for UI interactions
  const [isDragging, setIsDragging] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [showAllExif, setShowAllExif] = React.useState(false);
  const [userContext, setUserContext] = React.useState("");
  const [isExifLoading, setIsExifLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);

  // Refs
  const aiAnalysisRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset loading states when component unmounts
  React.useEffect(() => {
    return () => {
      setIsExifLoading(false);
    };
  }, []);

  // Add an effect to scroll to AI analysis when it's complete
  React.useEffect(() => {
    // Check if AI analysis is complete and not loading
    if (result.aiAnalysis && !result.isLoading && aiAnalysisRef.current) {
      // Scroll to the AI analysis container with smooth behavior
      aiAnalysisRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [result.aiAnalysis, result.isLoading]);

  const handleImageUpload = React.useCallback(
    async (file: File) => {
      if (!file || !file.type.startsWith("image/")) {
        setResult((prev) => ({
          ...prev,
          error: "Please upload a valid image file",
        }));
        return;
      }

      // First, set the loading states and clear previous data
      setIsExifLoading(true);
      setAiError(null); // Clear previous AI errors
      setResult((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        exifData: {}, // Clear previous EXIF data
        aiAnalysis: null, // Clear previous AI analysis
        imageUrl: URL.createObjectURL(file),
      }));

      // Use setTimeout to ensure the state updates are processed before continuing
      setTimeout(async () => {
        try {
          // Extract EXIF data
          const exifData = await extractExifData(file);

          // Update EXIF loading state immediately after extraction
          setIsExifLoading(false);

          // Update the result with EXIF data
          setResult((prev) => ({
            ...prev,
            exifData,
          }));

          // Analyze image with Gemini
          let aiAnalysis: ImageAnalysis | null = null;
          try {
            // Pass the user context and EXIF data to the AI analysis
            aiAnalysis = await analyzeImageWithGemini(file, userContext, exifData);

            // Finally update the result with AI analysis and set loading to false
            setResult((prev) => ({
              ...prev,
              aiAnalysis,
              isLoading: false,
            }));
          } catch (aiError) {
            console.error("Error analyzing image with Gemini:", aiError);

            // Set loading to false
            setResult((prev) => ({
              ...prev,
              isLoading: false,
            }));

            // Handle specific error for file size
            if (aiError instanceof FileTooLargeError) {
              setAiError(aiError.message);
            } else {
              setAiError(
                "Failed to analyze image with AI. Please try again or try a different image."
              );
            }
          }
        } catch (error) {
          console.error("Error processing image:", error);
          setIsExifLoading(false);
          setResult((prev) => ({
            ...prev,
            isLoading: false,
            error: "Error processing image. Please try again.",
          }));
        }
      }, 100); // Small delay to ensure state updates are processed
    },
    [userContext]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        handleImageUpload(files[0]);
      }
    },
    [handleImageUpload]
  );

  const handleImageClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Add a function to handle image resizing
  const handleResizeImage = async () => {
    if (!result.imageUrl) return;

    try {
      setIsResizing(true);

      // Get the original file from the URL
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const originalFile = new File([blob], "resized-image.jpg", { type: blob.type });

      // Resize the image
      const resizedFile = await resizeImage(originalFile);

      // Upload the resized image
      handleImageUpload(resizedFile);
    } catch (error) {
      console.error("Error resizing image:", error);
      setResult((prev) => ({
        ...prev,
        error: "Failed to resize image. Please try a different image or resize it manually.",
      }));
    } finally {
      setIsResizing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans text-gray-700 bg-white rounded-2xl shadow-lg relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-blue-500 before:via-purple-600 before:to-emerald-500 before:z-10 md:p-4 md:rounded-xl sm:p-3 sm:rounded-lg">
      <div className="text-center text-xl text-gray-500 mb-8 md:text-lg md:mb-6 sm:text-base sm:mb-4">
        Upload an image to extract EXIF data and get AI-powered analysis
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-6 sm:gap-4">
        {/* Left column: Upload and Context */}
        <div className="flex-1 flex flex-col">
          <div className="flex-grow mb-8 transition-all duration-300 hover:-translate-y-0.5 md:mb-6">
            <div
              className={`border-2 ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white"
              } border-dashed rounded-xl p-8 text-center transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 shadow-sm md:p-6 md:rounded-lg sm:p-5 sm:rounded-md h-full flex flex-col justify-center items-center`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="mb-3 md:text-sm sm:text-xs sm:mb-2">
                Drag and drop an image here, or click to select
              </p>
              <label className="inline-block bg-blue-500 text-white py-3 px-6 rounded-lg cursor-pointer mt-4 transition-all duration-300 font-semibold shadow-md hover:bg-blue-600 hover:-translate-y-0.5 md:py-2.5 md:px-5 md:text-sm sm:w-4/5 sm:text-center">
                Select Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Context input for AI analysis */}
          <div className="mb-8 md:mb-6 sm:mb-4">
            <label htmlFor="context" className="block mb-2 text-gray-700 font-medium md:text-sm">
              Add Context (Optional)
            </label>
            <textarea
              id="context"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="Add any context about the image to improve AI analysis (e.g., 'This is a photo from my vacation in Italy', 'This is a product photo for my website')"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all md:text-sm md:p-2.5 sm:p-2 sm:text-xs"
              rows={3}
            />
          </div>
        </div>

        {/* Right column: Image Preview (when available) */}
        {result.imageUrl && (
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={handleImageClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleImageClick();
                }
              }}
              className="bg-transparent border-0 p-0 cursor-pointer flex items-center justify-center w-full"
            >
              <img
                src={result.imageUrl}
                alt="Uploaded"
                className="max-w-full max-h-[40vh] object-contain rounded-lg transition-transform duration-200 hover:scale-[1.02] shadow-md"
              />
            </button>
          </div>
        )}
      </div>

      {result.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border-l-4 border-red-500 md:p-3 md:text-sm">
          {result.error}
        </div>
      )}

      {showModal && result.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto">
            <button
              onClick={handleCloseModal}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCloseModal();
                }
              }}
              type="button"
              className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-800 hover:bg-gray-200 transition-colors z-10"
            >
              ✕
            </button>
            <img
              src={result.imageUrl}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

      {(result.exifData && Object.keys(result.exifData).length > 0) ||
      isExifLoading ||
      result.aiAnalysis ? (
        <div className="mt-8 md:mt-6 sm:mt-4">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 md:text-xl md:mb-4 sm:text-lg sm:mb-3">
            Analysis Results
          </h2>

          <div className="flex flex-col gap-8 md:gap-6">
            {/* EXIF Data Section - Now positioned above AI Analysis */}
            <div className="w-full">
              <ExifDataDisplay
                exifData={result.exifData}
                isLoading={isExifLoading}
                showAllExif={showAllExif}
                setShowAllExif={setShowAllExif}
              />
            </div>

            {/* AI Analysis Section */}
            <div className="w-full">
              {result.isLoading ? (
                <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-purple-500 h-full">
                  <h3 className="mt-0 mb-6 text-purple-500 font-semibold">AI Analysis</h3>
                  <div className="text-center p-8 text-purple-700 bg-purple-50 rounded-lg border border-dashed border-purple-200 animate-pulse">
                    <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing image with AI...
                  </div>
                </div>
              ) : (
                <AIAnalysisDisplay
                  aiAnalysis={result.aiAnalysis}
                  aiError={aiError}
                  exifData={result.exifData}
                  isLoading={result.isLoading}
                  userContext={userContext}
                  isResizing={isResizing}
                  handleResizeImage={handleResizeImage}
                  aiAnalysisRef={aiAnalysisRef as React.RefObject<HTMLDivElement>}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImageAnalyzer;
