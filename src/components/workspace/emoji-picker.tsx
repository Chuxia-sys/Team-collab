'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '⭐', '🌟', '✨', '💫', '🔥', '💯', '🎯', '🚀', '💡', '📌', '📎', '📝', '✅', '❌', '⚠️', '🔔', '🎵', '🎶'],
  'Nature': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌿', '🍀', '🍁', '🍂', '🍃', '🌈', '☀️', '🌙', '⭐', '🌊', '❄️', '☃️'],
}

const CATEGORY_ICONS: Record<string, string> = {
  'Smileys': '😀',
  'Gestures': '👋',
  'Hearts': '❤️',
  'Objects': '🎉',
  'Nature': '🌸',
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEmojis = useMemo(() => {
    if (!searchQuery) return EMOJI_CATEGORIES[activeCategory] || []
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat()
    // Simple search: just return all if searching since we don't have emoji names
    return allEmojis
  }, [activeCategory, searchQuery])

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground', className)}
          type="button"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 z-50"
        align="end"
        side="top"
        sideOffset={8}
      >
        {/* Category Tabs */}
        <div className="flex items-center border-b px-1 pt-1">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              className={cn(
                'flex-1 py-1.5 text-center text-sm transition-colors hover:bg-accent rounded-sm',
                activeCategory === category && 'bg-accent'
              )}
              onClick={() => {
                setActiveCategory(category)
                setSearchQuery('')
              }}
              type="button"
            >
              {CATEGORY_ICONS[category]}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="p-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + (searchQuery ? '-search' : '')}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto"
            >
              {filteredEmojis.map((emoji) => (
                <button
                  key={emoji}
                  className="flex items-center justify-center h-8 w-8 rounded hover:bg-accent transition-colors text-lg cursor-pointer"
                  onClick={() => handleEmojiClick(emoji)}
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Category Label */}
        <div className="border-t px-3 py-1.5">
          <p className="text-xs text-muted-foreground">{activeCategory}</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
