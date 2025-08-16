require('dotenv').config();
const { pipeline } = require('@huggingface/transformers');

const HF_EMBED_MODEL = process.env.HF_EMBED_MODEL || 'Xenova/all-MiniLM-L6-v2'; // local embedder
const HF_GEN_MODEL = process.env.HF_GEN_MODEL || 'Xenova/TinyLlama-1.1B-Chat-v1.0';  // local generator

// Global pipeline instances
let embedder = null;
let generator = null;

// Load the embedding pipeline
async function loadEmbedder() {
  if (!embedder) {
    console.log(`Loading embedding model locally: ${HF_EMBED_MODEL}`);
    embedder = await pipeline("feature-extraction", process.env.HF_EMBED_MODEL, {
      cache_dir: "/app/models"
    });
  }
}

// Load the generation pipeline
async function loadGenerator() {
  if (!generator) {
    const start = Date.now();
    console.log(`Loading generation model locally: ${HF_GEN_MODEL}`);
    // For text generation, task is 'text-generation'
    generator = await pipeline("text-generation", process.env.HF_GEN_MODEL, {
      cache_dir: "/app/models"
    });
    console.log(`Model loaded in ${(Date.now() - start) / 1000}s`);
  }
}

// Embed function using local pipeline
async function embed(text) {
  await loadEmbedder();
  const inputs = Array.isArray(text) ? text : [text];
  const embeddings = await embedder(inputs, { pooling: 'mean', normalize: true });
  return Array.isArray(text) ? embeddings : embeddings[0];
}

// Generate function using local pipeline
async function generate(prompt, options = {}) {
  await loadGenerator();

  // Default generation parameters (can be extended)
  const generationOptions = {
    max_new_tokens: options.max_new_tokens || 512,
    temperature: options.temperature ?? 0.2,
    // You can add more parameters here, e.g. top_p, top_k, repetition_penalty...
    ...options.parameters
  };
  console.log("generate options:", generationOptions);
  // Run generation pipeline
  const output = await generator(prompt, generationOptions);
  console.log("generate output:", output);
  // output is usually an array of objects [{ generated_text: '...' }]
  if (Array.isArray(output) && output[0]?.generated_text) {
    return output[0].generated_text;
  }

  // fallback return as stringified JSON
  return JSON.stringify(output).slice(0, 5000);
}

module.exports = { embed, generate };
