import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, login as apiLogin, signup as apiSignup, loginWithGoogle as apiLoginGoogle } from '../api';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isExchangingToken = useRef(false);

    useEffect(() => {
        // init check
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (e) {
                    console.error("Failed to parse stored user:", e);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }

            setLoading(false);
        };
        initAuth();

        // Listen for Supabase OAuth Redirects
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth state changed: ${event}`, session ? 'with session' : 'no session');
            
            // Handle OAuth redirect callback
            if (event === 'SIGNED_IN' && session) {
                console.log("Supabase Signed In via OAuth");
                
                // If we're not already exchanging a token and don't have a local session
                if (!localStorage.getItem('token') && !isExchangingToken.current) {
                    isExchangingToken.current = true;
                    try {
                        // Exchange Supabase Access Token for App JWT
                        console.log("Exchanging token with backend...");
                        const data = await apiLoginGoogle(session.access_token);

                        if (data.access_token) {
                            localStorage.setItem('token', data.access_token);
                            localStorage.setItem('user', JSON.stringify(data.user));
                            api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
                            setUser(data.user);
                            console.log("Backend Auth Successful!");
                            
                            // Clear the OAuth state from URL
                            if (window.history.replaceState) {
                                window.history.replaceState(null, '', window.location.pathname);
                            }
                        } else {
                            throw new Error("No access token received from backend");
                        }
                    } catch (e) {
                        console.error("Google Token Exchange Failed:", e);
                        console.error("Error details:", e.response?.data);
                        await supabase.auth.signOut(); // Clear invalid supabase session
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                    } finally {
                        isExchangingToken.current = false;
                    }
                }
            }

            if (event === 'SIGNED_OUT') {
                console.log("User signed out");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                delete api.defaults.headers.common['Authorization'];
                setUser(null);
            }
            
            // Always stop loading after auth state settles
            setLoading(false);
        });

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    const login = async (email, password) => {
        try {
            const data = await apiLogin(email, password);
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
                setUser(data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const signup = async (email, password, fullName) => {
        try {
            await apiSignup(email, password, fullName);
            return true;
        } catch (error) {
            console.error("Signup failed", error);
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            // Use the current origin for redirect, or a configured production URL
            const redirectTo = window.location.origin;
            console.log("Initiating Google OAuth with redirect to:", redirectTo);
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo,
                    skipBrowserRedirect: false
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Google login init failed", error);
            throw error;
        }
    };

    const logout = async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, loading }}>

            {!loading && children}
        </AuthContext.Provider >
    );
};

export const useAuth = () => useContext(AuthContext);
