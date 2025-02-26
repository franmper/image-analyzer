export interface ExifData {
  // File information
  fileName?: string;
  fileSize?: string;
  fileSizeBytes?: number;
  fileType?: string;
  fileExtension?: string;

  // Image dimensions
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;

  // Camera information
  make?: string | null;
  model?: string | null;
  dateTime?: string | null;
  rawDateTime?: string | null; // Original unformatted date from EXIF
  exposureTime?: string | null;
  fNumber?: number | null;
  iso?: number | null;
  focalLength?: string | null;

  // Location information
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAltitude?: number | null;
  locationName?: string | null;

  // Allow for additional properties
  [key: string]: string | number | boolean | null | undefined | string[] | Record<string, unknown>;
}

export interface EnhancementSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ImageAnalysis {
  description: string;
  tags: string[];
  hashtags: string[];
  enhancementSuggestions: EnhancementSuggestion[];
}

export interface AnalysisResult {
  exifData: ExifData;
  aiAnalysis: ImageAnalysis | null;
  imageUrl: string;
  isLoading: boolean;
  error: string | null;
}
