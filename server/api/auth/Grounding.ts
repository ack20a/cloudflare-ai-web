import {
  DynamicRetrievalMode,
  GoogleGenerativeAI,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel(
  {
    model: "models/gemini-1.5-pro-002",
    tools: [
      {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.7,
          },
        },
      },
    ],
  },
  { apiVersion: "v1beta" },
);

const prompt = "Who won Wimbledon this year?";
const result = await model.generateContent(prompt);
console.log(result.response.candidates[0].groundingMetadata);