import { NextRequest, NextResponse } from 'next/server';
import { PlanningService, mediaIngestService, memoryService, shareService } from '@vibetrip/core';
import type { A2UIToolResult, ClarifyingQuestion, RoleType, TripPlan } from '@/components/types';
import {
  buildBudgetEnvelope,
  buildClarifyingEnvelope,
  buildErrorEnvelope,
  buildMemoryPrepEnvelope,
  buildMemoryResultEnvelope,
  buildMediaReviewEnvelope,
  buildMediaUploadEnvelope,
  buildPlanEnvelope,
  buildShareResultEnvelope,
} from '@/lib/a2ui-builders';

export const runtime = 'nodejs';

interface ChatRequestBody {
  message?: string;
  role?: RoleType;
  toolResult?: A2UIToolResult;
  serverState?: Record<string, unknown>;
}

const generateMemoryWithSelection = memoryService.generateMemory as (
  tripId: string,
  options: { format?: 'handbook' | 'poster'; captureIds?: string[] }
) => Promise<{ id: string; url: string; title: string; format: 'handbook' | 'poster' }>;

const generateShareWithArtifact = shareService.generateShare as (
  tripId: string,
  options: { channel?: 'xhs' | 'moments' | 'weibo' | 'other'; memoryArtifactId?: string }
) => Promise<{
  id: string;
  title: string;
  body: string;
  hashtags: string[];
  images: string[];
  copyableText: string;
  memoryArtifactId?: string;
}>;

function parsePlanMeta(message: string) {
  const daysMatch = message.match(/(\d+)\s*天/);
  const days = daysMatch ? parseInt(daysMatch[1], 10) : 3;

  const destinationMatch = message.match(/(?:去|到|飞)([^\s\d]+)/);
  const destination = destinationMatch ? destinationMatch[1] : '成都';

  const budgetMatch = message.match(/预算\s*(\d+)/);
  const budget = budgetMatch ? parseInt(budgetMatch[1], 10) : undefined;

  return { days, destination, budget };
}

