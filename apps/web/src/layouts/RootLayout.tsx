import Header from '@/components/Haeder'
import MobileNav from '@/components/MobileNav'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <div className="bg-background">
      <Header />

      <div className="mx-auto min-h-screen max-w-2xl pb-15">
        <Outlet />
      </div>

      <MobileNav />
    </div>
  )
}

export default RootLayout
