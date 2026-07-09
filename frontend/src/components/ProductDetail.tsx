import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Star, ShoppingCart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
}

interface Review {
  id: number;
  rating: number;
  content: string;
}

interface ProductDetailProps {
  productId: number;
  onBack: () => void;
  onAddToCart: (product: any) => void;
  apiBaseUrl: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  onBack,
  onAddToCart,
  apiBaseUrl,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const productRes = await axios.get(`${apiBaseUrl}/api/products/${productId}`);
        const reviewsRes = await axios.get(`${apiBaseUrl}/api/products/${productId}/reviews`);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, apiBaseUrl]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>상품 상세 정보를 불러오는 중...</h3>
        <p style={{ color: 'var(--text-muted)' }}>잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
        <h3>오류 발생</h3>
        <p>{error || '상품을 찾을 수 없습니다.'}</p>
        <button onClick={onBack} className="btn-add-cart">돌아가기</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* ACCESSIBILITY FLAW: Very small hit area and tiny font size */}
      <button className="back-btn" id="detail-back-btn" onClick={onBack}>
        <ArrowLeft size={12} /> 목록으로 돌아가기
      </button>

      <div className="product-details-container">
        <div>
          <img src={product.imageUrl} alt={product.name} className="detail-img" />
        </div>

        <div className="detail-info">
          <h1 className="detail-title">{product.name}</h1>

          {/* 정가 대비 할인가 표시 (쿠팡 스타일) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
              {Math.round((product.price * 1000) / (1 - (((product.id % 4) * 10 + 10) / 100))).toLocaleString()}원
            </span>
            <span style={{ fontSize: '14px', color: '#f43f5e', fontWeight: 'bold' }}>
              ({(product.id % 4) * 10 + 10}% 할인가)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="detail-price" style={{ color: 'var(--secondary)', margin: 0 }}>
              ₩{Math.round(product.price * 1000).toLocaleString()}
            </span>
            
            {/* 로켓배송 / 무료배송 뱃지 */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {product.id % 2 === 0 && (
                <span style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  🚀로켓배송
                </span>
              )}
              {product.id % 3 === 0 && (
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  무료배송
                </span>
              )}
            </div>
          </div>
          
          <div className="detail-stock">
            <span className="form-label" style={{ marginRight: '0.5rem' }}>판매 상태:</span>
            {product.stock > 0 ? (
              <span className="stock-badge stock-in" id="stock-badge">구매 가능 (재고 {product.stock}개)</span>
            ) : (
              <span className="stock-badge stock-out" id="stock-badge">품절 (재고 없음)</span>
            )}
          </div>

          <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>{product.description}</p>

          <button 
            className="btn-add-cart" 
            id="detail-add-to-cart-btn"
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
          >
            <ShoppingCart size={18} /> 장바구니 담기
          </button>

          <div className="reviews-section">
            <h2 style={{ fontSize: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
              구매자 리뷰 ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: '1rem 0' }}>이 상품에 등록된 리뷰가 아직 없습니다.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        style={{ 
                          fill: i < review.rating ? 'var(--accent)' : 'none', 
                          color: i < review.rating ? 'var(--accent)' : '#cbd5e1' 
                        }} 
                      />
                    ))}
                  </div>
                  {/* ACCESSIBILITY FLAW: Very small review content text with low contrast */}
                  <p style={{ fontSize: '10px', color: '#8c98a5', margin: 0, lineBreak: 'anywhere' }}>
                    {review.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetail;
