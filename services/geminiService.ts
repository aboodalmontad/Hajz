
export async function getGeminiSuggestions(summary: string): Promise<string> {
    // لتمكين العمل دون اتصال، تم تعطيل هذه الميزة.
    // الآن تُرجع رسالة لإعلام المستخدم.
    console.log("AI suggestions requested, but the app is in offline mode. Summary data:", summary);
    return "ميزة التوصيات الذكية تتطلب اتصالاً بالإنترنت للعمل.";
}
