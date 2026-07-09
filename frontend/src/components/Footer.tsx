import React from 'react';
import { Zap, Globe, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      padding: '4rem 2rem 2rem 2rem',
      borderTop: '1px solid #1e293b',
      fontSize: '0.9rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2.5rem',
        marginBottom: '3rem'
      }}>
        {/* Brand Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.2rem'
          }}>
            <Zap size={20} style={{ fill: '#6366f1', stroke: '#6366f1' }} />
            <span>BulletMarket</span>
          </div>
          <p style={{ lineHeight: '1.6', fontSize: '0.85rem' }}>
            가장 빠른 초고속 상품 탐색과 안전한 결제를 보장하는 차세대 e-커머스 플랫폼입니다.
          </p>
        </div>

        {/* Categories Section */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontWeight: 700 }}>카테고리</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>전체 상품 (All)</a></li>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>전자기기 (Electronics)</a></li>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>의류 (Clothing)</a></li>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>도서 (Books)</a></li>
          </ul>
        </div>

        {/* Customer Service Section */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontWeight: 700 }}>고객 지원</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>FAQ / 자주 묻는 질문</a></li>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>1:1 문의하기</a></li>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>배송 및 반품 안내</a></li>
            <li><a href="#" style={{ color: '#94a3b8', textDecoration: 'none' }}>이용 약관</a></li>
          </ul>
        </div>

        {/* Contact Section */}
        <div>
          <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontWeight: 700 }}>공식 소셜</h4>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', transition: 'color 0.2s' }} title="GitHub">
              <Globe size={20} />
            </a>
            <a href="https://google.com" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', transition: 'color 0.2s' }} title="Website">
              <Globe size={20} />
            </a>
          </div>
          <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: '#64748b' }}>
            도쿄 리전 Supabase 클라우드 & 오라클 VM 백본 운영 중
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        borderTop: '1px solid #1e293b',
        paddingTop: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8rem',
        color: '#64748b'
      }}>
        <span>© {new Date().getFullYear()} BulletMarket Inc. All rights reserved.</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          Made with <Heart size={12} style={{ fill: '#ec4899', stroke: '#ec4899' }} /> for premium testing.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
