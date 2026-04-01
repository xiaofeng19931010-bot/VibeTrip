'use client';

import type { A2UIAction, A2UIEnvelope, TripPlan } from './types';
import { TripCard } from './trip-components';
import { getVibeConfig } from './vibe-config';

export interface A2UIRenderContext {
  role: string;
  envelope: A2UIEnvelope;
  localValues: Record<string, string>;
  setLocalValue: (name: string, value: string) => void;
  setLocalFile: (name: string, file: File) => void;
  submitAction: (action: A2UIAction) => void;
}

type Renderer = (node: A2UIEnvelope['view'], key: string, context: A2UIRenderContext) => JSX.Element | null;

function toTripPlan(envelope: A2UIEnvelope, role: string): TripPlan | null {
  const data = envelope.view.props?.plan;
  if (!data || typeof data !== 'object') return null;
  const plan = data as Record<string, unknown>;
  if (!Array.isArray(plan.itinerary)) return null;

  return {
    tripId: typeof plan.tripId === 'string' ? plan.tripId : undefined,
    destination: typeof plan.destination === 'string' ? plan.destination : '未命名行程',
    days: typeof plan.days === 'number' ? plan.days : plan.itinerary.length,
    role: role as TripPlan['role'],
    itinerary: plan.itinerary as TripPlan['itinerary'],
  };
}

const renderStack: Renderer = (node, key, context) => (
  <div key={key} className="flex flex-col gap-4">
    {node.children?.map((child: A2UIEnvelope['view'], index: number) => renderA2UINode(child, `${key}-${index}`, context))}
  </div>
);

const renderGrid: Renderer = (node, key, context) => (
  <div key={key} className="grid gap-4 md:grid-cols-2">
    {node.children?.map((child: A2UIEnvelope['view'], index: number) => renderA2UINode(child, `${key}-${index}`, context))}
  </div>
);

const renderMessage: Renderer = (node, key, context) => {
  const vibe = getVibeConfig(context.role);
  return (
    <div
      key={key}
      className="rounded-2xl px-4 py-3 shadow-sm"
      style={{
        background: 'rgba(255,255,255,0.85)',
        color: vibe.theme.textColor,
      }}
    >
      {typeof node.props?.content === 'string' ? node.props.content : ''}
    </div>
  );
};

const renderCard: Renderer = (node, key, context) => {
  const vibe = getVibeConfig(context.role);
  return (
    <div
      key={key}
      className="rounded-3xl border p-5 shadow-sm"
      style={{
        background: 'rgba(255,255,255,0.9)',
        borderColor: `${vibe.theme.primaryColor}25`,
      }}
    >
      {typeof node.props?.title === 'string' && (
        <h3
          className="mb-2 text-lg font-semibold"
          style={{ color: vibe.theme.primaryColor, fontFamily: vibe.theme.fontDisplay }}
        >
          {node.props.title}
        </h3>
      )}
      {typeof node.props?.description === 'string' && (
        <p className="text-sm" style={{ color: vibe.theme.textColor }}>
          {node.props.description}
        </p>
      )}
      {node.children?.length ? (
        <div className="mt-3 flex flex-col gap-3">
          {node.children.map((child: A2UIEnvelope['view'], index: number) => renderA2UINode(child, `${key}-${index}`, context))}
        </div>
      ) : null}
    </div>
  );
};

const renderInput: Renderer = (node, key, context) => {
  const vibe = getVibeConfig(context.role);
  const name = typeof node.props?.name === 'string' ? node.props.name : 'value';
  return (
    <label key={key} className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: vibe.theme.textColor }}>
        {typeof node.props?.label === 'string' ? node.props.label : '请输入'}
      </span>
      <input
        className="rounded-xl border px-4 py-3 outline-none"
        style={{ borderColor: `${vibe.theme.primaryColor}40` }}
        placeholder={typeof node.props?.placeholder === 'string' ? node.props.placeholder : ''}
        value={context.localValues[name] ?? ''}
        onChange={(event) => context.setLocalValue(name, event.target.value)}
      />
    </label>
  );
};

