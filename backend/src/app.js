const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const gymRoutes = require('./routes/gym.routes');
const workerRoutes = require('./routes/worker.routes');
const clientRoutes = require('./routes/client.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const visitRoutes = require('./routes/visit.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
  ],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/auth', authRoutes);
app.use('/gyms', gymRoutes);
app.use('/workers', workerRoutes);
app.use('/clients', clientRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/visits', visitRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;
