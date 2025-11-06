import { useState } from "react";      // 导入 useState 钩子函数，用于在函数组件中添加状态管理(React 组件默认每次重新渲染都会重新执行函数、变量会被清空。但用 useState() 创建的值不会被清空，它能“保留下来”)
import axios from "axios";            // 导入 axios 库，用于发送 HTTP 请求
import { toast } from 'react-hot-toast'; // 导入 react-hot-toast 库，用于显示通知消息
import { useNavigate } from "react-router-dom"; // 导入 useNavigate 钩子函数，用于在组件中进行编程式导航

export default function Login() {      // 表示这是模块的默认导出,别人可以这样导入: import Navbar from './Login';
  const navigate = useNavigate();   // 使用 useNavigate 钩子函数获取导航函数
  const [data, setData] = useState({    // 使用 useState 钩子函数创建 [当前状态值,更新该状态的函数]，初始值是一个包含 email 和 password 的对象
    email: "",
    password: "",
  })

 const [showPassword, setShowPassword] = useState(false); // ← 新增：是否显示密码

 const loginUser = async (e) => {           // 定义一个名为 loginUser 的函数，用于处理登录表单的提交事件
    e.preventDefault();               // 阻止表单的默认提交行为，防止页面刷新  e是表单事件对象
      const { email, password } = data;   // 从 data 对象中解构出 email 和 password
      try {
        const { data } = await axios.post('/login', {
          email,
          password 
        });  // 使用 axios 发送 POST 请求到后端登录接口，传递 email 和 password
        if(data.error) {
          toast.error(data.error);
        } else {
          setData({ email: "", password: ""});  // 清空表单数据
          navigate('/dashboard');  // 编程式导航到Dashboard
        }
      } catch (error) {
        
      }
 }

  return (
    <div>
      <form onSubmit={loginUser}>     {/* 当表单提交时，调用 loginUser 函数 */}
        <label>Email </label>
        {/* 普通文本输入框， 提示文字,                输入框当前状态值=data.email,  每次用户输入时触发,它接收一个事件对象e       */}
        <input type="text" placeholder='enter Email' value={data.email}           onChange={ (e) => setData({...data, email: e.target.value})} />  <br/>

        <label>Password </label>
        <input type="password" placeholder='enter password' value={data.password} onChange={ (e) => setData({...data, password: e.target.value})} />  <br/>

        <button type='submit'>Login</button>
      </form>
    </div>
  )
}
