import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import { ProductCard } from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartModal from './components/CartModal';
import Auth from './components/Auth';
import MyPage from './components/MyPage';
import Footer from './components/Footer';
import { supabase } from './supabase';

interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  averageRating: number;
  reviewCount: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
}

interface UserSession {
  email: string;
  name: string;
  token: string;
  provider: 'supabase' | 'local';
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('latest');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 회원 로그인 세션 상태 값
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // 현재 활성화된 페이지 상태 ('home' | 'auth' | 'mypage')
  const [currentPage, setCurrentPage] = useState<'home' | 'auth' | 'mypage'>('home');

  // CLS 배너 출력 유무
  const [showPromoBanner, setShowPromoBanner] = useState<boolean>(false);

  // 의도적인 CLS(누적 레이아웃 이동) 결함 유도: 페이지 로드 1.5초 후 갑자기 프로모션 배너가 내려앉아 UI가 밑으로 밀림
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromoBanner(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 의도적인 성능 결함 설계: 메인 스레드 점유 동기식 무거운 스크롤 이벤트 (상시 활성화)
  // 스크롤 시마다 강제 리플로우(Layout Read)를 일으키고 40만 번 제곱근 동기식 계산 루프를 돌아 스크롤을 심하게 뚝뚝 끊기게 만듭니다.
  useEffect(() => {
    const handleScrollUnoptimized = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      // 동기식 40만 번 계산을 도는 과도한 작업 주입
      let sum = 0;
      for (let i = 0; i < 400000; i++) {
        sum += Math.sqrt(i);
      }
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        console.log("미최적화 스크롤 도달 이벤트 발생. 누적 연산 값:", sum);
      }
    };

    window.addEventListener('scroll', handleScrollUnoptimized);
    return () => window.removeEventListener('scroll', handleScrollUnoptimized);
  }, []);

  // 백엔드 N+1 쿼리 병목을 가지는 상품 목록 및 검색 호출 실행
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE_URL}/api/products?sort=${sortBy}`;
        if (searchQuery.trim()) {
          url = `${API_BASE_URL}/api/products/search?q=${encodeURIComponent(searchQuery)}&sort=${sortBy}`;
        }
        const res = await axios.get(url);
        setProducts(res.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, sortBy]);

  // 브라우저 최초 마운트 시 LocalStorage 세션 복원
  useEffect(() => {
    // URL Hash에서 에러 검사 (Supabase 이메일 인증 실패 대응 등)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const errorMsg = params.get('error_description');
      const errorCode = params.get('error_code');
      if (errorMsg) {
        let msg = decodeURIComponent(errorMsg.replace(/\+/g, ' '));
        if (errorCode === 'otp_expired') {
          msg = "이메일 인증 링크가 만료되었거나 이미 사용되었습니다.\n\n메일 클라이언트의 자동 링크 스캔(보안/스팸 검사 기능)으로 인해 링크가 미리 소진되었을 수 있습니다. 다시 로그인하거나 회원가입을 시도해 주십시오.";
        }
        alert(msg);
        // 해시 제거하여 새로고침 시 중복 경고 방지
        window.history.replaceState(null, '', window.location.pathname);
        setCurrentPage('auth');
      }
    }

    const savedSession = localStorage.getItem('bulletmarket_session');
    if (savedSession) {
      try {
        setUserSession(JSON.parse(savedSession));
      } catch (e) {
        console.error('세션 복구 오류', e);
      }
    }

    // Supabase 접속 상태 변경 이벤트 구독 연동
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          const s: UserSession = {
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            token: session.access_token,
            provider: 'supabase',
          };
          setUserSession(s);
          localStorage.setItem('bulletmarket_session', JSON.stringify(s));
          setCurrentPage('home'); // 로그인 성공 시 메인 홈으로 이동
        } else {
          // Supabase 로그아웃 이벤트이거나, 기존 세션이 Supabase 세션인 경우에만 초기화 진행 (로컬 DB 세션 보존)
          const savedSession = localStorage.getItem('bulletmarket_session');
          let parsed: UserSession | null = null;
          if (savedSession) {
            try {
              parsed = JSON.parse(savedSession);
            } catch (e) {
              console.error('Failed to parse saved session', e);
            }
          }
          if (event === 'SIGNED_OUT' || (parsed && parsed.provider === 'supabase')) {
            setUserSession(null);
            localStorage.removeItem('bulletmarket_session');
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleAuthSuccess = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem('bulletmarket_session', JSON.stringify(session));
    setCurrentPage('home'); // 로그인 성공 시 메인 홈으로 이동
  };

  const handleLogout = async () => {
    if (userSession?.provider === 'supabase' && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase 로그아웃 에러', err);
      }
    }
    setUserSession(null);
    localStorage.removeItem('bulletmarket_session');
    setCurrentPage('home');
  };

  // LocalStorage 장바구니 리로드
  useEffect(() => {
    const savedCart = localStorage.getItem('bulletmarket_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  // LocalStorage 장바구니 자동 변경 감지 동기화
  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('bulletmarket_cart', JSON.stringify(updatedCart));
  };

  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 회원 권한 한정 기능 차단: 비로그인 상태에서 장바구니 담기를 시도하면 로그인 페이지로 이동합니다.
    if (!userSession) {
      setCurrentPage('auth');
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
          stock: product.stock,
        },
      ];
    }
    saveCartToStorage(updatedCart);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    saveCartToStorage(updatedCart);
  };

  const handleRemoveFromCart = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    saveCartToStorage(updatedCart);
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
  };

  // 한국 쇼핑몰 스타일 카테고리 매핑 (필터링 매커니즘 보존용)
  const categoriesMap = [
    { label: '전체 상품', value: 'All' },
    { label: '과일', value: 'Fruit' },
    { label: '과자/간식', value: 'Snack' },
    { label: '가전/디지털', value: 'Electronics' },
    { label: '생필품', value: 'Essentials' },
    { label: '정육/계란', value: 'Meat' },
    { label: '채소', value: 'Vegetables' },
    { label: '홈인테리어', value: 'Home' }
  ];

  // 클라이언트 사이드 미최적화 필터링 (가상 DOM 버추얼라이제이션 스킵)
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.imageUrl.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => {
          // 비로그인 상태에서 장바구니 버튼 클릭 시 로그인 페이지로 라우팅
          if (!userSession) {
            setCurrentPage('auth');
          } else {
            setIsCartOpen(true);
          }
        }}
        userSession={userSession}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('auth')}
        onLogoClick={() => {
          setSelectedProductId(null);
          setCurrentPage('home');
        }}
        onMyPageClick={() => {
          setSelectedProductId(null);
          setCurrentPage('mypage');
        }}
      />

      {/* 누적 레이아웃 이동(CLS) 유발 배너 영역 */}
      {showPromoBanner && (
        <div className="promo-banner" id="promo-banner">
          🎉 오늘 전상품 10% 할인가 적용 쿠폰 번호 배포 중: <span style={{ textDecoration: 'underline', fontWeight: 800 }}>BULLET10</span> 🎉
        </div>
      )}

      {/* 메인 콘텐츠 영역 (Flex-Grow로 푸터를 항상 맨 아래로 고정) */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {currentPage === 'auth' ? (
          // 로그인 / 회원가입 전용 단독 페이지 뷰
          <Auth 
            onAuthSuccess={handleAuthSuccess} 
            apiBaseUrl={API_BASE_URL} 
            onClose={() => setCurrentPage('home')} 
          />
        ) : currentPage === 'mypage' ? (
          // 마이페이지 단독 뷰
          <div className="container" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <MyPage 
              userSession={userSession}
              apiBaseUrl={API_BASE_URL}
              onBackToShopping={() => setCurrentPage('home')}
            />
          </div>
        ) : (
          <div className="container" style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {selectedProductId !== null ? (
              <ProductDetail
                productId={selectedProductId}
                onBack={() => setSelectedProductId(null)}
                onAddToCart={(prod) => handleAddToCart(prod)}
                apiBaseUrl={API_BASE_URL}
              />
            ) : (
              <>
                {/* 카테고리 필터 영역 - 협소한 클릭 대상 영역 접근성 결함 */}
                <div className="category-container" id="category-filter-list" style={{ justifyContent: 'flex-start', padding: '1rem 0' }}>
                  {categoriesMap.map((cat) => (
                    <button
                      key={cat.value}
                      className={`category-pill ${selectedCategory === cat.value ? 'active' : ''}`}
                      id={`filter-${cat.value.toLowerCase()}`}
                      onClick={() => setSelectedCategory(cat.value)}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px' }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {loading && products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>상품 목록을 불러오는 중입니다...</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      잠시만 기다려 주시면 곧 상품 목록을 확인하실 수 있습니다.
                    </p>
                  </div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '5rem 0', color: '#ef4444' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>상품 조회 실패</h2>
                    <p style={{ fontSize: '0.9rem' }}>{error}</p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        {searchQuery ? `"${searchQuery}"에 대한 검색 결과` : `${categoriesMap.find(c => c.value === selectedCategory)?.label || '상품'} 목록`}
                      </h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        등록 상품 총 {filteredProducts.length}개
                      </span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                      >
                        <option value="latest">최신순</option>
                        <option value="price_asc">낮은 가격순</option>
                        <option value="price_desc">높은 가격순</option>
                        <option value="rating">평점 높은순</option>
                        <option value="reviews">리뷰 많은순</option>
                      </select>
                    </div>

                    {/* 의도적인 렌더링 성능 지뢰밭: 무한 스크롤 다운 시 뷰포트 바깥의 모든 요소를 가상화 없이
                        일괄 DOM 트리 노드로 무한 누적 적재시켜 브라우저 렌더링 레이어에 연산 과부하를 줌 */}
                    <div className="product-grid" id="product-grid">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onSelect={(id: number) => setSelectedProductId(id)}
                          apiBaseUrl={API_BASE_URL}
                          userSession={userSession}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onClearCart={handleClearCart}
        apiBaseUrl={API_BASE_URL}
        userSession={userSession}
      />

      <Footer />
    </div>
  );
}

export default App;
