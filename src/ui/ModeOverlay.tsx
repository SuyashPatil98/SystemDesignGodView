import { useEffect, useMemo, useState } from 'react';
import { X, ArrowRight, ChevronRight, Boxes, Network, Sparkles } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode, LearningPath, ProjectIdea, Tradeoff } from '../data/schema';

interface Props {
  paths: LearningPath[];
  projects: ProjectIdea[];
  tradeoffs: Tradeoff[];
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
}

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

export default function ModeOverlay({ paths, projects, tradeoffs, nodes, onSelect }: Props) {
  const mode = useGraphStore((s) => s.mode);
  const activePathId = useGraphStore((s) => s.activePathId);
  const activeProjectId = useGraphStore((s) => s.activeProjectId);
  const activeTradeoffId = useGraphStore((s) => s.activeTradeoffId);
  const setActivePath = useGraphStore((s) => s.setActivePath);
  const setActiveProject = useGraphStore((s) => s.setActiveProject);
  const setActiveTradeoff = useGraphStore((s) => s.setActiveTradeoff);

  const activePath = useMemo(
    () => paths.find((p) => p.id === activePathId) ?? null,
    [paths, activePathId],
  );
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );
  const activeTradeoff = useMemo(
    () => tradeoffs.find((t) => t.id === activeTradeoffId) ?? null,
    [tradeoffs, activeTradeoffId],
  );

  const visible = !!(
    (mode === 'learning-path' && activePath) ||
    (mode === 'project' && activeProject) ||
    (mode === 'tradeoff' && activeTradeoff)
  );

  // CSS fade + slide
  const [mounted, setMounted] = useState(visible);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => setOpen(true));
    } else if (mounted) {
      setOpen(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-auto absolute bottom-5 left-1/2 z-10 w-[min(960px,82vw)] -translate-x-1/2"
      style={{
        opacity: open ? 1 : 0,
        transform: `translate(-50%, ${open ? '0' : '12px'})`,
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}
    >
      <div
        className="px-5 py-4 bg-black"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {mode === 'learning-path' && activePath && (
          <PathOverlay
            path={activePath}
            nodes={nodes}
            onSelect={onSelect}
            onClose={() => setActivePath(null)}
          />
        )}
        {mode === 'project' && activeProject && (
          <ProjectOverlay
            project={activeProject}
            nodes={nodes}
            onSelect={onSelect}
            onClose={() => setActiveProject(null)}
          />
        )}
        {mode === 'tradeoff' && activeTradeoff && (
          <TradeoffOverlay
            tradeoff={activeTradeoff}
            onClose={() => setActiveTradeoff(null)}
          />
        )}
      </div>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="text-white/50 hover:text-white"
      style={{ background: 'transparent', cursor: 'pointer' }}
    >
      <X size={16} />
    </button>
  );
}

function EyebrowRow({
  label,
  icon: Icon,
}: {
  label: string;
  icon: any;
}) {
  return (
    <div
      className="flex items-center gap-2 font-mono uppercase"
      style={{
        fontSize: 10,
        letterSpacing: '0.22em',
        color: ACCENT,
      }}
    >
      <Icon size={12} />
      {label}
    </div>
  );
}

function PathOverlay({
  path,
  nodes,
  onSelect,
  onClose,
}: {
  path: LearningPath;
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <EyebrowRow label="Learning path" icon={Sparkles} />
          <h3
            className="mt-1 font-serif text-white"
            style={{ fontSize: 22, letterSpacing: '0.005em' }}
          >
            {path.name}
          </h3>
          <p
            className="mt-1 max-w-3xl font-serif italic text-white/60"
            style={{ fontSize: 13 }}
          >
            {path.description}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {path.nodeIds.map((id, i) => {
          const n = nodes.get(id);
          if (!n) return null;
          return (
            <div key={id} className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => onSelect(id)}
                className="group flex w-[180px] flex-col px-3 py-2 text-left transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT_DIM;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  Step {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  className="mt-0.5 truncate font-serif text-white"
                  style={{ fontSize: 13 }}
                >
                  {n.name}
                </div>
                <div
                  className="mt-1 truncate font-mono uppercase"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {n.difficulty} · {n.kind}
                </div>
              </button>
              {i < path.nodeIds.length - 1 && (
                <ArrowRight size={14} className="text-white/30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectOverlay({
  project,
  nodes,
  onSelect,
  onClose,
}: {
  project: ProjectIdea;
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <EyebrowRow label={`Project · ${project.difficulty}`} icon={Boxes} />
          <h3
            className="mt-1 font-serif text-white"
            style={{ fontSize: 22 }}
          >
            {project.name}
          </h3>
          <p
            className="mt-1 max-w-3xl font-serif italic text-white/70"
            style={{ fontSize: 13 }}
          >
            {project.oneLiner}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Column title="Components" items={project.components} />
        <Column title="Tools" items={project.tools} />
        <Column title="Extensions" items={project.extensions} />
        <Column
          title="Design questions"
          items={project.designQuestions}
          italic
        />
      </div>

      <div
        className="mt-4 p-3"
        style={{
          border: `1px solid ${ACCENT_DIM}`,
          background: 'rgba(94,234,183,0.04)',
        }}
      >
        <div
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: ACCENT,
            marginBottom: 4,
          }}
        >
          Why this is not generic
        </div>
        <p className="text-white/80" style={{ fontSize: 12 }}>
          {project.whyNonGeneric}
        </p>
        <div className="mt-2 text-white/55" style={{ fontSize: 11 }}>
          <span className="text-white/80">Resume value: </span>
          {project.resumeValue}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 items-baseline">
        {project.conceptIds.map((id, i, arr) => {
          const n = nodes.get(id);
          if (!n) return null;
          return (
            <span key={id} className="inline-flex items-baseline">
              <button
                onClick={() => onSelect(id)}
                className="font-serif italic text-white/75 hover:text-white"
                style={{
                  fontSize: 13,
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {n.name}
              </button>
              {i < arr.length - 1 && (
                <span className="ml-3 text-white/20">·</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  italic = false,
}: {
  title: string;
  items: string[];
  italic?: boolean;
}) {
  return (
    <div>
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT,
        }}
      >
        {title}
      </div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li
            key={i}
            className={`flex gap-1.5 text-white/70 ${italic ? 'italic font-serif' : ''}`}
            style={{ fontSize: 12 }}
          >
            <ChevronRight
              size={11}
              className="mt-1 shrink-0"
              style={{ color: ACCENT_DIM }}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TradeoffOverlay({
  tradeoff,
  onClose,
}: {
  tradeoff: Tradeoff;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <EyebrowRow label="Tradeoff" icon={Network} />
          <h3 className="mt-1 font-serif text-white" style={{ fontSize: 22 }}>
            {tradeoff.name}
          </h3>
          <p
            className="mt-1 font-serif italic text-white/60"
            style={{ fontSize: 13 }}
          >
            {tradeoff.axis}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </div>

      <div
        className="mt-4 grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(
            tradeoff.options.length,
            4,
          )}, minmax(0, 1fr))`,
        }}
      >
        {tradeoff.options.map((opt, i) => (
          <div
            key={i}
            className="p-3"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="font-serif text-white"
              style={{ fontSize: 14 }}
            >
              {opt.name}
            </div>
            <div
              className="mt-1 font-serif italic text-white/55"
              style={{ fontSize: 11 }}
            >
              {opt.whenToUse}
            </div>
            <BulletList title="Pros" items={opt.pros} />
            <BulletList title="Cons" items={opt.cons} />
            {opt.examples && opt.examples.length > 0 && (
              <div
                className="mt-2 text-white/55"
                style={{ fontSize: 11 }}
              >
                e.g. {opt.examples.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Framing label="Interview framing" body={tradeoff.interviewFraming} />
        <Framing label="Production framing" body={tradeoff.productionFraming} />
      </div>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-2">
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT,
        }}
      >
        {title}
      </div>
      <ul className="mt-1 space-y-0.5">
        {items.map((p, j) => (
          <li
            key={j}
            className="list-disc pl-3 text-white/75"
            style={{ fontSize: 11 }}
          >
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Framing({ label, body }: { label: string; body: string }) {
  return (
    <div
      className="p-3"
      style={{
        border: `1px solid ${ACCENT_DIM}`,
        background: 'rgba(94,234,183,0.04)',
      }}
    >
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <p className="text-white/80" style={{ fontSize: 12 }}>
        {body}
      </p>
    </div>
  );
}