const renderSelect: Renderer = (node, key, context) => {
  const vibe = getVibeConfig(context.role);
  const name = typeof node.props?.name === 'string' ? node.props.name : 'value';
  const options = Array.isArray(node.props?.options) ? node.props.options : [];

  return (
    <label key={key} className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: vibe.theme.textColor }}>
        {typeof node.props?.label === 'string' ? node.props.label : '请选择'}
      </span>
      <select
        className="rounded-xl border px-4 py-3 outline-none"
        style={{ borderColor: `${vibe.theme.primaryColor}40` }}
        value={context.localValues[name] ?? ''}
        onChange={(event) => context.setLocalValue(name, event.target.value)}
      >
        <option value="">请选择</option>
        {options.map((option, index) => {
          const normalized = typeof option === 'string'
            ? { label: option, value: option }
            : {
                label: typeof option === 'object' && option && 'label' in option ? String(option.label) : `选项 ${index + 1}`,
                value: typeof option === 'object' && option && 'value' in option ? String(option.value) : '',
              };

          return (
            <option key={`${name}-${normalized.value}-${index}`} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
};

const renderStatus: Renderer = (node, key) => (
  <div
    key={key}
    className="rounded-2xl px-4 py-3"
    style={{
      background: 'rgba(240, 253, 244, 0.95)',
      color: '#166534',
    }}
  >
    {typeof node.props?.title === 'string' && <div className="font-semibold">{node.props.title}</div>}
    {typeof node.props?.description === 'string' && <div className="mt-1 text-sm">{node.props.description}</div>}
  </div>
);

const renderError: Renderer = (node, key) => (
  <div
    key={key}
    className="rounded-2xl px-4 py-3"
    style={{
      background: 'rgba(255, 235, 238, 0.95)',
      color: '#b91c1c',
    }}
  >
    {typeof node.props?.title === 'string' && <div className="font-semibold">{node.props.title}</div>}
    {typeof node.props?.description === 'string' && <div className="mt-1 text-sm">{node.props.description}</div>}
  </div>
);

const renderItineraryCard: Renderer = (node, key, context) => {
  const plan = toTripPlan(
    {
      ...context.envelope,
      view: node,
    },
    context.role,
  );

  return plan ? (
    <div key={key}>
      <TripCard plan={plan} />
    </div>
  ) : null;
};

const renderUpload: Renderer = (node, key, context) => {
  const vibe = getVibeConfig(context.role);
  const name = typeof node.props?.name === 'string' ? node.props.name : 'file_name';
  return (
    <label
      key={key}
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed px-4 py-6 text-sm"
      style={{ borderColor: `${vibe.theme.primaryColor}40`, color: vibe.theme.textColor }}
    >
      <span>{typeof node.props?.description === 'string' ? node.props.description : '请上传文件'}</span>
      <input
        type="file"
        className="text-sm"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            context.setLocalValue(name, file.name);
            context.setLocalFile(name, file);
          }
        }}
      />
      {context.localValues[name] ? <span className="text-xs opacity-80">已选择：{context.localValues[name]}</span> : null}
    </label>
  );
};

const renderButtonGroup: Renderer = (node, key, context) => {
  const vibe = getVibeConfig(context.role);
  const actionIds = Array.isArray(node.props?.actionIds) ? node.props.actionIds.map(String) : [];
  const actions = actionIds.length > 0
    ? context.envelope.actions.filter((action) => actionIds.includes(action.id))
    : context.envelope.actions;

  return (
    <div key={key} className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled}
          onClick={() => context.submitAction(action)}
          className="rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})`,
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

const registry: Partial<Record<A2UIEnvelope['view']['type'], Renderer>> = {
  stack: renderStack,
  grid: renderGrid,
  message: renderMessage,
  card: renderCard,
  'choice-card': renderCard,
  'button-group': renderButtonGroup,
  input: renderInput,
  select: renderSelect,
  status: renderStatus,
  error: renderError,
  'itinerary-card': renderItineraryCard,
  upload: renderUpload,
};

export function renderA2UINode(node: A2UIEnvelope['view'], key: string, context: A2UIRenderContext) {
  const renderer = registry[node.type];
  return renderer ? renderer(node, key, context) : null;
}
