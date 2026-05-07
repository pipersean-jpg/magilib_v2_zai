'use client'
import { useState } from 'react'
import { FORMAT_OPTIONS, MAGIC_TOPICS } from '@/lib/constants'
import type { LibraryFilterState, SortKey } from '@/lib/libraryFilter'

interface LibraryFiltersProps {
  state: LibraryFilterState
  onFormatChange: (v: string) => void
  onToggleSigned: () => void
  onToggleLimited: () => void
  onToggleHasArchive: () => void
  onToggleHasMagicRef: () => void
  onTopicsChange: (topics: string[]) => void
  onSortChange: (sort: SortKey) => void
}

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'date_added_newest', label: 'Newest added' },
  { value: 'date_added_oldest', label: 'Oldest added' },
  { value: 'title_az', label: 'Title A–Z' },
  { value: 'title_za', label: 'Title Z–A' },
  { value: 'year_newest', label: 'Year newest' },
  { value: 'year_oldest', label: 'Year oldest' },
]

interface ToggleChipProps {
  active: boolean
  onClick: () => void
  label: string
  testId?: string
}

function ToggleChip({ active, onClick, label, testId }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={[
        'shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function LibraryFilters({
  state,
  onFormatChange,
  onToggleSigned,
  onToggleLimited,
  onToggleHasArchive,
  onToggleHasMagicRef,
  onTopicsChange,
  onSortChange,
}: LibraryFiltersProps) {
  const [topicsOpen, setTopicsOpen] = useState(false)

  function handleTopicToggle(value: string) {
    const next = state.topics.includes(value)
      ? state.topics.filter((t) => t !== value)
      : [...state.topics, value]
    onTopicsChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Scrollable chip row */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {/* Format */}
        <select
          value={state.format}
          onChange={(e) => onFormatChange(e.target.value)}
          data-testid="filter-format"
          className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-600 focus:outline-none focus:border-stone-500"
        >
          <option value="">All formats</option>
          {FORMAT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <ToggleChip
          active={state.signed}
          onClick={onToggleSigned}
          label="Signed"
          testId="filter-signed"
        />
        <ToggleChip
          active={state.limited}
          onClick={onToggleLimited}
          label="Limited"
          testId="filter-limited"
        />
        <ToggleChip
          active={state.hasArchive}
          onClick={onToggleHasArchive}
          label="Archive link"
          testId="filter-archive"
        />
        <ToggleChip
          active={state.hasMagicRef}
          onClick={onToggleHasMagicRef}
          label="MagicRef link"
          testId="filter-magicref"
        />

        {/* Topics expander trigger */}
        <button
          type="button"
          onClick={() => setTopicsOpen((o) => !o)}
          data-testid="filter-topics-toggle"
          className={[
            'shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            state.topics.length > 0
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500',
          ].join(' ')}
        >
          Topics{state.topics.length > 0 ? ` (${state.topics.length})` : ''}{' '}
          {topicsOpen ? '▲' : '▼'}
        </button>

        {/* Sort */}
        <select
          value={state.sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          data-testid="filter-sort"
          className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-600 focus:outline-none focus:border-stone-500"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Topics expander — vertical list, scrollable, mobile-safe */}
      {topicsOpen && (
        <div
          className="rounded-lg border border-stone-200 bg-white p-3 max-h-52 overflow-y-auto"
          data-testid="filter-topics-panel"
        >
          <p className="text-xs font-medium text-stone-500 mb-2">Topics</p>
          <div className="flex flex-col gap-2">
            {MAGIC_TOPICS.map((topic) => {
              const checked = state.topics.includes(topic.value)
              return (
                <label key={topic.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleTopicToggle(topic.value)}
                    data-testid={`topic-${topic.value}`}
                    className="h-4 w-4 rounded border-stone-300 accent-stone-900"
                  />
                  <span className="text-sm text-stone-700">{topic.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
