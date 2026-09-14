import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { loadPostCatalog } from './game/posts'

// A bounded static JSON load; no CLI, model or credential dependency in the browser.
void loadPostCatalog().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
