'use client'

import { useRef } from 'react'
import { Paperclip, X, FileText, Image as ImageIcon, Download } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────

function isPdf(nameOrUrl: string) {
  return nameOrUrl.toLowerCase().endsWith('.pdf')
}

function displayName(url: string) {
  const raw = url.split('/').pop()?.split('?')[0] ?? 'attachment'
  // strip the timestamp prefix added during upload (e.g. "1719123456789-")
  return raw.replace(/^\d{10,}-/, '')
}

// ── AttachmentUploader ──────────────────────────────────────────────
// Used inside modals — manages pending new files + existing kept URLs.

interface UploaderProps {
  /** URLs already saved in the DB (for edit mode). */
  existingUrls: string[]
  onRemoveExisting: (idx: number) => void
  /** New File objects the user has picked this session. */
  pendingFiles: File[]
  onAddFiles: (files: File[]) => void
  onRemovePending: (idx: number) => void
  disabled?: boolean
}

export function AttachmentUploader({
  existingUrls,
  onRemoveExisting,
  pendingFiles,
  onAddFiles,
  onRemovePending,
  disabled,
}: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasAny = existingUrls.length > 0 || pendingFiles.length > 0

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Attachments</p>

      {hasAny && (
        <div className="flex flex-col gap-1.5 mb-3">
          {/* Saved attachments */}
          {existingUrls.map((url, idx) => {
            const Icon = isPdf(url) ? FileText : ImageIcon
            return (
              <div
                key={url}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-100"
              >
                <Icon className="w-4 h-4 text-sky-500 shrink-0" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-xs text-sky-700 hover:text-sky-900 font-medium truncate"
                >
                  {displayName(url)}
                </a>
                <a
                  href={url}
                  download
                  className="text-sky-400 hover:text-sky-600 transition-colors shrink-0"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveExisting(idx)}
                  disabled={disabled}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}

          {/* Pending new files */}
          {pendingFiles.map((file, idx) => {
            const Icon = isPdf(file.name) ? FileText : ImageIcon
            return (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100"
              >
                <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="flex-1 text-xs text-amber-700 font-medium truncate">{file.name}</span>
                <span className="text-[10px] text-amber-400 shrink-0">uploading on save</span>
                <button
                  type="button"
                  onClick={() => onRemovePending(idx)}
                  disabled={disabled}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-sky-400 hover:text-sky-600 transition-colors w-fit"
      >
        <Paperclip className="w-4 h-4" />
        Add attachment
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onAddFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── AttachmentChips ─────────────────────────────────────────────────
// Used on item cards — read-only, clickable chips to open/download files.

interface ChipsProps {
  urls: string[]
  /** stopPropagation needed when chips are inside a Link or clickable card. */
  stopPropagation?: boolean
}

export function AttachmentChips({ urls, stopPropagation }: ChipsProps) {
  if (!urls || urls.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-gray-50">
      <Paperclip className="w-3 h-3 text-sky-400 shrink-0" />
      {urls.map((url, idx) => {
        const pdf = isPdf(url)
        const name = displayName(url)
        const short = name.length > 22 ? name.slice(0, 19) + '…' : name
        return (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-[11px] font-medium text-sky-600 hover:bg-sky-100 hover:border-sky-300 transition-colors"
          >
            {pdf ? '📄' : '🖼️'} {short}
          </a>
        )
      })}
    </div>
  )
}
