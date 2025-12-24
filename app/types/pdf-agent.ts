import { tool, RealtimeAgent } from "@openai/agents/realtime";
import { z } from "zod";
import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

// ---- 1. קריאה ופרסינג של ה-PDF ----
const pdfFile = fs.readFileSync("example.pdf");

async function parsePDF(fileBuffer: Buffer) {
  const data = await pdfParse(fileBuffer);
  const text = data.text;

  // נחלק ל־chunks של 500 תווים עם חפיפה קטנה
  const chunkSize = 500;
  const overlap = 50;
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

// ---- 2. Tool לשאילת שאלות על PDF ----
const askPdf = tool({
  name: "ask_pdf",
  description: "Answer questions about a PDF file.",
  parameters: z.object({ question: z.string() }),
  async execute({ question }) {
    const chunks = await parsePDF(pdfFile);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ---- 2a. יצירת Embeddings לכל chunk ----
    const embeddingsRes = await Promise.all(
      chunks.map((chunk) =>
        openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
        })
      )
    );

    // ---- 2b. יצירת Embedding לשאלה ----
    const questionEmbeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    const questionEmbedding = questionEmbeddingRes.data[0].embedding;

    // ---- 2c. חיפוש chunk הכי רלוונטי ----
    function cosineSimilarity(a: number[], b: number[]) {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (normA * normB);
    }

    let bestChunk = "";
    let bestScore = -Infinity;
    embeddingsRes.forEach((res, i) => {
      const score = cosineSimilarity(res.data[0].embedding, questionEmbedding);
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunks[i];
      }
    });

    // ---- 2d. שימוש ב-GPT כדי לייצר תשובה טבעית ----
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that answers questions based on the provided PDF content.",
        },
        {
          role: "user",
          content: `PDF content: """${bestChunk}"""
Answer the following question based on this content: "${question}"`,
        },
      ],
    });

    return completion.choices[0].message?.content ?? "No answer found.";
  },
});

// ---- 3. סוכן PDF עם ה-Tool ----
const pdfAgent = new RealtimeAgent({
  name: "PDF Assistant",
  instructions: "Answer questions about the PDF using the ask_pdf tool.",
  tools: [askPdf],
});

export { pdfAgent };
