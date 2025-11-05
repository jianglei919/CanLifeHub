// 挂载 React、启用 React Router
import { StrictMode } from 'react'                   //开发期辅助组件,对其子树做额外检查,如额外调用一次某些生命周期/Effect(仅开发环境),提示弃用 API、潜在的危险用法
import { createRoot } from 'react-dom/client'        // React 18 及更高版本中用于创建根节点的函数
import './index.css'                                 // 引入全局样式文件
import App from './App.jsx'                          // 引入主应用组件
import { BrowserRouter as Router } from 'react-router-dom'  // 从路由库导入 BrowserRouter,根据 URL 的不同路径显示不同组件,让单页应用具有多页面的感觉

createRoot(document.getElementById('root')).render(         // 让 React 从零开始渲染整个应用到 HTML 页面上id为'root'的元素内,把 React 的虚拟 DOM 树映射到真实 DOM
  <StrictMode>
    <Router>                                               {/* 启用路由功能 */}

    <App />                                                {/* 渲染主应用组件 */}
    
    </Router>
  </StrictMode>,
)
