import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ImageAnalysis, ExifData } from "../types";

// Initialize the Gemini API with your API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Maximum file size for Gemini API (20MB in bytes)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Custom error class for file size errors
export class FileTooLargeError extends Error {
  constructor(fileSize: number) {
    super(
      `Image file size (${(fileSize / (1024 * 1024)).toFixed(
        2
      )} MB) exceeds the 20MB limit for AI analysis.`
    );
    this.name = "FileTooLargeError";
  }
}

/**
 * Formats EXIF data into a readable string for the AI prompt
 * @param exifData The EXIF data extracted from the image
 * @returns A formatted string with relevant EXIF information
 */
const formatExifDataForPrompt = (exifData: ExifData): string => {
  if (!exifData || Object.keys(exifData).length === 0) {
    return "";
  }

  const sections = [];

  // Camera information
  const cameraInfo = [];
  if (exifData.make && exifData.model) {
    cameraInfo.push(`Camera: ${exifData.make} ${exifData.model}`);
  }
  if (exifData.dateTime) {
    cameraInfo.push(`Date Taken: ${exifData.dateTime}`);
  }
  if (exifData.exposureTime) {
    cameraInfo.push(`Exposure: ${exifData.exposureTime}s`);
  }
  if (exifData.fNumber) {
    cameraInfo.push(`Aperture: f/${exifData.fNumber}`);
  }
  if (exifData.iso) {
    cameraInfo.push(`ISO: ${exifData.iso}`);
  }
  if (exifData.focalLength) {
    cameraInfo.push(`Focal Length: ${exifData.focalLength}`);
  }

  if (cameraInfo.length > 0) {
    sections.push(`Camera Settings:\n${cameraInfo.join("\n")}`);
  }

  // Image information
  const imageInfo = [];
  if (exifData.imageWidth && exifData.imageHeight) {
    imageInfo.push(`Dimensions: ${exifData.imageWidth} × ${exifData.imageHeight} px`);
  }
  if (exifData.aspectRatio) {
    imageInfo.push(`Aspect Ratio: ${exifData.aspectRatio}`);
  }
  if (exifData.fileType) {
    imageInfo.push(`File Type: ${exifData.fileType}`);
  }

  if (imageInfo.length > 0) {
    sections.push(`Image Information:\n${imageInfo.join("\n")}`);
  }

  // Location information
  if (exifData.gpsLatitude && exifData.gpsLongitude) {
    sections.push(`Location: Coordinates ${exifData.gpsLatitude}, ${exifData.gpsLongitude}`);
    if (exifData.locationName) {
      sections.push(`Location Name: ${exifData.locationName}`);
    }
  }

  return sections.join("\n\n");
};

/**
 * Analyzes an image using Gemini to generate a description, tags, hashtags, and enhancement suggestions
 * @param imageFile The image file to analyze
 * @param userContext Optional context provided by the user to improve analysis
 * @param exifData Optional EXIF data extracted from the image
 * @returns Promise with the analysis results
 * @throws FileTooLargeError if the file is too large for the Gemini API
 */
export const analyzeImageWithGemini = async (
  imageFile: File,
  userContext?: string,
  exifData?: ExifData
): Promise<ImageAnalysis> => {
  try {
    // Check file size before processing
    if (imageFile.size > MAX_FILE_SIZE) {
      throw new FileTooLargeError(imageFile.size);
    }

    // Convert the image to base64
    const base64Image = await fileToGenerativePart(imageFile);

    // Get the Gemini Flash 2.0 model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // Add user context to the prompt if provided
    const contextSection = userContext
      ? `\nUser provided context: "${userContext}"\nUse this context to inform your analysis.`
      : "";

    // Add EXIF data to the prompt if available
    const exifSection =
      exifData && Object.keys(exifData).length > 0
        ? `\nEXIF Data:\n${formatExifDataForPrompt(
            exifData
          )}\nUse this technical information to inform your analysis.`
        : "";

    // Create a prompt for the model
    const prompt = `
      You are a professional photographer and social media expert.
      Analyze this image and provide:${contextSection}${exifSection}
      1. A detailed, empathetic, and human-like description (3-4 sentences)
      2. 5-7 relevant tags for social media
      3. 5-7 hashtags for social media (including the # symbol)
      4. 3-5 enhancement suggestions for the image, each with:
         - A short title (2-4 words)
         - A brief description explaining how to improve the image (1-2 sentences)
         - A priority level (high, medium, or low) based on how much the enhancement would improve the image
      
      For enhancement suggestions, consider aspects like:
      - Composition (rule of thirds, framing, leading lines)
      - Lighting (exposure, shadows, highlights)
      - Color balance and saturation
      - Focus and sharpness
      - Cropping opportunities
      - Potential filters or effects
      
      ${
        exifData
          ? "Use the EXIF data to provide technically accurate suggestions. For example, if the image has a high ISO, suggest noise reduction; if it has a shallow depth of field (low f-number), comment on the bokeh quality."
          : ""
      }
      
      Format your response as JSON with the following structure:
      {
        "description": "your detailed description here",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
        "enhancementSuggestions": [
          {
            "title": "Suggestion title",
            "description": "Detailed explanation of the suggestion",
            "priority": "high/medium/low"
          }
        ]
      }
    `;

    // Generate content with the image
    const result = await model.generateContent([prompt, base64Image]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/) || [null, text];

      const jsonText = jsonMatch[1] || text;
      const parsedResponse = JSON.parse(jsonText);

      return {
        description: parsedResponse.description || "No description available",
        tags: parsedResponse.tags || [],
        hashtags: parsedResponse.hashtags || [],
        enhancementSuggestions: parsedResponse.enhancementSuggestions || [],
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      // Fallback to a simple response if parsing fails
      return {
        description: `${text.substring(0, 200)}...`,
        tags: [],
        hashtags: [],
        enhancementSuggestions: [],
      };
    }
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
};

/**
 * Converts a file to a format that can be used with the Gemini API
 */
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: (await base64EncodedDataPromise).split(",")[1],
      mimeType: file.type,
    },
  };
}
