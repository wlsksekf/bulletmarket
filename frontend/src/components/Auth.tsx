import React, { useState } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';
import { Mail, Lock, User, AlertCircle, Zap, X } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
