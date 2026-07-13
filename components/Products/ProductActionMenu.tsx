'use client'

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/SupabaseClient'
import {
  MoreHorizontalIcon,
  Edit01Icon,
  Delete01Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const MENU_WIDTH = 140 // matches w-48

export default function ProductActionMenu({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return

    const rect = btn.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? 170
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < menuHeight + 12

    setPosition({
      top: openUp ? rect.top - menuHeight - 8 : rect.bottom + 8,
      left: Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8),
    })
  }, [])

  // Recompute position whenever the menu opens, and track scroll/resize
  // while it's open so it doesn't drift away from the button.
  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()

    const handle = () => updatePosition()
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [isOpen, updatePosition])

  // Close on outside click — checks both the button and the portaled menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedButton = buttonRef.current?.contains(target)
      const clickedMenu = menuRef.current?.contains(target)
      if (!clickedButton && !clickedMenu) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product?')) {
      setIsDeleting(true)
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', productId)
      setIsDeleting(false)
      setIsOpen(false)
      if (!error) {
        router.refresh()
      } else {
        alert('Failed to delete product: ' + error.message)
      }
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isDeleting}
        className="p-2 text-gray-600 hover:text-black hover:bg-zinc-300/80 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        aria-label="Product actions"
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
      </button>

      {mounted &&
        isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: position.top, left: position.left, width: MENU_WIDTH }}
            className="w-fit rounded-xl bg-gray-100 shadow-lg z-50 overflow-hidden border border-gray-200"
          >
            <div>
              <Link
                href={`/dashboard/products/edit/${productId}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 font-general font-medium hover:bg-gray-200 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2}/>
                Edit
              </Link>
              <Link
                href={`/dashboard/products?info=${productId}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 font-general font-medium hover:bg-zinc-300 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HugeiconsIcon icon={InformationCircleIcon} size={16} strokeWidth={2}/>
                More info
              </Link>
              <hr className="border-zinc-400" />
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50 cursor-pointer"
              >
                <HugeiconsIcon icon={Delete01Icon} size={16} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}