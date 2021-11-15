import React from "react";
import { S3Image } from "aws-amplify-react";
// prettier-ignore
import { Notification, Popover, Button, Dialog, Card, Form, Input, Radio } from "element-react";
import EmailedIcon from "../assets/emailed.svg";
import ShippedIcon from "../assets/shipped.svg";
import { convertCentsToDollars, convertDollarsToCents } from "../utils";
import { UserContext } from "../App";
import PayButton from "./PayButton";
import { updateProduct, deleteProduct } from "../graphql/mutations";
import { API, graphqlOperation } from "aws-amplify";
import { Link } from "react-router-dom";

class Product extends React.Component {
  state = {
    updatedProductDialog: false,
    deleteProductDialog: false,
    description: "",
    price: "",
    shipped: false,
  };

  handleUpdateProduct = async (productId) => {
    try {
      this.setState({ updatedProductDialog: false });
      const { description, price, shipped } = this.state;
      const input = {
        id: productId,
        description,
        shipped,
        price: convertDollarsToCents(price),
      };
      const result = await API.graphql(
        graphqlOperation(updateProduct, { input })
      );
      console.log(result);
      Notification({
        title: "Success",
        message: "Product successfully updated",
        type: "success",
      });
    } catch (error) {
      console.error("Error updating product", error);
      Notification({
        title: "Error",
        message: "Error updating product",
        type: "error",
      });
    }
  };

  handleDeleteProduct = async (productId) => {
    try {
      this.setState({ deleteProductDialog: false });
      const input = {
        id: productId,
      };
      await API.graphql(graphqlOperation(deleteProduct, { input }));
      Notification({
        title: "Success",
        message: "Product successfully deleted",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting product", error);
      Notification({
        title: "Error",
        message: `Error deleting product with id: ${productId}`,
        type: "error",
      });
    }
  };

  render() {
    const { product } = this.props; // MarketPage
    const {
      updatedProductDialog,
      deleteProductDialog,
      description,
      price,
      shipped,
    } = this.state;

    return (
      <UserContext.Consumer>
        {({ userAttributes }) => {
          const isProductOwner =
            userAttributes && userAttributes.sub === product.owner;
          const isEmailVerified =
            userAttributes && userAttributes.email_verified;
          return (
            <div className="card-container">
              <Card bodyStyle={{ padding: 0, minWidth: "200px" }}>
                <S3Image
                  imgKey={product.file.key}
                  theme={{
                    photoImg: { maxWidth: "100%", maxHeight: "100%" },
                  }}
                />
                <div className="card-body">
                  <h3 className="m-0">{product.description}</h3>
                  <div className="items-center">
                    <img
                      src={product.shipped ? ShippedIcon : EmailedIcon}
                      alt="Shipping Icon"
                      className="icon shipping-icon"
                    />

                    {product.shipped ? "Shipped" : "Emailed"}
                  </div>
                  <div className="text-right">
                    <span className="mx-1">
                      ${convertCentsToDollars(product.price)}
                    </span>
                    {isEmailVerified ? (
                      !isProductOwner && (
                        <PayButton
                          product={product}
                          userAttributes={userAttributes}
                        />
                      )
                    ) : (
                      <Link to="/profile" className="link">
                        Verify email to buy this product
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
              {/* Update and delete Buttons */}
              <div className="text-center">
                {isProductOwner && (
                  <>
                    <Button
                      type="warning"
                      icon="edit"
                      className="m-1"
                      onClick={() =>
                        this.setState({
                          updatedProductDialog: true,
                          description: product.description,
                          shipped: product.shipped,
                          price: convertCentsToDollars(product.price),
                        })
                      }
                    />
                    <Popover
                      width="160"
                      trigger="click"
                      visible={deleteProductDialog}
                      placement="top"
                      content={
                        <>
                          <p>Are you sure you want to delete this product?</p>
                          <div className="text-right">
                            <Button
                              size="mini"
                              type="text"
                              className="m-1"
                              onClick={() =>
                                this.setState({ deleteProductDialog: false })
                              }
                            >
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              size="mini"
                              className="m-1"
                              onClick={() =>
                                this.handleDeleteProduct(product.id)
                              }
                            >
                              Confirm
                            </Button>
                          </div>
                        </>
                      }
                    >
                      <Button
                        type="danger"
                        icon="delete"
                        onClick={() =>
                          this.setState({ deleteProductDialog: true })
                        }
                      />
                    </Popover>
                  </>
                )}
              </div>
              {/* Update Product Dialog */}
              <Dialog
                title="Update Product"
                size="large"
                customClass="dialog"
                visible={updatedProductDialog}
                onCancel={() => this.setState({ updatedProductDialog: false })}
              >
                <Dialog.Body>
                  <Form labelPosition="top">
                    <Form.Item label="Update Description">
                      <Input
                        placeholder="Update Description"
                        value={description}
                        trim={true}
                        icon="information"
                        onChange={(description) =>
                          this.setState({ description })
                        }
                      />
                    </Form.Item>
                    <Form.Item label="Update Price">
                      <Input
                        type="number"
                        icon="plus"
                        value={price}
                        placeholder="Price $(USD)"
                        onChange={(price) => this.setState({ price })}
                      />
                    </Form.Item>
                    <Form.Item labem="Update Shipping">
                      <div className="text-center">
                        <Radio
                          value="true"
                          checked={shipped === true}
                          onChange={() => this.setState({ shipped: true })}
                        >
                          Shipped
                        </Radio>
                        <Radio
                          value="false"
                          checked={shipped === false}
                          onChange={() => this.setState({ shipped: false })}
                        >
                          Emailed
                        </Radio>
                      </div>
                    </Form.Item>
                  </Form>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button
                    onClick={() =>
                      this.setState({ updatedProductDialog: false })
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    color="primary"
                    onClick={() => this.handleUpdateProduct(product.id)}
                  >
                    Update
                  </Button>
                </Dialog.Footer>
              </Dialog>
            </div>
          );
        }}
      </UserContext.Consumer>
    );
  }
}

export default Product;
