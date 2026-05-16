import Header from '@/components/Haeder'
import MobileNav from '@/components/MobileNav'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <div className="bg-background">
      <Header />

      <div className="min-h-screen pb-15">
        <Outlet />
      </div>

      <MobileNav />
    </div>
  )
}

export default RootLayout
