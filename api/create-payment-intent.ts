import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, currency } = req.body;

    // If no real key is provided, return a mock secret for demo mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "") {
      console.log("Using Demo Mode: Returning mock client secret");
      return res.json({ 
        clientSecret: "pi_demo_secret_" + Math.random().toString(36).substring(7),
        isDemo: true 
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: currency || "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error("Stripe Error:", error.message);
    res.status(400).json({ error: error.message });
  }
}
