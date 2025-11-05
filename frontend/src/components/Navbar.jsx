import { Link } from 'react-router-dom';
export default function Navbar() {         // 表示这是模块的默认导出,别人可以这样导入: import Navbar from './Navbar';
  return (                                 //React 函数组件必须返回 JSX
    
    <nav>
      <Link to="/">Home</Link>{/*跳转到首页（path="/"）, /路径在 App.jsx 中定义*/}
      <Link to="/register">Register</Link>
      <Link to="/login">Login</Link>
    </nav>

  );
}