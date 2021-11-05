import React from "react";
// prettier-ignore
import { Form, Button, Input, Notification, Radio, Progress } from "element-react";
import { PhotoPicker } from "aws-amplify-react";

const initialState = {
  description: "",
  price: "",
  shipped: false,
  imagePreview: "",
  image: "",
};

class NewProduct extends React.Component {
  state = { ...initialState };

  handleAddProduct = () => {
    console.log(this.state);
    this.setState(initialState);
  };

  render() {
    const { shipped, imagePreview, description, price, image } = this.state;
    return (
      <div className="flex-center">
        <h2 className="header">Add New Product</h2>
        <div>
          <Form className="market-header">
            <Form.Item label="Add Product Description">
              <Input
                type="text"
                icon="information"
                placeholder="Description"
                value={description}
                onChange={(description) => this.setState({ description })}
              />
            </Form.Item>
            <Form.Item label="Set Product Price">
              <Input
                type="number"
                icon="plus"
                value={price}
                placeholder="Price $(USD)"
                onChange={(price) => this.setState({ price })}
              />
            </Form.Item>
            <Form.Item labem="Is the Product Shipped or Emailed?">
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
            {/* Photo */}
            {imagePreview && (
              <img
                className="image-preview"
                src={imagePreview}
                alt="product preview "
              />
            )}
            <PhotoPicker
              title="Product Image"
              preview="hidden"
              // Image file
              onPick={(file) => this.setState({ image: file })}
              onLoad={(url) => this.setState({ imagePreview: url })}
              theme={{
                formContainer: {
                  margin: 0,
                  padding: "0.8em",
                },
                formSection: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                },
                sectionBody: {
                  margin: 0,
                  width: "250px",
                },
                sectionHeader: {
                  padding: "0.1em",
                  color: "var(--darkAmazonOrange)",
                },
                photoPickerButton: {
                  display: "none",
                },
              }}
            />
            {/* Button */}
            <Form.Item>
              <Button
                disabled={!image || !description || !price}
                type="primary"
                onClick={this.handleAddProduct}
              >
                Add product
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}

export default NewProduct;
