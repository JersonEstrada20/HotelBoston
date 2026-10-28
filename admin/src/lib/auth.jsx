import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigError } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(supabaseConfigError);

  const loadProfile = useCallback(async (user) => {
    if (!supabase || !user) {
      setProfile(null);
      return null;
    }
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, must_change_password, created_date")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) {
      setError(profileError.message);
      setProfile(null);
      return null;
    }
    if (!data) {
      setError("Tu cuenta existe, pero no tiene un perfil de personal habilitado.");
      setProfile(null);
      return null;
    }
    setError("");
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user);
      if (active) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user) await loadProfile(nextSession.user);
      else {
        setProfile(null);
        setError("");
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error(supabaseConfigError);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError) throw signInError;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) return loadProfile(session.user);
    return null;
  }, [loadProfile, session?.user]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    isStaff: profile?.role === "admin" || profile?.role === "recepcion",
    isAdmin: profile?.role === "admin",
    loading,
    error,
    setError,
    signIn,
    signOut,
    refreshProfile,
  }), [session, profile, loading, error, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}
