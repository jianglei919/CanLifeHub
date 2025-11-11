//应用启动时请求 /profile 恢复登录态
import { createContext, useState, useEffect, use } from 'react';
import { authApi } from '../src/api/http';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
 const [user, setUser] = useState(null);
 useEffect(() => {
    if (!user) {
        authApi.profile().then(({ data }) => {
            setUser(data);
    })
 }
}, [])
    return (
        <UserContext.Provider value={{ user, setUser }} >
            {children}
        </UserContext.Provider>
    );
}