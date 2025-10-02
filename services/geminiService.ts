
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// تهيئة عميل GoogleGenAI باستخدام مفتاح API من متغيرات البيئة
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * يولد اقتراحات لتحسين إدارة الطابور باستخدام Gemini API.
 * @param summary سلسلة نصية تحتوي على الحالة الحالية لنظام الطابور.
 * @returns وعد يتم حله إلى سلسلة نصية تحتوي على اقتراحات مدعومة بالذكاء الاصطناعي.
 */
export async function getGeminiSuggestions(summary: string): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';
    
    // بناء طلب مفصل للذكاء الاصطناعي باللغة العربية
    const prompt = `
أنت خبير في تحسين كفاءة العمليات وإدارة قوائم الانتظار. بناءً على ملخص البيانات التالي لنظام طابور ذكي، قدم توصيات واضحة وقابلة للتنفيذ لتحسين الأداء وتقليل أوقات الانتظار.

**ملخص البيانات:**
${summary}

**المطلوب:**
1.  تحليل موجز للحالة الحالية (نقاط القوة والضعف).
2.  قائمة من 3 إلى 5 توصيات محددة. على سبيل المثال: "إعادة توجيه الموظف X للشباك Y لتقليل الضغط"، "فتح شباك جديد خلال ساعات الذروة"، "تدريب الموظف Z على التعامل مع المعاملات الأسرع".
3.  يجب أن تكون الإجابة باللغة العربية ومنسقة بشكل جيد.
`;

    // استدعاء Gemini API لتوليد المحتوى
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    // استخراج النص من الاستجابة وإعادته
    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // إرجاع رسالة خطأ سهلة الفهم للمستخدم باللغة العربية
    return "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقًا أو التحقق من إعدادات مفتاح API.";
  }
}
