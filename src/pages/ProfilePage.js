import React from "react";
// prettier-ignore
import { Table, Button, Notification, MessageBox, Message, Tabs, Icon, Form, Dialog,Loading, Input, Card, Tag } from 'element-react'
import { API, Auth, graphqlOperation } from "aws-amplify";
import { convertCentsToDollars, formatOrderDate } from "../utils";

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
    email: this.props.userAttributes && this.props.userAttributes.email,
    updateEmailDialog: false,
    verificationForm: false,
    verificationCode: "",
    orders: [],
    columns: [
      { prop: "name", width: "150" },
      { prop: "value", width: "330px" },
      {
        prop: "tag",
        width: "150px",
        render: (row) => {
          if (row.name === "Email") {
            const email_verified = this.props.userAttributes.email_verified;
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
                <Button
                  onClick={() => this.setState({ updateEmailDialog: true })}
                  type="info"
                  size="small"
                >
                  Edit
                </Button>
              );
            case "Delete Profile":
              return (
                <Button
                  onClick={this.handleDeleteProfile}
                  type="danger"
                  size="small"
                >
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
    if (this.props.userAttributes) {
      this.getUserOrders(this.props.userAttributes.sub);
    }
  }

  getUserOrders = async (userId) => {
    const input = { id: userId };
    const result = await API.graphql(graphqlOperation(getUser, input));
    console.log(result);
    if (result.data.getUser !== null) {
      this.setState({ orders: result.data.getUser.orders.items });
    } else {
      return <Loading fullscreen={true} />;
    }
  };

  handleUpdateEmail = async () => {
    try {
      const updatedAttributes = {
        email: this.state.email,
      };
      const result = await Auth.updateUserAttributes(
        this.props.user,
        updatedAttributes
      );
      if (result === "SUCCESS") {
        this.sendVerificationCode("email");
      }
    } catch (error) {
      console.error(error);
      Notification.error({
        title: "Error",
        message: `${error.message || "Error updating email"}`,
      });
    }
  };

  sendVerificationCode = async (attr) => {
    await Auth.verifyCurrentUserAttribute(attr);
    this.setState({ verificationForm: true });
    Message({
      type: "info",
      customClass: "message",
      message: `Verification code sent to ${this.state.email}`,
    });
  };

  handleVerifyEmail = async (attr) => {
    try {
      const result = await Auth.verifyCurrentUserAttributeSubmit(
        attr,
        this.state.verificationCode
      );
      Notification({
        title: "Success",
        message: "Email successfuly verified",
        type: `${result.toLowerCase()}`,
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error(error);
      Notification.error({
        title: "Error",
        message: `${error.message || "Error updating email"}`,
      });
    }
  };

  handleDeleteProfile = () => {
    MessageBox.confirm(
      "This will permanently delete your account. All your data (orders/products) will be lost. Continue?",
      "Attention!",
      {
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        type: "warning",
      }
    )
      .then(async () => {
        try {
          await this.props.user.deleteUser(() => window.location.reload());
        } catch (error) {
          console.error(error);
        }
      })
      // is user canceled deleteing profile
      .catch(() => {
        Message({
          type: "info",
          message: "Delete canceled",
        });
      });
  };

  render() {
    const {
      orders,
      columns,
      updateEmailDialog,
      email,
      verificationCode,
      verificationForm,
    } = this.state;
    const { user, userAttributes } = this.props;
    return (
      userAttributes && (
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
                  { name: "Your Id", value: userAttributes.sub },
                  { name: "Username", value: user.username },
                  { name: "Email", value: userAttributes.email },
                  { name: "Phone Number", value: userAttributes.phone_number },
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
                // console.log(order);
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
                          {formatOrderDate(order.createdAt)}
                        </p>
                        {order.shippedAddress && (
                          <>
                            <strong className="colored">
                              Shipping Address:
                            </strong>{" "}
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
          {/* Update email */}
          <Dialog
            size="large"
            customClass="dialog"
            title="Edit Email"
            visible={updateEmailDialog}
            onCancel={() => this.setState({ updateEmailDialog: false })}
          >
            <Dialog.Body>
              <Form labelPosition="top">
                <Form.Item lable="Email">
                  <Input
                    value={email}
                    onChange={(email) => this.setState({ email: email })}
                  />
                </Form.Item>
                {verificationForm && (
                  <Form.Item label="Enter verification code" lebelWidth="120">
                    <Input
                      onChange={(verificationCode) =>
                        this.setState({ verificationCode })
                      }
                      value={verificationCode}
                    />
                  </Form.Item>
                )}
              </Form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                onClick={() => this.setState({ updateEmailDialog: false })}
              >
                Cancel
              </Button>
              {!verificationForm && (
                <Button type="primary" onClick={this.handleUpdateEmail}>
                  Save
                </Button>
              )}
              {verificationForm && (
                <Button
                  type="primary"
                  // takes the attribute sent 'email' to verify it
                  onClick={() => this.handleVerifyEmail("email")}
                >
                  Submit
                </Button>
              )}
            </Dialog.Footer>
          </Dialog>
        </>
      )
    );
  }
}

export default ProfilePage;
