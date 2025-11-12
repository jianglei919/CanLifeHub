// 负责接收前端（React 页面）发来的请求，并把请求转交给相应的“控制器（controller）”去处理
const express = require('express');
const router = express.Router();         //创建一个“路由对象（router）”
const cors = require('cors');            //CORS 允许浏览器端（例如 React 前端 http://localhost:5173）访问这个后端服务器
const { test, registerUser, loginUser, getProfile, verifyEmail, resendVerification, forgotPassword, resetPassword } = require('../controllers/authController');        //从 authController.js 文件中引入 test 函数


  //middleware
  router.use(                            //用 CORS 中间件，允许跨域访问. 当 React 前端调用 fetch('http://localhost:8000/') 时，服务器不会拒绝跨域
    cors({
        credentials: true,               //允许携带凭证（如 cookies）
        origin: 'http://localhost:5173'  //只允许来自这个前端地址（你的 React 应用）发起请求
    }) 
)

router.get('/', test);                    //当收到对根路径 / 的 GET 请求时，调用 test 函数处理请求
router.post('/register', registerUser);       //当收到对 /register 的 POST 请求时，调用 registerUser 函数处理请求
router.post('/login', loginUser);             //当收到对 /login 的 POST 请求时，调用 loginUser 函数处理请求
router.get('/profile', getProfile);           //当收到对 /profile 的 GET 请求时，调用 getProfile 函数处理请求
router.post('/verify', verifyEmail);          //当收到对 /verify 的 POST 请求时，调用 verifyEmail 函数处理请求
router.post('/resend-verification', resendVerification); //当收到对 /resend-verification 的 POST 请求时，调用 resendVerification 函数处理请求
router.post('/forgot-password', forgotPassword); //当收到对 /forgot-password 的 POST 请求时，调用 forgotPassword 函数处理请求
router.post('/reset-password', resetPassword);   //当收到对 /reset-password 的 POST 请求时，调用 resetPassword 函数处理请求

module.exports = router;                      //导出 router，供外部文件（例如 index.js）使用