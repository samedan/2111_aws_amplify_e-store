import React from "react";
import NewMarket from "../components/NewMarket";
import MarketList from "../components/MarketList";
import { API, graphqlOperation } from "aws-amplify";
import { searchMarkets } from "../graphql/queries";

class HomePage extends React.Component {
  state = {
    searchTerm: "",
    searchResults: [],
    isSearching: false,
  };

  handleSearchChange = (searchTerm) =>
    this.setState({
      searchTerm,
    });

  handleClearSearch = () =>
    this.setState({ searchTerm: "", searchResults: [], isSearching: false });

  handleSearch = async (event) => {
    event.preventDefault();
    try {
      this.setState({ isSearching: true });
      const result = await API.graphql(
        graphqlOperation(searchMarkets, {
          filter: {
            or: [
              { name: { match: this.state.searchTerm } },
              { owner: { match: this.state.searchTerm } },
              { tags: { match: this.state.searchTerm } },
            ],
          },
          sort: {
            field: "createdAt",
            direction: "desc",
          },
        })
      );
      console.log(result);
      this.setState({
        searchResults: result.data.searchMarkets.items,
        isSearching: false,
      });
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    return (
      <>
        <NewMarket
          handleSearchChange={this.handleSearchChange}
          handleSearch={this.handleSearch}
          handleClearSearch={this.handleClearSearch}
          searchTerm={this.state.searchTerm}
          isSearching={this.state.isSearching}
        />
        <MarketList
          searchTerm={this.state.searchTerm}
          searchResults={this.state.searchResults}
        />
      </>
    );
  }
}

export default HomePage;
