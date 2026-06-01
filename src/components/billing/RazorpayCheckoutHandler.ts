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
    private onPaymentSuccess: (verifyResponse: any) => Promise<void> | void
  ) {}

  async initiateCheckout(product: CatalogProduct): Promise<CheckoutResult> {
    // 1. Load the Razorpay checkout script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      return {
        success: false,
        error: 'Unable to load the Razorpay checkout SDK. Please check your internet connection.',
      };
    }

    try {
      // 2. Create the order with the backend proxy
      const createRes = await clientFetch('/api/payments/create-order?lang=en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.productId }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok) {
        return {
          success: false,
          error: orderData.error || 'Failed to create order on the payment server.',
        };
      }

      // 3. Initiate the Razorpay modal
      return new Promise<CheckoutResult>((resolve) => {
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
            // 4. Verify signature on successful payment capture
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

        const rzp = new (window as any).Razorpay(options);

        rzp.on('payment.failed', (resp: any) => {
          console.error('[RazorpayCheckoutHandler] Transaction failed inside modal:', resp.error);
        });

        rzp.open();
      });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred during checkout setup.',
      };
    }
  }
}
