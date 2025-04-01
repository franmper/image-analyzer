import type * as React from "react";
import type { ExifData, ImageAnalysis } from "../types";

interface AIAnalysisDisplayProps {
  aiAnalysis: ImageAnalysis | null;
  aiError: string | null;
  exifData: ExifData;
  isLoading: boolean;
  userContext: string;
  isResizing: boolean;
  handleResizeImage: () => void;
  aiAnalysisRef: React.RefObject<HTMLDivElement>;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  aiAnalysis,
  aiError,
  exifData,
  isLoading,
  userContext,
  isResizing,
  handleResizeImage,
  aiAnalysisRef,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="mt-0 mb-4 text-purple-500 font-semibold">AI Analysis</h3>
        <div className="text-center p-6 text-purple-700 bg-purple-50 rounded-lg border border-dashed border-purple-200 animate-pulse">
          <div className="inline-block w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
          Analyzing image with AI...
        </div>
      </div>
    );
  }

  // If there's an AI-specific error but we have EXIF data
  if (aiError && exifData && Object.keys(exifData).length > 0) {
    return (
      <div ref={aiAnalysisRef} className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="mt-0 mb-4 text-purple-500 font-semibold">AI Analysis</h3>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4">
          <div className="flex items-start">
            <div className="text-amber-500 text-xl mr-3">⚠️</div>
            <div className="flex-1">
              <h4 className="text-amber-800 font-medium mb-1">AI Analysis Unavailable</h4>
              <p className="text-amber-700 text-sm">{aiError}</p>

              {aiError.includes("file size") && (
                <div className="mt-3">
                  <p className="text-sm text-amber-700 mb-2">Suggestions:</p>
                  <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 mb-3">
                    <li>Resize the image to reduce its file size</li>
                    <li>Compress the image before uploading</li>
                    <li>Try a different image under 20MB</li>
                  </ul>

                  <button
                    type="button"
                    onClick={handleResizeImage}
                    disabled={isResizing}
                    className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    {isResizing ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Resizing...
                      </>
                    ) : (
                      <>Resize This Image Automatically</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm italic">
          EXIF data extraction was successful. You can still view the technical details of your
          image above.
        </p>
      </div>
    );
  }

  // Don't render if there's no analysis and no error
  if (!aiAnalysis && !aiError) {
    return null;
  }

  return (
    <div ref={aiAnalysisRef} className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="mt-0 mb-4 text-purple-500 font-semibold">AI Analysis</h3>

      {userContext && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-blue-700 text-sm font-medium md:text-xs md:p-2.5">
          <span className="text-xl md:text-lg">💡</span>
          <span>Analysis enhanced with your context</span>
        </div>
      )}

      {aiAnalysis && (
        <>
          <div className="mb-4">
            <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
              Description
            </h4>
            <p className="m-0 text-gray-700 leading-relaxed text-sm">{aiAnalysis.description}</p>
          </div>

          {aiAnalysis.enhancementSuggestions && aiAnalysis.enhancementSuggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
                Enhancement Suggestions
              </h4>
              <div className="flex flex-col gap-2">
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
                      className={`bg-white rounded-lg p-3 border-l-4 ${priorityColors[priority]}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-gray-700">
                        {suggestion.title}
                        <span
                          className={`text-[0.7rem] font-bold uppercase py-0.5 px-1.5 rounded text-white ${badgeColors[priority]}`}
                        >
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="m-0 text-xs text-gray-600 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.tags.map((tag) => (
                <span
                  key={`tag-${tag}`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs border border-gray-200 transition-colors hover:bg-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
              Hashtags
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.hashtags.map((hashtag) => (
                <span
                  key={`hashtag-${hashtag}`}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:bg-purple-200"
                >
                  {hashtag}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {!aiAnalysis && aiError && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="text-amber-500 text-xl mr-3">⚠️</div>
            <div className="flex-1">
              <h4 className="text-amber-800 font-medium mb-1">AI Analysis Failed</h4>
              <p className="text-amber-700 text-sm">{aiError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisDisplay;
