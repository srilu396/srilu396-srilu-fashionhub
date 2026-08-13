/**
 * Shared order utility functions for SRILU FashionHub
 * Centralizes status resolution, financial calculations, and lifecycle timeline formatting.
 */

/**
 * Resolve exact order status based on database status and creation timestamp.
 * Cancellation always takes strict, permanent priority.
 *
 * Timeline:
 * - 0 to 24 hrs  => processing
 * - 24 to 48 hrs => shipped
 * - 48 to 72 hrs => out_for_delivery
 * - 72+ hrs      => delivered
 *
 * @param {Object} order - Order object containing status and createdAt (or orderDate)
 * @returns {String} Resolved order status: 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'
 */
export const resolveOrderStatus = (order) => {
  if (!order) return 'processing';

  // 1. Permanent cancellation override
  const rawStatus = (order.status || '').toLowerCase();
  if (rawStatus === 'cancelled') {
    return 'cancelled';
  }

  // 2. Determine start timestamp
  const dateStr = order.createdAt || order.orderDate;
  if (!dateStr) return rawStatus || 'processing';

  const createdTime = new Date(dateStr).getTime();
  if (isNaN(createdTime)) return rawStatus || 'processing';

  const now = Date.now();
  const elapsedMs = Math.max(0, now - createdTime);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours < 24) {
    return 'processing';
  } else if (elapsedHours < 48) {
    return 'shipped';
  } else if (elapsedHours < 72) {
    return 'out_for_delivery';
  } else {
    return 'delivered';
  }
};

/**
 * Calculate order totals consistently across Cart, Checkout, APIs, and Orders views.
 * Formula: Subtotal + Shipping (0) + Tax (10%) - Coupon Discount = Final Amount
 *
 * @param {Object} params - { items, appliedCoupon }
 * @returns {Object} { subtotal, productSavings, couponDiscount, totalDiscount, shipping, tax, finalAmount }
 */
export const calculateOrderTotals = ({ items = [], appliedCoupon = null }) => {
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item?.product?.price || item?.price || 0);
    const qty = Number(item?.quantity || 1);
    return sum + (price * qty);
  }, 0);

  // Product savings (comparing original price to actual price)
  const productSavings = items.reduce((sum, item) => {
    const origPrice = Number(item?.product?.originalPrice || item?.originalPrice || 0);
    const price = Number(item?.product?.price || item?.price || 0);
    const qty = Number(item?.quantity || 1);
    if (origPrice > price) {
      return sum + ((origPrice - price) * qty);
    }
    return sum;
  }, 0);

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.min_order_value && subtotal < appliedCoupon.min_order_value) {
      couponDiscount = 0;
    } else if (appliedCoupon.discount_type === 'percentage') {
      couponDiscount = (subtotal * Number(appliedCoupon.discount_value)) / 100;
    } else {
      couponDiscount = Math.min(Number(appliedCoupon.discount_value || 0), subtotal);
    }
  }

  const totalDiscount = productSavings + couponDiscount;
  const shipping = 0; // Complimentary Luxury Delivery
  const tax = Math.round(subtotal * 0.1);
  const finalAmount = Math.max(0, Math.round(subtotal + shipping + tax - couponDiscount));

  return {
    subtotal: Math.round(subtotal),
    productSavings: Math.round(productSavings),
    couponDiscount: Math.round(couponDiscount),
    totalDiscount: Math.round(totalDiscount),
    shipping,
    tax,
    finalAmount
  };
};

/**
 * Get detailed timeline steps for an order for tracking UI.
 *
 * @param {Object} order
 * @returns {Array} List of timeline steps with label, date, status, completed flag
 */
export const getSimulatedTimeline = (order) => {
  const resolved = resolveOrderStatus(order);
  const createdDate = order?.createdAt || order?.orderDate || new Date().toISOString();
  const createdTime = new Date(createdDate).getTime();

  const formatDate = (ts) => {
    try {
      return new Date(ts).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      return 'N/A';
    }
  };

  const day1 = createdTime + (24 * 60 * 60 * 1000);
  const day2 = createdTime + (48 * 60 * 60 * 1000);
  const day3 = createdTime + (72 * 60 * 60 * 1000);

  if (resolved === 'cancelled') {
    const cancelledDate = order?.cancelledAt || order?.updatedAt || new Date().toISOString();
    return [
      { id: 'placed', label: 'Order Placed', date: formatDate(createdTime), completed: true, current: false },
      { id: 'cancelled', label: 'Order Cancelled', date: formatDate(cancelledDate), completed: true, current: true, isError: true }
    ];
  }

  const isShipped = ['shipped', 'out_for_delivery', 'delivered'].includes(resolved);
  const isOutForDelivery = ['out_for_delivery', 'delivered'].includes(resolved);
  const isDelivered = resolved === 'delivered';

  return [
    {
      id: 'placed',
      label: 'Order Placed',
      date: formatDate(createdTime),
      completed: true,
      current: false
    },
    {
      id: 'processing',
      label: 'Processing',
      date: formatDate(createdTime),
      completed: true,
      current: resolved === 'processing'
    },
    {
      id: 'shipped',
      label: 'Shipped',
      date: isShipped ? formatDate(day1) : `Est. ${formatDate(day1)}`,
      completed: isShipped,
      current: resolved === 'shipped'
    },
    {
      id: 'out_for_delivery',
      label: 'Out for Delivery',
      date: isOutForDelivery ? formatDate(day2) : `Est. ${formatDate(day2)}`,
      completed: isOutForDelivery,
      current: resolved === 'out_for_delivery'
    },
    {
      id: 'delivered',
      label: 'Delivered',
      date: isDelivered ? formatDate(day3) : `Est. ${formatDate(day3)}`,
      completed: isDelivered,
      current: resolved === 'delivered'
    }
  ];
};
