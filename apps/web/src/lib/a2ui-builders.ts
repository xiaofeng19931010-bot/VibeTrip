import { randomUUID } from 'crypto';
import type { A2UIEnvelope, ClarifyingQuestion, RoleType, TripPlan } from '@/components/types';

function getMemoryTemplateLabel(template: string) {
  if (template === 'poster') return '朋友圈海报';
  if (template === 'summary') return '旅行摘要卡';
  return '手账长图';
}

function getShareChannelLabel(channel: string) {
  if (channel === 'moments') return '朋友圈';
  return '小红书';
}

function getShareToneLabel(tone: string) {
  if (tone === 'story') return '故事感';
  if (tone === 'playful') return '轻松活泼';
  return '治愈氛围';
}

function buildMemoryHeadline(role: RoleType, templateLabel: string) {
  if (role === 'parents') return `给爸妈的 ${templateLabel} 已整理完成，节奏更舒缓、信息更清晰。`;
  if (role === 'family') return `亲子旅行 ${templateLabel} 已整理完成，重点保留轻松好懂的回忆片段。`;
  if (role === 'couple') return `情侣旅程 ${templateLabel} 已整理完成，已经带上浪漫氛围和高光片段。`;
  if (role === 'soldier') return `高密度旅程 ${templateLabel} 已整理完成，打卡节奏和关键节点都保留下来了。`;
  return `这次旅行的 ${templateLabel} 已整理完成，可以继续生成分享内容。`;
}

function buildShareCopy(params: {
  role: RoleType;
  channel: string;
  tone: string;
  memoryTitle: string;
}) {
  const channelLabel = getShareChannelLabel(params.channel);
  const toneLabel = getShareToneLabel(params.tone);

  if (params.channel === 'moments') {
    return {
      title: `${params.memoryTitle}｜${toneLabel}版`,
      body: `这次旅程被我整理成了「${params.memoryTitle}」，把路上的舒服节奏、照片和当下的小情绪都收了进去。准备发到${channelLabel}，留住这段刚刚好的旅行感。`,
      tags: '#旅行记忆 #氛围感出游 #VibeTrip',
    };
  }

  return {
    title: `${params.memoryTitle}，这次真的值回票价`,
    body: `刚把这次旅程整理成「${params.memoryTitle}」，选了 ${toneLabel} 的表达方式，把路线、照片和最值得回味的瞬间压成一份可直接分享的内容包。`,
    tags: '#旅行攻略 #旅行手账 #出游灵感',
  };
}

export function buildPlanEnvelope(params: {
  role: RoleType;
  tripPlan: TripPlan;
  message: string;
}): A2UIEnvelope {
  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'review-plan',
      original_message: params.message,
      role: params.role,
      trip_id: params.tripPlan.tripId ?? null,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children: [
        {
          type: 'message',
          props: {
            content: `已为你生成 ${params.tripPlan.destination} 的 ${params.tripPlan.days} 天方案，请确认或继续调整。`,
          },
        },
        {
          type: 'itinerary-card',
          props: {
            plan: params.tripPlan,
          },
        },
        {
          type: 'button-group',
          props: {
            actionIds: ['confirm_plan', 'revise_budget'],
          },
        },
      ],
    },
    actions: [
      {
        id: 'confirm_plan',
        type: 'confirm',
        label: '确认行程',
        target: 'llm',
        payload: {
          intent: 'confirm_plan',
        },
      },
      {
        id: 'revise_budget',
        type: 'submit',
        label: '调整预算',
        target: 'llm',
        payload: {
          intent: 'revise_budget',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}

export function buildClarifyingEnvelope(params: {
  role: RoleType;
  message: string;
  questions: ClarifyingQuestion[];
}): A2UIEnvelope {
  const children: NonNullable<A2UIEnvelope['view']['children']> = [
    {
      type: 'message',
      props: {
        content: '还差一点信息，我通过可点击卡片快速确认一下～',
      },
    },
  ];

  const actions = params.questions.flatMap((question, index) => {
    children.push({
      type: 'choice-card',
      props: {
        title: question.question,
        description: question.field ? `字段：${question.field}` : `问题 ${index + 1}`,
      },
    });

    return (question.options ?? []).map((option) => ({
      id: `${question.field ?? `q${index}`}_${option}`,
      type: 'submit' as const,
      label: option,
      target: 'llm' as const,
      payload: {
        intent: 'answer_clarifying_question',
        field: question.field ?? `question_${index}`,
        value: option,
      },
    }));
  });

  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'clarifying',
      original_message: params.message,
      role: params.role,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children,
    },
    actions,
    tool_call: null,
    tool_result: null,
  };
}

