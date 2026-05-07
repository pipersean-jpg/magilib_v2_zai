'use client'
import { useState, useMemo } from 'react'
import {
  applyLibraryFilter,
  hasActiveFilters,
  DEFAULT_FILTER_STATE,
  type LibraryFilterState,
  type SortKey,
} from '@/lib/libraryFilter'
import type { Book } from '@/types/book'

export function useLibraryFilter(books: Book[]) {
  const [filterState, setFilterState] = useState<LibraryFilterState>(DEFAULT_FILTER_STATE)

  const filteredBooks = useMemo(
    () => applyLibraryFilter(books, filterState),
    [books, filterState],
  )

  function setQuery(query: string) {
    setFilterState((s) => ({ ...s, query }))
  }

  function setFormat(format: string) {
    setFilterState((s) => ({ ...s, format }))
  }

  function toggleSigned() {
    setFilterState((s) => ({ ...s, signed: !s.signed }))
  }

  function toggleLimited() {
    setFilterState((s) => ({ ...s, limited: !s.limited }))
  }

  function toggleHasArchive() {
    setFilterState((s) => ({ ...s, hasArchive: !s.hasArchive }))
  }

  function toggleHasMagicRef() {
    setFilterState((s) => ({ ...s, hasMagicRef: !s.hasMagicRef }))
  }

  function setTopics(topics: string[]) {
    setFilterState((s) => ({ ...s, topics }))
  }

  function setSort(sort: SortKey) {
    setFilterState((s) => ({ ...s, sort }))
  }

  function clearFilters() {
    setFilterState(DEFAULT_FILTER_STATE)
  }

  return {
    filterState,
    filteredBooks,
    isFiltered: hasActiveFilters(filterState),
    setQuery,
    setFormat,
    toggleSigned,
    toggleLimited,
    toggleHasArchive,
    toggleHasMagicRef,
    setTopics,
    setSort,
    clearFilters,
  }
}