export async function POST(req: NextRequest) {
  try {
    const { message, role, toolResult, serverState }: ChatRequestBody = await req.json();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const llmApiKey = process.env.ZHIPU_API_KEY || process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        content: '请配置 SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量',
      }, { status: 500 });
    }

    const { createSupabaseClient: createClient, setGlobalSupabaseClient } = await import('@vibetrip/core');
    const client = createClient({ supabaseUrl, supabaseAnonKey });
    setGlobalSupabaseClient(client);

    const service = new PlanningService({
      llmProvider: llmApiKey ? 'zhipu' : undefined,
      apiKey: llmApiKey,
    });

    const currentRole = role ?? (serverState?.role as RoleType | undefined) ?? 'friends';

    if (toolResult) {
      const originalMessage = String(serverState?.original_message ?? '');
      const intent = toolResult.payload.intent;

      if (intent === 'confirm_plan') {
        return NextResponse.json({
          envelope: buildMediaUploadEnvelope({
            role: currentRole,
            message: originalMessage,
            tripId: typeof serverState?.trip_id === 'string' ? serverState.trip_id : null,
          }),
        });
      }

      if (intent === 'revise_budget') {
        return NextResponse.json({
          envelope: buildBudgetEnvelope({
            role: currentRole,
            message: originalMessage,
          }),
        });
      }

      if (intent === 'submit_budget') {
        const budget = String(toolResult.payload.budget ?? '').trim();
        const nextMessage = budget ? `${originalMessage} 预算 ${budget}` : originalMessage;
        const { days, destination, budget: parsedBudget } = parsePlanMeta(nextMessage);

        const plan = await service.plan({
          description: nextMessage,
          role: currentRole,
          days,
          budget: parsedBudget,
          userId: 'web-user',
        });

        if (plan.success && plan.itinerary) {
          const tripPlan: TripPlan = {
            tripId: plan.tripId,
            destination,
            days,
            role: currentRole,
            itinerary: plan.itinerary,
            questions: plan.questions as ClarifyingQuestion[] | undefined,
          };

          return NextResponse.json({
            envelope: buildPlanEnvelope({
              role: currentRole,
              tripPlan,
              message: nextMessage,
            }),
          });
        }
      }

      if (intent === 'submit_media') {
        const uploadedAssets = toolResult.uploadedAssets ?? [];
        const tripId = typeof serverState?.trip_id === 'string' ? serverState.trip_id : null;

        if (uploadedAssets.length === 0) {
          return NextResponse.json({
            envelope: buildErrorEnvelope('请先选择并上传至少一个素材文件。'),
          }, { status: 400 });
        }

        if (!tripId) {
          return NextResponse.json({
            envelope: buildErrorEnvelope('当前缺少 trip_id，暂时无法把素材写入真实旅行记录。请重新确认行程后再试。'),
          }, { status: 400 });
        }

        const ingestResults = await mediaIngestService.ingestUploadedAssets(
          tripId,
          uploadedAssets.map((asset) => ({
            bucket: asset.bucket,
            path: asset.path,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            size: asset.size,
            publicUrl: asset.publicUrl,
          })),
        );
        const ingestedAssets = ingestResults.flatMap((result) => (
          result.success && result.captureId
            ? [{
                fileName: result.asset.fileName,
                publicUrl: result.asset.publicUrl,
                mimeType: result.asset.mimeType,
                size: result.asset.size,
                captureId: result.captureId,
              }]
            : []
        ));

        if (ingestedAssets.length === 0) {
          return NextResponse.json({
            envelope: buildErrorEnvelope('素材入库失败'),
          }, { status: 500 });
        }

        return NextResponse.json({
          envelope: buildMediaReviewEnvelope({
            role: currentRole,
            message: originalMessage,
            tripId,
            uploadedAssets: ingestedAssets,
          }),
        });
      }

      if (intent === 'confirm_assets') {
        const uploadedAssets = Array.isArray(serverState?.uploaded_assets)
          ? serverState.uploaded_assets as Array<Record<string, unknown>>
          : [];
        const selectedAssets = uploadedAssets.filter((asset) => {
          const captureId = typeof asset.captureId === 'string' ? asset.captureId : null;
          if (!captureId) return true;
          const decision = String(toolResult.payload[`assetDecision_${captureId}`] ?? '').trim();
          return decision !== 'remove';
        });
        const selectedCaptureIds = selectedAssets
          .map((asset) => (typeof asset.captureId === 'string' ? asset.captureId : null))
          .filter((captureId): captureId is string => typeof captureId === 'string' && captureId.length > 0);
        const uploadedCount = selectedAssets.length;

        if (uploadedCount === 0) {
          return NextResponse.json({
            envelope: buildErrorEnvelope('至少需要保留一个素材后才能继续生成旅行记忆。'),
          }, { status: 400 });
        }

        return NextResponse.json({
          envelope: buildMemoryPrepEnvelope({
            role: currentRole,
            message: originalMessage,
            tripId: typeof serverState?.trip_id === 'string' ? serverState.trip_id : null,
            uploadedAssetsCount: uploadedCount,
            selectedCaptureIds,
          }),
        });
      }

      if (intent === 'generate_memory') {
        const selectedTemplate = String(toolResult.payload.memoryTemplate ?? '').trim();
        const template = selectedTemplate === 'poster' ? 'poster' : 'handbook';
        const uploadedCount = Number(serverState?.uploaded_assets_count ?? 0);
        const tripId = typeof serverState?.trip_id === 'string' ? serverState.trip_id : null;
        const selectedCaptureIds = Array.isArray(serverState?.selected_capture_ids)
          ? serverState.selected_capture_ids.filter((captureId): captureId is string => typeof captureId === 'string' && captureId.length > 0)
          : [];
        const artifactTitle = template === 'poster'
          ? '朋友圈海报'
          : '手账长图';

        if (!tripId) {
          return NextResponse.json({
            envelope: buildErrorEnvelope('当前缺少 trip_id，暂时无法生成真实旅行记忆。请重新确认行程后再试。'),
          }, { status: 400 });
        }

        const result = await generateMemoryWithSelection(tripId, {
          format: template,
          captureIds: selectedCaptureIds,
        });

        return NextResponse.json({
          envelope: buildMemoryResultEnvelope({
            role: currentRole,
            message: originalMessage,
            tripId,
            uploadedAssetsCount: uploadedCount,
            template,
            artifactId: result.id,
            downloadUrl: result.url,
            title: `${artifactTitle} · ${uploadedCount}个素材版`,
          }),
        });
      }

      if (intent === 'generate_share') {
        const shareChannel = String(toolResult.payload.shareChannel ?? '').trim() || 'xhs';
        const shareTone = String(toolResult.payload.shareTone ?? '').trim() || 'healing';
        const memoryTitle = String(serverState?.memory_title ?? '旅行记忆草稿').trim() || '旅行记忆草稿';
        const tripId = typeof serverState?.trip_id === 'string' ? serverState.trip_id : null;
        const memoryArtifactId = typeof serverState?.memory_artifact_id === 'string' ? serverState.memory_artifact_id : undefined;

        if (!tripId) {
          return NextResponse.json({
            envelope: buildErrorEnvelope('当前缺少 trip_id，暂时无法生成真实分享内容。请重新确认行程后再试。'),
          }, { status: 400 });
        }

        const result = await generateShareWithArtifact(tripId, {
          channel: shareChannel === 'moments' || shareChannel === 'weibo' || shareChannel === 'other' ? shareChannel : 'xhs',
          memoryArtifactId,
        });

        return NextResponse.json({
          envelope: buildShareResultEnvelope({
            role: currentRole,
            channel: shareChannel,
            tone: shareTone,
            memoryTitle,
            memoryArtifactId,
            packageId: result.id,
            title: result.title,
            body: result.body,
            hashtags: result.hashtags,
            copyableText: result.copyableText,
          }),
        });
      }

      if (intent === 'answer_clarifying_question') {
        const field = String(toolResult.payload.field ?? '').trim();
        const value = String(toolResult.payload.value ?? '').trim();
        const nextMessage = `${originalMessage} ${field}: ${value}`.trim();
        const { days, destination, budget } = parsePlanMeta(nextMessage);

        const plan = await service.plan({
          description: nextMessage,
          role: currentRole,
          days,
          budget,
          userId: 'web-user',
        });

        if (plan.success && plan.itinerary) {
          const tripPlan: TripPlan = {
            tripId: plan.tripId,
            destination,
            days,
            role: currentRole,
            itinerary: plan.itinerary,
            questions: plan.questions as ClarifyingQuestion[] | undefined,
          };

          return NextResponse.json({
            envelope: buildPlanEnvelope({
              role: currentRole,
              tripPlan,
              message: nextMessage,
            }),
          });
        }

        return NextResponse.json({
          envelope: buildClarifyingEnvelope({
            role: currentRole,
            message: nextMessage,
            questions: plan.questions ?? [],
          }),
        });
      }

      return NextResponse.json({
        envelope: buildErrorEnvelope('无法识别当前交互动作，请重试。'),
      });
    }

    if (!message) {
      return NextResponse.json({
        envelope: buildErrorEnvelope('请输入旅行需求后再继续。'),
      }, { status: 400 });
    }

    const { days, destination, budget } = parsePlanMeta(message);

    const plan = await service.plan({
      description: message,
      role: currentRole,
      days,
      budget,
      userId: 'web-user',
    });

    if (plan.success && plan.itinerary) {
      const tripPlan: TripPlan = {
        tripId: plan.tripId,
        destination,
        days,
        role: currentRole,
        itinerary: plan.itinerary,
        questions: plan.questions as ClarifyingQuestion[] | undefined,
      };

      return NextResponse.json({
        envelope: buildPlanEnvelope({
          role: currentRole,
          tripPlan,
          message,
        }),
      });
    }

    return NextResponse.json({
      envelope: buildClarifyingEnvelope({
        role: currentRole,
        message,
        questions: plan.questions ?? [],
      }),
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      envelope: buildErrorEnvelope('服务暂时不可用，请稍后重试～'),
    }, { status: 500 });
  }
}
