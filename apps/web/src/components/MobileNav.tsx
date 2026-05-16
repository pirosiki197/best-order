import { Link } from 'react-router-dom'

const navItems = [
  { href: '/', label: 'ホーム' },
  { href: '/restaurants/new', label: '追加' },
]

function MobileNav() {
  return (
    <nav className="border-border bg-card fixed right-0 bottom-0 left-0 z-50 border-t py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex flex-col items-center justify-center"
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
