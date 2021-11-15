import React from "react";
import { Notification, Message } from "element-react";
import { API, graphqlOperation } from "aws-amplify";
import { getUser } from "../graphql/queries";
import StripeCheckout from "react-stripe-checkout";
import { stripeKeys } from "../stripe.keys";
import { createOrder } from "../graphql/mutations";
import { history } from "../App";

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: stripeKeys.publishableAPIKey,
};

const PayButton = ({ product, userAttributes }) => {
  const getOwnerEmail = async (ownerId) => {
    try {
      const input = { id: ownerId };
      const result = await API.graphql(graphqlOperation(getUser, input));
      console.log(result);
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
    console.log(product);
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
            customerEmail: userAttributes.email,
            ownerEmail,
            shipped: product.shipped,
          },
        },
      });
      console.log({ result });
      if (result.charge.status === "succeeded") {
        // shippedAddress in schema, not shippingAddress (tutorial)
        let shippedAddress = null;
        if (product.shipped) {
          shippedAddress = createShippingAddress(result.charge.source);
        }
        const input = {
          orderUserId: userAttributes.sub,
          orderProductId: product.id,
          shippedAddress,
        };
        const order = await API.graphql(
          graphqlOperation(createOrder, { input })
        );
        console.log(order);
        Notification({
          title: "Success",
          message: `${result.message}`,
          type: "success",
          duration: 3000,
        });
        setTimeout(() => {
          history.push("/");
          Message({
            type: "info",
            message: "Check your verified email for order details",
            duration: 7000,
            showClose: true,
          });
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      Notification.error({
        title: "Error",
        message: `${error.message || "Error processing order"}`,
      });
    }
  };

  return (
    <StripeCheckout
      token={handleCharge}
      email={userAttributes.email}
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
