import { CheckoutHandler, CheckoutResult } from './MockCheckoutModal';
import { CatalogProduct } from '@/types/billing';
import { clientFetch } from '@/lib/apiClient';

/**
 * Dynamically loads the Razorpay checkout script if it is not already present in the document.
 */
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    // If Razorpay object is already loaded globally
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Real payment provider integration for Razorpay in Astra Navi.
 * Integrates with /api/payments/create-order and /api/payments/verify endpoints.
 */
export class RazorpayCheckoutHandler implements CheckoutHandler {
  providerId = 'razorpay';
  providerName = 'Razorpay';

  constructor(
    private user: { name?: string | null; email?: string | null; phoneNumber?: string | null } | null,
    private language: string,
    private onPaymentSuccess: (verifyResponse: any) => Promise<void> | void
  ) {}

  async precreateOrder(product: CatalogProduct): Promise<any> {
    // 1. Load the Razorpay checkout script in the background
    loadRazorpayScript();

    // 2. Create the order on the backend
    const createRes = await clientFetch(`/api/payments/create-order?lang=${this.language || 'en'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.productId }),
    });

    const orderData = await createRes.json();
    if (!createRes.ok) {
      throw new Error(orderData.error || 'Failed to create order on the payment server.');
    }
    return orderData;
  }

  async initiateCheckout(product: CatalogProduct, precreatedOrderData?: any): Promise<CheckoutResult> {
    const RazorpayObj = (window as any).Razorpay;
    
    // If script is already loaded and order is precreated, execute completely synchronously
    // to bypass mobile browser popup blockers.
    if (RazorpayObj && precreatedOrderData) {
      return new Promise<CheckoutResult>((resolve) => {
        this.openRazorpayModal(RazorpayObj, precreatedOrderData, product, resolve);
      });
    }

    // Fallback: load script dynamically if not loaded
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      return {
        success: false,
        error: 'Unable to load the Razorpay checkout SDK. Please check your internet connection.',
      };
    }

    try {
      let orderData = precreatedOrderData;
      if (!orderData) {
        const createRes = await clientFetch(`/api/payments/create-order?lang=${this.language || 'en'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.productId }),
        });

        orderData = await createRes.json();
        if (!createRes.ok) {
          return {
            success: false,
            error: orderData.error || 'Failed to create order on the payment server.',
          };
        }
      }

      return new Promise<CheckoutResult>((resolve) => {
        this.openRazorpayModal((window as any).Razorpay, orderData, product, resolve);
      });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred during checkout setup.',
      };
    }
  }

  private openRazorpayModal(
    RazorpayClass: any,
    orderData: any,
    product: CatalogProduct,
    resolve: (res: CheckoutResult) => void
  ) {
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Astra Navi',
      description: orderData.product_name || product.nameEn,
      order_id: orderData.order_id,
      prefill: {
        name: this.user?.name || '',
        email: this.user?.email || '',
        contact: this.user?.phoneNumber || '',
      },
      theme: {
        color: '#c8880a', // Astra Navi secondary gold accent
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        // Verification signature on payment completion
        try {
          const verifyRes = await clientFetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            resolve({
              success: false,
              error: verifyData.error || 'Payment signature verification failed.',
            });
            return;
          }

          // Fulfilled successfully, call verification success callback to refresh credits/tier
          await this.onPaymentSuccess(verifyData);

          resolve({
            success: true,
            orderId: response.razorpay_order_id,
          });
        } catch (err) {
          resolve({
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred during verification.',
          });
        }
      },
      modal: {
        ondismiss: () => {
          resolve({
            success: false,
            error: 'Payment was cancelled.',
          });
        },
      },
    };

    const rzp = new RazorpayClass(options);

    rzp.on('payment.failed', (resp: any) => {
      console.error('[RazorpayCheckoutHandler] Transaction failed inside modal:', resp.error);
    });

    rzp.open();
  }
}
