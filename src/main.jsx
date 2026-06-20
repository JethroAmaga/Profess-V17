import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// StrictMode was double-mounting on first load in dev (mount → unmount →
// mount), which replayed the intro text's entrance animation twice — the
// first pass got cut off mid-way, reading as a stutter/bug.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
