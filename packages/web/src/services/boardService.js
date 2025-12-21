import { supabase } from './supabaseClient';

/**
 * Board Service
 * Handles fetching and managing user boards (saved configurations)
 */

export async function getUserBoards(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[BoardService] Error fetching user boards:', error);
    throw error;
  }
}

export async function createBoard(userId, name, config = {}) {
  if (!userId) throw new Error('User ID is required');

  try {
    const { data, error } = await supabase
      .from('boards')
      .insert([
        { 
          user_id: userId, 
          name: name || 'New Board', 
          config,
          is_online: false
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[BoardService] Error creating board:', error);
    throw error;
  }
}
