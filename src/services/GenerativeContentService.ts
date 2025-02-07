import Sentence from "../models/Sentence";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import exampleSentences from "../data/example_sentences.json";

export default class GenerativeContentService {
  public static async getNewSentence(
    key: string,
    topics: string[]
  ): Promise<{
    formal: Sentence;
    informal: Sentence;
  }> {
    const results: { formal: Sentence; informal: Sentence } = {
      formal: exampleSentences[0],
      informal: exampleSentences[1],
    };

    const schema = {
      description:
        "List of 2 Japanese sentences (formal and informal versions of the same sentence)",
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ["content", "furigana", "romaji", "vn_meaning", "en_meaning"],
        properties: {
          content: {
            type: SchemaType.STRING,
            description: "A Japanese sentence in kanji and kana.",
          },
          furigana: {
            type: SchemaType.STRING,
            description:
              "The furigana (phonetic reading) of the 'content' property.",
          },
          romaji: {
            type: SchemaType.STRING,
            description:
              "The romaji (Latin script representation) of the 'content' property.",
          },
          vn_meaning: {
            type: SchemaType.STRING,
            description:
              "The Vietnamese translation of the 'content' property.",
          },
          en_meaning: {
            type: SchemaType.STRING,
            description:
              "The English translation of the 'content' property. This must always be provided.",
          },
        },
      },
    };

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",

      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const prompt =
      "Return an array with 2 items as Japanese sentences. The first one should be a formal sentence related to 2-3 random topics from: " +
      topics.join(", ") +
      ". The second sentence should be the informal form of the first sentence. " +
      "For each sentence, provide the following fields: \n" +
      "- content: The Japanese sentence in kanji and kana.\n" +
      "- furigana: The furigana (phonetic reading) for the content.\n" +
      "- romaji: The romaji representation.\n" +
      "- vn_meaning: The Vietnamese translation.\n" +
      "- en_meaning: The English translation (MUST always be provided).\n" +
      "Make sure the 'en_meaning' field is always included in the response. \n\n" +
      "Here is an example:\n" +
      JSON.stringify(exampleSentences);

    try {
      const result = await model.generateContent(prompt);
      const parsedResult = JSON.parse(
        result.response.text()
      ) as Array<Sentence>;

      if (parsedResult.length > 0) {
        results.formal = parsedResult[0];
      }

      if (parsedResult.length > 1) {
        results.informal = parsedResult[1];
      }
    } catch (error) {
      console.error("Error generating content:", error);
      throw new Error(error);
    }
    return results;
  }

  public static async checkAPIKey(key: string): Promise<boolean> {
    const schema = {
      description: "boolean value for checking API key",
      type: SchemaType.BOOLEAN,
    };

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",

      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const prompt = "Return true";
    const result = await model.generateContent(prompt);

    return JSON.parse(result.response.text()) as boolean;
  }

  public static checkAPIFormat(apiKey: string): boolean {
    const regex = /^AIza[0-9A-Za-z\\-_]{35}$/;

    if (!apiKey) return false;

    return regex.test(apiKey);
  }
}
