import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, signIn, signUp } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      throw error;
    }
  };

  const handleSignup = async (data: any) => {
    const { error } = await signUp(data.email, data.password, data.fullName, data.phone);
    if (error) {
      throw error;
    }
    // Redirect to login page after successful signup
    setIsLogin(true);
  };

  return (
    <>
      {isLogin ? (
        <LoginForm 
          onLogin={handleLogin}
          onSignupRedirect={() => setIsLogin(false)}
          onForgotPassword={() => console.log('Forgot password')}
        />
      ) : (
        <SignupForm 
          onSignup={handleSignup}
          onLoginRedirect={() => setIsLogin(true)}
        />
      )}
    </>
  );
}