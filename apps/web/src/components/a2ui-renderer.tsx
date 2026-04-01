'use client';

import { useState } from 'react';
import type { A2UIAction, A2UIEnvelope, A2UIToolResult } from './types';
import { StreamingIndicator } from './trip-components';
import { getVibeConfig } from './vibe-config';
import { renderA2UINode } from './a2ui-registry';

interface A2UIRendererProps {
  envelope: A2UIEnvelope;
  role: string;
  onAction: (result: A2UIToolResult) => Promise<void> | void;
}

function hasInlineActionMount(node: A2UIEnvelope['view']): boolean {
  if (node.type === 'button-group') return true;
  return node.children?.some((child) => hasInlineActionMount(child)) ?? false;
}

export function A2UIRenderer({ envelope, role, onAction }: A2UIRendererProps) {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [localFiles, setLocalFiles] = useState<Record<string, File>>({});
  const vibe = getVibeConfig(role);
  const shouldRenderFallbackActions = envelope.actions.length > 0 && !hasInlineActionMount(envelope.view);

  const submitAction = async (action: A2UIAction) => {
    if (action.target === 'local') {
      const field = typeof action.payload.field === 'string' ? action.payload.field : null;
      const value = typeof action.payload.value === 'string' ? action.payload.value : '';

      if (field) {
        setLocalValues((prev) => ({ ...prev, [field]: value }));
      }

      return;
    }

    const payload = {
      ...action.payload,
      ...localValues,
    };

    let uploadedAssets: A2UIToolResult['uploadedAssets'];

    const uploadField = typeof action.payload.uploadField === 'string' ? action.payload.uploadField : null;
    if (uploadField && localFiles[uploadField]) {
      const formData = new FormData();
      formData.append('file', localFiles[uploadField]);
      formData.append('trace_id', envelope.trace_id);
      formData.append('interaction_id', envelope.interaction_id);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.error ?? '文件上传失败');
      }

      uploadedAssets = [uploadData.asset];
    }

    await onAction({
      interaction_id: envelope.interaction_id,
      action_id: action.id,
      action_type: action.type,
      submitted_at: new Date().toISOString(),
      payload,
      client_state: {
        ...envelope.client_state,
        ...localValues,
      },
      uploadedAssets,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {renderA2UINode(envelope.view, envelope.interaction_id, {
        role,
        envelope,
        localValues,
        setLocalValue: (name, value) => setLocalValues((prev) => ({ ...prev, [name]: value })),
        setLocalFile: (name, file) => setLocalFiles((prev) => ({ ...prev, [name]: file })),
        submitAction: (action) => {
          void submitAction(action);
        },
      })}

      {shouldRenderFallbackActions && (
        <div className="flex flex-wrap gap-3">
          {envelope.actions.map((action: A2UIAction) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                void submitAction(action);
              }}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${vibe.theme.primaryColor}, ${vibe.theme.secondaryColor})`,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function A2UIStreamingCard({ role }: { role: string }) {
  return <StreamingIndicator role={role} />;
}
