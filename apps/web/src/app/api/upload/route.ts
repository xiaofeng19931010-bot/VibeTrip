import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@vibetrip/core';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase 未配置，无法上传文件。' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const traceId = String(formData.get('trace_id') ?? randomUUID());
    const interactionId = String(formData.get('interaction_id') ?? randomUUID());

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '未检测到可上传文件。' }, { status: 400 });
    }

    const supabase = createSupabaseClient({
      supabaseUrl,
      supabaseAnonKey,
    });

    const bucket = process.env.SUPABASE_UPLOAD_BUCKET ?? 'uploads';
    const safeName = file.name.replace(/\s+/g, '-');
    const path = `${traceId}/${interactionId}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({
      asset: {
        bucket,
        path,
        fileName: file.name,
        mimeType: file.type || undefined,
        size: file.size,
        publicUrl: data.publicUrl || undefined,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '上传服务异常';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
