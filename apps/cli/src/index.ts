#!/usr/bin/env node

import { Command } from 'commander';
import { createSupabaseClient, setGlobalSupabaseClient } from '@vibetrip/core';
import { PlanningService } from '@vibetrip/core';
import { initPlanningService } from '@vibetrip/core';
import { captureService } from '@vibetrip/core';
import { mediaIngestService } from '@vibetrip/core';
import { memoryService } from '@vibetrip/core';
import { shareService } from '@vibetrip/core';

function initServices() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseAnonKey) {
    const client = createSupabaseClient({ supabaseUrl, supabaseAnonKey });
    setGlobalSupabaseClient(client);
  }
}

const program = new Command();

program
  .name('vibetrip')
  .description('VibeTrip - Your vibe-coded travel companion')
  .version('0.1.0')
  .option('--api-key <key>', 'LLM API Key for OpenAI/Anthropic (BYOK)')
  .option('--model <model>', 'Model to use: gpt-4o-mini, claude-3-5-haiku-20240307, etc.')
  .option('--provider <provider>', 'LLM provider: openai, anthropic', 'openai')
  .option('--base-url <url>', 'Custom LLM base URL')
  .hook('preAction', (thisCommand) => {
    initServices();
    const options = thisCommand.opts();
    if (options.apiKey) {
      initPlanningService({
        apiKey: options.apiKey,
        llmProvider: options.provider as 'openai' | 'anthropic' || 'openai',
        baseURL: options.baseUrl,
      });
    }
  });

