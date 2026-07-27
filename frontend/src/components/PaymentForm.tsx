import { useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const PaymentForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'UGX',
    payment_type: 'tithe',
    payment_method: 'mobile_money',
    metadata: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/payments/create_payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        alert('Payment initiated! Please complete payment on your device.');
        if (onSuccess) onSuccess();
      } else {
        alert('Payment failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error processing payment');
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      <h2>Give to the Church</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            placeholder="Enter amount"
            step="0.01"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Type
          </label>
          <select
            name="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="tithe">Tithe</option>
            <option value="offering">Offering</option>
            <option value="project">Project Donation</option>
            <option value="event">Event Registration</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Payment Method
          </label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="mobile_money">Mobile Money (MTN/Airtel)</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Credit/Debit Card</option>
            <option value="cash">Cash (In Person)</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Notes (Optional)
          </label>
          <input
            type="text"
            name="metadata"
            value={formData.metadata}
            onChange={handleChange}
            placeholder="e.g., In honor of..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            background: '#003d7a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing...' : 'Give Now'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
        Your generosity enables ministry and outreach. Thank you for your stewardship!
      </p>
    </motion.div>
  );
};
