import React, { useState } from 'react';
import axios from 'axios';
import { X, Trash2, AlertCircle } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  onClearCart: () => void;
  apiBaseUrl: string;
  userSession?: { name: string; email: string } | null;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onClearCart,
  apiBaseUrl,
  userSession,
}) => {
  const [customerName, setCustomerName] = useState<string>('John Doe');
  const [customerEmail, setCustomerEmail] = useState<string>('john.doe@example.com');
  
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  // 쿠폰 관련 상태 정의
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // 로그인 상태인 경우, 결제 폼에 주문자 이름과 이메일을 자동으로 채워 넣습니다.
  React.useEffect(() => {
    if (userSession) {
      setCustomerName(userSession.name);
      setCustomerEmail(userSession.email);
    }
  }, [userSession]);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 쿠폰 할인 가맹 연산
  let discountAmount = 0;
  if (appliedCoupon === 'BULLET10') {
    discountAmount = totalAmount * 0.1; // 10% 할인
  } else if (appliedCoupon === 'WELCOME20') {
    discountAmount = totalAmount * 0.2; // 20% 신규 가입 할인
  } else if (appliedCoupon === 'DISCOUNT5') {
    discountAmount = Math.min(totalAmount, 5); // 5달러(5,000원) 정액 할인
  }
  const finalTotal = Math.max(0, totalAmount - discountAmount);

  // 쿠폰 유효성 검증 및 적용 처리
  const handleApplyCoupon = () => {
    setCouponError(null);
    setCouponSuccess(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('쿠폰 코드를 입력해 주세요.');
      return;
    }

    if (code === 'BULLET10') {
      setAppliedCoupon(code);
      setCouponSuccess('10% 할인가 적용 쿠폰(BULLET10)이 성공적으로 적용되었습니다!');
    } else if (code === 'WELCOME20') {
      setAppliedCoupon(code);
      setCouponSuccess('20% 신규 웰컴 할인 쿠폰(WELCOME20)이 성공적으로 적용되었습니다!');
    } else if (code === 'DISCOUNT5') {
      setAppliedCoupon(code);
      setCouponSuccess('5천원 즉시 할인 쿠폰(DISCOUNT5)이 성공적으로 적용되었습니다!');
    } else {
      setCouponError('존재하지 않거나 만료된 쿠폰 번호입니다.');
    }
  };

  const handleCheckout = async () => {
    // 의도적인 UX 버그 설계: 결제 중 버튼 비활성화(`disabled`) 및 중복 요청 방지(Debouncing) 누락
    setErrorDetails(null);
    setSuccessOrder(null);

    const orderPayload = {
      customerName,
      customerEmail,
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      couponCode: appliedCoupon || null // 쿠폰 코드 전달
    };

    try {
      const res = await axios.post(`${apiBaseUrl}/api/orders`, orderPayload);
      setSuccessOrder(res.data);
      onClearCart();
      // 주문 성공 시 쿠폰 상태도 초기화
      setCouponInput('');
      setAppliedCoupon('');
      setCouponSuccess(null);
    } catch (err: any) {
      if (err.response && err.response.data) {
        setErrorDetails(err.response.data);
      } else {
        setErrorDetails({ message: err.message, trace: '스택 트레이스 정보를 받아올 수 없습니다.' });
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>장바구니</h2>
          <button className="cart-close-btn" id="close-cart-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {successOrder ? (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="success-box" id="checkout-success-box">
              <h3>주문이 성공적으로 완료되었습니다!</h3>
              <p>주문 번호 (Order ID): {successOrder.id}</p>
              <p>총 결제 금액: ₩{Math.round((successOrder.totalPrice || 0) * 1000).toLocaleString()}</p>
              <p>주문자: {successOrder.user?.name || customerName}</p>
            </div>
            <button className="checkout-btn" style={{ marginTop: '2rem' }} onClick={() => setSuccessOrder(null)}>
              쇼핑 계속하기
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
                  장바구니가 비어 있습니다.
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="cart-item" id={`cart-item-${item.id}`}>
                    <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                    
                    <div className="cart-item-details">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">₩{Math.round(item.price * 1000).toLocaleString()}</div>
                    </div>

                    <div className="cart-item-actions">
                      {/* 웹 접근성 결함: 모바일 타치 영역 규격(최소 44px 이상)을 위반하는 터무니없이 조밀한 수량조절 버튼(18x18px) */}
                      <button 
                        className="quantity-btn dec-btn" 
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button 
                        className="quantity-btn inc-btn" 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      className="cart-remove-btn" 
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="checkout-section">
                
                {/* 쿠폰 입력 영역 */}
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px' }}>
                    🏷️ 할인 쿠폰 코드 입력 (예: BULLET10)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, textTransform: 'uppercase', padding: '0.4rem', fontSize: '12px' }}
                      placeholder="쿠폰 번호를 입력하세요"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="checkout-btn"
                      style={{ width: 'auto', padding: '0.4rem 1rem', marginTop: 0, fontSize: '12px' }}
                    >
                      적용
                    </button>
                  </div>
                  {couponError && (
                    <div style={{ color: '#f43f5e', fontSize: '11px', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} />
                      <span>{couponError}</span>
                    </div>
                  )}
                  {couponSuccess && (
                    <div style={{ color: '#10b981', fontSize: '11px', marginTop: '0.4rem' }}>
                      ✨ {couponSuccess}
                    </div>
                  )}
                </div>

                {/* 결제 금액 계산 영역 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>주문 상품 합계:</span>
                    <span>₩{Math.round(totalAmount * 1000).toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#f43f5e', fontWeight: 600 }}>
                      <span>쿠폰 할인 금액:</span>
                      <span>-₩{Math.round(discountAmount * 1000).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="cart-total" style={{ margin: 0, paddingTop: '0.25rem', justifyContent: 'space-between', display: 'flex' }}>
                    <span>최종 결제 금액:</span>
                    <span id="cart-total-amount">₩{Math.round(finalTotal * 1000).toLocaleString()}</span>
                  </div>
                </div>

                <div className="checkout-form">
                  <div className="form-group">
                    <label className="form-label">주문자 성함</label>
                    <input
                      type="text"
                      className="form-input"
                      id="customer-name-input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">이메일 주소</label>
                    <input
                      type="email"
                      className="form-input"
                      id="customer-email-input"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  {/* 의도적인 더블클릭 오동작 주입: 결제 통신 도중 스피너 차단 등의 UI 락아웃을 수행하지 않음 */}
                  <button 
                    className="checkout-btn" 
                    id="place-order-btn"
                    onClick={handleCheckout}
                  >
                    결제하기 (주문 접수)
                  </button>
                </div>

                {errorDetails && (
                  <div className="error-box" id="checkout-error-box">
                    <div className="error-title">
                      <AlertCircle size={16} />
                      <span>결제 실패: {errorDetails.message || '오류가 발생했습니다.'}</span>
                    </div>
                    {/* 보안 취약점 결함(CWE-209): 재고 부족 등 서버 예외 발생 시, 원시 자바 예외 스택 트레이스(stackTrace)를 상세히 노출함 */}
                    {errorDetails.trace && (
                      <pre className="stack-trace" id="error-stack-trace">
                        {errorDetails.trace}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default CartModal;
