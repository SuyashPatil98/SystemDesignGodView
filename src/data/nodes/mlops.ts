import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'mlops';

export const mlopsNodes: GNode[] = [
  domainNode(
    D,
    'MLOps',
    'CI/CD for models and data: reproducibility, deployment, monitoring, drift, rollback.',
    'A model in a notebook is not a product. MLOps is what turns research output into a system that survives production traffic, data shifts, and time.',
    'Treat models like services: version them, deploy them, observe them, and make rollback a one-click operation.',
  ),

  subNode(D, 'Experimentation & tracking', D, 'Tracking runs, params, metrics, artifacts.', 'Reproducibility starts with knowing what you did.', { id: 'mlops-experiments' }),
  subNode(D, 'Data versioning', D, 'Versioning datasets and lineage from raw → training.', 'Without it, you can\'t reproduce a model from a year ago.', { id: 'mlops-data' }),
  subNode(D, 'Feature engineering', D, 'Designing and engineering features used across models.', 'Most of an ML system\'s value is in features; treat them like code.', { id: 'mlops-features' }),
  subNode(D, 'Model registry', D, 'Versioned store of trained models with promotion stages.', 'The source of truth for "what\'s in production right now".', { id: 'mlops-registry' }),
  subNode(D, 'Training pipelines', D, 'Reproducible orchestrated training and retraining jobs.', 'Lets you retrain on schedule or trigger without manual heroics.', { id: 'mlops-pipelines' }),
  subNode(D, 'Serving', D, 'Online and batch inference with SLOs, scaling, and canaries.', 'Where models meet users — and where most production pain lives.', { id: 'mlops-serving' }),
  subNode(D, 'Monitoring', D, 'Live performance, drift, and quality monitoring.', 'A model is a depreciating asset; you must watch it.', { id: 'mlops-monitoring' }),
  subNode(D, 'Governance', D, 'Approval, audit, fairness, regulation.', 'Especially mandatory in finance, healthcare, and the EU AI Act era.', { id: 'mlops-governance' }),

  conceptNode('mlops-feature-store', 'Feature store', D, 'mlops-features', 'Unified registry + online + offline stores for features used by models.', {
    whyItMatters: 'Eliminates train/serve skew and enables reuse across teams.',
    relatedIds: ['pat-feature-store-arch', 'fm-training-serving-skew', 'tool-feast'],
    interviewRelevance: 5,
    productionRelevance: 5,
  }),
  conceptNode('mlops-online-store', 'Online feature store', D, 'mlops-features', 'Low-latency store (Redis/DynamoDB) for serving features at request time.', {
    whyItMatters: 'Sets the latency floor for online inference.',
    tradeoffs: ['Cost vs latency vs freshness'],
  }),
  conceptNode('mlops-offline-store', 'Offline feature store', D, 'mlops-features', 'Historical features for training, with point-in-time correctness.', {
    whyItMatters: 'Point-in-time joins prevent label leakage and inflated metrics.',
    relatedIds: ['fm-data-leakage'],
  }),
  conceptNode('mlops-pit', 'Point-in-time joins', D, 'mlops-features', 'Joining features as they were at each training event timestamp.', {
    whyItMatters: 'The boring detail that prevents the most common silent leak in ML.',
    failureModes: ['Using future-looking features inflates offline metrics, then crashes online.'],
  }),

  conceptNode('mlops-registry-stages', 'Promotion stages', D, 'mlops-registry', 'Models flow through staging → production with approvals.', {
    whyItMatters: 'Gives you a clear lineage of which version was live when, and lets you roll back.',
    relatedIds: ['tool-mlflow'],
  }),
  conceptNode('mlops-shadow', 'Shadow deployment', D, 'mlops-serving', 'Route a copy of production traffic to a new model without using its responses.', {
    whyItMatters: 'Surfaces production-only issues (latency, schema, drift) before real exposure.',
    relatedIds: ['pat-model-serving'],
  }),
  conceptNode('mlops-canary', 'Canary deployment', D, 'mlops-serving', 'Route a small % of traffic to the new model; widen if metrics hold.', {
    whyItMatters: 'Limits blast radius of a regression to a small slice.',
    relatedIds: ['cicd-deploy-strategies'],
  }),
  conceptNode('mlops-ab-test', 'Online A/B testing', D, 'mlops-serving', 'Randomized assignment of users to model variants with business-metric measurement.', {
    whyItMatters: 'The only way to measure real-world business impact.',
    failureModes: ['Sample ratio mismatch; peeking; novelty effects.'],
  }),
  conceptNode('mlops-batching', 'Request batching', D, 'mlops-serving', 'Group requests within a small window to amortize GPU forward passes.', {
    whyItMatters: 'Often a 3-10x throughput win on GPU serving at minimal latency cost.',
  }),
  conceptNode('mlops-quantization', 'Quantization', D, 'mlops-serving', 'Use 8-bit or 4-bit weights/activations to fit bigger models in less memory.', {
    whyItMatters: 'Massively cheaper inference; small quality cost on most tasks.',
  }),

  conceptNode('mlops-drift', 'Drift detection', D, 'mlops-monitoring', 'Statistical tests on feature/prediction distributions vs reference.', {
    whyItMatters: 'Early warning that the model\'s assumptions have aged out.',
    relatedIds: ['metric-drift', 'fm-model-drift'],
  }),
  conceptNode('mlops-monitoring-business', 'Business-metric monitoring', D, 'mlops-monitoring', 'Track model\'s impact on the actual business KPI, not just offline metrics.', {
    whyItMatters: 'Offline AUC means nothing if conversion drops.',
  }),
  conceptNode('mlops-rollback', 'Automated rollback', D, 'mlops-serving', 'Trigger rollback on metric burn (latency, error rate, business KPI).', {
    whyItMatters: 'Cuts MTTR from hours to seconds.',
  }),

  conceptNode('mlops-data-versioning', 'Data versioning', D, 'mlops-data', 'Snapshot datasets so a model can be retrained identically.', {
    whyItMatters: 'Without it, "I retrained and the numbers are different" has no debug path.',
    relatedIds: ['tool-dvc'],
  }),
  conceptNode('mlops-data-lineage', 'Lineage', D, 'mlops-data', 'Tracking which raw data → which feature → which model version.', {
    whyItMatters: 'Required for audits and for root-causing a quality regression.',
  }),

  conceptNode('mlops-retraining', 'Retraining triggers', D, 'mlops-pipelines', 'Schedule vs drift-triggered vs performance-triggered retraining.', {
    whyItMatters: 'Smart triggers save GPU time and avoid retraining on bad data.',
  }),
  conceptNode('mlops-cicd-models', 'CI/CD for models', D, 'mlops-pipelines', 'Tests on data and model artifacts as part of pipeline gates.', {
    whyItMatters: 'Catches schema drift, leakage, and metric regressions before deploy.',
    relatedIds: ['cicd-pipelines'],
  }),
];
