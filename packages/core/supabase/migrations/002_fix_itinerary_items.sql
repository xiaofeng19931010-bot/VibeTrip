-- 修复 itinerary_items 表，添加缺失的 day_number 列
ALTER TABLE public.itinerary_items ADD COLUMN IF NOT EXISTS day_number INTEGER;

-- 如果需要，更新现有数据
UPDATE public.itinerary_items SET day_number = 1 WHERE day_number IS NULL;

-- 添加 NOT NULL 约束
ALTER TABLE public.itinerary_items ALTER COLUMN day_number SET NOT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_number ON public.itinerary_items(day_number);
