import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("متغير البيئة API_KEY غير معين لـ Gemini. ميزات الذكاء الاصطناعي لن تعمل.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function getGeminiSuggestions(summary: string): Promise<string> {
  if (!API_KEY) {
    return "مفتاح API غير مهيأ. يرجى تعيين متغير البيئة API_KEY.";
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `بناءً على البيانات اللحظية التالية من نظام إدارة الطوابير، قدم بعض التوصيات العملية للمسؤول. الهدف هو تقليل أوقات الانتظار، وموازنة عبء العمل، وتحسين الكفاءة. كن موجزًا ونسق إجابتك بوضوح.

ملخص البيانات:
${summary}

التوصيات:`,
        config: {
          temperature: 0.5,
          topP: 0.95,
          topK: 40,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("فشل في جلب الاقتراحات من Gemini API.");
  }
}
