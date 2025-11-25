import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Network,
  SquareFunction,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({})

  const closeSheet = () => setIsOpen(false)

  return (
    <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-gray-700 text-white">
            <Menu size={24} />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-gray-900 border-r-gray-800 text-white p-0">
          <SheetHeader className="p-4 border-b border-gray-700">
            <SheetTitle className="text-white">Navigation</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 p-4 overflow-y-auto">
            <Link
              to="/"
              onClick={closeSheet}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <Home size={20} />
              <span className="font-medium">Home</span>
            </Link>

            {/* Demo Links Start */}

            <Link
              to="/demo/start/server-funcs"
              onClick={closeSheet}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <SquareFunction size={20} />
              <span className="font-medium">Start - Server Functions</span>
            </Link>

            <Link
              to="/demo/start/api-request"
              onClick={closeSheet}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <Network size={20} />
              <span className="font-medium">Start - API Request</span>
            </Link>

            <Collapsible
              open={groupedExpanded.StartSSRDemo}
              onOpenChange={(open) =>
                setGroupedExpanded((prev) => ({ ...prev, StartSSRDemo: open }))
              }
            >
              <div className="flex items-center justify-between mb-2">
                <Link
                  to="/demo/start/ssr"
                  onClick={closeSheet}
                  className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                  activeProps={{
                    className:
                      'flex-1 flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">Start - SSR Demos</span>
                </Link>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-800 text-white ml-2">
                    {groupedExpanded.StartSSRDemo ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="flex flex-col ml-4 border-l border-gray-700 pl-2">
                <Link
                  to="/demo/start/ssr/spa-mode"
                  onClick={closeSheet}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">SPA Mode</span>
                </Link>

                <Link
                  to="/demo/start/ssr/full-ssr"
                  onClick={closeSheet}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">Full SSR</span>
                </Link>

                <Link
                  to="/demo/start/ssr/data-only"
                  onClick={closeSheet}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">Data Only</span>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            {/* Demo Links End */}
          </nav>
        </SheetContent>
      </Sheet>
      <h1 className="ml-4 text-xl font-semibold">
        <Link to="/">
          <img
            src="/tanstack-word-logo-white.svg"
            alt="TanStack Logo"
            className="h-10"
          />
        </Link>
      </h1>
    </header>
  )
}
