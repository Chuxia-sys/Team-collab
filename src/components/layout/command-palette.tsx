'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Hash,
  FileText,
  Table2,
  Presentation,
  ListTodo,
  Users,
  Clock,
  Search,
} from 'lucide-react'

interface SearchResult {
  id: string
  name?: string
  title?: string
  email?: string
  status?: string
  priority?: string
  workspaceId?: string
  workspace?: { name: string }
  type?: string
  description?: string
}

interface SearchResults {
  channels?: SearchResult[]
  documents?: SearchResult[]
  spreadsheets?: SearchResult[]
  presentations?: SearchResult[]
  tasks?: SearchResult[]
  members?: SearchResult[]
}

const RECENT_SEARCHES_KEY = 'teamcollab-recent-searches'

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentSearches().filter((s) => s !== query)
    recent.unshift(query)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)))
  } catch {
    // ignore
  }
}

export function CommandPalette() {
  const { currentWorkspaceId, navigate, commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({})
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  // Search when query changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({})
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({ q: query })
        if (currentWorkspaceId) params.set('workspaceId', currentWorkspaceId)
        const res = await fetch(`/api/search?${params}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || {})
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, currentWorkspaceId])

  const handleSelect = useCallback(
    (type: string, item: SearchResult) => {
      addRecentSearch(query)
      setRecentSearches(getRecentSearches())

      switch (type) {
        case 'channel':
          if (item.workspaceId) {
            navigate('workspace', {
              workspaceId: item.workspaceId,
              channelId: item.id,
              subView: 'channel',
            })
          }
          break
        case 'document':
          if (item.workspaceId) {
            navigate('workspace', {
              workspaceId: item.workspaceId,
              documentId: item.id,
              subView: 'document-edit',
            })
          }
          break
        case 'spreadsheet':
          if (item.workspaceId) {
            navigate('workspace', {
              workspaceId: item.workspaceId,
              spreadsheetId: item.id,
              subView: 'spreadsheet-edit',
            })
          }
          break
        case 'presentation':
          if (item.workspaceId) {
            navigate('workspace', {
              workspaceId: item.workspaceId,
              presentationId: item.id,
              subView: 'presentation-edit',
            })
          }
          break
        case 'task':
          if (item.workspaceId) {
            navigate('workspace', {
              workspaceId: item.workspaceId,
              subView: 'tasks',
            })
          }
          break
        case 'member':
          if (currentWorkspaceId) {
            navigate('workspace', {
              workspaceId: currentWorkspaceId,
              subView: 'members',
            })
          }
          break
      }

      setCommandPaletteOpen(false)
      setQuery('')
    },
    [query, currentWorkspaceId, navigate, setCommandPaletteOpen]
  )

  const handleRecentSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)
  }, [])

  const hasResults =
    (results.channels?.length || 0) > 0 ||
    (results.documents?.length || 0) > 0 ||
    (results.spreadsheets?.length || 0) > 0 ||
    (results.presentations?.length || 0) > 0 ||
    (results.tasks?.length || 0) > 0 ||
    (results.members?.length || 0) > 0

  if (!user) return null

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={(isOpen) => {
        setCommandPaletteOpen(isOpen)
        if (!isOpen) {
          setQuery('')
          setResults({})
        }
      }}
      title="Search TeamCollab"
      description="Search across channels, documents, tasks, and members"
    >
      <CommandInput
        placeholder="Search channels, documents, tasks, members..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? 'Searching...' : query.length >= 2 ? 'No results found.' : 'Type at least 2 characters to search.'}
        </CommandEmpty>

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((search) => (
              <CommandItem
                key={search}
                onSelect={() => handleRecentSearch(search)}
                className="cursor-pointer"
              >
                <Clock className="size-4 text-muted-foreground" />
                <span>{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick navigation when no query */}
        {!query && user && (
          <CommandGroup heading="Quick Navigation">
            <CommandItem
              onSelect={() => {
                navigate('dashboard')
                setCommandPaletteOpen(false)
              }}
              className="cursor-pointer"
            >
              <Search className="size-4 text-muted-foreground" />
              <span>Go to Dashboard</span>
            </CommandItem>
            {currentWorkspaceId && (
              <>
                <CommandItem
                  onSelect={() => {
                    navigate('workspace', { workspaceId: currentWorkspaceId, subView: 'home' })
                    setCommandPaletteOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Hash className="size-4 text-muted-foreground" />
                  <span>Go to Workspace Home</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    navigate('workspace', { workspaceId: currentWorkspaceId, subView: 'tasks' })
                    setCommandPaletteOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <ListTodo className="size-4 text-muted-foreground" />
                  <span>Go to Tasks</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    navigate('workspace', { workspaceId: currentWorkspaceId, subView: 'members' })
                    setCommandPaletteOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Users className="size-4 text-muted-foreground" />
                  <span>Go to Members</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    navigate('workspace', { workspaceId: currentWorkspaceId, subView: 'documents' })
                    setCommandPaletteOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <span>Go to Documents</span>
                </CommandItem>
              </>
            )}
          </CommandGroup>
        )}

        {/* Search results */}
        {hasResults && (
          <>
            {results.channels && results.channels.length > 0 && (
              <CommandGroup heading="Channels">
                {results.channels.map((channel) => (
                  <CommandItem
                    key={channel.id}
                    onSelect={() => handleSelect('channel', channel)}
                    className="cursor-pointer"
                  >
                    <Hash className="size-4 text-muted-foreground" />
                    <span className="flex-1">{channel.name}</span>
                    {channel.workspace && (
                      <span className="text-xs text-muted-foreground">{channel.workspace.name}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.documents && results.documents.length > 0 && (
              <>
                {(results.channels?.length || 0) > 0 && <CommandSeparator />}
                <CommandGroup heading="Documents">
                  {results.documents.map((doc) => (
                    <CommandItem
                      key={doc.id}
                      onSelect={() => handleSelect('document', doc)}
                      className="cursor-pointer"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="flex-1">{doc.title}</span>
                      {doc.workspace && (
                        <span className="text-xs text-muted-foreground">{doc.workspace.name}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results.spreadsheets && results.spreadsheets.length > 0 && (
              <>
                {(results.channels?.length || 0) > 0 || (results.documents?.length || 0) > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading="Spreadsheets">
                  {results.spreadsheets.map((sheet) => (
                    <CommandItem
                      key={sheet.id}
                      onSelect={() => handleSelect('spreadsheet', sheet)}
                      className="cursor-pointer"
                    >
                      <Table2 className="size-4 text-muted-foreground" />
                      <span className="flex-1">{sheet.title}</span>
                      {sheet.workspace && (
                        <span className="text-xs text-muted-foreground">{sheet.workspace.name}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results.presentations && results.presentations.length > 0 && (
              <>
                {(results.channels?.length || 0) > 0 || (results.documents?.length || 0) > 0 || (results.spreadsheets?.length || 0) > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading="Presentations">
                  {results.presentations.map((pres) => (
                    <CommandItem
                      key={pres.id}
                      onSelect={() => handleSelect('presentation', pres)}
                      className="cursor-pointer"
                    >
                      <Presentation className="size-4 text-muted-foreground" />
                      <span className="flex-1">{pres.title}</span>
                      {pres.workspace && (
                        <span className="text-xs text-muted-foreground">{pres.workspace.name}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results.tasks && results.tasks.length > 0 && (
              <>
                {(results.channels?.length || 0) > 0 || (results.documents?.length || 0) > 0 || (results.spreadsheets?.length || 0) > 0 || (results.presentations?.length || 0) > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading="Tasks">
                  {results.tasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      onSelect={() => handleSelect('task', task)}
                      className="cursor-pointer"
                    >
                      <ListTodo className="size-4 text-muted-foreground" />
                      <span className="flex-1">{task.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{task.status?.replace('_', ' ')}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results.members && results.members.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Members">
                  {results.members.map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => handleSelect('member', member)}
                      className="cursor-pointer"
                    >
                      <Users className="size-4 text-muted-foreground" />
                      <span className="flex-1">{member.name}</span>
                      {member.email && (
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
