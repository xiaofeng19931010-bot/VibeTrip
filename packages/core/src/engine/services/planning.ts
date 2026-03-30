import { randomUUID } from 'crypto';
import type { RoleType } from '../../schemas/index.js';
import { tripRepository } from '../../repositories/trip.repository.js';
import { itineraryRepository } from '../../repositories/itinerary.repository.js';
import type { PlanRequest, PlanResult, ClarifyingQuestion, PlannedDay, PlannedItem } from '../planning.js';
import { parsePlanRequest, generateClarifyingQuestions, generateFallbackItinerary } from '../planning.js';
import type { BaseLLMService } from '../../services/llm.js';
import { createLLMService } from '../../services/llm.js';

export interface PlanningServiceOptions {
  llmProvider?: 'openai' | 'anthropic' | 'zhipu';
  apiKey?: string;
  baseURL?: string;
}

export class PlanningService {
  private llm?: BaseLLMService;

  constructor(options: PlanningServiceOptions = {}) {
    if (options.apiKey) {
      this.llm = createLLMService(options.llmProvider || 'openai', options.apiKey, options.baseURL);
    }
  }

  async plan(request: PlanRequest): Promise<PlanResult> {
    try {
      const { destination, days, role, budget, questions, isComplete } = parsePlanRequest(request);

      if (!isComplete) {
        return { success: false, questions, isFallback: false };
      }

      if (!this.llm) {
        return this.fallbackPlan(request, destination, days, role, budget);
      }

      try {
        return await this.llmPlan(request, destination, days, role, budget);
      } catch (error) {
        console.error('LLM planning failed, falling back:', error);
        return this.fallbackPlan(request, destination, days, role, budget);
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', isFallback: false };
    }
  }

  private async llmPlan(
    request: PlanRequest,
    destination: string,
    days: number,
    role: RoleType,
    budget?: number
  ): Promise<PlanResult> {
    const prompt = this.buildPrompt(destination, days, role, budget);
    const response = await this.llm!.complete(prompt, { temperature: 0.7, maxTokens: 4000 });
    const parsed = this.parseLLMResponse(response.content);
    const trip = await this.saveTrip(request.userId, { destination, days, role, budget });
    await this.saveItinerary(trip.id, parsed);
    return { success: true, tripId: trip.id, itinerary: parsed, isFallback: false };
  }

  private fallbackPlan(
    request: PlanRequest,
    destination: string,
    days: number,
    role: RoleType,
    budget?: number
  ): PlanResult {
    const itinerary = generateFallbackItinerary(request.description, days, role, budget);
    return { success: true, questions: generateClarifyingQuestions(request.description), itinerary, isFallback: true };
  }

  private buildPrompt(destination: string, days: number, role: RoleType, budget?: number): string {
    const roleDescriptions: Record<RoleType, string> = {
      parents: '带父母出行，节奏舒缓，注重休息和无障碍设施',
      family: '亲子出行，注重亲子设施和安全',
      couple: '情侣出行，浪漫氛围优先',
      friends: '闺蜜/特种兵，节奏紧凑，打卡拍照优先',
      soldier: '特种兵，极限打卡，高效率',
    };

    return `请为用户规划一次${destination}旅行，行程${days}天。

角色类型：${roleDescriptions[role]}
${budget ? `预算：${budget}元/天` : ''}

请以JSON格式返回行程安排，格式如下：
{
  "days": [
    {
      "dayNumber": 1,
      "date": "2024-03-15",
      "summary": "第一天行程概要",
      "items": [
        { "type": "transport", "title": "交通安排", "description": "详情描述", "order": 0 },
        { "type": "attraction", "title": "景点名称", "description": "景点描述", "location": "景点地址", "startTime": "09:00", "endTime": "12:00", "order": 1 }
      ]
    }
  ]
}

请确保：
1. 每天的行程不超过${this.getMaxActivities(role)}个活动
2. 包含合适的休息和用餐时间
3. 交通、景点、餐饮合理搭配
4. 返回有效的JSON格式`;
  }

  private getMaxActivities(role: RoleType): number {
    const maxActivities: Record<RoleType, number> = { parents: 2, family: 3, couple: 2, friends: 5, soldier: 8 };
    return maxActivities[role] ?? 3;
  }

  private parseLLMResponse(content: string): PlannedDay[] {
    try {
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      } else {
        const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          jsonStr = braceMatch[0];
        }
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.days && Array.isArray(parsed.days)) {
        return parsed.days.map((day: { dayNumber: number; date: string; summary: string; items: Array<{ type: string; title: string; description?: string; location?: string; startTime?: string; endTime?: string; order: number }> }) => ({
          dayNumber: day.dayNumber,
          date: day.date || new Date().toISOString().split('T')[0],
          summary: day.summary || '',
          items: day.items.map((item: { type: string; title: string; description?: string; location?: string; startTime?: string; endTime?: string; order: number }) => ({
            dayNumber: day.dayNumber,
            type: item.type as PlannedItem['type'],
            title: item.title,
            description: item.description,
            location: item.location,
            startTime: item.startTime,
            endTime: item.endTime,
            order: item.order,
          })),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Content preview:', content.substring(0, 500));
      return [];
    }
  }

  private async saveTrip(userId: string, params: { destination: string; days: number; role: RoleType; budget?: number }) {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + params.days * 24 * 60 * 60 * 1000).toISOString();
    return tripRepository.create({
      user_id: userId,
      title: `${params.destination}旅行`,
      destination: params.destination,
      start_date: startDate,
      end_date: endDate,
      role: params.role,
      budget: params.budget,
    });
  }

  private async saveItinerary(tripId: string, days: PlannedDay[]) {
    for (const day of days) {
      await itineraryRepository.create({ trip_id: tripId, day_number: day.dayNumber, date: day.date, summary: day.summary });
      await itineraryRepository.bulkCreateItems(day.items.map((item: PlannedItem) => ({
        trip_id: tripId,
        day_number: day.dayNumber,
        type: item.type,
        title: item.title,
        description: item.description,
        location: item.location ? { lat: 0, lng: 0 } : undefined,
        address: item.location,
        start_time: item.startTime,
        end_time: item.endTime,
        order: item.order,
      })));
    }
  }
}

let globalPlanningService: PlanningService | null = null;

export function initPlanningService(options: PlanningServiceOptions): PlanningService {
  globalPlanningService = new PlanningService(options);
  return globalPlanningService;
}

export function getPlanningService(): PlanningService | null {
  return globalPlanningService;
}
