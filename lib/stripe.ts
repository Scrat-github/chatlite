import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY!,
};

/**
 * Create a checkout session for a new subscription
 */
export async function createCheckoutSession({
  workspaceId,
  email,
  plan = "monthly",
  returnUrl,
}: {
  workspaceId: string;
  email: string;
  plan?: "monthly" | "yearly";
  returnUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    customer_email: email,
    metadata: {
      workspace_id: workspaceId,
      plan,
    },
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
    },
  });

  return { url: session.url, sessionId: session.id };
}

/**
 * Create a customer portal session for managing subscriptions
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string,
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

/**
 * Handle webhook events
 */
export async function handleWebhookEvent(
  signature: string,
  body: string,
  webhookSecret: string,
) {
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.metadata?.workspace_id;
      const subscriptionId = session.subscription;

      if (workspaceId && subscriptionId) {
        // Update workspace subscription status
        await updateWorkspaceSubscription(workspaceId, {
          stripe_subscription_id: subscriptionId as string,
          subscription_status: "trial",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const workspaceId = await getWorkspaceBySubscriptionId(
        subscription.id as string,
      );

      if (workspaceId) {
        await updateWorkspaceSubscription(workspaceId, {
          subscription_status: subscription.status as any,
          plan:
            subscription.items.data[0]?.price?.nickname === "Pro Monthly"
              ? "pro"
              : "free",
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const workspaceId = await getWorkspaceBySubscriptionId(
        subscription.id as string,
      );

      if (workspaceId) {
        await updateWorkspaceSubscription(workspaceId, {
          subscription_status: "canceled",
          plan: "free",
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      // Handle failed payment
      console.log("Invoice payment failed:", event.data.object.id);
      break;
    }
  }

  return { received: true };
}

/**
 * Get pricing information
 */
export function getPricing() {
  return {
    monthly: {
      price: 29,
      period: "month",
      features: [
        "Unlimited conversations",
        "Up to 5 agents",
        "Basic analytics",
        "Email support",
        "14-day free trial",
      ],
    },
    yearly: {
      price: 290,
      period: "year",
      savings: "Save 17%",
      features: [
        "Everything in Monthly",
        "Priority support",
        "Advanced analytics",
        "Custom branding",
        "14-day free trial",
      ],
    },
  };
}

// Helper functions (would be implemented with your database)
async function updateWorkspaceSubscription(
  workspaceId: string,
  data: {
    stripe_subscription_id?: string;
    subscription_status?: string;
    plan?: string;
    trial_ends_at?: Date;
  },
) {
  // Implement with your database
  console.log("Updating workspace subscription:", workspaceId, data);
}

async function getWorkspaceBySubscriptionId(subscriptionId: string) {
  // Implement with your database
  console.log("Finding workspace by subscription:", subscriptionId);
  return null;
}
