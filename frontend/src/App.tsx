import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import LLMConfiguration from './pages/LLMConfiguration'
import RallyIntegration from './pages/RallyIntegration'
import TestPlanGenerator from './pages/TestPlanGenerator'
import TestCaseGenerator from './pages/TestCaseGenerator'
import ReportsAnalytics from './pages/ReportsAnalytics'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <Router>
      <div className="app-container flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/connections/llm" element={<LLMConfiguration />} />
            <Route path="/connections/rally" element={<RallyIntegration />} />
            <Route path="/generator/test-plan" element={<TestPlanGenerator />} />
            <Route path="/generator/test-case" element={<TestCaseGenerator />} />
            <Route path="/reports" element={<ReportsAnalytics />} />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" />
    </Router>
  )
}

export default App
