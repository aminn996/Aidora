import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

function getAuthRedirect(path) {
  const configured = import.meta.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim();
  if (configured) return configured;
  return `${window.location.origin}${path}`;
}

function mapUser(user, profile, roles = []) {
  const role = roles.includes('ADMIN') ? 'admin' : roles.includes('PROVIDER') ? 'provider' : 'user';
  return {
    ...user,
    id: user.id,
    email: user.email,
    name: profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
    profile,
    roles,
    role,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [locationSynced, setLocationSynced] = useState(false);
  const geo = useGeolocation();

  const hydrateUser = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      return null;
    }

    const [{ data: profile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', authUser.id),
    ]);
    if (profileError) throw profileError;
    if (rolesError) throw rolesError;
    const nextUser = mapUser(authUser, profile, roleRows?.map(({ role }) => role) || []);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!active) return;
        setSession(currentSession);
        await hydrateUser(currentSession?.user || null);
      } catch (error) {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      void hydrateUser(currentSession?.user || null)
        .catch(() => { if (active) setUser(null); })
        .finally(() => { if (active) setLoading(false); });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateUser]);

  const login = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) throw error;
    const nextUser = await hydrateUser(data.user);
    return { ...data, user: nextUser };
  }, [hydrateUser]);

  const register = useCallback(async (payload) => {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: getAuthRedirect('/login'),
        data: {
          first_name: payload.firstName || payload.first_name,
          last_name: payload.lastName || payload.last_name,
          full_name: payload.name || payload.full_name,
        },
      },
    });
    if (error) throw error;
    if (data.user && data.session) await hydrateUser(data.user);
    return data;
  }, [hydrateUser]);

  const googleLogin = useCallback(async (redirectTo) => {
    const safeRedirect = typeof redirectTo === 'string' && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? `${window.location.origin}${redirectTo}`
      : getAuthRedirect('/login');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: safeRedirect,
      },
    });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!session?.user) throw new Error('You must be signed in.');
    const profileUpdates = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('profiles').update(profileUpdates).eq('id', session.user.id).select().single();
    if (error) throw error;
    setUser((current) => current ? { ...current, profile: data, ...data, name: data.display_name || current.name } : current);
    return { user: { ...user, profile: data } };
  }, [session, user]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!user || locationSynced || user.role !== 'provider' || !geo.coords) return;
    setLocationSynced(true);
  }, [user, locationSynced, geo.coords]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      token: session?.access_token || null,
      isAuthenticated: Boolean(session?.user),
      login,
      register,
      googleLogin,
      updateProfile,
      logout,
      apiClient: supabase,
      supabase,
      geolocation: geo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
