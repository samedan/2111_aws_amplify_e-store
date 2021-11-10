import React from "react";
import { Notification, Message } from "element-react";
import { API } from "aws-amplify";
import StripeCheckout from "react-stripe-checkout";
import { stripeKeys } from "../stripe.keys";

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: stripeKeys.publishableAPIKey,
};

const PayButton = ({ product, user }) => {
  const handleCharge = async (token) => {
    try {
      // API Http
      const result = await API.post("labdafunction", "/charge", {
        body: {
          token,
          charge: {
            currency: stripeConfig.currency,
            amount: product.price,
            description: product.description,
          },
        },
      });
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <StripeCheckout
      token={handleCharge}
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
