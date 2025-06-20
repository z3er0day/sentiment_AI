import axios from "axios";

// Вместо явного ключа используем переменную окружения
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

/**
 * Генерация рекомендации по теме через HuggingFace (text2text-generation)
 * category: тема/категория отзыва
 * Возвращает краткую рекомендацию (1 предложение)
 */
export async function generateTextRecommendation(category: string): Promise<string> {
  // Используем google/flan-t5-base — стабильная для text2text-generation
  const HF_MODEL = "google/flan-t5-base";
  const apiUrl = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const prompt = `На основе темы отзыва \"${category}\" сформулируй краткую рекомендацию по улучшению сервиса или продукта. Ответ должен быть одним предложением, конкретным и полезным для бизнеса.`;
  const payload = { inputs: prompt };
  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });
    const result = response.data;
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      return result[0].generated_text.trim();
    }
    if (result && result.generated_text) {
      return result.generated_text.trim();
    }
    return "";
  } catch (error: any) {
    console.error("HuggingFace API error (text recommendation):", error?.response?.data || error.message);
    throw new Error("Ошибка HuggingFace API (text recommendation): " + (error?.response?.data?.error || error.message));
  }
}
