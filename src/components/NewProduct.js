import React from "react";
// prettier-ignore
import { Form, Button, Input, Notification, Radio, Progress } from "element-react";
import { PhotoPicker } from "aws-amplify-react";
import { Storage, Auth, API, graphqlOperation } from "aws-amplify";
import aws_exports from "../aws-exports";
import { convertDollarsToCents } from "../utils/index";
import { createProduct } from "../graphql/mutations";

const initialState = {
  description: "",
  price: "",
  shipped: false,
  imagePreview: "",
  image: "",
  isUploading: false,
  percentUploaded: 0,
};

class NewProduct extends React.Component {
  state = { ...initialState };

  handleAddProduct = async () => {
    try {
      this.setState({ isUploading: true });

      const visibility = "public";
      const { identityId } = await Auth.currentCredentials();
      const filename = `/${visibility}/${identityId}/${Date.now()}-${
        this.state.image.name
      }`;
      // Upload to S3
      const uploadedFile = await Storage.put(filename, this.state.image.file, {
        contentType: this.state.image.type,
        // progress state
        progressCallback: (progress) => {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
          const percentUploaded = Math.round(
            (progress.loaded / progress.total) * 100
          );
          this.setState({ percentUploaded });
        },
      });
      // put a reference in the DBB
      const file = {
        key: uploadedFile.key,
        bucket: aws_exports.aws_user_files_s3_bucket,
        region: aws_exports.aws_project_region,
      };
      // create the inout
      const input = {
        productMarketId: this.props.marketId,
        description: this.state.description,
        shipped: this.state.shipped,
        price: convertDollarsToCents(this.state.price),
        file,
      };
      const result = await API.graphql(
        graphqlOperation(createProduct, { input })
      );
      console.log("Created Product", result);
      Notification({
        title: "Success",
        message: "Product Successfully Created",
        type: "success",
      });
      this.setState(initialState);
    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  render() {
    const {
      shipped,
      imagePreview,
      description,
      price,
      image,
      isUploading,
      percentUploaded,
    } = this.state;
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
            {percentUploaded > 0 && (
              <>
                <p>{percentUploaded}%</p>
                <Progress
                  type="circle"
                  className="progress"
                  // status="success"
                  status={percentUploaded === 100 ? "success" : ""}
                  percentage={percentUploaded}
                />
              </>
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
                disabled={!image || !description || !price || isUploading}
                type="primary"
                onClick={this.handleAddProduct}
                loading={isUploading}
              >
                {isUploading ? "Uploading..." : "Add product"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}

export default NewProduct;
