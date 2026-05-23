import Header from '@/components/Haeder'
import MobileNav from '@/components/MobileNav'
import ScrollToTop from '@/components/ScrollToTop'
import { Outlet } from 'react-router-dom'

function RootLayout() {
  return (
    <div className="bg-background pb-15">
      <ScrollToTop />

      <Header />

      <div className="mx-auto min-h-screen max-w-2xl">
        <Outlet />
      </div>

      <MobileNav />
    </div>
  )
}

export default RootLayout
