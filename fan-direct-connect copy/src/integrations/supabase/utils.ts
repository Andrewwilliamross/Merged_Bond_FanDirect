import { supabase } from './client';
import type { Database } from './types';

export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

export async function insertRecord<T extends TableName>(
  table: T,
  data: Tables[T]['Insert']
) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function updateRecord<T extends TableName>(
  table: T,
  id: string,
  data: Tables[T]['Update']
) {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function deleteRecord<T extends TableName>(
  table: T,
  id: string
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getRecord<T extends TableName>(
  table: T,
  id: string
) {
  const { data: result, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return result;
}

export async function listRecords<T extends TableName>(
  table: T,
  query?: {
    column?: keyof Tables[T]['Row'];
    value?: any;
    orderBy?: keyof Tables[T]['Row'];
    ascending?: boolean;
  }
) {
  let queryBuilder = supabase.from(table).select('*');

  if (query?.column && query?.value) {
    queryBuilder = queryBuilder.eq(query.column, query.value);
  }

  if (query?.orderBy) {
    queryBuilder = queryBuilder.order(query.orderBy, {
      ascending: query.ascending ?? true,
    });
  }

  const { data: results, error } = await queryBuilder;

  if (error) throw error;
  return results;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) throw error;
  return data;
}

export async function getFileUrl(
  bucket: string,
  path: string
) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
} 