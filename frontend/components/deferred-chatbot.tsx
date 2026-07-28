'use client';

import dynamic from 'next/dynamic';

/**
 * Mounted in the root layout, so it is on every route. It no longer bundles the
 * Gemini SDK — that call moved to POST /api/chat and the dependency is gone —
 * but the widget is still below the fold on first paint and has no business in
 * the initial chunk. Lazy and client-only.
 */
const QnAChatbot = dynamic(() => import('@/components/qna-chatbot').then((m) => m.QnAChatbot), {
  ssr: false,
  loading: () => null,
});

export function DeferredChatbot() {
  return <QnAChatbot />;
}
