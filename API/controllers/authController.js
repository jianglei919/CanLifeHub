// API/controllers/authController.js
//负责告诉服务器“请求到达时要干什么”, 业务逻辑（注册、登录、获取个人信息）
const User = require('../models/user');  //引入用户模型
const { hashPassword, comparePassword } = require('../helpers/auth'); //引入密码哈希函数, 用于加密密码与验证密码是否匹配
const jwt = require('jsonwebtoken'); // 引入 jsonwebtoken，用于生成（sign）和验证（verify）JWT token
const { get } = require('mongoose');

// ===================== 测试用接口 =====================
const test = (req, res) => {   //定义一个名为 test 的函数，接收请求对象 req 和响应对象 res 作为参数
    res.json('test is working!')
}

// ===================== 注册接口 /register =====================
// Register Endpoint
const registerUser = async (req, res) => {
   try {
       const { name, email, password } = req.body; // 从前端传来的请求体（req.body）中解构出 name、email、password
       // Step 1. 检查是否填写了 name
       if (!name) {
           return res.json({
            error: 'Name is required' 
        });
       }
       // Step 2. 检查密码合法性
         if (!password || password.length < 6) {
            return res.json({
                error: 'Password is required and should be at least 6 characters long'
            })
         };
       // Step 3. 检查邮箱是否已注册
       const exist = await User.findOne({ email });
       if (exist) {
        return res.json({
            error: 'Email is taken already'
        });
       }

       // Step 4. 哈希密码
       const hashedPassword = await hashPassword(password); // 使用 bcrypt 封装的 hashPassword 对明文密码进行加密

       // Step 5. 创建并保存用户, 写入数据库
       const user = await User.create({
           name, 
           email, 
           password: hashedPassword,
        });
        
       // Step 6. 返回结果
       // 直接返回新创建的用户对象（默认会包含 _id、name、email 等）
        return res.json(user);

   } catch (error) {
       console.log(error);
   }
}


// ===================== 登录接口 /login =====================
// Login Endpoint
const loginUser = async (req, res) => {
 try {
    const { email, password } = req.body;  // 从请求体中解构出 email 和 password

    // Step 1. 检查邮箱是否存在
    const user = await User.findOne({ email }); // 在数据库中查找该邮箱用户
    if (!user) {
        return res.json({
            error: 'No user found'
        });
    }

    // Step 2. 检查密码是否正确
    const match = await comparePassword(password, user.password);

    if (match) {
    // Step 3. 密码正确则生成 JWT
    // 生成包含 email、id、name 的 token (payload)
        jwt.sign(
         { email: user.email, id: user._id, name: user.name }, // payload
          process.env.JWT_SECRET,                              // 加密密钥，从 .env 文件读取
          {},                                                  // 可选配置 (如过期时间)
          (err, token) => {                                    // 回调函数，当 token 生成后执行
          if (err) throw err;                                  // 如果出错则抛出
    // Step 4. 设置 Cookie 并返回用户信息
          res.cookie('token', token).json(user)                // 把 token 存进浏览器 Cookie 中，以维持登录状态
    })
     }
    
    // Step 5. 密码错误
    if (!match) {
        res.json({
            error: 'Wrong password'
        });
    }
 } catch (error) {
    console.log(error);
 }

}

// ===================== 获取用户个人信息接口 /profile =====================
const getProfile = (req, res) => {
const {token} = req.cookies               // 从请求头中读取 Cookie (前端 axios 请求带上了 withCredentials)
if(token){
    // Step 1. 验证 JWT
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) =>{
        if (err) throw err;
    // Step 2. 返回解码后的用户信息
        res.json(user)
    })
} else {
    // Step 3. 未登录或无 token
    res.json(null)
}
}

module.exports = {             //把 test 函数导出，让其他文件可以使用
    test,
    registerUser,
    loginUser,
    getProfile
}