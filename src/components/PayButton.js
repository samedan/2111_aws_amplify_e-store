import React from "react";
import { Notification, Message } from "element-react";
import StripeCheckout from "react-stripe-checkout";
import { stripeKeys } from "../stripe.keys";

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: stripeKeys.publishableAPIKey,
};

const PayButton = ({ product, user }) => {
  return (
    <StripeCheckout
      email={user.attributes.email}
      name={product.description}
      amount={product.price}
      shippingAddress={product.shipped}
      billingAddress={product.shipped}
      currency={stripeConfig.currency}
      stripeKey={stripeConfig.publishableAPIKey}
      locale="auto"
      allowRememberMe={false}
    />
  );
};

export default PayButton;
