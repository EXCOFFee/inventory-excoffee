/**
 * Hook para manejar paginación
 */

import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps {
  totalItems: number;
  initialPage?: number;
  initialLimit?: number;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  getPageNumbers: () => number[];
}

export function usePagination({
  totalItems,
  initialPage = 1,
  initialLimit = 10,
}: UsePaginationProps): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const totalPages = useMemo(() => Math.ceil(totalItems / limit), [totalItems, limit]);
  
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  const startIndex = useMemo(() => (page - 1) * limit, [page, limit]);
  const endIndex = useMemo(
    () => Math.min(startIndex + limit - 1, totalItems - 1),
    [startIndex, limit, totalItems]
  );

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.max(1, Math.min(newPage, totalPages || 1)));
    },
    [totalPages]
  );

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1); // Reset a primera página al cambiar límite
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPageState((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPageState((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const firstPage = useCallback(() => setPageState(1), []);
  const lastPage = useCallback(() => setPageState(totalPages), [totalPages]);

  const getPageNumbers = useCallback(() => {
    const pages: number[] = [];
    const showPages = 5; // Número de páginas a mostrar
    
    let start = Math.max(1, page - Math.floor(showPages / 2));
    const end = Math.min(totalPages, start + showPages - 1);
    
    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [page, totalPages]);

  return {
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    getPageNumbers,
  };
}
