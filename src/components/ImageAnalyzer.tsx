import { useState, useCallback, useEffect } from "react";
import type { FC } from "react";
import { extractExifData } from "../services/exifService";
import { analyzeImageWithGemini } from "../services/geminiService";
import type { AnalysisResult, ImageAnalysis } from "../types";

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

const ImageAnalyzer: FC = () => {
  // Call the function to set viewport meta tag
  setViewportMeta();

  const [result, setResult] = useState<AnalysisResult>({
    exifData: {},
    aiAnalysis: null,
    imageUrl: "",
    isLoading: false,
    error: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showAllExif, setShowAllExif] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isExifLoading, setIsExifLoading] = useState(false);
  const [userContext, setUserContext] = useState("");

  // Reset loading states when component unmounts
  useEffect(() => {
    return () => {
      setIsExifLoading(false);
    };
  }, []);

  const handleImageUpload = useCallback(
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
          } catch (aiError) {
            console.error("Error analyzing image with Gemini:", aiError);
            // Continue with EXIF data even if AI analysis fails
          }

          // Finally update the result with AI analysis and set loading to false
          setResult((prev) => ({
            ...prev,
            aiAnalysis,
            isLoading: false,
          }));
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

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
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

  const renderExifData = () => {
    const { exifData } = result;

    if (isExifLoading) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-emerald-500">
          <h3 className="mt-0 mb-6 text-emerald-500 font-semibold">EXIF Data</h3>
          <div className="text-center p-8 text-purple-700 bg-purple-50 rounded-lg border border-dashed border-purple-200 animate-pulse">
            <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
            Extracting EXIF data...
          </div>
        </div>
      );
    }

    if (!exifData || Object.keys(exifData).length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-emerald-500">
          <h3 className="mt-0 mb-6 text-emerald-500 font-semibold">EXIF Data</h3>
          <p>No EXIF data found</p>
        </div>
      );
    }

    // Helper function to safely render values
    const safeRender = (value: unknown): string => {
      if (value === null || value === undefined) {
        return "N/A";
      }
      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch (e) {
          return String(value);
        }
      }
      return String(value);
    };

    return (
      <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-emerald-500">
        <h3 className="mt-0 mb-6 text-emerald-500 font-semibold">EXIF Data</h3>

        {/* File Information Section */}
        {(exifData.fileName ||
          exifData.fileSize ||
          exifData.imageWidth ||
          exifData.imageHeight) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
              File Information
            </h4>
            <div className="flex flex-wrap gap-6 mb-4 md:gap-4 sm:gap-3">
              {exifData.fileName && (
                <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
                  <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">
                    File Name
                  </div>
                  <div className="text-gray-600 md:text-sm">{safeRender(exifData.fileName)}</div>
                </div>
              )}

              {exifData.fileExtension && (
                <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
                  <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Format</div>
                  <div className="text-gray-600 md:text-sm">
                    {safeRender(exifData.fileExtension).toUpperCase()}
                  </div>
                </div>
              )}

              {exifData.fileSize && (
                <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
                  <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">
                    File Size
                  </div>
                  <div className="text-gray-600 md:text-sm">{safeRender(exifData.fileSize)}</div>
                </div>
              )}
            </div>

            {(exifData.imageWidth || exifData.imageHeight) && (
              <div className="flex flex-wrap gap-6 md:gap-4 sm:gap-3">
                {exifData.imageWidth && exifData.imageHeight && (
                  <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
                    <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">
                      Dimensions
                    </div>
                    <div className="text-gray-600 md:text-sm">
                      {safeRender(exifData.imageWidth)} × {safeRender(exifData.imageHeight)} px
                    </div>
                  </div>
                )}

                {exifData.aspectRatio && (
                  <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
                    <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">
                      Aspect Ratio
                    </div>
                    <div className="text-gray-600 md:text-sm">
                      {safeRender(exifData.aspectRatio)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Camera Information Section - Add a heading for existing camera info */}
        <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
          Camera Information
        </h4>
        <div className="flex flex-wrap gap-6 mb-6 md:gap-4 sm:gap-3">
          {exifData.make && exifData.model && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Camera</div>
              <div className="text-gray-600 md:text-sm">
                {safeRender(exifData.make)} {safeRender(exifData.model)}
              </div>
            </div>
          )}

          {exifData.dateTime && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Date</div>
              <div
                className="text-gray-600 md:text-sm"
                title={
                  exifData.rawDateTime
                    ? `Original format: ${safeRender(exifData.rawDateTime)}`
                    : undefined
                }
              >
                {safeRender(exifData.dateTime)}
              </div>
            </div>
          )}

          {exifData.exposureTime && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Exposure</div>
              <div className="text-gray-600 md:text-sm">{safeRender(exifData.exposureTime)}s</div>
            </div>
          )}

          {exifData.fNumber && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Aperture</div>
              <div className="text-gray-600 md:text-sm">f/{safeRender(exifData.fNumber)}</div>
            </div>
          )}

          {exifData.iso && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">ISO</div>
              <div className="text-gray-600 md:text-sm">{safeRender(exifData.iso)}</div>
            </div>
          )}

          {exifData.focalLength && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">
                Focal Length
              </div>
              <div className="text-gray-600 md:text-sm">{safeRender(exifData.focalLength)}mm</div>
            </div>
          )}

          {exifData.gpsLatitude && exifData.gpsLongitude && (
            <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
              <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Location</div>
              <div className="text-gray-600 md:text-sm">
                <a
                  href={`https://www.google.com/maps?q=${
                    typeof exifData.gpsLatitude === "number" ? exifData.gpsLatitude : 0
                  },${typeof exifData.gpsLongitude === "number" ? exifData.gpsLongitude : 0}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-blue-500 font-semibold hover:text-blue-700 hover:underline transition-colors sm:text-sm sm:mt-1.5"
                >
                  View on Map
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Toggle button for showing all EXIF data */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <button
            onClick={() => setShowAllExif(!showAllExif)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowAllExif(!showAllExif);
              }
            }}
            type="button"
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-all hover:shadow-md hover:-translate-y-0.5 md:text-sm md:py-1.5 md:px-3"
          >
            {showAllExif ? "Hide" : "Show"} All EXIF Data
            <span
              className={`ml-2 transition-transform duration-300 ${
                showAllExif ? "rotate-180" : "rotate-0"
              }`}
            >
              ▼
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ${
              showAllExif ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr>
                  <th className="bg-slate-100 text-teal-700 font-semibold p-2 text-left md:text-sm md:p-1.5 sm:text-xs sm:p-1">
                    Property
                  </th>
                  <th className="bg-slate-100 text-teal-700 font-semibold p-2 text-left md:text-sm md:p-1.5 sm:text-xs sm:p-1">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(exifData).map(([key, value]) => (
                  <tr key={key} className="hover:bg-slate-50 even:bg-slate-50">
                    <td className="p-2 border-b border-slate-200 md:text-sm md:p-1.5 sm:text-xs sm:p-1 sm:max-w-[40%] sm:break-words">
                      {key}
                    </td>
                    <td className="p-2 border-b border-slate-200 md:text-sm md:p-1.5 sm:text-xs sm:p-1">
                      {safeRender(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAiAnalysis = () => {
    const { aiAnalysis } = result;
    if (!aiAnalysis) {
      return null;
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-purple-500">
        <h3 className="mt-0 mb-6 text-purple-500 font-semibold">AI Analysis</h3>

        {userContext && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-blue-700 text-sm font-medium md:text-xs md:p-2.5 md:mb-4">
            <span className="text-xl md:text-lg">💡</span>
            <span>Analysis enhanced with your context</span>
          </div>
        )}

        <div className="mb-6 md:mb-4">
          <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-lg md:text-base sm:text-sm">
            Description
          </h4>
          <p className="m-0 text-gray-700 leading-relaxed md:text-sm">{aiAnalysis.description}</p>
        </div>

        {aiAnalysis.enhancementSuggestions && aiAnalysis.enhancementSuggestions.length > 0 && (
          <div className="mb-6 md:mb-4">
            <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-lg md:text-base sm:text-sm">
              Enhancement Suggestions
            </h4>
            <div className="flex flex-col gap-3 md:gap-2">
              {aiAnalysis.enhancementSuggestions.map((suggestion, index) => {
                const priorityColors = {
                  high: "border-red-500 bg-red-50",
                  medium: "border-amber-500 bg-amber-50",
                  low: "border-emerald-500 bg-emerald-50",
                };
                const badgeColors = {
                  high: "bg-red-500",
                  medium: "bg-amber-500",
                  low: "bg-emerald-500",
                };
                const priority = suggestion.priority as "high" | "medium" | "low";

                return (
                  <div
                    key={`suggestion-${suggestion.title
                      .replace(/\s+/g, "-")
                      .toLowerCase()}-${index}`}
                    className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${priorityColors[priority]} md:p-3 sm:p-2.5`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-base font-semibold text-gray-700 md:text-sm sm:text-xs">
                      {suggestion.title}
                      <span
                        className={`text-[0.7rem] font-bold uppercase py-0.5 px-1.5 rounded text-white ${badgeColors[priority]}`}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="m-0 text-sm text-gray-600 leading-relaxed md:text-xs">
                      {suggestion.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6 md:mb-4">
          <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-lg md:text-base sm:text-sm">
            Tags
          </h4>
          <div className="flex flex-wrap gap-2 md:gap-1.5 sm:gap-1">
            {aiAnalysis.tags.map((tag) => (
              <span
                key={`tag-${tag}`}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200 transition-colors hover:bg-gray-200 md:text-xs md:px-2.5 md:py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-lg md:text-base sm:text-sm">
            Hashtags
          </h4>
          <div className="flex flex-wrap gap-2 md:gap-1.5 sm:gap-1">
            {aiAnalysis.hashtags.map((hashtag) => (
              <span
                key={`hashtag-${hashtag}`}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium transition-colors hover:bg-purple-200 md:text-xs md:px-2.5 md:py-0.5"
              >
                {hashtag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
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

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-6">
            {/* EXIF Data Column */}
            <div className="flex-1">{renderExifData()}</div>

            {/* AI Analysis Column */}
            <div className="flex-1">
              {result.isLoading ? (
                <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-purple-500 h-full">
                  <h3 className="mt-0 mb-6 text-purple-500 font-semibold">AI Analysis</h3>
                  <div className="text-center p-8 text-purple-700 bg-purple-50 rounded-lg border border-dashed border-purple-200 animate-pulse">
                    <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing image with AI...
                  </div>
                </div>
              ) : (
                renderAiAnalysis()
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImageAnalyzer;
