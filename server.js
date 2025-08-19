// server.js
require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const YOUR_DOMAIN = process.env.YOUR_DOMAIN || 'http://localhost:5500'; // where your index.html is served

if (!stripeSecret) {
  console.warn('Warning: STRIPE_SECRET_KEY not set. Set it in .env before running.');
}

const stripe = Stripe(stripeSecret || ''); // will error if empty when called

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    // Build line_items for Stripe from the received items.
    // Each item should have: title (string), unit_price (cents), quantity (int)
    const line_items = items.map(it => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: it.title,
        },
        unit_amount: it.unit_price,
      },
      quantity: it.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating Stripe session:', err);
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Server listening on port ${port}`));
