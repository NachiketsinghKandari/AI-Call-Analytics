'use client';

import { useEffect } from 'react';

export default function VisitLogger() {
  useEffect(() => {
    if (sessionStorage.getItem('visit-logged')) return;
    sessionStorage.setItem('visit-logged', '1');
    fetch('/api/log-visit', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}
