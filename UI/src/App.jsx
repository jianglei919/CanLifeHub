/*全局路由与全局配置*/
import './App.css'                                   // 引入APP样式文件
import { Routes, Route } from 'react-router-dom';    //Routes:路由容器,用来包裹所有<Route> Route:定义一条路径与组件的对应规则; 这两个必须写在 BrowserRouter 里
import Navbar from '../src/components/Navbar.jsx';   // 导入导航栏组件
import Home from '../src/pages/Home.jsx';            // 导入首页组件
import Register from '../src/pages/Register.jsx';    // 导入注册页面组件
import Login from '../src/pages/Login.jsx';          // 导入登录页面组件
import Dashboard from '../src/pages/Dashboard.jsx';// 导入用户仪表盘组件
import axios from 'axios';                           // 引入 Axios 库，用于发送 HTTP 请求
import { Toaster } from 'react-hot-toast';          // 引入 react-hot-toast 库中的 Toaster 组件，用于显示通知
import { UserContextProvider } from '../context/userContext'; // 导入用户上下文提供者组件

axios.defaults.baseURL = 'http://localhost:8000';    // 设置 Axios 的默认基础 URL，所有通过 Axios 发送的请求都会以这个 URL 为前缀
axios.defaults.withCredentials = true                // 配置 Axios 以在跨域请求中携带凭据（如 cookies）

function App() {                                     // 主界面组件函数
  return (                                           //React 函数组件必须返回 JSX
    <UserContextProvider>                      {/* 使用用户上下文提供者包裹应用，以便在组件树中共享用户状态 */}
    <Navbar />
    <Toaster position='bottom-right' toastOptions={{ duration: 2000 }}/>                                      {/* 用于在应用中显示通知的组件 */}
    <Routes>                                         {/* 定义路由规则的容器 */}
      <Route path="/" element={<Home />} />          {/* 当 URL 是 /（网站根路径）时，渲染 <Home /> 组件 */}
      <Route path="/register" element={<Register />} /> 
      <Route path="/login" element={<Login />} /> 
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
    </UserContextProvider>
  )
}

export default App;                                  // 导出主界面组件函数，以便在其他文件中使用