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
    <div className="w-screen min-h-screen bg-white">
      <header className="w-screen bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-labelledby="imageIconTitle"
          >
            <title id="imageIconTitle">Image Icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h1 className="text-lg font-medium text-gray-800">Image Insights</h1>
        </div>
        <a
          href="mailto:fran.mper@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center"
        >
          Contact
        </a>
      </header>

      <div className="flex flex-col md:flex-row w-full h-[calc(100vh-57px)]">
        {/* Left sidebar for upload - Only show when no image is uploaded */}
        {!result.imageUrl ? (
          <div className="w-full bg-gray-50 p-6 border-r border-gray-200">
            <div className="mb-6">
              <h2 className="text-base font-medium text-gray-800 mb-1">Upload Image</h2>
              <p className="text-sm text-gray-500 mb-4">
                Select an image or drop it below to analyze
              </p>

              <div
                className={`border-2 ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                } border-dashed rounded-lg p-8 text-center transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 mb-4`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-labelledby="uploadIconTitle"
                  >
                    <title id="uploadIconTitle">Upload Image</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a3 3 0 01-3-3V6a3 3 0 013-3h10a3 3 0 013 3v7a3 3 0 01-3 3H7zm8-9a1 1 0 00-1-1h-4a1 1 0 00-1 1v4l2-1.5L13 11V7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 21h14a2 2 0 002-2V7.8a5 5 0 00-2.582-4.389A4.81 4.81 0 0016 3H8a4.81 4.81 0 00-2.418.411A5 5 0 003 7.8V19a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">Drag and drop an image here</p>
                  <span className="text-xs text-gray-500">or</span>
                  <label className="inline-block bg-blue-500 text-white py-2 px-4 rounded-lg cursor-pointer text-sm font-medium hover:bg-blue-600 transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Context input for AI analysis */}
            <div>
              <h2 className="text-base font-medium text-gray-800 mb-1">Image Context</h2>
              <p className="text-sm text-gray-500 mb-2">
                Add optional context to improve AI analysis
              </p>
              <textarea
                id="context"
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="Example: 'This was taken during my vacation in Italy' or 'This is a product photo for my website'"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                rows={4}
              />
            </div>
          </div>
        ) : null}

        {/* Main content area */}
        <div
          className={`flex-1 flex flex-col overflow-auto bg-white ${
            result.imageUrl ? "w-full" : ""
          }`}
        >
          {result.imageUrl ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800">Image Analysis</h2>
                <button
                  onClick={() => {
                    // Clear image and analysis
                    setResult({
                      imageUrl: null,
                      exifData: {},
                      aiAnalysis: null,
                      isLoading: false,
                      error: null,
                    });
                    setAiError(null);
                    setIsExifLoading(false);
                  }}
                  className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-labelledby="backButtonTitle"
                  >
                    <title id="backButtonTitle">Back arrow</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Upload
                </button>
              </div>

              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={handleImageClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleImageClick();
                    }
                  }}
                  className="bg-transparent border-0 p-0 cursor-pointer flex items-center justify-center w-full"
                  aria-label="View full size image"
                >
                  <img
                    src={result.imageUrl}
                    alt="Uploaded"
                    className="max-w-full max-h-[50vh] object-contain"
                  />
                </button>
              </div>

              {userContext && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-blue-700 text-sm">
                  <span className="text-blue-500 font-medium">Context:</span>
                  <span className="text-blue-800">{userContext}</span>
                </div>
              )}

              {/* Error display */}
              {result.error && (
                <div className="bg-red-50 text-red-600 p-4 mt-4 rounded-lg border-l-4 border-red-500 text-sm">
                  {result.error}
                </div>
              )}

              {/* Results section - only show if we have EXIF data or analysis is loading/complete */}
              {((result.exifData && Object.keys(result.exifData).length > 0) ||
                isExifLoading ||
                result.isLoading ||
                result.aiAnalysis ||
                aiError) && (
                <div className="mt-6">
                  <div className="flex flex-col gap-6">
                    {/* EXIF Data Section */}
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
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="mt-0 mb-4 text-purple-500 font-semibold">AI Analysis</h3>
                          <div className="text-center p-6 text-purple-700 bg-purple-50 rounded-lg border border-dashed border-purple-200 animate-pulse">
                            <div className="inline-block w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
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
              )}
            </div>
          ) : null}
        </div>
      </div>

      {showModal && result.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-[90vh] overflow-auto">
            <button
              onClick={handleCloseModal}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCloseModal();
                }
              }}
              type="button"
              className="absolute top-3 right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-800 hover:bg-gray-200 transition-colors z-10"
              aria-label="Close modal"
            >
              ✕
            </button>
            <img
              src={result.imageUrl}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain bg-gray-900 p-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;