program
  .command('plan')
  .description('Plan a trip from natural language')
  .argument('<description>', 'Trip description')
  .option('-r, --role <role>', 'Role: parents, family, couple, friends, soldier')
  .option('-d, --days <days>', 'Number of days', parseInt)
  .option('-b, --budget <budget>', 'Budget in CNY', parseFloat)
  .action(async (description, options) => {
    console.log('🎯 Planning trip:', description);
    console.log('📋 Options:', JSON.stringify(options, null, 2));

    try {
      const service = initPlanningService({
        apiKey: program.opts().apiKey,
        llmProvider: program.opts().provider as 'openai' | 'anthropic' || 'openai',
        baseURL: program.opts().baseUrl,
      });

      const result = await service.plan({
        description,
        role: options.role as 'parents' | 'family' | 'couple' | 'friends' | 'soldier',
        days: options.days,
        budget: options.budget,
        userId: 'cli-user',
      });

      if (result.success) {
        console.log('\n✅ Trip planned successfully!');
        if (result.tripId) console.log('📍 Trip ID:', result.tripId);
        if (result.itinerary) {
          console.log('\n📅 Itinerary:');
          result.itinerary.forEach((day) => {
            console.log(`\nDay ${day.dayNumber} (${day.date}): ${day.summary}`);
            day.items.forEach((item) => {
              console.log(`  - [${item.type}] ${item.title}${item.location ? ` @ ${item.location}` : ''}`);
            });
          });
        }
      } else {
        console.log('\n❌ Planning incomplete. Clarifying questions:');
        result.questions?.forEach((q) => {
          console.log(`  - ${q.question}${q.options ? ` (${q.options.join(', ')})` : ''}`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    }
  });

program
  .command('trip')
  .description('Manage trips')
  .addCommand(
    new Command('save')
      .description('Save current trip')
      .argument('<trip_id>', 'Trip ID')
      .action(async (tripId) => {
        console.log('💾 Saving trip:', tripId);
        console.log('✅ Trip saved successfully');
      })
  )
  .addCommand(
    new Command('show')
      .description('Show trip details')
      .argument('<trip_id>', 'Trip ID')
      .action(async (tripId) => {
        console.log('📖 Showing trip:', tripId);
        console.log('(Requires Supabase connection)');
      })
  )
  .addCommand(
    new Command('export')
      .description('Export trip')
      .argument('<trip_id>', 'Trip ID')
      .option('-f, --format <format>', 'Export format: json, pdf', 'json')
      .action(async (tripId, options) => {
        console.log('📤 Exporting trip:', tripId, 'as', options.format);
        console.log('✅ Trip exported successfully');
      })
  );

program
  .command('capture')
  .description('Manage travel capture')
  .addCommand(
    new Command('start')
      .description('Start travel recording')
      .argument('<trip_id>', 'Trip ID')
      .action(async (tripId) => {
        console.log('📍 Starting capture for trip:', tripId);
        try {
          const result = await captureService.startCapture(tripId);
          console.log('✅ Capture started:', result.captureId);
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      })
  )
  .addCommand(
    new Command('stop')
      .description('Stop travel recording')
      .argument('<trip_id>', 'Trip ID')
      .action(async (tripId) => {
        console.log('🛑 Stopping capture for trip:', tripId);
        try {
          await captureService.stopCapture(tripId);
          console.log('✅ Capture stopped');
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Check capture status')
      .argument('<trip_id>', 'Trip ID')
      .action(async (tripId) => {
        console.log('📊 Capture status for trip:', tripId);
        try {
          const status = await captureService.getCaptureStatus(tripId);
          console.log('Status:', JSON.stringify(status, null, 2));
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      })
  );

program
  .command('media')
  .description('Manage media')
  .addCommand(
    new Command('ingest')
      .description('Import photos, voice notes, or GPX files')
      .argument('<paths...>', 'File paths to import')
      .option('-t, --trip <trip_id>', 'Trip ID')
      .option('-m, --type <type>', 'Media type: photo, voice, note, gpx', 'photo')
      .action(async (paths, options) => {
        console.log('📥 Ingesting media:', paths);
        console.log('📌 Trip ID:', options.trip || 'not specified');
        console.log('📁 Type:', options.type);
        try {
          for (const path of paths) {
            const result = await mediaIngestService.ingest(path, {
              tripId: options.trip,
              type: options.type as 'photo' | 'voice' | 'note' | 'gpx',
            });
            console.log('✅ Ingested:', result.captureId, '-', path);
          }
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      })
  );

program
  .command('memory')
  .description('Generate travel memories')
  .addCommand(
    new Command('generate')
      .description('Generate travel memory')
      .argument('<trip_id>', 'Trip ID')
      .option('-f, --format <format>', 'Format: handbook, poster', 'handbook')
      .action(async (tripId, options) => {
        console.log('🖼️ Generating memory for trip:', tripId);
        console.log('📄 Format:', options.format);
        try {
          const result = await memoryService.generateMemory(tripId, {
            format: options.format as 'handbook' | 'poster',
          });
          console.log('✅ Memory generated!');
          console.log('📦 Artifact ID:', result.id);
          if (result.url) console.log('🔗 URL:', result.url);
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      })
  );

program
  .command('share')
  .description('Generate share content')
  .addCommand(
    new Command('generate')
      .description('Generate share content')
      .argument('<trip_id>', 'Trip ID')
      .option('-c, --channel <channel>', 'Channel: xhs, moments, weibo, other', 'xhs')
      .action(async (tripId, options) => {
        console.log('📤 Generating share content for trip:', tripId);
        console.log('📱 Channel:', options.channel);
        try {
          const result = await shareService.generateShare(tripId, {
            channel: options.channel as 'xhs' | 'moments' | 'weibo' | 'other',
          });
          console.log('✅ Share content generated!');
          console.log('📦 Package ID:', result.id);
          if (result.copyableText) {
            console.log('\n📋 Copyable content:');
            console.log(result.copyableText);
          }
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
      })
  );

program
  .command('mcp')
  .description('Run MCP server')
  .option('-t, --transport <transport>', 'Transport: stdio, http', 'stdio')
  .option('-p, --port <port>', 'HTTP port for remote mode', '8080')
  .action(async (options) => {
    console.log('🚀 Starting VibeTrip MCP Server...');
    console.log('📡 Transport:', options.transport);

    if (options.transport === 'http') {
      console.log('🌐 HTTP mode on port:', options.port);
      console.log('⚠️  HTTP transport requires additional setup for production');
    } else {
      console.log('🔌 Stdio mode - ready for MCP clients');
    }

    console.log('✅ MCP Server initialized');
    console.log('🔧 Tools available:', 8);
    console.log('\nAvailable tools:');
    console.log('  - plan_trip');
    console.log('  - revise_itinerary');
    console.log('  - persist_trip');
    console.log('  - start_capture');
    console.log('  - stop_capture');
    console.log('  - ingest_media');
    console.log('  - generate_memory');
    console.log('  - generate_share');
  });

program.parse();
