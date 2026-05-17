import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="bg-background/95 border-border sticky top-0 z-40 border-b px-3 py-4">
      <Link to="/" className="text-primary font-bold">
        My Best Order
      </Link>
    </header>
  )
}

export default Header
