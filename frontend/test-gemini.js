// Test script to list available Gemini models
const GEMINI_API_KEY = "AIzaSyCM2IprqbHAx4trM0ipPFEWA3-N4o4AoYM";

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Available Gemini Models:");
    console.log(JSON.stringify(data, null, 2));
    
    // Filter models that support generateContent
    if (data.models) {
      console.log("\n\nModels supporting generateContent:");
      data.models.forEach(model => {
        if (model.supportedGenerationMethods?.includes("generateContent")) {
          console.log(`- ${model.name}`);
        }
      });
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
