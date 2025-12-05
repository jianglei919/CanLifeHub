// API/routes/authRoutes.js
// 负责接收前端（React 页面）发来的请求，并把请求转交给相应的“控制器（controller）”去处理
const express = require('express');
const router = express.Router();         //创建一个"路由对象（router）"
const { test, registerUser, loginUser, getProfile, getUserById, verifyEmail, resendVerification, forgotPassword, resetPassword, logout, updateProfile, uploadAvatar } = require('../controllers/authController');        //从 authController.js 文件中引入 test 函数
const { avatarUpload } = require('../helpers/uploadAdapter'); // 开发用本地，生产用 Cloudinary

// CORS 由全局中间件处理（app.js），此处无需重复配置

router.get('/', test);                    //当收到对根路径 / 的 GET 请求时，调用 test 函数处理请求
router.post('/register', registerUser);       //当收到对 /register 的 POST 请求时，调用 registerUser 函数处理请求
router.post('/login', loginUser);             //当收到对 /login 的 POST 请求时，调用 loginUser 函数处理请求
router.get('/profile', getProfile);           //当收到对 /profile 的 GET 请求时，调用 getProfile 函数处理请求
router.get('/users/:id', getUserById);        //当收到对 /users/:id 的 GET 请求时，调用 getUserById 函数处理请求
router.post('/verify', verifyEmail);          //当收到对 /verify 的 POST 请求时，调用 verifyEmail 函数处理请求
router.post('/resend-verification', resendVerification); //当收到对 /resend-verification 的 POST 请求时，调用 resendVerification 函数处理请求
router.post('/forgot-password', forgotPassword); //当收到对 /forgot-password 的 POST 请求时，调用 forgotPassword 函数处理请求
router.post('/reset-password', resetPassword);   //当收到对 /reset-password 的 POST 请求时，调用 resetPassword 函数处理请求
router.post('/logout', logout);                  //当收到对 /logout 的 POST 请求时，调用 logout 函数处理请求
router.put('/update-profile', updateProfile);    //当收到对 /update-profile 的 PUT 请求时，调用 updateProfile 函数处理请求
router.post('/upload-avatar', avatarUpload.single('avatar'), uploadAvatar); //当收到对 /upload-avatar 的 POST 请求时，调用 uploadAvatar 函数处理请求

module.exports = router;                      //导出 router，供外部文件（例如 index.js）使用