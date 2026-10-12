import { ArrowRight } from 'lucide-react'

// Renders text with "→" separators as Lucide arrow icons instead of the glyph.
export function ArrowText({ text }: { text: string }) {
  return (
    <>
      {text.split('→').map((part, index) => (
        <span key={index}>
          {index > 0 && <ArrowRight aria-hidden="true" className="mx-1 inline-block size-3.5 align-[-2px]" />}
          {part}
        </span>
      ))}
    </>
  )
}
