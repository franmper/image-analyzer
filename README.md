# Image Analyzer

A React application that analyzes images to:
1. Extract EXIF metadata (including location data)
2. Generate human-like descriptions using Google's Gemini Flash 2.0
3. Create relevant tags and hashtags for social media

![image](https://github.com/user-attachments/assets/88da5a71-2b5e-40ce-b6e4-ee497db11663)


## Features

- Complete EXIF data extraction (camera model, settings, date, etc.)
- GPS location data with map link
- AI-powered image descriptions using Gemini Flash 2.0
- Social media tag and hashtag generation
- Drag-and-drop interface for easy image uploading

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Google API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   You can get a Gemini API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).

4. Start the development server:
   ```
   npm start
   ```

## How to Use

1. Open the application in your browser (http://localhost:3000)
2. Drag and drop an image or click "Select Image" to upload
3. The application will extract EXIF data and analyze the image
4. View the results, including:
   - EXIF metadata
   - Location data (if available)
   - AI-generated description
   - Tags and hashtags for social media

## Technologies Used

- React with TypeScript
- Vite for fast development and building
- exif-js for EXIF data extraction
- Google's Generative AI SDK for Gemini Flash 2.0
- Styled Components for styling

## Notes

- The Gemini API requires an API key and may have usage limits
- EXIF data extraction depends on the information available in the image file
- Location data is only available if the image contains GPS coordinates
