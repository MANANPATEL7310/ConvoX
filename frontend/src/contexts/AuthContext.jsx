import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // default true to check auth first
    
    // Check auth on mount
    useEffect(() => {
        async function checkStatus() {
            try {
                const response = await api.post("/verify");
                if (response.data.status) {
                    setUser(response.data.user);
                } else {
                    setUser(null);
                }
            } catch(e) {
                console.log(e);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        checkStatus();
    }, [])

    useEffect(() => {
        if (!user) return;
        let active = true;
        const ping = async () => {
            try {
                await api.post("/presence");
            } catch (e) {
                if (active) console.log(e);
            }
        };
        ping();
        const interval = setInterval(ping, 60000);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [user]);

    const getProfile = async () => {
        try {
            const response = await api.post("/verify");
            if (response.data.status) {
                setUser(response.data.user);
            }
            return response.data;
        } catch (e) {
            console.log(e);
            return null;
        }
    };    
    const addToUserHistory = async (meetingCode) => {
        try {
            return await api.post("/add_history", {
                meetingCode: meetingCode
            });
        } catch (e) {
            throw e;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let response = await api.get("/get_history");
            return response.data;
        } catch (e) {
            throw e;
        }
    };

    const handleRegister = async (name, username, email, password) => {
        try {
            const request = await api.post("/signup", {
                name: name,
                username: username,
                email: email,
                password: password
            });
            
            if (request.status === 201) {
                setUser(request.data.user);
                return request.data.message;
            }
            return request.data.message;
        } catch (e) {
            throw e;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            const request = await api.post("/login", {
                username: username,
                password: password
            });
            
            if (request.status === 200) {
                setUser(request.data.user);
                return request.data.message;
            }
            return request.data.message;
        } catch (e) {
            throw e;
        }
    }


    const logout = async () => {
        try {
           await api.post("/logout");
           setUser(null);
        } catch (e) {
            console.log(e);
        }
    }

    const data = {
        user, 
        loading,
        setUser, 
        addToUserHistory, 
        getHistoryOfUser,
        getProfile,
        register: handleRegister,
        login: handleLogin,
        logout
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
