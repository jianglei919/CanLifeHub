//应用启动时请求 /profile 恢复登录态
import { createContext, useState, useEffect } from 'react';
import { authApi } from '../src/api/http';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
 const [user, setUser] = useState(null);
 useEffect(() => {
    if (!user) {
        authApi.profile().then(({ data }) => {
            // 处理不同的返回格式
            const userData = data?.user || data;
            setUser(userData);
        }).catch(err => {
            console.error('Failed to fetch profile:', err);
        });
 }
}, [user])
    return (
        <UserContext.Provider value={{ user, setUser }} >
            {children}
        </UserContext.Provider>
    );
}