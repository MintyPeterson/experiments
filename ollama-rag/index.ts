import { ChromaClient } from "chromadb";
import { Ollama } from "ollama";
import { Glob } from "bun";

import { chunkTextBySentences } from "./utilities";

// Create a custom client.
// This is needed if Ollama is running remotely.
const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

// Check if the models exists.
const modelList = await ollama.list();

const embedModelName = "all-minilm:latest";
if (!modelList.models.find((model) => model.name === embedModelName)) {
  throw new Error("embed model does not exist.");
}

const mainModelName = "llama3.2:latest";
if (!modelList.models.find((model) => model.name === mainModelName)) {
  throw new Error("main model does not exist.");
}

// Create a Chroma (vector database) client.
const chromaClient = new ChromaClient({ host: "localhost", port: 8000 });

// Create the vector collection. The cosine space, per Chroma documentation, measures only
// the angle between vectors (ignoring magnitude), making it ideal for text embeddings or
// cases where you care about direction rather than scale.
const vectorCollection = await chromaClient.getOrCreateCollection({
  name: "ollama-rag",
  metadata: {
    "hnsw:space": "cosine",
  },
});

// Import sources.
const glob = new Glob("*.txt");

for await (const path of glob.scan({
  absolute: true,
  cwd: "sources",
})) {
  const file = await Bun.file(path).text();
  const chunks = chunkTextBySentences(file, 7, 0);

  for await (const [index, chunk] of chunks.entries()) {
    const embedding = (
      await ollama.embeddings({
        model: embedModelName,
        prompt: chunk,
      })
    ).embedding;

    await vectorCollection.add({
      ids: [path + index],
      embeddings: [embedding],
      metadatas: [
        {
          source: path,
        },
      ],
      documents: [chunk],
    });
  }
}

// Create the query.
// Query the vector collection to find documents similar to the query
// and then ask the main model to generate a response based on the returned
// documents.
const query = "I want to know...";

const embeddingsQuery = (
  await ollama.embeddings({
    model: embedModelName,
    prompt: query,
  })
).embedding;

const relevantDocuments = (
  await vectorCollection.query({
    queryEmbeddings: [embeddingsQuery],
    nResults: 1,
  })
).documents[0]?.join("\n\n");

const modelQuery = `${query} - Answer that question using the following text as a resource: ${relevantDocuments}`;

// Generate the response.
const stream = await ollama.generate({
  model: mainModelName,
  prompt: modelQuery,
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.response);
}

// Tidy up the collection.
await chromaClient.deleteCollection({ name: "ollama-rag" });
