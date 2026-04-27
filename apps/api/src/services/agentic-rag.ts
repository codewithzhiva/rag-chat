import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { Ollama } from "ollama";
import { searchChunks, type ChunkPayload } from "./qdrant.js";

const CHAT_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

const ollama = new Ollama({ host: HOST });

const MAX_RETRIEVE_LOOPS = 3;
const MIN_RELEVANT_CHUNKS = 2;

const State = Annotation.Root({
  originalQuestion: Annotation<string>(),
  currentQuery: Annotation<string>({ reducer: (_, b) => b }),
  retrievedChunks: Annotation<ChunkPayload[]>({ reducer: (_, b) => b, default: () => [] }),
  relevantChunks: Annotation<ChunkPayload[]>({ reducer: (_, b) => b, default: () => [] }),
  loopCount: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  answer: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
});

type StateT = typeof State.State;

// Node: rephrase the query for better retrieval
async function analyzeQuery(state: StateT): Promise<Partial<StateT>> {
  // On first iteration use original question directly
  if (state.loopCount === 0) {
    return { currentQuery: state.originalQuestion };
  }

  // On retry: ask LLM to rephrase for better retrieval
  const llm = new ChatOllama({ baseUrl: HOST, model: CHAT_MODEL });
  const res = await llm.invoke([
    {
      role: "system",
      content:
        "You are a search query optimizer. Rephrase the question to maximize semantic retrieval from a document store. Return only the rephrased query, no explanation.",
    },
    {
      role: "user",
      content: `Original question: "${state.originalQuestion}"\nPrevious query didn't find enough relevant documents. Rephrase it differently.`,
    },
  ]);

  const rephrased = typeof res.content === "string" ? res.content.trim() : state.originalQuestion;
  return { currentQuery: rephrased };
}

// Node: embed query and retrieve top-k chunks
async function retrieve(state: StateT): Promise<Partial<StateT>> {
  const embRes = await ollama.embeddings({ model: EMBED_MODEL, prompt: state.currentQuery });
  const chunks = await searchChunks(embRes.embedding, 5);
  return { retrievedChunks: chunks, loopCount: state.loopCount + 1 };
}

// Node: grade each chunk for relevance using LLM
async function gradeRelevance(state: StateT): Promise<Partial<StateT>> {
  if (state.retrievedChunks.length === 0) return { relevantChunks: [] };

  const llm = new ChatOllama({ baseUrl: HOST, model: CHAT_MODEL });

  const gradingPromises = state.retrievedChunks.map(async (chunk) => {
    const res = await llm.invoke([
      {
        role: "system",
        content:
          'You are a relevance grader. Answer only "yes" or "no" — is this document chunk relevant to the question?',
      },
      {
        role: "user",
        content: `Question: ${state.originalQuestion}\n\nChunk: ${chunk.text}`,
      },
    ]);
    const verdict = typeof res.content === "string" ? res.content.toLowerCase().trim() : "no";
    return verdict.startsWith("yes") ? chunk : null;
  });

  const results = await Promise.all(gradingPromises);
  const relevantChunks = results.filter((c): c is ChunkPayload => c !== null);
  return { relevantChunks };
}

// Node: generate final answer from relevant chunks
async function generate(state: StateT): Promise<Partial<StateT>> {
  const context = state.relevantChunks.map((c) => c.text).join("\n\n---\n\n");
  const llm = new ChatOllama({ baseUrl: HOST, model: CHAT_MODEL });

  const res = await llm.invoke([
    {
      role: "system",
      content: `You are a helpful assistant that answers questions based on provided documents.
Use ONLY the information from the context below. If the answer is not in the context, say so clearly.
Be concise and accurate.

CONTEXT:
${context}`,
    },
    { role: "user", content: state.originalQuestion },
  ]);

  const answer = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  return { answer };
}

// Edge: decide whether to retry retrieval or generate
function shouldRetry(state: StateT): "analyze_query" | "generate" {
  const hasEnough = state.relevantChunks.length >= MIN_RELEVANT_CHUNKS;
  const exhausted = state.loopCount >= MAX_RETRIEVE_LOOPS;
  if (hasEnough || exhausted) return "generate";
  return "analyze_query";
}

// Build and compile the graph once (module-level singleton)
const graph = new StateGraph(State)
  .addNode("analyze_query", analyzeQuery)
  .addNode("retrieve", retrieve)
  .addNode("grade_relevance", gradeRelevance)
  .addNode("generate", generate)
  .addEdge(START, "analyze_query")
  .addEdge("analyze_query", "retrieve")
  .addEdge("retrieve", "grade_relevance")
  .addConditionalEdges("grade_relevance", shouldRetry, {
    analyze_query: "analyze_query",
    generate: "generate",
  })
  .addEdge("generate", END)
  .compile();

export interface AgenticRagResult {
  answer: string;
  relevantChunks: ChunkPayload[];
  loopCount: number;
}

export async function runAgenticRag(question: string): Promise<AgenticRagResult> {
  const result = await graph.invoke({
    originalQuestion: question,
    currentQuery: question,
    loopCount: 0,
  });

  return {
    answer: result.answer,
    relevantChunks: result.relevantChunks,
    loopCount: result.loopCount,
  };
}
