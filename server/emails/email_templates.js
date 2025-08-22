const getOrderConfirmationEmail = (user, order) => `
  Hello ${user.username},

  Thank you for your order! Your order #${order.id} has been confirmed.

  Order Details:
  ${order.items.map(item => `- ${item.name} (x${item.quantity}): $${item.price}`).join('\n')}
  Total: $${order.totalAmount}

  You can view your order history in your dashboard.

  Thanks,
  Kapiree Team
`;

const getVerificationEmail = (user, verificationLink) => `
  Hello ${user.username},

  Thank you for registering with Kapiree! Please verify your email address by clicking the link below:

  ${verificationLink}

  If you did not register for an account, please ignore this email.

  Thanks,
  Kapiree Team
`;

const getSubscriptionConfirmationEmail = (user, subscription) => `
  Hello ${user.username},

  Your subscription to the ${subscription.planName} plan has been successfully activated!

  Subscription Details:
  Plan: ${subscription.planName}
  Status: ${subscription.status}
  Start Date: ${subscription.startDate}
  End Date: ${subscription.endDate || 'N/A'}

  You can manage your subscription in your customer portal.

  Thanks,
  Kapiree Team
`;

const getCancellationConfirmationEmail = (user, subscription) => `
  Hello ${user.username},

  Your subscription to the ${subscription.planName} plan has been successfully cancelled.

  Cancellation Details:
  Plan: ${subscription.planName}
  Status: ${subscription.status}
  Cancellation Date: ${new Date().toLocaleDateString()}
  ${subscription.endDate ? `Your subscription will remain active until ${subscription.endDate}.` : ''}

  We're sorry to see you go!

  Thanks,
  Kapiree Team
`;

const getPlanChangeConfirmationEmail = (user, oldSubscription, newSubscription) => `
  Hello ${user.username},

  Your subscription plan has been successfully updated from ${oldSubscription.planName} to ${newSubscription.planName}!

  New Subscription Details:
  Plan: ${newSubscription.planName}
  Status: ${newSubscription.status}
  Start Date: ${newSubscription.startDate}
  End Date: ${newSubscription.endDate || 'N/A'}

  You can manage your subscription in your customer portal.

  Thanks,
  Kapiree Team
`;

module.exports = {
  getOrderConfirmationEmail,
  getVerificationEmail,
  getSubscriptionConfirmationEmail,
  getCancellationConfirmationEmail,
  getPlanChangeConfirmationEmail,
};
