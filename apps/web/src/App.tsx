import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Chat } from './pages/Chat'
import { Upload } from './pages/Upload'

export function App() {
  return (
    <BrowserRouter>
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
