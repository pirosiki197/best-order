import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import RootLayout from './layouts/RootLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RestaurantPage from './pages/RestaurantPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/restaurants/:id" element={<RestaurantPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
