import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'genai';

export const genaiNodes: GNode[] = [
  domainNode(
    D,
    'GenAI Engineering',
    'Building products on top of LLMs and generative models — prompting, retrieval, tools, evaluation, safety.',
    'The fastest-growing surface of software engineering. The discipline is still forming, but the patterns — RAG, agents, evals, guardrails — are stabilizing.',
    'Think of an LLM as a probabilistic function that turns context into output. Engineering it means controlling the context and measuring the output.',
  ),

  subNode(D, 'Models & inference', D, 'Choosing and running base models (closed, open, fine-tuned).', 'Model choice drives cost, latency, capability, and lock-in.', { id: 'genai-models' }),
  subNode(D, 'Prompting', D, 'Crafting inputs that shape outputs reliably.', 'Cheapest control surface — and the first one to revisit when quality drops.', { id: 'genai-prompting' }),
  subNode(D, 'RAG', D, 'Retrieval-augmented generation — ground the model in your data.', 'The default architecture for QA, copilots, and assistants over enterprise data.', { id: 'genai-rag' }),
  subNode(D, 'Agents & tools', D, 'Loops where the LLM picks tools and acts.', 'Lets language understanding orchestrate real-world actions. Hard to evaluate.', { id: 'genai-agents' }),
  subNode(D, 'Evaluation', D, 'Measuring quality, faithfulness, hallucination, harm.', 'Without evals, you\'re shipping vibes. The team that owns evals owns the product.', { id: 'genai-eval' }),
  subNode(D, 'Safety & guardrails', D, 'Prompt injection, PII, harmful content, refusal.', 'You will own all model output — design for the worst input.', { id: 'genai-security' }),
  subNode(D, 'LLM applications', D, 'End-to-end frameworks and patterns for shipping LLM apps.', 'Where the architecture meets the product.', { id: 'genai-apps' }),

  conceptNode('genai-base-models', 'Base vs instruction-tuned vs chat models', D, 'genai-models', 'Models differ by what they were post-trained for.', {
    whyItMatters: 'Picking the wrong variant either wastes capacity or fails to follow instructions.',
  }),
  conceptNode('genai-context-window', 'Context window', D, 'genai-models', 'How many tokens the model can attend to at once.', {
    whyItMatters: 'Bigger windows enable longer documents but cost more and degrade attention over the middle ("lost in the middle").',
    tradeoffs: ['Long context vs RAG: long context is simpler but costlier and less precise.'],
  }),
  conceptNode('genai-function-calling', 'Function/tool calling', D, 'genai-models', 'Structured way for the model to request tool invocations.', {
    whyItMatters: 'Replaces brittle parsing of free text; the foundation of agents.',
  }),

  conceptNode('genai-system-prompt', 'System prompt', D, 'genai-prompting', 'Persistent instruction that shapes the model\'s behavior across turns.', {
    whyItMatters: 'Most product quality lives here.',
    commonMistakes: ['Stuffing instructions until the model loses them; mixing instructions and data.'],
  }),
  conceptNode('genai-few-shot', 'Few-shot prompting', D, 'genai-prompting', 'Show input → output examples; the model generalizes.', {
    whyItMatters: 'Often the cheapest way to nail format and tone without fine-tuning.',
  }),
  conceptNode('genai-cot', 'Chain-of-thought / reasoning', D, 'genai-prompting', 'Ask the model to reason step by step before answering.', {
    whyItMatters: 'Improves accuracy on multi-step problems but increases tokens and latency.',
  }),
  conceptNode('genai-structured-output', 'Structured outputs', D, 'genai-prompting', 'Force JSON/schema output via constrained decoding or schema mode.', {
    whyItMatters: 'Makes downstream parsing reliable; mandatory for any tool-calling pipeline.',
  }),

  conceptNode('genai-rag-chunking', 'Chunking strategy', D, 'genai-rag', 'How documents are split into retrievable units.', {
    whyItMatters: 'Bad chunking is the single biggest source of retrieval quality loss.',
    tradeoffs: ['Small chunks = precision; large chunks = context'],
    commonMistakes: ['Fixed-size chunking that cuts mid-sentence; ignoring semantic boundaries.'],
  }),
  conceptNode('genai-embeddings', 'Embeddings', D, 'genai-rag', 'Dense vector representations of text/images/code.', {
    whyItMatters: 'Define the semantic geometry of your retrieval system.',
    relatedIds: ['vector-engines', 'fm-embedding-drift'],
  }),
  conceptNode('genai-reranking', 'Reranking', D, 'genai-rag', 'Re-score top-k retrieved candidates with a heavier model.', {
    whyItMatters: 'Often the biggest quality lift after first-pass retrieval.',
    relatedIds: ['metric-retrieval-precision'],
  }),
  conceptNode('genai-hybrid-search', 'Hybrid search', D, 'genai-rag', 'Combine BM25 keyword + vector similarity.', {
    whyItMatters: 'Almost always beats vector alone, especially for code, IDs, names.',
    relatedIds: ['to-vector-keyword-hybrid'],
  }),
  conceptNode('genai-context-window-rag', 'Citations & grounding', D, 'genai-rag', 'Require the model to cite retrieved passages.', {
    whyItMatters: 'Cuts hallucination and gives users a way to verify.',
    relatedIds: ['metric-faithfulness'],
  }),

  conceptNode('genai-tool-use', 'Tool use', D, 'genai-agents', 'Model calls registered tools (search, DB, API) to perform actions.', {
    whyItMatters: 'Lets agents do things, not just talk.',
    failureModes: ['Tool misuse via prompt injection; tool-call loops; cost explosions.'],
    relatedIds: ['fm-prompt-injection'],
  }),
  conceptNode('genai-react', 'ReAct loop', D, 'genai-agents', 'Reason → Act → Observe cycle until done.', {
    whyItMatters: 'Default agent loop; needs strict step limits and budget caps.',
  }),
  conceptNode('genai-multi-agent', 'Multi-agent systems', D, 'genai-agents', 'Multiple LLM agents with roles (planner, executor, critic).', {
    whyItMatters: 'Useful for complex tasks; non-determinism multiplies; evaluations get harder.',
  }),

  conceptNode('genai-eval-suites', 'Eval suites', D, 'genai-eval', 'Curated scenarios with grading prompts and expected outputs.', {
    whyItMatters: 'Lets you compare models and detect regressions.',
    relatedIds: ['llm-eval'],
  }),
  conceptNode('genai-llm-as-judge', 'LLM-as-judge', D, 'genai-eval', 'Use a strong model to grade outputs against a rubric.', {
    whyItMatters: 'Scales evals beyond what humans can do; needs calibration.',
    failureModes: ['Self-preference bias; rubric drift; single-judge variance.'],
  }),
  conceptNode('genai-ragas', 'Faithfulness & answer relevance', D, 'genai-eval', 'Metrics measuring whether the answer is grounded and relevant.', {
    whyItMatters: 'The two halves of RAG quality.',
    relatedIds: ['metric-faithfulness'],
  }),

  conceptNode('genai-prompt-injection', 'Prompt injection', D, 'genai-security', 'Untrusted text overrides instructions; direct or indirect (via retrieved content).', {
    whyItMatters: 'OWASP top-tier risk for LLM apps. No fully solved defense.',
    useCases: ['Don\'t mix instructions and data', 'Privilege separation for tools', 'Output policy LLMs'],
    relatedIds: ['fm-prompt-injection'],
  }),
  conceptNode('genai-pii', 'PII redaction', D, 'genai-security', 'Detect and redact personal info from prompts and outputs.', {
    whyItMatters: 'Compliance and privacy obligation; hard to retrofit.',
  }),
  conceptNode('genai-policy-llm', 'Policy LLM / classifier', D, 'genai-security', 'Lightweight model that filters inputs and outputs against policy.', {
    whyItMatters: 'Practical layer between raw model and product.',
  }),
];
