import { Link } from 'react-router-dom'
import { House, CirclePlus } from 'lucide-react'

const navItems = [
  { href: '/', label: 'ホーム', icon: <House className="h-5 w-5" /> },
  { href: '/restaurants/new', label: '追加', icon: <CirclePlus className="h-5 w-5" /> },
]

function MobileNav() {
  return (
    <nav className="border-border bg-background/95 fixed bottom-0 left-0 z-50 h-14 w-full border-t py-2">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="text-muted-foreground flex flex-col items-center justify-center"
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
