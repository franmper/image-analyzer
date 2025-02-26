import type * as React from "react";
import type { ExifData } from "../types";

interface ExifDataDisplayProps {
  exifData: ExifData;
  isLoading: boolean;
  showAllExif: boolean;
  setShowAllExif: (show: boolean) => void;
}

/**
 * Helper function to safely render EXIF values of different types
 */
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

const ExifDataDisplay: React.FC<ExifDataDisplayProps> = ({
  exifData,
  isLoading,
  showAllExif,
  setShowAllExif,
}) => {
  if (isLoading) {
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

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-t-emerald-500">
      <h3 className="mt-0 mb-6 text-emerald-500 font-semibold">EXIF Data</h3>

      {/* File Information Section */}
      {(exifData.fileName || exifData.fileSize || exifData.imageWidth || exifData.imageHeight) && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
            File Information
          </h4>
          <div className="flex flex-wrap gap-6 mb-4 md:gap-4 sm:gap-3">
            {exifData.fileName && (
              <div className="flex-1 min-w-[150px] bg-slate-50 rounded-lg p-3 shadow-sm md:min-w-[120px] md:p-2.5 sm:min-w-[100px] sm:p-2">
                <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">File Name</div>
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
                <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">File Size</div>
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
                  <div className="text-gray-600 md:text-sm">{safeRender(exifData.aspectRatio)}</div>
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
            <div className="text-sm font-semibold text-teal-700 mb-1 md:text-xs">Focal Length</div>
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

export default ExifDataDisplay;
