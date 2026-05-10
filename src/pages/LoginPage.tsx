import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Configura persistência com base no "Manter-me conectado"
      await setPersistence(
        auth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Ocorreu um erro ao realizar o login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Erro ao fazer login com o Google.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <LogIn size={32} />
          </div>
          <h1>{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h1>
          <p>{isLogin ? 'Acesse sua conta para gerenciar atletas' : 'Comece a monitorar a performance de seus atletas'}</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleAuth}>
          <div className="form-group">
            <label>E-mail</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Senha</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          {isLogin && (
            <div className="login-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Manter-me conectado
              </label>
              <a href="#" className="forgot-password">Esqueceu a senha?</a>
            </div>
          )}

          <button className="btn btn-primary btn-login" disabled={isLoading}>
            {isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="login-divider">Ou entrar com</div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" alt="Google" width="18" height="18" />
          Google
        </button>

        <div className="login-footer">
          {isLogin ? (
            <>Não tem uma conta? <a href="#" onClick={(e) => { 
              e.preventDefault(); 
              setError('A criação direta de conta está desabilitada temporariamente. Por favor, utilize o login com Google.');
            }}>Cadastre-se</a></>
          ) : (
            <>Já tem uma conta? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Faça login</a></>
          )}
        </div>
      </div>
    </div>
  );
}
