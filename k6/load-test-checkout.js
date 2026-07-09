import http from 'k6/http';
import { sleep, check } from 'k6';

// k6 Options: 15 concurrent users executing orders repeatedly for 20 seconds
export const options = {
  scenarios: {
    checkout_stress: {
      executor: 'constant-vus',
      vus: 15,
      duration: '20s',
    },
  },
  thresholds: {
    // Under lock contention and 5 connection limits, we expect latency to spike and some checkouts to fail
    http_req_duration: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const MODE = __ENV.MODE || 'pessimistic'; // Modes: unsafe, pessimistic, optimistic

export default function () {
  const url = `${BASE_URL}/api/orders/${MODE}`;
  
  // Checkout product ID 1 (which starts with some limited stock, e.g. 10 to 150)
  const payload = JSON.stringify({
    customerName: `k6 Load Test User ${__VU}`,
    customerEmail: `k6-user-${__VU}@example.com`,
    items: [
      {
        productId: 1, // Focus on product 1 to trigger row-level locking contention
        quantity: 1
      }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  // We check if it returns 201 (Created) or if it fails.
  // Under extreme load, it will start returning 500 (Connection timeout or Out of stock).
  check(res, {
    'is created (201)': (r) => r.status === 201,
    'is out of stock or error (500)': (r) => r.status === 500 || r.status === 400
  });

  // Short delay between orders
  sleep(0.5);
}
