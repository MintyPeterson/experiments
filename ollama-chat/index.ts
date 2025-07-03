import { Ollama } from "ollama";

// Create a custom client.
// This is needed if Ollama is running remotely.
const ollama = new Ollama({
  host: "http://127.0.0.1:11434",
});

// Check if the model exists.
const modelName = "llama3.2:latest";
const modelList = await ollama.list();

if (!modelList.models.find((model) => model.name === modelName)) {
  throw new Error("model does not exist.");
}

// Build a chat prompt with system, user, and assistant roles.
const schema = {
  city: {
    type: "string",
    description: "The city where the user is located.",
  },
  industry: {
    type: "string",
    description:
      "The most popular industry in the city. What the city is known for.",
  },
  fun: {
    type: "string",
    description: "One thing that is fun to do there on a day off",
  },
};

const msgs = [
  {
    role: "system",
    content: `The user will give you a city name. Describe the city including the major industry and a fun thing to do there. Output as JSON using this schema: ${JSON.stringify(
      schema,
      null,
      2
    )}`,
  },
  {
    role: "user",
    content: "Paris",
  },
  {
    role: "assistant",
    content:
      '{\n  "city": "Paris",\n  "industry": "Fashion",\n  "fun": "Take a stroll along the Seine River and enjoy the city\'s iconic landmarks while aboard a river cruise."\n}',
  },
  {
    role: "user",
    content: "London",
  },
];

// Generate the next message in the chat.
const output = await ollama.chat({ model: modelName, messages: msgs });

console.log(output.message.content);
