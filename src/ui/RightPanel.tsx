import { useState } from 'react';
import { X, Brain, Workflow, AlertTriangle, Gauge, Wrench, GitBranch, BookOpen, Lightbulb, ChevronRight, Crown, Sparkles, Focus, ChevronDown, ChevronUp, Link2, ExternalLink, Globe, FileText, Github, Youtube, Book, Search, GitCompare } from 'lucide-react';
import { googleFallback } from '../data/resources';
import { shareableUrl } from '../lib/urlState';
import type { ResourceLink } from '../data/schema';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPanel from './primitives/GlassPanel';
import Section from './primitives/Section';
import Chip from './primitives/Chip';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode, Domain } from '../data/schema';
import { domainColor } from '../three/layout';

interface Props {
  nodes: Map<string, GNode>;
  domains: Map<string, Domain>;
  breadcrumbs: GNode[];
  onSelect: (id: string) => void;
}

const difficultyColor: Record<string, any> = {
  beginner: 'emerald',
  intermediate: 'cyan',
  advanced: 'violet',
  expert: 'rose',
};

const RESOURCE_ICON: Record<ResourceLink['kind'], any> = {
  wikipedia: Globe,
  docs: FileText,
  paper: FileText,
  video: Youtube,
  blog: ExternalLink,
  book: Book,
  github: Github,
  search: Search,
};

function ResourceRow({ link }: { link: ResourceLink }) {
  const Icon = RESOURCE_ICON[link.kind] ?? ExternalLink;
  return (
    <li>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-1.5 text-[12px] text-slate-200 hover:border-cyan-300/30 hover:bg-cyan-500/[0.05]"
      >
        <Icon size={12} className="mt-0.5 shrink-0 text-cyan-300" />
        <div className="min-w-0 flex-1">
          <div className="truncate group-hover:text-cyan-100">{link.label}</div>
          <div className="truncate text-[9px] uppercase tracking-wider text-slate-500">
            {link.kind}
          </div>
        </div>
        <ExternalLink size={10} className="mt-1 shrink-0 text-slate-500 group-hover:text-cyan-300" />
      </a>
    </li>
  );
}

