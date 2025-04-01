import type * as React from "react";
import type { ExifData } from "../types";

interface ExifDataDisplayProps {
  exifData: ExifData;
  isLoading: boolean;
  showAllExif: boolean;
  setShowAllExif: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * A component that displays EXIF data extracted from an image
 */
const ExifDataDisplay: React.FC<ExifDataDisplayProps> = ({
  exifData,
  isLoading,
  showAllExif,
  setShowAllExif,
}) => {
  // Safely render values of different types
  const safeRender = (value: unknown): string => {
    if (value === undefined || value === null) {
      return "Unknown";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "number") {
      return value.toString();
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return JSON.stringify(value);
    }

    return String(value);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="mt-0 mb-4 text-blue-500 font-semibold">EXIF Data</h3>
        <div className="text-center p-6 text-blue-700 bg-blue-50 rounded-lg border border-dashed border-blue-200 animate-pulse">
          <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
          Extracting image metadata...
        </div>
      </div>
    );
  }

  if (!exifData || Object.keys(exifData).length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="mt-0 mb-4 text-blue-500 font-semibold">EXIF Data</h3>
        <div className="text-center p-6 text-gray-600 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No EXIF data found in this image
        </div>
      </div>
    );
  }

  const hasFileInfo = exifData.fileName || exifData.fileSize || exifData.fileType;
  const hasDimensions = exifData.imageWidth || exifData.imageHeight;
  const hasCamera = exifData.make || exifData.model;
  const hasLocation = exifData.gpsLatitude || exifData.gpsLongitude || exifData.locationName;

  // Get all remaining exif properties not displayed in the main sections
  const displayedProperties = [
    "make",
    "model",
    "dateTime",
    "rawDateTime",
    "exposureTime",
    "fNumber",
    "iso",
    "focalLength",
    "fileName",
    "fileSize",
    "fileSizeBytes",
    "fileType",
    "fileExtension",
    "imageWidth",
    "imageHeight",
    "aspectRatio",
    "gpsLatitude",
    "gpsLongitude",
    "gpsAltitude",
    "locationName",
  ];

  const otherProperties = Object.keys(exifData).filter((key) => !displayedProperties.includes(key));

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="mt-0 text-blue-500 font-semibold">EXIF Data</h3>
        <button
          type="button"
          onClick={() => setShowAllExif(!showAllExif)}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAllExif ? "Show Less" : "Show All Properties"}
        </button>
      </div>

      {/* File Info Section */}
      {hasFileInfo && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
            File Information
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {exifData.fileName && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">File Name</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.fileName)}</div>
              </div>
            )}
            {exifData.fileType && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Format</div>
                <div className="font-medium text-gray-800">
                  {safeRender(exifData.fileExtension)} ({safeRender(exifData.fileType)})
                </div>
              </div>
            )}
            {exifData.fileSize && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">File Size</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.fileSize)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Dimensions Section */}
      {hasDimensions && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
            Image Dimensions
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {exifData.imageWidth && exifData.imageHeight && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Dimensions</div>
                <div className="font-medium text-gray-800">
                  {safeRender(exifData.imageWidth)} × {safeRender(exifData.imageHeight)} px
                </div>
              </div>
            )}
            {exifData.aspectRatio && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Aspect Ratio</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.aspectRatio)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Info Section */}
      {hasCamera && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
            Camera Information
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {exifData.make && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Make</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.make)}</div>
              </div>
            )}
            {exifData.model && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Model</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.model)}</div>
              </div>
            )}
            {exifData.dateTime && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-medium text-gray-800 group relative">
                  {safeRender(exifData.dateTime)}
                  {exifData.rawDateTime && (
                    <span className="invisible group-hover:visible absolute top-full left-0 mt-1 p-1 bg-gray-800 text-white text-xs rounded z-10 whitespace-nowrap">
                      {safeRender(exifData.rawDateTime)}
                    </span>
                  )}
                </div>
              </div>
            )}
            {exifData.exposureTime && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Exposure</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.exposureTime)}</div>
              </div>
            )}
            {exifData.fNumber && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Aperture</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.fNumber)}</div>
              </div>
            )}
            {exifData.iso && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">ISO</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.iso)}</div>
              </div>
            )}
            {exifData.focalLength && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Focal Length</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.focalLength)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Info Section */}
      {hasLocation && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">
            Location Information
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {exifData.locationName && (
              <div className="bg-gray-50 p-2 rounded md:col-span-3">
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.locationName)}</div>
              </div>
            )}
            {exifData.gpsLatitude && exifData.gpsLongitude && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Coordinates</div>
                <div className="font-medium text-gray-800">
                  {safeRender(exifData.gpsLatitude)}, {safeRender(exifData.gpsLongitude)}
                </div>
              </div>
            )}
            {exifData.gpsAltitude && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Altitude</div>
                <div className="font-medium text-gray-800">{safeRender(exifData.gpsAltitude)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Properties when Show All is active */}
      {showAllExif && otherProperties.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">All Properties</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Property
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(exifData).map((key) => (
                  <tr key={key}>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{key}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                      {safeRender(exifData[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExifDataDisplay;