export function buildBudgetEnvelope(params: {
  role: RoleType;
  message: string;
}): A2UIEnvelope {
  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'revise-budget',
      original_message: params.message,
      role: params.role,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children: [
        {
          type: 'card',
          props: {
            title: '更新预算',
            description: '输入新的预算，我会重新生成下一轮方案。',
          },
          children: [
            {
              type: 'input',
              props: {
                name: 'budget',
                label: '预算（元）',
                placeholder: '例如 5000',
              },
            },
            {
              type: 'button-group',
              props: {
                actionIds: ['submit_budget'],
              },
            },
          ],
        },
      ],
    },
    actions: [
      {
        id: 'submit_budget',
        type: 'submit',
        label: '更新预算并重算',
        target: 'llm',
        payload: {
          intent: 'submit_budget',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}

export function buildStatusEnvelope(params: {
  role: RoleType;
  title: string;
  description: string;
}): A2UIEnvelope {
  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'status',
      role: params.role,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'status',
      props: {
        title: params.title,
        description: params.description,
      },
    },
    actions: [],
    tool_call: null,
    tool_result: null,
  };
}

export function buildMediaUploadEnvelope(params: {
  role: RoleType;
  message: string;
  tripId?: string | null;
}): A2UIEnvelope {
  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'upload-media',
      original_message: params.message,
      role: params.role,
      trip_id: params.tripId ?? null,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children: [
        {
          type: 'message',
          props: {
            content: '可以上传这次旅行的照片或素材，我会继续帮你整理旅行记忆。',
          },
        },
        {
          type: 'card',
          props: {
            title: '上传旅行素材',
            description: '先上传 1 张照片试试，后续可扩展为多图与语音素材。',
          },
          children: [
            {
              type: 'upload',
              props: {
                name: 'photo',
                description: '选择旅行照片并上传',
              },
            },
            {
              type: 'button-group',
              props: {
                actionIds: ['submit_media'],
              },
            },
          ],
        },
      ],
    },
    actions: [
      {
        id: 'submit_media',
        type: 'upload_file',
        label: '上传并继续',
        target: 'llm',
        payload: {
          intent: 'submit_media',
          uploadField: 'photo',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}

export function buildMediaReviewEnvelope(params: {
  role: RoleType;
  message: string;
  uploadedAssets: Array<{
    fileName: string;
    publicUrl?: string;
    mimeType?: string;
    size?: number;
  }>;
}): A2UIEnvelope {
  const children: NonNullable<A2UIEnvelope['view']['children']> = [
    {
      type: 'message',
      props: {
        content: '素材已上传，我先帮你确认一下要继续用于旅行记忆生成的内容。',
      },
    },
    {
      type: 'grid',
      children: params.uploadedAssets.map((asset, index) => ({
        type: 'card',
        props: {
          title: asset.fileName || `素材 ${index + 1}`,
          description: asset.publicUrl
            ? `已上传 · ${asset.mimeType ?? '未知类型'}`
            : '已上传素材',
        },
      })),
    },
    {
      type: 'button-group',
      props: {
        actionIds: ['confirm_assets'],
      },
    },
  ];

  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'review-media',
      original_message: params.message,
      role: params.role,
      uploaded_assets_count: params.uploadedAssets.length,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children,
    },
    actions: [
      {
        id: 'confirm_assets',
        type: 'confirm',
        label: '确认素材并继续',
        target: 'llm',
        payload: {
          intent: 'confirm_assets',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}

export function buildMemoryPrepEnvelope(params: {
  role: RoleType;
  message: string;
  uploadedAssetsCount: number;
}): A2UIEnvelope {
  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'prepare-memory',
      original_message: params.message,
      role: params.role,
      uploaded_assets_count: params.uploadedAssetsCount,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children: [
        {
          type: 'message',
          props: {
            content: `已确认 ${params.uploadedAssetsCount} 个素材，接下来选择旅行记忆模板，我就开始生成。`,
          },
        },
        {
          type: 'card',
          props: {
            title: '选择旅行记忆模板',
            description: 'MVP 先生成图文手账/长图，后续再扩展视频版本。',
          },
          children: [
            {
              type: 'select',
              props: {
                name: 'memoryTemplate',
                label: '模板风格',
                options: [
                  { label: '手账长图', value: 'handbook' },
                  { label: '朋友圈海报', value: 'poster' },
                  { label: '旅行摘要卡', value: 'summary' },
                ],
              },
            },
            {
              type: 'button-group',
              props: {
                actionIds: ['generate_memory'],
              },
            },
          ],
        },
      ],
    },
    actions: [
      {
        id: 'generate_memory',
        type: 'submit',
        label: '开始生成旅行记忆',
        target: 'llm',
        payload: {
          intent: 'generate_memory',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}

export function buildMemoryResultEnvelope(params: {
  role: RoleType;
  message: string;
  uploadedAssetsCount: number;
  template: string;
}): A2UIEnvelope {
  const templateLabel = getMemoryTemplateLabel(params.template);
  const memoryTitle = `${templateLabel} · ${params.uploadedAssetsCount}个素材版`;
  const artifactId = randomUUID();

  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'memory-generated',
      original_message: params.message,
      role: params.role,
      uploaded_assets_count: params.uploadedAssetsCount,
      memory_template: params.template,
      memory_artifact_id: artifactId,
      memory_title: memoryTitle,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children: [
        {
          type: 'message',
          props: {
            content: buildMemoryHeadline(params.role, templateLabel),
          },
        },
        {
          type: 'card',
          props: {
            title: '旅行记忆草稿',
            description: `已基于 ${params.uploadedAssetsCount} 个素材生成「${templateLabel}」版本，当前先以可分享草稿形式返回，后续再接入正式产物落库与下载链接。`,
          },
          children: [
            {
              type: 'message',
              props: {
                content: `草稿名称：${memoryTitle}`,
              },
            },
            {
              type: 'message',
              props: {
                content: `适配角色：${params.role} · 建议下一步确认分享渠道与文案调性。`,
              },
            },
          ],
        },
        {
          type: 'card',
          props: {
            title: '生成分享内容包',
            description: '选择分享渠道与表达风格后，我会继续生成可直接复制的标题、正文与标签。',
          },
          children: [
            {
              type: 'select',
              props: {
                name: 'shareChannel',
                label: '分享渠道',
                options: [
                  { label: '小红书', value: 'xhs' },
                  { label: '朋友圈', value: 'moments' },
                ],
              },
            },
            {
              type: 'select',
              props: {
                name: 'shareTone',
                label: '文案风格',
                options: [
                  { label: '治愈氛围', value: 'healing' },
                  { label: '故事感', value: 'story' },
                  { label: '轻松活泼', value: 'playful' },
                ],
              },
            },
            {
              type: 'button-group',
              props: {
                actionIds: ['generate_share'],
              },
            },
          ],
        },
      ],
    },
    actions: [
      {
        id: 'generate_share',
        type: 'submit',
        label: '生成分享内容',
        target: 'llm',
        payload: {
          intent: 'generate_share',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}

export function buildShareResultEnvelope(params: {
  role: RoleType;
  channel: string;
  tone: string;
  memoryTitle: string;
}): A2UIEnvelope {
  const channelLabel = getShareChannelLabel(params.channel);
  const toneLabel = getShareToneLabel(params.tone);
  const copy = buildShareCopy(params);

  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'share-generated',
      role: params.role,
      share_channel: params.channel,
      share_tone: params.tone,
      memory_title: params.memoryTitle,
    },
    client_state: {
      role: params.role,
    },
    view: {
      type: 'stack',
      children: [
        {
          type: 'message',
          props: {
            content: `已生成 ${channelLabel} 可用的分享内容包，当前是 ${toneLabel} 风格版本。`,
          },
        },
        {
          type: 'card',
          props: {
            title: '分享文案预览',
            description: `适配渠道：${channelLabel} · 文案风格：${toneLabel}`,
          },
          children: [
            {
              type: 'message',
              props: {
                content: `标题：${copy.title}`,
              },
            },
            {
              type: 'message',
              props: {
                content: `正文：${copy.body}`,
              },
            },
            {
              type: 'message',
              props: {
                content: `标签：${copy.tags}`,
              },
            },
          ],
        },
        {
          type: 'card',
          props: {
            title: '内容包说明',
            description: `已基于「${params.memoryTitle}」整理分享标题、正文和标签草稿。下一步可补充封面渲染、长图链接与一键复制能力。`,
          },
        },
      ],
    },
    actions: [],
    tool_call: null,
    tool_result: null,
  };
}

export function buildErrorEnvelope(message: string): A2UIEnvelope {
  return {
    version: '1.0',
    trace_id: randomUUID(),
    interaction_id: randomUUID(),
    server_state: {
      step: 'error',
    },
    client_state: {},
    view: {
      type: 'error',
      props: {
        title: '生成失败',
        description: message,
      },
    },
    actions: [
      {
        id: 'retry',
        type: 'retry',
        label: '重试',
        target: 'llm',
        payload: {
          intent: 'retry',
        },
      },
    ],
    tool_call: null,
    tool_result: null,
  };
}
