import { supabase } from './supabase';
import type { Group, GroupMember, Profile } from '@/types/database';

export async function createGroup(name: string, description?: string) {
  const { data: group, error } = await supabase
    .from('groups')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) throw error;
  return group;
}

export async function getMyGroups() {
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      members:group_members(
        user_id,
        role,
        profiles(
          id,
          full_name,
          avatar_url
        )
      )
    `);

  if (error) throw error;
  return groups;
}

export async function addGroupMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member') {
  const { data: member, error } = await supabase
    .from('group_members')
    .insert([{ group_id: groupId, user_id: userId, role }])
    .select()
    .single();

  if (error) throw error;
  return member;
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .match({ group_id: groupId, user_id: userId });

  if (error) throw error;
}

export async function updateGroupMemberRole(groupId: string, userId: string, role: 'admin' | 'member') {
  const { data: member, error } = await supabase
    .from('group_members')
    .update({ role })
    .match({ group_id: groupId, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return member;
}

export async function searchUsers(query: string) {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .ilike('full_name', `%${query}%`)
    .limit(5);

  if (error) throw error;
  return users;
}
