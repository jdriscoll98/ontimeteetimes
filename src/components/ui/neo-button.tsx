import { ClassValue } from 'clsx'

import { cn } from '@/lib/utils'
import { LoaderIcon } from 'lucide-react'

type Props = {
  className?: ClassValue
  children: React.ReactNode
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  loading?: boolean
}

export default function NeoButton({ className, children, onClick, loading }: Props) {
  return (
    <button
      role="button"
      aria-label="Click to perform an action"
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center rounded-base border-2 border-black bg-main px-10 py-3 font-base shadow-base transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
        className,
      )}
    >
      {loading ? <LoaderIcon /> : children}
    </button>
  )
}