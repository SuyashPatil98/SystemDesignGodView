import { domainNode, subNode, conceptNode } from './_helpers';
import type { GNode } from '../schema';

const D = 'observability';

export const observabilityNodes: GNode[] = [
  domainNode(
    D,
    'Observability',
    'The ability to ask new questions about your system without shipping new code — via logs, metrics, traces, and (now) eval signals.',
    'You cannot operate or improve a system you can\'t see. Observability is where every incident is won or lost.',
    'Three pillars: metrics tell you what is happening, traces tell you where, logs tell you why.',
  ),

  subNode(D, 'Metrics', D, 'Time-series numbers with labels — RED, USE, business KPIs.', 'The base layer of monitoring and alerting.', { id: 'observ-metrics' }),
  subNode(D, 'Logs', D, 'Structured event records with timestamps and context.', 'The "why" of incidents lives in logs.', { id: 'observ-logs' }),
  subNode(D, 'Traces', D, 'End-to-end request flows across services.', 'The only honest way to debug latency in microservices.', { id: 'observ-traces' }),
  subNode(D, 'Reliability', D, 'SLOs, SLIs, error budgets, MTTR/MTTD.', 'The language SRE uses to talk to product.', { id: 'observ-reliability' }),
  subNode(D, 'Alerting', D, 'Routing important signals to humans without burning them out.', 'Bad alerting causes outages; good alerting prevents them.', { id: 'observ-alerting' }),
  subNode(D, 'Blind spots', D, 'Critical paths you forgot to instrument.', 'The first lesson of every postmortem.', { id: 'observ-blind' }),

  conceptNode('observ-red', 'RED method', D, 'observ-metrics', 'Rate, Errors, Duration — three signals every service should emit.', {
    whyItMatters: 'Minimal, opinionated starting point that catches most issues.',
    interviewRelevance: 5,
  }),
  conceptNode('observ-use', 'USE method', D, 'observ-metrics', 'Utilization, Saturation, Errors — resource-level diagnostics.', {
    whyItMatters: 'Complement to RED — diagnoses infrastructure, not user impact.',
  }),
  conceptNode('observ-cardinality', 'Cardinality control', D, 'observ-metrics', 'Number of unique label combinations on a time series.', {
    whyItMatters: 'High cardinality (user_id labels) breaks Prometheus and TSDBs.',
    failureModes: ['Cardinality explosions OOM the TSDB.'],
  }),
  conceptNode('observ-percentiles', 'Percentiles vs averages', D, 'observ-metrics', 'Latency must be reported as percentiles, never as averages.', {
    whyItMatters: 'Averages hide the tail experience that defines user-perceived performance.',
  }),

  conceptNode('observ-structured-logs', 'Structured logging', D, 'observ-logs', 'JSON logs with trace and span IDs, request IDs, user IDs.', {
    whyItMatters: 'The difference between "grep through 100GB" and "query".',
  }),
  conceptNode('observ-sampling', 'Sampling logs and traces', D, 'observ-traces', 'Head-based, tail-based, or adaptive sampling.', {
    whyItMatters: 'You can\'t store everything; sample wisely so you keep the interesting tail.',
  }),
  conceptNode('observ-context-prop', 'Context propagation', D, 'observ-traces', 'Pass trace IDs across service, queue, and async boundaries.', {
    whyItMatters: 'Without it, traces are fragmented and useless.',
    failureModes: ['Async boundaries silently drop context.'],
    relatedIds: ['fm-observability-blind'],
  }),
  conceptNode('observ-w3c-trace', 'W3C trace context', D, 'observ-traces', 'Standard headers (traceparent, tracestate) for cross-vendor compatibility.', {
    whyItMatters: 'Lets you mix vendors without losing trace continuity.',
  }),

  conceptNode('observ-slo', 'Service Level Objectives (SLOs)', D, 'observ-reliability', 'Target for an SLI over a window, e.g., 99.9% requests < 300ms over 30 days.', {
    whyItMatters: 'Concrete, measurable promise; basis for error budgets.',
    relatedIds: ['metric-slo', 'metric-sli', 'metric-sla'],
    interviewRelevance: 5,
  }),
  conceptNode('observ-error-budget', 'Error budgets', D, 'observ-reliability', 'Allowed unreliability (1 - SLO) in a window — spend it on velocity.', {
    whyItMatters: 'Resolves "more reliability vs more features" politically.',
  }),
  conceptNode('observ-burn-rate', 'Burn-rate alerts', D, 'observ-reliability', 'Alert when error budget is consumed faster than the SLO\'s long-term allowance.', {
    whyItMatters: 'Fast, low-noise alerts that beat threshold-on-raw-error.',
  }),

  conceptNode('observ-runbook', 'Runbooks', D, 'observ-alerting', 'Step-by-step procedures for known alert classes.', {
    whyItMatters: 'Cuts MTTR; the cheapest reliability investment.',
  }),
  conceptNode('observ-alert-fatigue', 'Alert fatigue', D, 'observ-alerting', 'Too many alerts make oncall ignore them.', {
    whyItMatters: 'You will lose a real incident because nobody believed the alert.',
  }),
];
