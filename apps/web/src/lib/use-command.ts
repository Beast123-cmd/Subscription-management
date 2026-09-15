import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { useToast } from '@/contexts/ToastContext';

export function useCommand() {
  const cache = useQueryClient();
  const toast = useToast();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  async function run(path: string, message: string, confirmation?: string, body?: unknown) {
    if (busy.current || (confirmation && !window.confirm(confirmation))) return;
    busy.current = true; setPending(true);
    try { await apiClient.command(path, body); toast.success(message, 'Saved'); await cache.invalidateQueries(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to save.', 'Action failed'); }
    finally { busy.current = false; setPending(false); }
  }
  return { run, pending };
}
