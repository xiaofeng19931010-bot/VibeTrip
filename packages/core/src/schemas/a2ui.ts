import { z } from 'zod';

export const A2UIVersion = z.literal('1.0');
export type A2UIVersion = z.infer<typeof A2UIVersion>;

export const A2UIViewType = z.enum([
  'stack',
  'grid',
  'message',
  'card',
  'choice-card',
  'button-group',
  'input',
  'select',
  'upload',
  'timeline',
  'itinerary-card',
  'status',
  'error',
]);
export type A2UIViewType = z.infer<typeof A2UIViewType>;

export const A2UIActionType = z.enum([
  'submit',
  'select',
  'multi_select',
  'open_input',
  'upload_file',
  'confirm',
  'cancel',
  'retry',
]);
export type A2UIActionType = z.infer<typeof A2UIActionType>;

export const A2UIActionTarget = z.enum(['llm', 'local']);
export type A2UIActionTarget = z.infer<typeof A2UIActionTarget>;

export const A2UIStateSchema = z.record(z.unknown());
export type A2UIState = z.infer<typeof A2UIStateSchema>;

export const A2UIToolCallSchema = z.object({
  name: z.string().min(1),
  input: z.record(z.unknown()).default({}),
});
export type A2UIToolCall = z.infer<typeof A2UIToolCallSchema>;

export const A2UIActionSchema = z.object({
  id: z.string().min(1),
  type: A2UIActionType,
  label: z.string().min(1),
  target: A2UIActionTarget,
  payload: z.record(z.unknown()).default({}),
  disabled: z.boolean().optional(),
});
export type A2UIAction = z.infer<typeof A2UIActionSchema>;

export const A2UIToolResultSchema = z.object({
  interaction_id: z.string().min(1),
  action_id: z.string().min(1),
  action_type: A2UIActionType,
  submitted_at: z.string().datetime().optional(),
  payload: z.record(z.unknown()).default({}),
  client_state: A2UIStateSchema.optional(),
});
export type A2UIToolResult = z.infer<typeof A2UIToolResultSchema>;

type A2UIViewNode = {
  type: A2UIViewType;
  props?: Record<string, unknown>;
  children?: A2UIViewNode[];
};

export const A2UIViewSchema: z.ZodType<A2UIViewNode> = z.lazy(() =>
  z.object({
    type: A2UIViewType,
    props: z.record(z.unknown()).optional(),
    children: z.array(A2UIViewSchema).optional(),
  }),
);
export type A2UIView = z.infer<typeof A2UIViewSchema>;

export const A2UIEnvelopeSchema = z.object({
  version: A2UIVersion,
  trace_id: z.string().min(1),
  interaction_id: z.string().min(1),
  server_state: A2UIStateSchema.default({}),
  client_state: A2UIStateSchema.default({}),
  view: A2UIViewSchema,
  actions: z.array(A2UIActionSchema).default([]),
  tool_call: A2UIToolCallSchema.nullable().default(null),
  tool_result: A2UIToolResultSchema.nullable().default(null),
});
export type A2UIEnvelope = z.infer<typeof A2UIEnvelopeSchema>;

export const A2UIRendererErrorSchema = z.object({
  version: A2UIVersion,
  trace_id: z.string().min(1),
  interaction_id: z.string().min(1),
  server_state: A2UIStateSchema.default({}),
  client_state: A2UIStateSchema.default({}),
  view: z.object({
    type: z.literal('error'),
    props: z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
    children: z.array(A2UIViewSchema).optional(),
  }),
  actions: z.array(A2UIActionSchema).default([]),
  tool_call: A2UIToolCallSchema.nullable().default(null),
  tool_result: A2UIToolResultSchema.nullable().default(null),
});
export type A2UIRendererError = z.infer<typeof A2UIRendererErrorSchema>;
