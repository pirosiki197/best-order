import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import RootLayout from './layouts/RootLayout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RestaurantPage from './pages/RestaurantPage'
import NewRestaurantPage from './pages/NewRestaurantPage'
import { APIProvider } from '@vis.gl/react-google-maps'

const queryClient = new QueryClient()

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return (
    <QueryClientProvider client={queryClient}>
      <APIProvider apiKey={apiKey}>
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/restaurants/:id" element={<RestaurantPage />} />
              <Route path="/restaurants/new" element={<NewRestaurantPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </APIProvider>
    </QueryClientProvider>
  )
}

export default App
