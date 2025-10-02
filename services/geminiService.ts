
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null | undefined = undefined;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents the application from crashing on module load if the API key is missing.
 */
function getAiClient(): GoogleGenAI | null {
    if (ai === undefined) {
        // In a browser environment, `process` might not be defined.
        // We need to check for its existence before accessing `process.env`.
        const API_KEY = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
        
        if (API_KEY) {
            try {
                ai = new GoogleGenAI({ apiKey: API_KEY });
            } catch (e) {
                console.error("Failed to initialize GoogleGenAI:", e);
                ai = null;
            }
        } else {
            console.warn("متغير البيئة API_KEY غير معين لـ Gemini. ميزات الذكاء الاصطناعي لن تعمل.");
            ai = null;
        }
    }
    return ai;
}

export async function getGeminiSuggestions(summary: string): Promise<string> {
    const client = getAiClient();
    if (!client) {
        return "مفتاح API غير مهيأ. يرجى تعيين متغير البيئة API_KEY.";
    }

    try {
        const response = await client.models.generateContent({
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
        return "فشل في جلب الاقتراحات من Gemini API. يرجى المحاولة مرة أخرى لاحقًا.";
    }
}
