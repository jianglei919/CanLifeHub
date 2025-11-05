// 启动服务器、连 MongoDB、挂全局中间件与路由
const express = require('express');
const dotenv = require('dotenv').config();  //用于从 .env 文件加载环境变量，比如数据库密码
const cors = require('cors');               //CORS 允许浏览器端（例如 React 前端 http://localhost:5173）访问这个后端服务器
const mongoose = require('mongoose');       //用于连接和操作 MongoDB 数据库
const cookieParser = require('cookie-parser'); //用于解析请求中的 cookies
const app = express();                     // 创建 Express 应用实例

mongoose.connect(process.env.MONGODB_URL)   //连接到 MongoDB 数据库
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('MongoDB connection error:', err));

//middleware
app.use(express.json());                     // 解析 JSON 格式的请求体
app.use(cookieParser());                    // 解析请求中的 cookies
app.use(express.urlencoded({ extended: false })); // 解析 URL-encoded 格式的请求体


app.use('/', require('./routes/authRoutes'));   //当访问服务器根路径 / 时，使用 ./routes/authRoutes.js 文件中定义的路由

const PORT = 8000;                         // 服务器监听的端口号(后端)
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));  // 启动服务器并监听指定端口