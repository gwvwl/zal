const Gym = require('./Gym');
const Worker = require('./Worker');
const Client = require('./Client');
const Subscription = require('./Subscription');
const Visit = require('./Visit');
const Payment = require('./Payment');
const Admin = require('./Admin');
const SubscriptionPreset = require('./SubscriptionPreset');
const AuditLog = require('./AuditLog');

// Gym → Workers
Gym.hasMany(Worker, { foreignKey: 'gym_id', as: 'workers' });
Worker.belongsTo(Gym, { foreignKey: 'gym_id', as: 'gym' });

// Gym → Clients
Gym.hasMany(Client, { foreignKey: 'gym_id', as: 'clients' });
Client.belongsTo(Gym, { foreignKey: 'gym_id', as: 'gym' });

// Client → Subscriptions
Client.hasMany(Subscription, { foreignKey: 'client_id', as: 'subscriptions' });
Subscription.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Client → Visits
Client.hasMany(Visit, { foreignKey: 'client_id', as: 'visits' });
Visit.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Subscription → Visits
Subscription.hasMany(Visit, { foreignKey: 'subscription_id', as: 'visits' });
Visit.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

// Client → Payments
Client.hasMany(Payment, { foreignKey: 'client_id', as: 'payments' });
Payment.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Gym → SubscriptionPresets
Gym.hasMany(SubscriptionPreset, { foreignKey: 'gym_id', as: 'presets' });
SubscriptionPreset.belongsTo(Gym, { foreignKey: 'gym_id', as: 'gym' });

// Gym → AuditLogs
Gym.hasMany(AuditLog, { foreignKey: 'gym_id', as: 'auditLogs' });
AuditLog.belongsTo(Gym, { foreignKey: 'gym_id', as: 'gym' });

module.exports = { Gym, Worker, Client, Subscription, Visit, Payment, Admin, SubscriptionPreset, AuditLog };
