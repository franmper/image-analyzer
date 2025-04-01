import type * as React from "react";
import type {
  ExifData,
  ImageAnalysis,
  SocialMediaSuggestion,
  EnhancementSuggestion,
} from "../types";
import { useState, useEffect } from "react";

const socialMediaOptions = [
  {
    title: "Emotional Option",
    description: "A description of the image that is emotional and engaging.",
  },
  {
    title: "Informative Option",
    description: "A description of the image that is informative and educational.",
  },
  {
    title: "Creative Option",
    description: "A description of the image that is creative and unique.",
  },
];

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

// Toast notification component
const CopyToast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded shadow-md flex items-center z-50 animate-fadeIn">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
        role="img"
        aria-hidden="true"
      >
        <title>Success</title>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </div>
  );
};

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
  // Add state for active tab
  const [activeTab, setActiveTab] = useState<"improvements" | "content">("improvements");
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: "",
  });

  // Function to copy text and show toast
  const copyToClipboard = (text: string, itemName: string) => {
    navigator.clipboard.writeText(text);
    setToast({ show: true, message: `${itemName} copied to clipboard` });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast({ show: false, message: "" });
  };

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
      {/* Show toast notification when active */}
      {toast.show && <CopyToast message={toast.message} onClose={hideToast} />}

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

          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors ${
                activeTab === "improvements"
                  ? "border-purple-500 text-purple-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("improvements")}
              aria-selected={activeTab === "improvements"}
              role="tab"
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Improvements
              </div>
            </button>
            <button
              type="button"
              className={`py-2 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors ${
                activeTab === "content"
                  ? "border-purple-500 text-purple-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("content")}
              aria-selected={activeTab === "content"}
              role="tab"
            >
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                Content Recommendations
              </div>
            </button>
          </div>

          {/* Improvements tab content */}
          <div className={`${activeTab === "improvements" ? "block" : "hidden"}`}>
            <div className="mt-6">
              <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
                Enhancement Suggestions
              </h4>
              <div className="flex flex-col gap-3">
                {aiAnalysis.enhancementSuggestions &&
                aiAnalysis.enhancementSuggestions.length > 0 ? (
                  aiAnalysis.enhancementSuggestions.map(
                    (enhancement: EnhancementSuggestion, index: number) => (
                      <div
                        key={`enhance-${enhancement.title.replace(/\s+/g, "-").toLowerCase()}`}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-gray-800 font-medium mb-1 text-sm">
                            {enhancement.title}
                          </h5>
                          <button
                            type="button"
                            className="text-purple-600 hover:text-purple-800 text-xs flex items-center bg-purple-50 py-1 px-2 rounded-lg"
                            onClick={() => {
                              const text = `${enhancement.title}\n\n${enhancement.description}`;
                              copyToClipboard(text, "Enhancement suggestion");
                            }}
                            title="Copy suggestion"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-700 text-xs mb-2">{enhancement.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                enhancement.priority === "high"
                                  ? "bg-red-500"
                                  : enhancement.priority === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                            />
                            <span className="text-xs text-gray-500">
                              {enhancement.priority.charAt(0).toUpperCase() +
                                enhancement.priority.slice(1)}{" "}
                              Priority
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-gray-500 text-sm">
                    No enhancement suggestions available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content Recommendations tab content */}
          <div className={`${activeTab === "content" ? "block" : "hidden"}`}>
            <div>
              {/* Social Media Titles & Descriptions */}
              <div className="mb-6">
                <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
                  Social Media Suggestions
                </h4>

                {aiAnalysis.socialSuggestions ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((num) => (
                      <div
                        key={`social-suggestion-${num}`}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-200 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-sm font-medium text-gray-800">
                            {socialMediaOptions[num - 1].title}
                          </h5>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="text-purple-600 hover:text-purple-800 text-xs flex items-center bg-purple-50 py-1 px-2 rounded-lg"
                              onClick={() => {
                                // Copy title only
                                const text = aiAnalysis.socialSuggestions?.[num - 1]?.title || "";
                                copyToClipboard(text, "Title");
                              }}
                              title="Copy title"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Title
                            </button>
                            <button
                              type="button"
                              className="text-purple-600 hover:text-purple-800 text-xs flex items-center bg-purple-50 py-1 px-2 rounded-lg"
                              onClick={() => {
                                // Copy description only
                                const text =
                                  aiAnalysis.socialSuggestions?.[num - 1]?.description || "";
                                copyToClipboard(text, "Description");
                              }}
                              title="Copy description"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Desc
                            </button>
                            <button
                              type="button"
                              className="text-purple-600 hover:text-purple-800 text-xs flex items-center bg-purple-50 py-1 px-2 rounded-lg"
                              onClick={() => {
                                // Copy both title and description
                                const text = `${
                                  aiAnalysis.socialSuggestions?.[num - 1]?.title || ""
                                }\n\n${aiAnalysis.socialSuggestions?.[num - 1]?.description || ""}`;
                                copyToClipboard(text, "Title and description");
                              }}
                              title="Copy both title and description"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              All
                            </button>
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Title</div>
                          <div className="text-sm font-medium text-gray-800">
                            {aiAnalysis.socialSuggestions?.[num - 1]?.title ||
                              "Creative title for your social media post"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Description</div>
                          <div className="text-sm text-gray-700">
                            {aiAnalysis.socialSuggestions?.[num - 1]?.description ||
                              "Engaging description that complements your image and drives engagement."}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200 mb-4 text-sm">
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="mb-2 font-medium">This feature needs an update to your API</p>
                        <p>
                          Update the AI analysis to include socialSuggestions in the response with
                          title and description options for social media posts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
                  Tags
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-700">
                    Click to copy individual tags or copy all
                  </div>
                  <button
                    type="button"
                    className="text-purple-600 hover:text-purple-800 text-xs flex items-center bg-purple-50 py-1 px-2 rounded-lg"
                    onClick={() => {
                      // Copy all tags
                      const text = aiAnalysis.tags?.join(", ") || "";
                      copyToClipboard(text, "All tags");
                    }}
                    title="Copy all tags"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy All Tags
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.tags && aiAnalysis.tags.length > 0 ? (
                    aiAnalysis.tags.map((tag) => (
                      <button
                        key={`tag-${tag}`}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs border border-gray-200 transition-colors hover:bg-gray-200"
                        onClick={() => copyToClipboard(tag, `Tag "${tag}"`)}
                        title={`Copy "${tag}"`}
                        type="button"
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags available</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mt-0 mb-2 text-purple-700 font-semibold text-base border-b border-gray-200 pb-1">
                  Hashtags
                </h4>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-gray-700">
                    Click to copy individual hashtags or copy all
                  </div>
                  <button
                    type="button"
                    className="text-purple-600 hover:text-purple-800 text-xs flex items-center bg-purple-50 py-1 px-2 rounded-lg"
                    onClick={() => {
                      // Copy all hashtags
                      const text = aiAnalysis.hashtags?.join(" ") || "";
                      copyToClipboard(text, "All hashtags");
                    }}
                    title="Copy all hashtags"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy All Hashtags
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.hashtags && aiAnalysis.hashtags.length > 0 ? (
                    aiAnalysis.hashtags.map((hashtag) => (
                      <button
                        key={`hashtag-${hashtag}`}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:bg-purple-200"
                        onClick={() => copyToClipboard(hashtag, `Hashtag "${hashtag}"`)}
                        title={`Copy "${hashtag}"`}
                        type="button"
                      >
                        {hashtag}
                      </button>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No hashtags available</span>
                  )}
                </div>
              </div>
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
