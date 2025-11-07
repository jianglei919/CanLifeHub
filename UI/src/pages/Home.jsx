// UI/src/pages/Home.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="hero">
      <h1>让生活更有掌控感</h1>
      <p>
        CanLifeHub 为你提供简单而强大的工具，管理账户、追踪目标，连接你关心的一切。
        极简而不简单的体验，从这里开始。
      </p>
      <div className="actions">
        <Link to="/register" className="btn btn-primary" style={{ width: 'auto' }}>免费注册</Link>
        <Link to="/login" className="btn btn-secondary" style={{ width: 'auto' }}>已有账号？登录</Link>
      </div>
    </div>
  )
}
