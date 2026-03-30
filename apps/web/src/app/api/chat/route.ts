import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@vibetrip/core';
import { PlanningService } from '@vibetrip/core';
import type { TripPlan, ClarifyingQuestion } from '@/components/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { message, role } = await req.json();

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

    const daysMatch = message.match(/(\d+)\s*天/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 3;

    const destinationMatch = message.match(/(?:去|到|飞)([^\s\d]+)/);
    const destination = destinationMatch ? destinationMatch[1] : '成都';

    const budgetMatch = message.match(/预算\s*(\d+)/);
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : undefined;

    const plan = await service.plan({
      description: message,
      role: role as 'parents' | 'family' | 'couple' | 'friends' | 'soldier',
      days,
      budget,
      userId: 'web-user',
    });

    if (plan.success && plan.itinerary) {
      const tripPlan: TripPlan = {
        tripId: plan.tripId,
        destination,
        days,
        role,
        itinerary: plan.itinerary,
        questions: plan.questions as ClarifyingQuestion[] | undefined,
      };

      return NextResponse.json({
        content: `已为你规划好${destination}的${days}天行程！`,
        plan: tripPlan,
        questions: plan.questions,
      });
    }

    return NextResponse.json({
      content: plan.questions?.length
        ? '需要确认一些信息：'
        : '抱歉，无法生成行程，请稍后重试。',
      questions: plan.questions,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      content: '服务暂时不可用，请稍后重试～',
    }, { status: 500 });
  }
}
