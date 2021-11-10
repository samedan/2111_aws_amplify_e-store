import React from "react";
import { Notification, Message } from "element-react";
import { API, graphqlOperation } from "aws-amplify";
import { getUser } from "../graphql/queries";
import StripeCheckout from "react-stripe-checkout";
import { stripeKeys } from "../stripe.keys";
import { createOrder } from "../graphql/mutations";

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: stripeKeys.publishableAPIKey,
};

const PayButton = ({ product, user }) => {
  const getOwnerEmail = async (ownerId) => {
    try {
      const input = { id: ownerId };
      const result = await API.graphql(graphqlOperation(getUser, input));
      return result.data.getUser.email;
    } catch (error) {
      console.error("Error fetching user email: ", error);
    }
  };

  const createShippingAddress = (source) => ({
    city: source.address_city,
    country: source.address_country,
    address_line1: source.address_line1,
    address_state: source.address_state,
    address_zip: source.address_zip,
  });

  const handleCharge = async (token) => {
    try {
      const ownerEmail = await getOwnerEmail(product.owner);
      console.log(ownerEmail);
      // API Http
      const result = await API.post("labdafunction", "/charge", {
        body: {
          token,
          charge: {
            currency: stripeConfig.currency,
            amount: product.price,
            description: product.description,
          },
          email: {
            customerEmail: user.attributes.email,
            ownerEmail,
            shipped: product.shipped,
          },
        },
      });
      console.log(result);
      if (result.charge.status === "succeeded") {
        let shippingAddress = null;
        if (product.shipped) {
          shippingAddress = createShippingAddress(result.charge.source);
        }
        const input = {
          orderUserId: user.attributes.sub,
        };
      }
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
