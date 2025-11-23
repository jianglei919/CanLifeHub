/*全局路由与全局配置*/
import './App.css'                                   // 引入APP样式文件
import { Routes, Route, Navigate } from 'react-router-dom';    //Routes:路由容器,用来包裹所有<Route> Route:定义一条路径与组件的对应规则; 这两个必须写在 BrowserRouter 里
// import Navbar from '../src/components/Navbar.jsx';   // 导入导航栏组件（已移除）
import Register from '../src/pages/Register.jsx';    // 导入注册页面组件
import Login from '../src/pages/Login.jsx';          // 导入登录页面组件
import Dashboard from '../src/pages/Dashboard.jsx';// 导入用户仪表盘组件
import ForgotPassword from '../src/pages/ForgotPassword.jsx'; // 导入忘记密码页面
import ResetPassword from '../src/pages/ResetPassword.jsx';   // 导入重置密码页面
import axios from 'axios';                           // 引入 Axios 库，用于发送 HTTP 请求
import { Toaster } from 'react-hot-toast';          // 引入 react-hot-toast 库中的 Toaster 组件，用于显示通知
import { UserContextProvider, UserContext } from '../context/userContext'; // 导入用户上下文提供者组件
import { useContext } from 'react';

axios.defaults.baseURL = 'http://localhost:8000';    // 设置 Axios 的默认基础 URL，所有通过 Axios 发送的请求都会以这个 URL 为前缀
axios.defaults.withCredentials = true                // 配置 Axios 以在跨域请求中携带凭据（如 cookies）

// 已登录用户访问登录/注册时跳转回 Dashboard
function AuthGuard({ children }) {
  const { user } = useContext(UserContext);
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <UserContextProvider>
      <Toaster position='bottom-right' toastOptions={{ duration: 2000 }}/>
      <Routes>
        {/* 默认首页：Dashboard（免登录） */}
        <Route path="/" element={<Dashboard />} />
        {/* 可选别名：/dashboard 也指向 Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/register" element={<AuthGuard><Register /></AuthGuard>} />
        <Route path="/login" element={<AuthGuard><Login /></AuthGuard>} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 其余路径回到首页 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserContextProvider>
  );
}

export default App;                                  // 导出主界面组件函数，以便在其他文件中使用