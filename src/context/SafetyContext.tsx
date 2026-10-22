"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, CircleAlert, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { blockMember, listBlocks, memberId, unblockMember, type BlockedMember } from "@/lib/ugc-safety";

type Notice = { text: string; tone: "ok" | "error"; href?: string; cta?: string };

interface SafetyContextType {
  /** The member's block list has been loaded for this session. */
  ready: boolean;
  blocks: BlockedMember[];
  blockedIds: ReadonlySet<number>;
  isBlocked: (authorId: unknown) => boolean;
  /** Comments this member reported in this session: hidden for them right away. */
  reportedComments: ReadonlySet<number>;
  markCommentReported: (commentId: number) => void;
  block: (member: { id: number; name: string; avatar?: string }) => Promise<void>;
  unblock: (userId: number) => Promise<void>;
  refresh: () => Promise<void>;
  listError: string | null;
  notify: (notice: Notice) => void;
}

const EMPTY: ReadonlySet<number> = new Set<number>();

type State = { key: string; blocks: BlockedMember[]; loaded: boolean; error: string | null };

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

/**
 * Report/block state for the signed-in member (Core 1.0.67). The block list
 * is read once per session with the member's token, kept in memory only, and
 * read again after every block/unblock. Signing out or switching accounts
 * drops it (the key changes), so a list never leaks to the next member.
 */
export function SafetyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const token = user?.token || "";
  const key = token ? `${user?.id || 0}:${token}` : "";
  const [state, setState] = useState<State>({ key: "", blocks: [], loaded: false, error: null });
  const [reported, setReported] = useState<{ key: string; ids: ReadonlySet<number> }>({ key: "", ids: EMPTY });
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(key);
  useEffect(() => { keyRef.current = key; }, [key]);

  const settle = useCallback((forKey: string, outcome: { blocks: BlockedMember[] } | { error: unknown }) => {
    if (keyRef.current !== forKey) return;
    if ("blocks" in outcome) {
      setState({ key: forKey, blocks: outcome.blocks, loaded: true, error: null });
      return;
    }
    const message = outcome.error instanceof Error ? outcome.error.message : "Engellenen üyeler şu anda yüklenemedi.";
    // Keep what we already know (e.g. an optimistic block) and say the refresh failed.
    setState(prev => prev.key === forKey ? { ...prev, loaded: true, error: message } : { key: forKey, blocks: [], loaded: true, error: message });
  }, []);

  const load = useCallback((forKey: string, forToken: string) =>
    listBlocks(forToken).then(blocks => settle(forKey, { blocks }), error => settle(forKey, { error })), [settle]);

  // Once per member session; a new key (sign-in, sign-out, account switch) loads afresh.
  useEffect(() => {
    if (!key) return;
    listBlocks(token).then(blocks => settle(key, { blocks }), error => settle(key, { error }));
  }, [key, token, settle]);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const current = state.key === key && key ? state : null;
  const blocks = useMemo(() => current?.blocks ?? [], [current]);
  const blockedIds = useMemo<ReadonlySet<number>>(() => new Set(blocks.map(b => b.userId)), [blocks]);
  const reportedComments = reported.key === key && key ? reported.ids : EMPTY;

  const notify = useCallback((next: Notice) => {
    setNotice(next);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  const refresh = useCallback(async () => {
    if (key) await load(key, token);
  }, [key, token, load]);

  const block = useCallback(async (member: { id: number; name: string; avatar?: string }) => {
    const id = memberId(member.id);
    await blockMember(token, id);
    const forKey = key;
    setState(prev => {
      const base = prev.key === forKey ? prev : { key: forKey, blocks: [], loaded: false, error: null };
      if (base.blocks.some(b => b.userId === id)) return base;
      const added: BlockedMember = { userId: id, name: member.name || "Üye", avatar: member.avatar || "", blockedAt: new Date().toISOString() };
      return { ...base, blocks: [added, ...base.blocks] };
    });
    void load(forKey, token);
  }, [key, token, load]);

  const unblock = useCallback(async (userId: number) => {
    const id = memberId(userId);
    await unblockMember(token, id);
    const forKey = key;
    setState(prev => prev.key === forKey ? { ...prev, blocks: prev.blocks.filter(b => b.userId !== id) } : prev);
    void load(forKey, token);
  }, [key, token, load]);

  const markCommentReported = useCallback((commentId: number) => {
    const id = memberId(commentId);
    if (!id || !key) return;
    setReported(prev => {
      const ids = new Set(prev.key === key ? prev.ids : EMPTY);
      ids.add(id);
      return { key, ids };
    });
  }, [key]);

  const isBlocked = useCallback((authorId: unknown) => {
    const id = memberId(authorId);
    return id > 0 && blockedIds.has(id);
  }, [blockedIds]);

  const value = useMemo<SafetyContextType>(() => ({
    ready: !!current?.loaded,
    blocks,
    blockedIds,
    isBlocked,
    reportedComments,
    markCommentReported,
    block,
    unblock,
    refresh,
    listError: current?.error ?? null,
    notify,
  }), [current, blocks, blockedIds, isBlocked, reportedComments, markCommentReported, block, unblock, refresh, notify]);

  return (
    <SafetyContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[220] flex justify-center px-4 sm:bottom-6">
        {notice && (
          <div className="pointer-events-auto inline-flex max-w-md items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
            {notice.tone === "ok"
              ? <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              : <CircleAlert className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
            <span className="min-w-0">{notice.text}</span>
            {notice.href && notice.cta && (
              <Link href={notice.href} onClick={() => setNotice(null)} className="shrink-0 font-semibold text-white underline underline-offset-2 hover:text-white/80">
                {notice.cta}
              </Link>
            )}
            <button type="button" onClick={() => setNotice(null)} aria-label="Bildirimi kapat"
              className="-mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </SafetyContext.Provider>
  );
}

const NOOP: SafetyContextType = {
  ready: false,
  blocks: [],
  blockedIds: EMPTY,
  isBlocked: () => false,
  reportedComments: EMPTY,
  markCommentReported: () => {},
  block: async () => {},
  unblock: async () => {},
  refresh: async () => {},
  listError: null,
  notify: () => {},
};

/** Outside the provider (never in the app) everything is simply visible. */
export function useSafety(): SafetyContextType {
  return useContext(SafetyContext) ?? NOOP;
}
