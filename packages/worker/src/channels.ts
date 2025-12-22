import { SupabaseClient } from '@supabase/supabase-js';
import { RedisClientType } from 'redis';
import axios from 'axios';

/**
 * ChannelProcessor - Handles automated data fetching for idle boards
 */
export class ChannelProcessor {
  private supabase: SupabaseClient;
  private redis: RedisClientType;
  private interval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(supabase: SupabaseClient, redis: RedisClientType) {
    this.supabase = supabase;
    this.redis = redis;
  }

  start(intervalMs = 60000) { // Check every minute
    console.log(`[Channels] Starting channel processor every ${intervalMs}ms`);
    this.interval = setInterval(() => this.processChannels(), intervalMs);
    this.processChannels();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async processChannels() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      
      // Fetch subscriptions that are due for update
      const { data: subscriptions, error } = await this.supabase
        .from('board_channels')
        .select('*, channels(*)')
        .eq('is_enabled', true);

      if (error) throw error;

      for (const sub of subscriptions) {
        const lastRun = sub.last_run_at ? new Date(sub.last_run_at) : new Date(0);
        const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);

        if (diffMinutes >= sub.update_interval_minutes) {
          await this.runChannel(sub);
        }
      }
    } catch (error) {
      console.error('[Channels] Error processing channels:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async runChannel(sub: any) {
    const { board_id, channels: channel } = sub;
    console.log(`[Channels] Running ${channel.type} for board ${board_id}`);

    try {
      let content = '';
      
      if (channel.type === 'weather') {
        content = await this.fetchWeather(channel.config);
      } else if (channel.type === 'stocks') {
        content = await this.fetchStocks(channel.config);
      } else if (channel.type === 'news') {
        content = await this.fetchNews(channel.config);
      }

      if (content) {
        await this.pushToBoard(board_id, content);
        
        // Update last_run_at
        await this.supabase
          .from('board_channels')
          .update({ last_run_at: new Date().toISOString() })
          .eq('id', sub.id);
      }
    } catch (error) {
      console.error(`[Channels] Error running channel ${channel.id}:`, error);
    }
  }

  private async fetchWeather(config: any): Promise<string> {
    try {
      // Mock weather for now (Open-Meteo doesn't need API key)
      const lat = config.lat || 40.7128;
      const lon = config.lon || -74.0060;
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const temp = res.data.current_weather.temperature;
      const code = res.data.current_weather.weathercode;
      return `WEATHER: ${temp}°C | CLEAR SKIES`;
    } catch (e) {
      return 'WEATHER: 22°C | SUNNY';
    }
  }

  private async fetchStocks(config: any): Promise<string> {
    // Mock stock data
    const symbols = config.symbols || ['AAPL', 'BTC'];
    return `STOCKS: AAPL +1.2% | BTC $64,230 | TSLA -0.5%`;
  }

  private async fetchNews(config: any): Promise<string> {
    return `NEWS: DIGITAL FLIPBOARD V2.0 RELEASED! | NEW DESIGNER TOOLS ADDED`;
  }

  private async pushToBoard(boardId: string, content: string) {
    // Find active session
    const { data: session } = await this.supabase
      .from('display_sessions')
      .select('session_code')
      .eq('board_id', boardId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!session) return;

    const payload = JSON.stringify({
      type: 'message:broadcast',
      timestamp: Date.now(),
      data: {
        sessionCode: session.session_code,
        content,
        animation: 'slide',
        color: 'monochrome',
        source: 'channel'
      }
    });

    await this.redis.publish('system:events', payload);
  }
}
