import React from 'react';
import { Star } from 'lucide-react';

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

interface ProductCardProps {
  product: ProductDto;
  onAddToCart: (product: ProductDto, e: React.MouseEvent) => void;
  onSelect: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onSelect,
}) => {
  // 쿠팡 스타일 할인율 시뮬레이션 (10% ~ 40%)
  const discountPercent = (product.id % 4) * 10 + 10; 
  const originalPrice = Math.round((product.price * 1000) / (1 - discountPercent / 100));

  // 배송 조건 구분 (로켓배송 또는 무료배송 뱃지 부착용)
  const isRocket = product.id % 2 === 0;
  const isFreeDelivery = product.id % 3 === 0;

  return (
    <div 
      className="product-card" 
      id={`product-card-${product.id}`}
      onClick={() => onSelect(product.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* 의도적인 누적 레이아웃 이동(CLS) 결함: 고정 종횡비 높이(Height/Aspect Ratio)를 부여하지 않아 
          이미지가 지연 로딩 완료되면 툭 떨어지며 레이아웃을 밀쳐내 오클릭을 유발함. Eager 로딩 강제 */}
      <div className="cls-image-wrapper">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="product-card-img" 
          loading="eager" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const cat = product.name.toLowerCase().includes('electronics') ? 'electronics' : 'all';
            target.src = `/images/${cat}.jpg`;
          }}
        />
      </div>
      
      <div className="product-card-info" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 className="product-card-title" style={{ fontSize: '0.95rem', height: '2.4rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.2rem', marginBottom: '0.4rem' }}>
          {product.name}
        </h3>
        
        {/* 웹 접근성 결함: 설명 텍스트를 흰 배경에서 희미한 회색(#a3a3a3)으로 매핑하여 명도 대비AA 규정(4.5:1) 위반 */}
        <p className="product-card-desc" style={{ fontSize: '11px', height: '1.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}>
          {product.description}
        </p>
        
        {/* 쿠팡 스타일 평점 및 별점 개수 */}
        <div className="product-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '0.75rem', fontSize: '11px' }}>
          <Star className="star-icon" style={{ width: '0.85rem', height: '0.85rem' }} />
          <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>
            {product.averageRating > 0 ? product.averageRating.toFixed(1) : '5.0'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
             ({product.reviewCount || 1}개)
          </span>
        </div>

        {/* 정가선 긋기 및 할인율 표기 (쿠팡 스타일) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
            {originalPrice.toLocaleString()}원
          </span>
          <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 'bold' }}>
            ({discountPercent}% 할인가)
          </span>
        </div>

        <div className="product-card-footer" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="product-card-price" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
              ₩{Math.round(product.price * 1000).toLocaleString()}
            </span>
            
            {/* 🚀로켓배송 / 무료배송 뱃지 */}
            <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
              {isRocket && (
                <span style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  padding: '1px 5px',
                  borderRadius: '3px'
                }}>
                  🚀로켓배송
                </span>
              )}
              {isFreeDelivery && (
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  padding: '1px 5px',
                  borderRadius: '3px'
                }}>
                  무료배송
                </span>
              )}
            </div>
          </div>
          
          <button 
            className="btn-add-cart" 
            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
            onClick={(e) => onAddToCart(product, e)}
          >
            장바구니
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
