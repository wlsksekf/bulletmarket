import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, ShoppingBag, Receipt, Ticket, ChevronRight, RefreshCw, AlertCircle, Coins, Eye, BarChart } from 'lucide-react';

interface OrderItem {
  id: number;
  product: {
    name: string;
    imageUrl: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  orderItems: OrderItem[];
}

interface MyPageProps {
  userSession: { email: string; name: string; token: string } | null;
  apiBaseUrl: string;
  onBackToShopping: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({ userSession, apiBaseUrl, onBackToShopping }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'points' | 'recent' | 'admin'>('orders');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 사용 가능한 쿠폰 정적 정보 정의
  const couponList = [
    { code: 'BULLET10', name: '총알배송 전상품 10% 쿠폰', desc: '결제 총액에서 10% 비율 할인 제공', type: 'ratio' },
    { code: 'WELCOME20', name: '신규 회원 가입 웰컴 20% 쿠폰', desc: '신규 회원을 위한 20% 스페셜 특별 할인', type: 'ratio' },
    { code: 'DISCOUNT5', name: '오픈 기념 5천원 즉시 할인 쿠폰', desc: '최종 결제 단계에서 5,000원 정액 차감', type: 'flat' }
  ];

  const fetchData = async () => {
    if (!userSession) return;
    try {
      setLoading(true);
      setError(null);
      const headers = { 'X-User-Id': 2 }; // Mock user session id for api
      
      const [ordersRes, pointsRes, recentRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/orders`, { params: { email: userSession.email } }),
        axios.get(`${apiBaseUrl}/api/points/history`, { headers }),
        axios.get(`${apiBaseUrl}/api/recently-viewed`, { headers })
      ]);
      setOrders(ordersRes.data || []);
      setPoints(pointsRes.data || []);
      setRecentlyViewed(recentRes.data || []);

      // Mock admin check (should be based on actual role)
      axios.get(`${apiBaseUrl}/api/admin/stats`, { headers: { 'X-User-Id': 1 } }) // Admin ID
        .then(res => setAdminStats(res.data))
        .catch(() => setAdminStats(null)); // Ignore if not admin

    } catch (err: any) {
      console.error('데이터 로드 실패', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userSession, apiBaseUrl]);

  if (!userSession) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h2 style={{ color: 'var(--text-main)' }}>로그인이 필요한 서비스입니다.</h2>
        <button onClick={onBackToShopping} className="checkout-btn" style={{ width: 'auto', marginTop: '1.5rem', padding: '0.6rem 2rem' }}>
          쇼핑하러 가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 0' }}>
      
      {/* 마이페이지 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          마이페이지
        </h1>
        <button onClick={onBackToShopping} className="back-btn" style={{ margin: 0, padding: '6px 16px', borderRadius: '8px' }}>
          쇼핑 계속하기 <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* 1. 회원 정보 요약 프로필 */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              {userSession.name} 회원님
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              이메일: {userSession.email}
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(225, 29, 72, 0.1))',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>회원 등급</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px' }}>⚡ VIP SILVER</span>
          </div>
        </div>

        {/* 2. 보유 사용 가능 쿠폰 목록 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Ticket size={20} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>가용 할인 쿠폰 ({couponList.length})</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}>
            {couponList.map((coupon) => (
              <div key={coupon.code} style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{
                      backgroundColor: 'rgba(244, 63, 94, 0.1)',
                      color: 'var(--accent)',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 700
                    }}>
                      AVAILABLE
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{coupon.code}</span>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-main)' }}>
                    {coupon.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    {coupon.desc}
                  </p>
                </div>
                <div style={{
                  borderTop: '1px solid var(--border)',
                  marginTop: '0.8rem',
                  paddingTop: '0.6rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  <span>제한 조건: 없음</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>무기한 가용</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShoppingBag size={16} /> 주문 내역
          </button>
          <button 
            onClick={() => setActiveTab('points')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'points' ? 'bold' : 'normal', color: activeTab === 'points' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Coins size={16} /> 포인트 내역
          </button>
          <button 
            onClick={() => setActiveTab('recent')}
            style={{ background: 'none', border: 'none', fontWeight: activeTab === 'recent' ? 'bold' : 'normal', color: activeTab === 'recent' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Eye size={16} /> 최근 본 상품
          </button>
          {adminStats && (
            <button 
              onClick={() => setActiveTab('admin')}
              style={{ background: 'none', border: 'none', fontWeight: activeTab === 'admin' ? 'bold' : 'normal', color: activeTab === 'admin' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <BarChart size={16} /> 관리자 대시보드
            </button>
          )}
        </div>

        {/* 콘텐츠 영역 */}
        {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>최근 주문/구매 내역</h2>
            </div>
            <button onClick={fetchData} style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px'
            }}>
              <RefreshCw size={12} className={loading ? 'spin' : ''} /> 새로고침
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>구매 목록을 정렬 중입니다...</span>
            </div>
          ) : error ? (
            <div className="error-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '5rem 0',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-muted)'
            }}>
              <Receipt size={40} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>최근 주문/구매 내역이 존재하지 않습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {orders.map((order) => {
                const date = new Date(order.createdAt);
                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                return (
                  <div key={order.id} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {/* 주문 상단 메타 정보 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '0.8rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                          주문 ID: #{order.id}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {dateString}
                        </span>
                      </div>
                      <span style={{
                        backgroundColor: 'rgba(167, 139, 250, 0.1)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '6px'
                      }}>
                        {order.status === 'ORDERED' ? '주문 접수 완료' : order.status}
                      </span>
                    </div>

                    {/* 주문 개별 상품 항목들 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {order.orderItems.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '1px solid var(--border)',
                              background: '#1a1829'
                            }}>
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  // 깨진 이미지가 있거나 로컬/서버 동적 대체 이미지 처리
                                  const target = e.target as HTMLImageElement;
                                  const cat = item.product.name.toLowerCase().includes('electronics') ? 'electronics' : 'all';
                                  target.src = `/images/${cat}.jpg`;
                                }}
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {item.product.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                단가 {Math.round(item.price).toLocaleString()}원 | {item.quantity}개
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {Math.round(item.price * item.quantity).toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 주문 하단 총 합계 */}
                    <div style={{
                      borderTop: '1px dashed var(--border)',
                      marginTop: '1rem',
                      paddingTop: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>총 결제 금액 (쿠폰 적용가)</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--secondary)' }}>
                        {Math.round(order.totalPrice).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        {activeTab === 'points' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>포인트 내역</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {points.length === 0 ? <p>내역이 없습니다.</p> : points.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontWeight: 'bold', color: p.type === 'EARN' ? '#10b981' : '#ef4444' }}>
                      {p.type === 'EARN' ? '+' : '-'}{p.amount} P
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>최근 본 상품</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {recentlyViewed.map(view => (
                <div key={view.id} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-card)' }}>
                  <img src={view.product.imageUrl} alt={view.product.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                  <p style={{ fontSize: '12px', margin: '0.5rem 0 0 0', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{view.product.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && adminStats && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>관리자 대시보드 (Admin Stats)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>총 가입 유저</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{adminStats.totalUsers}명</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>총 누적 주문</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{adminStats.totalOrders}건</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>등록된 리뷰</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{adminStats.totalReviews}개</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyPage;
