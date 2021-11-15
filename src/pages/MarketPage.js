import React from "react";
import { Loading, Tabs, Icon } from "element-react";
import { API, graphqlOperation } from "aws-amplify";
// import { getMarket } from "../graphql/queries";
// manually added to this file with 'file' added
import { Link } from "react-router-dom";
import NewProduct from "../components/NewProduct";
import {
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
} from "../graphql/subscriptions";
import Product from "../components/Product";

const getMarket = /* GraphQL */ `
  query GetMarket($id: ID!) {
    getMarket(id: $id) {
      id
      name
      products(sortDirection: DESC, limit: 999) {
        items {
          id
          description
          price
          shipped
          owner
          createdAt
          updatedAt
          file {
            key
          }
        }
        nextToken
      }
      tags
      owner
      createdAt
      updatedAt
    }
  }
`;

class MarketPage extends React.Component {
  state = {
    market: null,
    isLoading: true,
    isMarketOwner: false,
    isEmailVerified: false,
  };

  componentDidMount() {
    this.handleGetMarket();
    const { user } = this.props;
    // POST
    this.createProductListener = API.graphql(
      graphqlOperation(onCreateProduct, { owner: user.username })
    ).subscribe({
      next: (productData) => {
        const createdProduct = productData.value.data.onCreateProduct;
        // separate createdProduct from the others
        const prevProducts = this.state.market.products.items.filter(
          (item) => item.id !== createdProduct.id
        );
        const updatedProducts = [createdProduct, ...prevProducts];
        // shallow copy
        const marketCopy = { ...this.state.market };
        marketCopy.products.items = updatedProducts;
        this.setState({ market: marketCopy });
      },
    });
    // EDIT
    this.updateProductListener = API.graphql(
      graphqlOperation(onUpdateProduct, { owner: user.username })
    ).subscribe({
      next: (productData) => {
        const updatedProduct = productData.value.data.onUpdateProduct;
        const updatedProductIndex = this.state.market.products.items.findIndex(
          (item) => item.id === updatedProduct.id
        );
        const updatedProducts = [
          // [ , , , Index,
          ...this.state.market.products.items.slice(0, updatedProductIndex),
          updatedProduct,
          // till the end index -> ,,,]
          ...this.state.market.products.items.slice(updatedProductIndex + 1),
        ];
        // console.log(updatedProducts);
        // shallow copy
        const marketCopy = { ...this.state.market };
        marketCopy.products.items = updatedProducts;
        this.setState({ market: marketCopy });
      },
    });
    // DELETE
    this.deleteProductListener = API.graphql(
      graphqlOperation(onDeleteProduct, { owner: user.username })
    ).subscribe({
      next: (productData) => {
        const deletedProduct = productData.value.data.onDeleteProduct;
        // separate deletedProduct from the others
        const updatedProducts = this.state.market.products.items.filter(
          (item) => item.id !== deletedProduct.id
        );
        // shallow copy
        const marketCopy = { ...this.state.market };
        marketCopy.products.items = updatedProducts;
        this.setState({ market: marketCopy });
      },
    });
  }

  componentWillUnmount() {
    this.createProductListener.unsubscribe();
    this.updateProductListener.unsubscribe();
    this.deleteProductListener.unsubscribe();
  }

  handleGetMarket = async () => {
    const input = {
      id: this.props.marketId,
    };
    const result = await API.graphql(graphqlOperation(getMarket, input));
    console.log(result);
    this.setState({ market: result.data.getMarket, isLoading: false }, () => {
      this.checkMarketOwner();
      this.checkEmailVerified();
    });
  };

  checkMarketOwner = () => {
    const { user } = this.props;
    const { market } = this.state;
    if (user) {
      this.setState({ isMarketOwner: user.username === market.owner });
    }
  };

  checkEmailVerified = () => {
    const { userAttributes } = this.props;
    if (userAttributes) {
      this.setState({ isEmailVerified: userAttributes.email_verified });
    }
  };

  render() {
    const { market, isLoading, isMarketOwner, isEmailVerified } = this.state;
    return isLoading ? (
      <Loading fullscreen={true} />
    ) : (
      <>
        {/* <p>{new Date(Date.now()).toDateString()}</p> */}
        <Link className="link" to="/">
          Back to market list
        </Link>
        {/* // Market Data */}
        <span className="items-center pt-2">
          <h2 className="mb-mr">{market.name}</h2> - {market.owner}
        </span>
        <div className="items-center pt-2">
          <span style={{ color: "var(--lightSquidInk)", paddingBottom: "1em" }}>
            <Icon name="date" className="icon" />
            {market.createdAt}
          </span>
        </div>
        {/* New product */}
        <Tabs type="border-card" value={isMarketOwner ? "1" : "2"}>
          {isMarketOwner && (
            <Tabs.Pane
              label={
                <>
                  <Icon name="plus" className="icon" />
                  Add Product
                </>
              }
              name="1"
            >
              {/* marketId props coming from NewProduct */}
              {isEmailVerified ? (
                <NewProduct marketId={this.props.marketId} />
              ) : (
                <Link to="/profile" className="header">
                  Verify your email before adding products
                </Link>
              )}
            </Tabs.Pane>
          )}
          {/* Products List */}
          <Tabs.Pane
            label={
              <>
                <Icon name="menu" className="icon" />
                Products ({market.products.items.length})
              </>
            }
            name="2"
          >
            <div className="product-list">
              {market.products.items.map((product) => (
                <Product key={product.id} product={product} />
              ))}
            </div>
          </Tabs.Pane>
        </Tabs>
      </>
    );
  }
}

export default MarketPage;
