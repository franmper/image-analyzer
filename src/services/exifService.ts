/* eslint-disable @typescript-eslint/no-explicit-any */
import ExifReader from "exifreader";
import type { ExifData } from "../types";

/**
 * Safely converts any value to a string or number primitive
 */
const safeValue = (value: unknown): string | number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // Handle arrays and objects by converting to JSON string
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  return String(value);
};

/**
 * Formats file size in a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formats a date string from EXIF format (YYYY:MM:DD HH:MM:SS) to a more readable format
 * @param dateString The date string in EXIF format
 * @returns Formatted date string (e.g., "February 25, 2025")
 */
const formatExifDate = (dateString: string): string => {
  if (!dateString) return "";

  // EXIF dates are typically in format: "YYYY:MM:DD HH:MM:SS"
  const match = dateString.match(/^(\d{4}):(\d{2}):(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return dateString; // Return original if it doesn't match expected format

  try {
    const [, year, month, day, hour, minute, second] = match;
    const date = new Date(
      Number(year),
      Number(month) - 1, // JavaScript months are 0-indexed
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );

    // Format the date using Intl.DateTimeFormat for localization
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    console.warn("Error formatting date:", error);
    return dateString; // Return original on error
  }
};

/**
 * Extracts EXIF data from an image file
 * @param imageFile The image file to extract EXIF data from
 * @returns Promise with the extracted EXIF data
 */
export const extractExifData = (imageFile: File): Promise<ExifData> => {
  return new Promise((resolve, reject) => {
    try {
      // Add file information to EXIF data
      const fileInfo: ExifData = {
        fileName: imageFile.name,
        fileSize: formatFileSize(imageFile.size),
        fileSizeBytes: imageFile.size,
        fileType: imageFile.type,
        fileExtension: imageFile.name.split(".").pop()?.toLowerCase() || "",
      };

      // Read the file as an ArrayBuffer for EXIF extraction
      const reader = new FileReader();

      // Create an Image object to get dimensions
      const img = new Image();
      let loadedImage = false;
      let loadedExif = false;
      let exifData: ExifData = {};

      // Function to resolve when both image and EXIF data are loaded
      const resolveWhenBothLoaded = () => {
        if (loadedImage && loadedExif) {
          resolve({ ...fileInfo, ...exifData });
        }
      };

      // Load the image to get dimensions
      const urlReader = new FileReader();
      urlReader.onload = (e) => {
        if (!e.target?.result) return;

        img.onload = () => {
          fileInfo.imageWidth = img.width;
          fileInfo.imageHeight = img.height;
          fileInfo.aspectRatio = (img.width / img.height).toFixed(2);
          loadedImage = true;
          resolveWhenBothLoaded();
        };

        img.onerror = () => {
          console.warn("Could not load image for dimensions");
          loadedImage = true;
          resolveWhenBothLoaded();
        };

        img.src = e.target.result as string;
      };

      urlReader.onerror = () => {
        console.warn("Could not read file for image dimensions");
        loadedImage = true;
        resolveWhenBothLoaded();
      };

      // Start reading the file for image dimensions
      urlReader.readAsDataURL(imageFile);

      // Process EXIF data
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (!e.target?.result) {
          reject(new Error("Failed to read file"));
          return;
        }

        try {
          // Parse EXIF data using ExifReader
          const tags = ExifReader.load(e.target.result as ArrayBuffer);

          // Convert the tags to our ExifData format
          exifData = {};

          // Basic camera info
          if (tags.Make) {
            exifData.make = safeValue(tags.Make.description) as string;
          }

          if (tags.Model) {
            exifData.model = safeValue(tags.Model.description) as string;
          }

          if (tags.DateTime) {
            const rawDateTime = safeValue(tags.DateTime.description) as string;
            exifData.dateTime = formatExifDate(rawDateTime);
            exifData.rawDateTime = rawDateTime; // Keep the original date format too
          }

          // Camera settings
          if (tags.ExposureTime) {
            exifData.exposureTime = safeValue(tags.ExposureTime.description) as string;
          }

          if (tags.FNumber) {
            const fNumber = Number.parseFloat(tags.FNumber.description);
            exifData.fNumber = Number.isNaN(fNumber) ? undefined : fNumber;
          }

          if (tags.ISOSpeedRatings) {
            const iso = Number.parseInt(tags.ISOSpeedRatings.description, 10);
            exifData.iso = Number.isNaN(iso) ? undefined : iso;
          }

          if (tags.FocalLength) {
            exifData.focalLength = safeValue(tags.FocalLength.description) as string;
          }

          // GPS data
          const gpsLatitude = tags.GPSLatitude;
          const gpsLatitudeRef = tags.GPSLatitudeRef;
          const gpsLongitude = tags.GPSLongitude;
          const gpsLongitudeRef = tags.GPSLongitudeRef;
          const gpsAltitude = tags.GPSAltitude;

          if (gpsLatitude && gpsLatitudeRef && gpsLongitude && gpsLongitudeRef) {
            try {
              // ExifReader returns GPS coordinates in decimal degrees format
              const latValue = Number.parseFloat(gpsLatitude.description);
              const latRef = gpsLatitudeRef.description;
              const lngValue = Number.parseFloat(gpsLongitude.description);
              const lngRef = gpsLongitudeRef.description;

              exifData.gpsLatitude = latRef === "N" ? latValue : -latValue;
              exifData.gpsLongitude = lngRef === "E" ? lngValue : -lngValue;

              if (gpsAltitude) {
                const altValue = Number.parseFloat(gpsAltitude.description);
                exifData.gpsAltitude = Number.isNaN(altValue) ? undefined : altValue;
              }
            } catch (error) {
              console.error("Error processing GPS data:", error);
              // Don't add GPS data if there's an error
            }
          }

          // Add image dimensions from EXIF if available
          if (tags.ImageWidth && !fileInfo.imageWidth) {
            const width = Number.parseInt(tags.ImageWidth.description, 10);
            if (!Number.isNaN(width)) {
              exifData.imageWidth = width;
            }
          }

          if (tags.ImageHeight && !fileInfo.imageHeight) {
            const height = Number.parseInt(tags.ImageHeight.description, 10);
            if (!Number.isNaN(height)) {
              exifData.imageHeight = height;
            }
          }

          // Add all other available tags
          for (const [key, value] of Object.entries(tags)) {
            if (!exifData[key] && value.description !== undefined) {
              exifData[key] = safeValue(value.description);
            }
          }

          // Final safety check to ensure no complex objects remain
          for (const key of Object.keys(exifData)) {
            if (exifData[key] !== null && typeof exifData[key] === "object") {
              exifData[key] = JSON.stringify(exifData[key]);
            }
          }

          loadedExif = true;
          resolveWhenBothLoaded();
        } catch (error) {
          console.error("Error processing EXIF data:", error);
          loadedExif = true;
          resolveWhenBothLoaded();
        }
      };

      reader.onerror = () => {
        console.error("Failed to read file for EXIF data");
        loadedExif = true;
        resolveWhenBothLoaded();
      };

      // Read the file as an ArrayBuffer for EXIF data
      reader.readAsArrayBuffer(imageFile);
    } catch (error) {
      console.error("Error extracting EXIF data:", error);
      reject(error);
    }
  });
};

/**
 * Converts GPS coordinates from Degrees, Minutes, Seconds format to Decimal Degrees
 * Note: This function is kept for backward compatibility but is no longer used
 * as ExifReader returns GPS coordinates in decimal degrees format
 */
function convertDMSToDD(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: number
): number {
  return (degrees + minutes / 60 + seconds / 3600) * direction;
}
