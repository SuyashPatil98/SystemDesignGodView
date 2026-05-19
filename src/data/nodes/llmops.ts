import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'llmops';

export const llmopsNodes: GNode[] = [
  domainNode(
    D,
    'LLMOps',
    'Serving, evaluating, and governing LLMs in production: throughput, cost, evals, observability.',
    'Specialized ops discipline that has emerged because LLM serving has unique workload shapes (long prompts, KV cache, batching) and unique failure modes (hallucination, prompt injection).',
    'LLMOps is MLOps with KV cache, token economics, and prompt versioning.',
  ),

  subNode(D, 'Serving', D, 'Throughput-optimized inference engines: vLLM, TGI, TensorRT-LLM.', 'Drives unit cost and latency of any LLM product.', { id: 'llm-serving' }),
  subNode(D, 'Evaluation', D, 'Offline and online evaluation pipelines.', 'Your only honest measure of product quality.', { id: 'llm-eval' }),
  subNode(D, 'Performance', D, 'Tokens/sec, batching, paged attention, speculative decoding.', 'Where 5x cost reductions live.', { id: 'llm-perf' }),
  subNode(D, 'Cost', D, 'Token economics, caching, routing.', 'Defines the unit margin of an LLM feature.', { id: 'llm-cost' }),
  subNode(D, 'Observability', D, 'Traces of prompts, retrievals, tools, outputs, costs.', 'The new tracing surface that didn\'t exist 3 years ago.', { id: 'llm-obs' }),
  subNode(D, 'Governance', D, 'PII, jailbreaks, policy violations, audit.', 'Regulators are catching up; build the trail now.', { id: 'llm-governance' }),

  conceptNode('llm-paged-attention', 'Paged attention', D, 'llm-perf', 'Manage KV cache like virtual memory pages to allow flexible batching.', {
    whyItMatters: 'Single biggest throughput win in modern OSS serving (vLLM).',
    relatedIds: ['tool-vllm'],
  }),
  conceptNode('llm-continuous-batching', 'Continuous batching', D, 'llm-perf', 'Add new requests into the batch as old ones finish — utilizes GPU constantly.', {
    whyItMatters: 'Replaces wasteful per-batch padding.',
  }),
  conceptNode('llm-speculative-decoding', 'Speculative decoding', D, 'llm-perf', 'Use a fast draft model; verify with a strong model.', {
    whyItMatters: 'Speeds up inference 2-3x with near-lossless quality on most workloads.',
  }),
  conceptNode('llm-kv-cache', 'KV cache', D, 'llm-perf', 'Cache of attention keys/values per token; grows with context.', {
    whyItMatters: 'Defines serving memory pressure; design choices around context length cascade.',
    relatedIds: ['fm-gpu-oom'],
  }),
  conceptNode('llm-quantization', 'Quantization (INT8/INT4)', D, 'llm-perf', 'Compress weights/activations to fit larger models and accelerate.', {
    whyItMatters: 'Often the cheapest 2-4x speedup with manageable quality cost.',
  }),

  conceptNode('llm-prompt-cache', 'Prompt caching', D, 'llm-cost', 'Cache long system prompts and reuse across requests.', {
    whyItMatters: 'Often a 50%+ cost reduction for chat-style products.',
    relatedIds: ['metric-cost-req'],
  }),
  conceptNode('llm-routing', 'Model routing', D, 'llm-cost', 'Send easy queries to cheap models; escalate hard ones.', {
    whyItMatters: 'Material margin win on heterogeneous traffic.',
  }),
  conceptNode('llm-distillation', 'Distillation', D, 'llm-cost', 'Train a smaller model on a larger model\'s outputs.', {
    whyItMatters: 'Sustainable path from expensive prototype to cheap production.',
  }),

  conceptNode('llm-offline-evals', 'Offline evaluation', D, 'llm-eval', 'Run candidate models against fixed scenario suites and grade.', {
    whyItMatters: 'Lets you compare without shipping.',
  }),
  conceptNode('llm-online-evals', 'Online evaluation', D, 'llm-eval', 'Live A/B tests, thumbs-up/down, business-KPI deltas.', {
    whyItMatters: 'Only way to verify offline gains translate.',
  }),
  conceptNode('llm-evaluator-models', 'Evaluator/judge models', D, 'llm-eval', 'Models specialized for grading other models against rubrics.', {
    whyItMatters: 'Scales evaluation when human review can\'t keep up.',
    failureModes: ['Self-preference bias; rubric drift.'],
  }),
  conceptNode('llm-redteam', 'Red-teaming suites', D, 'llm-eval', 'Adversarial prompts probing jailbreaks, injections, policy violations.', {
    whyItMatters: 'Required before launch in any high-stakes domain.',
  }),

  conceptNode('llm-tracing', 'LLM tracing', D, 'llm-obs', 'Spans for prompt, retrieval, tool calls, generations, with token counts.', {
    whyItMatters: 'Tells you where cost, latency, and quality go.',
    relatedIds: ['tool-otel'],
  }),
  conceptNode('llm-prompt-versioning', 'Prompt versioning', D, 'llm-obs', 'Treat prompts like code: review, version, deploy.', {
    whyItMatters: 'A prompt change is a model change; managing it as ad-hoc text is a leading cause of regressions.',
  }),
];
