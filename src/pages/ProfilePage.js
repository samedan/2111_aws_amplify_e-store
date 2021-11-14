import React from "react";
// prettier-ignore
import { Table, Button, Notification, MessageBox, Message, Tabs, Icon, Form, Dialog, Input, Card, Tag } from 'element-react'
import { API, graphqlOperation } from "aws-amplify";
import { convertCentsToDollars } from "../utils";

const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      username
      email
      registered
      orders(sortDirection: DESC, limit: 999) {
        items {
          id
          createdAt
          updatedAt
          product {
            id
            owner
            price
            createdAt
            description
          }
          shippedAddress {
            city
            country
            address_line1
            address_state
            address_zip
          }
        }
        nextToken
      }
      createdAt
      updatedAt
    }
  }
`;

class ProfilePage extends React.Component {
  state = {
    orders: [],
    columns: [
      { prop: "name", width: "150" },
      { prop: "value", width: "330px" },
      {
        prop: "tag",
        width: "150px",
        render: (row) => {
          if (row.name === "Email") {
            const email_verified = this.props.user.attributes.email_verified;
            return email_verified ? (
              <Tag type="success">Verified</Tag>
            ) : (
              <Tag type="danger">Unverified</Tag>
            );
          }
        },
      },
      {
        prop: "operations",
        render: (row) => {
          switch (row.name) {
            case "Email":
              return (
                <Button type="info" size="small">
                  Edit
                </Button>
              );
            case "Delete Profile":
              return (
                <Button type="danger" size="small">
                  Delete
                </Button>
              );
            default:
              return;
          }
        },
      },
    ],
  };

  componentDidMount() {
    if (this.props.user) {
      this.getUserOrders(this.props.user.attributes.sub);
    }
  }

  getUserOrders = async (userId) => {
    const input = { id: userId };
    const result = await API.graphql(graphqlOperation(getUser, input));
    this.setState({ orders: result.data.getUser.orders.items });
  };

  render() {
    const { orders, columns } = this.state;
    const { user } = this.props;
    return (
      <>
        <Tabs activeName="1" className="profile-tabs">
          <Tabs.Pane
            label={
              <>
                <Icon name="document" className="icon" />
                Summary
              </>
            }
            name="1"
          >
            <h2 className="header">Profile Summary</h2>
            <Table
              columns={columns}
              data={[
                { name: "Your Id", value: user.attributes.sub },
                { name: "Username", value: user.username },
                { name: "Email", value: user.attributes.email },
                { name: "Phone Number", value: user.attributes.phone_number },
                { name: "Delete Profile", value: "Sorry to see you go" },
              ]}
              showHeader={false}
              rowClassName={(row) =>
                row.name === "Delete Profile" && "delete-profile"
              }
            />
          </Tabs.Pane>
          <Tabs.Pane
            label={
              <>
                <Icon name="message" className="icon" />
                Orders
              </>
            }
            name="2"
          >
            <h2 className="header">Order History</h2>
            {orders.map((order) => {
              console.log(order);
              return (
                <div className="mb-1" key={order.id}>
                  <Card>
                    <pre>
                      <p>
                        <strong className="colored">Order Id:</strong>{" "}
                        {order.id}
                      </p>
                      <p>
                        <strong className="colored">
                          Product Description:
                        </strong>{" "}
                        {order.product.description}
                      </p>
                      <p>
                        <strong className="colored">Product price:</strong> $
                        {convertCentsToDollars(order.product.price)}
                      </p>
                      <p>
                        <strong className="colored">Purchased on:</strong>{" "}
                        {order.createdAt}
                      </p>
                      {order.shippedAddress && (
                        <>
                          <strong className="colored">Shipping Address:</strong>{" "}
                          <div className="ml-2">
                            <p>{order.shippedAddress.address_line1}</p>
                            <p>
                              {order.shippedAddress.city} -{" "}
                              {order.shippedAddress.state}
                            </p>
                            <p>{order.shippedAddress.address_country}</p>
                            <p>{order.shippedAddress.address_zip}</p>
                          </div>
                        </>
                      )}
                    </pre>
                  </Card>
                </div>
              );
            })}
          </Tabs.Pane>
        </Tabs>
      </>
    );
  }
}

export default ProfilePage;