export default function RightPanel({
  nodes,
  domains,
  breadcrumbs,
  onSelect,
}: Props) {
  const selectedId = useGraphStore((s) => s.selectedId);
  const select = useGraphStore((s) => s.select);
  const conquered = useGraphStore((s) => s.conquered);
  const toggleConquered = useGraphStore((s) => s.toggleConquered);
  const focusedSubtreeId = useGraphStore((s) => s.focusedSubtreeId);
  const setFocusedSubtree = useGraphStore((s) => s.setFocusedSubtree);
  const expandedDomainIds = useGraphStore((s) => s.expandedDomainIds);
  const expandedSubdomainIds = useGraphStore((s) => s.expandedSubdomainIds);
  const toggleDomainExpanded = useGraphStore((s) => s.toggleDomainExpanded);
  const toggleSubdomainExpanded = useGraphStore((s) => s.toggleSubdomainExpanded);
  const compareA = useGraphStore((s) => s.compareA);
  const compareB = useGraphStore((s) => s.compareB);
  const addToCompare = useGraphStore((s) => s.addToCompare);
  const mode = useGraphStore((s) => s.mode);
  const activePathId = useGraphStore((s) => s.activePathId);
  const [copied, setCopied] = useState(false);

  const node = selectedId ? nodes.get(selectedId) : null;
  const domain = node ? domains.get(node.domainId) : null;
  const isConq = node ? conquered.has(node.id) : false;
  const accent = node ? domainColor(node.domainId) : '#22d3ee';

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto absolute z-10
            left-3 right-3 bottom-3 max-h-[70vh]
            sm:left-auto sm:right-5 sm:top-[78px] sm:bottom-5 sm:max-h-none sm:w-[400px]"
        >
          <GlassPanel className="flex h-full flex-col">
            {/* Header */}
            <div
              className="relative border-b border-white/5 px-5 pb-4 pt-4"
              style={{
                background: `linear-gradient(180deg, ${accent}18 0%, transparent 100%)`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {breadcrumbs.slice(0, -1).map((b) => (
                      <span key={b.id} className="flex items-center gap-1">
                        <button
                          onClick={() => select(b.id)}
                          className="hover:text-cyan-300"
                        >
                          {b.name}
                        </button>
                        <ChevronRight size={10} />
                      </span>
                    ))}
                    {breadcrumbs.length === 1 && <span>{node.kind}</span>}
                  </div>
                  <h2
                    className="mt-1 text-xl font-semibold leading-tight text-white"
                    style={{ textShadow: `0 0 16px ${accent}66` }}
                  >
                    {node.name}
                  </h2>
                  {domain && (
                    <div
                      className="mt-1 inline-flex items-center gap-1.5 text-[11px]"
                      style={{ color: accent }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                      />
                      {domain.name} · {node.kind}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => select(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action row: Expand/Collapse + Focus */}
              <div className="mt-3 flex gap-2">
                {(node.kind === 'domain' || node.kind === 'subdomain') && (
                  <button
                    onClick={() => {
                      if (node.kind === 'domain') toggleDomainExpanded(node.id);
                      else toggleSubdomainExpanded(node.id);
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                      (node.kind === 'domain'
                        ? expandedDomainIds.has(node.id)
                        : expandedSubdomainIds.has(node.id))
                        ? 'border-violet-300/60 bg-violet-500/15 text-violet-100'
                        : 'border-white/15 bg-white/[0.03] text-slate-200 hover:border-violet-300/40 hover:text-violet-100 hover:bg-violet-500/[0.07]'
                    }`}
                  >
                    {(node.kind === 'domain'
                      ? expandedDomainIds.has(node.id)
                      : expandedSubdomainIds.has(node.id)) ? (
                      <>
                        <ChevronUp size={13} /> Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown size={13} /> Expand children
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() =>
                    setFocusedSubtree(
                      focusedSubtreeId === node.id ? null : node.id,
                    )
                  }
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                    focusedSubtreeId === node.id
                      ? 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                      : 'border-white/15 bg-white/[0.03] text-slate-200 hover:border-cyan-300/40 hover:text-cyan-100 hover:bg-cyan-500/[0.07]'
                  }`}
                >
                  <Focus size={13} />
                  {focusedSubtreeId === node.id ? 'Focused' : 'Isolate'}
                </button>
              </div>

              {/* Secondary actions: compare + share link */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => addToCompare(node.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                    compareA === node.id || compareB === node.id
                      ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-100'
                      : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-emerald-300/40 hover:text-emerald-100'
                  }`}
                  title="Pick this node to compare. Pick a second node to open the compare panel."
                >
                  <GitCompare size={11} />
                  {compareA === node.id
                    ? 'A: this node'
                    : compareB === node.id
                    ? 'B: this node'
                    : !compareA
                    ? 'Compare A'
                    : 'Compare B'}
                </button>
                <button
                  onClick={async () => {
                    const url = shareableUrl({
                      selectedId: node.id,
                      mode,
                      activePathId,
                    });
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    } catch {}
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
                  title="Copy a deep link to this node"
                >
                  <Link2 size={11} />
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>

              {/* Conquer button */}
              <button
                onClick={() => toggleConquered(node.id)}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
                  isConq
                    ? 'border-amber-300/60 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-yellow-500/20 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
                    : 'border-white/15 bg-white/[0.03] text-slate-200 hover:border-amber-300/40 hover:text-amber-100 hover:bg-amber-500/[0.07]'
                }`}
              >
                {isConq ? (
                  <>
                    <Crown size={14} className="text-amber-300" /> Conquered — click to unmark
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Mark this concept as conquered
                  </>
                )}
              </button>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip tone={difficultyColor[node.difficulty]} active>
                  {node.difficulty}
                </Chip>
                <Chip tone="slate" active>
                  {node.layer}
                </Chip>
                {node.interviewRelevance && (
                  <Chip tone="cyan" active>
                    interview · {node.interviewRelevance}/5
                  </Chip>
                )}
                {node.productionRelevance && (
                  <Chip tone="violet" active>
                    production · {node.productionRelevance}/5
                  </Chip>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-1 overflow-y-auto px-5 py-2">
              <p className="py-3 text-sm leading-relaxed text-slate-200">
                {node.shortExplanation}
              </p>

              {node.whyItMatters && (
                <Section title="Why it matters">
                  <p className="leading-relaxed">{node.whyItMatters}</p>
                </Section>
              )}

              {node.mentalModel && (
                <Section title="Mental model" tone="good">
                  <div className="flex gap-2">
                    <Brain size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    <p className="leading-relaxed italic text-slate-300">
                      {node.mentalModel}
                    </p>
                  </div>
                </Section>
              )}

              {node.whereItAppears && node.whereItAppears.length > 0 && (
                <Section title="Where it appears" count={node.whereItAppears.length}>
                  <ul className="space-y-1 text-[13px]">
                    {node.whereItAppears.map((u, i) => (
                      <li key={i} className="flex gap-2">
                        <Workflow size={12} className="mt-1 shrink-0 text-cyan-300" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {node.useCases && node.useCases.length > 0 && (
                <Section title="Use cases" count={node.useCases.length}>
                  <ul className="space-y-1 text-[13px]">
                    {node.useCases.map((u, i) => (
                      <li key={i} className="list-disc pl-3 marker:text-cyan-300/60">{u}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {node.tradeoffs && node.tradeoffs.length > 0 && (
                <Section title="Tradeoffs" count={node.tradeoffs.length}>
                  <ul className="space-y-1 text-[13px]">
                    {node.tradeoffs.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <GitBranch size={12} className="mt-1 shrink-0 text-rose-300" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {node.failureModes && node.failureModes.length > 0 && (
                <Section title="Failure modes" tone="warn" count={node.failureModes.length}>
                  <ul className="space-y-1 text-[13px]">
                    {node.failureModes.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <AlertTriangle size={12} className="mt-1 shrink-0 text-amber-300" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {node.metricsToMonitor && node.metricsToMonitor.length > 0 && (
                <Section title="Metrics to monitor" count={node.metricsToMonitor.length}>
                  <ul className="space-y-1 text-[13px]">
                    {node.metricsToMonitor.map((m, i) => (
                      <li key={i} className="flex gap-2">
                        <Gauge size={12} className="mt-1 shrink-0 text-cyan-300" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {(node.interviewFraming || node.productionFraming) && (
                <Section title="Framing">
                  {node.interviewFraming && (
                    <div className="mb-2 rounded-lg border border-cyan-300/20 bg-cyan-500/[0.06] p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                        <BookOpen size={11} /> Interview
                      </div>
                      <p className="leading-relaxed">{node.interviewFraming}</p>
                    </div>
                  )}
                  {node.productionFraming && (
                    <div className="rounded-lg border border-violet-300/20 bg-violet-500/[0.06] p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                        <Lightbulb size={11} /> Production
                      </div>
                      <p className="leading-relaxed">{node.productionFraming}</p>
                    </div>
                  )}
                </Section>
              )}

              {node.relatedIds && node.relatedIds.length > 0 && (
                <Section title="Related concepts" count={node.relatedIds.length}>
                  <div className="flex flex-wrap gap-1.5">
                    {node.relatedIds.map((rid) => {
                      const r = nodes.get(rid);
                      if (!r) return null;
                      return (
                        <Chip key={rid} onClick={() => onSelect(rid)}>
                          {r.name}
                        </Chip>
                      );
                    })}
                  </div>
                </Section>
              )}

              {node.toolIds && node.toolIds.length > 0 && (
                <Section title="Tools" count={node.toolIds.length}>
                  <div className="flex flex-wrap gap-1.5">
                    {node.toolIds.map((tid) => {
                      const t = nodes.get(tid);
                      if (!t) return null;
                      return (
                        <Chip key={tid} tone="emerald" onClick={() => onSelect(tid)}>
                          <Wrench size={10} />
                          {t.name}
                        </Chip>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Resources — always shown; curated links first, Google fallback last */}
              <Section title="Resources" defaultOpen={true} count={(node.resources?.length ?? 0) + 1}>
                <ul className="space-y-1.5">
                  {(node.resources ?? []).map((r, i) => (
                    <ResourceRow key={i} link={r} />
                  ))}
                  <ResourceRow
                    link={googleFallback(node.name, domain?.name)}
                  />
                </ul>
              </Section>

              {node.tags && node.tags.length > 0 && (
                <Section title="Tags" defaultOpen={false}>
                  <div className="flex flex-wrap gap-1">
                    {node.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
