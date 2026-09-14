import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { loadPostCatalog } from './game/posts'

// A bounded static JSON load; no CLI, model or credential dependency in the browser.
void loadPostCatalog().then(count => {
  const root = ReactDOM.createRoot(document.getElementById('root')!)
  if (count < 2) {
    root.render(<main className="game-page"><section className="content-card invalid-card"><h1>帖子池暂不可用</h1><p>至少需要两篇通过筛选的知乎回答。请重新运行独立导入器后刷新页面。</p></section></main>)
    return
  }
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
