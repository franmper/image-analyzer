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

  // Define sections with their properties and formatting
  const sectionDefinitions = {
    "File Information": [
      { key: "fileName", format: (data: ExifData) => `File Name: ${data.fileName}` },
      { key: "fileSize", format: (data: ExifData) => `File Size: ${data.fileSize}` },
      { key: "fileType", format: (data: ExifData) => `File Type: ${data.fileType}` },
      { key: "fileExtension", format: (data: ExifData) => `File Extension: ${data.fileExtension}` },
    ],
    "Image Information": [
      {
        key: ["imageWidth", "imageHeight"],
        format: (data: ExifData) => `Dimensions: ${data.imageWidth} × ${data.imageHeight} px`,
      },
      { key: "aspectRatio", format: (data: ExifData) => `Aspect Ratio: ${data.aspectRatio}` },
    ],
    "Camera Settings": [
      { key: ["make", "model"], format: (data: ExifData) => `Camera: ${data.make} ${data.model}` },
      { key: "dateTime", format: (data: ExifData) => `Date Taken: ${data.dateTime}` },
      { key: "exposureTime", format: (data: ExifData) => `Exposure: ${data.exposureTime}s` },
      { key: "fNumber", format: (data: ExifData) => `Aperture: f/${data.fNumber}` },
      { key: "iso", format: (data: ExifData) => `ISO: ${data.iso}` },
      { key: "focalLength", format: (data: ExifData) => `Focal Length: ${data.focalLength}` },
    ],
  };

  // Process each section
  const sections = Object.entries(sectionDefinitions)
    .map(([sectionName, properties]) => {
      // Get all valid properties for this section
      const sectionLines = properties
        .filter((prop) => {
          // Check if all required keys exist in the exifData
          if (Array.isArray(prop.key)) {
            return prop.key.every((k) => exifData[k as keyof ExifData]);
          }
          return exifData[prop.key as keyof ExifData];
        })
        .map((prop) => prop.format(exifData));

      // Only return sections that have content
      return sectionLines.length > 0 ? `${sectionName}:\n${sectionLines.join("\n")}` : null;
    })
    .filter(Boolean); // Remove empty sections

  // Add location information if available
  if (exifData.gpsLatitude && exifData.gpsLongitude) {
    const locationSection = [
      `Location Information:\nCoordinates: ${exifData.gpsLatitude}, ${exifData.gpsLongitude}`,
    ];
    if (exifData.locationName) {
      locationSection.push(`Location Name: ${exifData.locationName}`);
    }
    if (exifData.gpsAltitude) {
      locationSection.push(`Altitude: ${exifData.gpsAltitude}`);
    }
    sections.push(locationSection.join("\n"));
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

    // Create a prompt for the model
    const prompt = `
      You are a professional photographer and social media strategist with a deeply human, empathetic, and warm personality—like a supportive friend who's passionate about helping others shine. 
      A user has shared an image for analysis, along with this context: ${
        contextSection ||
        "No extra context given—I'll imagine this is a heartfelt moment you want to share with the world on social media."
      }
      When available, use this EXIF data to inform your analysis: ${
        exifData
          ? formatExifDataForPrompt(exifData)
          : "No EXIF data here—don't worry, I'll focus on the beauty I see in the image itself!"
      }
      Here's what I'd love to offer you:
      1. A 3-4 sentence description that feels alive—capturing the heart of your image with warmth, empathy, and a story that pulls people in on social media.
      2. 5-7 tags that reflect your image's soul and fit the vibe of platforms like Instagram or TikTok—simple, relatable, and trendy.
      3. 5-7 hashtags (with #) to help your image find its audience—blending popular ones with special ones just for your moment.
      4. 3-5 enhancement suggestions to make your image glow even brighter, each with:
        - A short title (2-4 words)
        - A 1-2 sentence nudge explaining how it lifts your image's spirit and connection with viewers
        - A priority level (high, medium, low) based on how much love it could add

      For those enhancements, I'll think about:
      - Composition (e.g., framing that feels just right)
      - Lighting (e.g., soft glow or bold contrast)
      - Color (e.g., hues that sing or soothe)
      - Sharpness (e.g., crisp details that pop)
      - Cropping or effects to make it uniquely yours

      If there's EXIF data, I'll use it to get technical in a friendly way—like suggesting a little noise reduction if the ISO's high, or cheering the dreamy blur from a low f-number. No EXIF? No problem—I'll lean into what I see and feel, keeping it all about boosting your social media magic.

      Format your response as JSON so it's easy to read:
      {
        "description": "A warm, heartfelt description here",
        "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
        "enhancementSuggestions": [
          {
            "title": "A gentle idea",
            "description": "Why this makes your image sing",
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
        description: parsedResponse.description ?? "No description available",
        tags: parsedResponse.tags ?? [],
        hashtags: parsedResponse.hashtags ?? [],
        enhancementSuggestions: parsedResponse.enhancementSuggestions ?? [],
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
