import React, { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';
import { Mail, Lock, User, AlertCircle, Zap, X, Loader2 } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (userSession: { email: string; name: string; token: string; provider: 'supabase' | 'local' }) => void;
  apiBaseUrl: string;
  onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, apiBaseUrl, onClose }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ────────────────────────────────────────────────────────────────
  // Google OAuth
  // ────────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      if (!supabase) {
        throw new Error('Supabase 설정이 누락되어 구글 로그인을 사용할 수 없습니다. 환경 변수를 확인해 주세요.');
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 🔹 현재 접속한 도메인을 동적으로 주입
          redirectTo: `${window.location.origin}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || '구글 로그인 중 오류가 발생했습니다.');
      setIsGoogleLoading(false);
    }
  };

  // 이메일 및 비밀번호 규칙 클라이언트단 유효성 검증
  const validateForm = (): boolean => {
    // 1. 이메일 정규식 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식(예: you@example.com)을 입력해 주세요.");
      return false;
    }

    // 2. Supabase 기본 권장 비밀번호 강도 검사 (최소 6자 이상)
    if (password.length < 6) {
      setError("비밀번호는 안전을 위해 최소 6자 이상 입력해야 합니다.");
      return false;
    }

    // 3. 회원가입 추가 검사 (이름 및 비밀번호 일치 확인)
    if (isSignUp) {
      if (!name || name.trim().length < 2) {
        setError("이름은 성함을 식별할 수 있도록 최소 2자 이상 입력해 주세요.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // 가입/로그인 전 유효성 검사 작동
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        // --- Supabase 클라우드 회원가입 및 로그인 처리 ---
        if (isSignUp) {
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name || email.split('@')[0],
              },
              emailRedirectTo: window.location.origin
            }
          });
          if (signUpErr) throw signUpErr;
          
          if (data?.session) {
            onAuthSuccess({
              email: data.session.user.email || email,
              name: data.session.user.user_metadata?.full_name || name || email.split('@')[0],
              token: data.session.access_token,
              provider: 'supabase',
            });
          } else {
            setInfo(`가입 인증 메일이 '${email}' 주소로 성공적으로 발송되었습니다! 스팸함을 포함한 이메일 수신함에서 링크를 클릭하여 인증을 완료해 주십시오.`);
          }
        } else {
          const { data, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInErr) throw signInErr;

          if (data?.session) {
            onAuthSuccess({
              email: data.session.user.email || email,
              name: data.session.user.user_metadata?.full_name || email.split('@')[0],
              token: data.session.access_token,
              provider: 'supabase',
            });
          }
        }
      } else {
        // --- 로컬 백엔드 대체(Fallback) 회원가입 및 로그인 처리 ---
        if (isSignUp) {
          const res = await axios.post(`${apiBaseUrl}/api/auth/signup`, {
            email,
            password,
            name: name || email.split('@')[0],
          });
          if (res.status === 201 || res.data?.success) {
            setInfo("로컬 DB 회원가입 성공! 로그인 탭에서 로그인을 진행해 주세요.");
            setIsSignUp(false);
          } else {
            throw new Error(res.data?.message || "로컬 회원 가입에 실패했습니다.");
          }
        } else {
          const res = await axios.post(`${apiBaseUrl}/api/auth/login`, {
            email,
            password,
          });
          if (res.data && res.data.token) {
            onAuthSuccess({
              email: res.data.email,
              name: res.data.name,
              token: res.data.token,
              provider: 'local',
            });
          } else {
            throw new Error(res.data?.message || "올바르지 않은 계정 자격 증명 정보입니다.");
          }
        }
      }
    } catch (err: any) {
      console.error("인증 에러:", err);

      let msg = "";
      if (err) {
        if (typeof err === 'string') {
          msg = err;
        } else if (err.message && typeof err.message === 'string') {
          msg = err.message;
        } else if (err.error_description && typeof err.error_description === 'string') {
          msg = err.error_description;
        } else if (err.error && typeof err.error === 'string') {
          msg = err.error;
        } else if (err.details && typeof err.details === 'string') {
          msg = err.details;
        } else {
          msg = err.toString ? err.toString() : String(err);
        }
      }

      // 껍데기만 남는 오동작 방지
      if (!msg || msg === "[object Object]" || msg === "{}") {
        msg = `인증 처리 오류: ${err.message || err.name || '알 수 없는 에러가 발생했습니다.'}`;
      }

      // Supabase 미인증 계정 로그인 시도 시 예외 케이스 처리
      if (msg.includes("Email not confirmed") || msg.includes("email_not_confirmed")) {
        setError("이메일 인증이 완료되지 않은 계정입니다. 수신하신 가입 메일 내 인증 링크를 먼저 클릭해 주세요.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80vh',
      padding: '2rem'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '1rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        )}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Zap size={32} style={{ color: 'var(--primary)', fill: 'var(--primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>BulletMarket</h2>
        </div>
        
        {/* 로그인 / 회원가입 전환 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => { setIsSignUp(false); setError(null); setInfo(null); setConfirmPassword(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: !isSignUp ? '2px solid var(--primary)' : 'none',
              color: !isSignUp ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            로그인
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(null); setInfo(null); setConfirmPassword(''); }}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'none',
              border: 'none',
              borderBottom: isSignUp ? '2px solid var(--primary)' : 'none',
              color: isSignUp ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">이름</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="홍길동"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">이메일 주소</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label">비밀번호 확인</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="checkout-btn" 
            style={{ marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? "처리 중..." : (isSignUp ? "회원 등록하기" : "로그인하기")}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.18)' }} />
          <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>또는</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.18)' }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary, #333)',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            opacity: isGoogleLoading ? 0.7 : 1,
          }}
          onMouseEnter={e => !isGoogleLoading && ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover, #f1f5f9)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card, transparent)')}
        >
          {isGoogleLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isGoogleLoading ? '연결 중...' : 'Google로 계속하기'}
        </button>

        {error && (
          <div className="error-box" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="success-box" style={{ marginTop: '1rem', fontSize: '13px' }}>
            <span>{info}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default Auth;
