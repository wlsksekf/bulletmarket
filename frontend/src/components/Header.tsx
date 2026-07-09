import React from 'react';
import { ShoppingCart, Search, Zap, LogOut } from 'lucide-react';
import { supabase } from '../supabase';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  onCartClick: () => void;
  userSession: { name: string; email: string } | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onLogoClick: () => void;
  onMyPageClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  cartCount,
  onCartClick,
  userSession,
  onLogout,
  onLoginClick,
  onLogoClick,
  onMyPageClick,
}) => {
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onLogout();
  };

  return (
    <nav className="navbar" id="main-navbar">
      {/* 로고 클릭 시 메인 홈 페이지로 이동하도록 설정 */}
      <a 
        href="/" 
        className="logo" 
        onClick={(e) => { 
          e.preventDefault(); 
          onLogoClick(); 
        }}
      >
        <Zap className="logo-icon" size={24} style={{ fill: '#4f46e5' }} />
        <span>BulletMarket</span>
      </a>

      <div className="nav-actions">
        {/* 비로그인 시 로그인 버튼 노출, 로그인 시 프로필 및 로그아웃 노출 */}
        {!userSession ? (
          <button
            onClick={onLoginClick}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginRight: '0.5rem'
            }}
          >
            로그인
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
            <button
              onClick={onMyPageClick}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="마이페이지 이동"
            >
              👤 {userSession.name} 님
            </button>
            <button 
              onClick={handleSignOut}
              style={{
                background: '#fee2e2',
                border: 'none',
                color: '#ef4444',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}
              title="로그아웃"
            >
              <LogOut size={12} />
              <span>로그아웃</span>
            </button>
          </div>
        )}

        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            id="search-input"
            placeholder="상품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="cart-btn" id="cart-toggle-btn" onClick={onCartClick}>
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="cart-count" id="cart-badge-count">{cartCount}</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Header;
