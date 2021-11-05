import React from "react";
// prettier-ignore
import { Form, Button, Dialog, Input, Select, Notification } from 'element-react'
import { API, graphqlOperation } from "aws-amplify";
import { createMarket } from "../graphql/mutations";
import { UserContext } from "../App";

import { i18n } from "element-react";
import locale from "element-react/src/locale/lang/en";

i18n.use(locale);

class NewMarket extends React.Component {
  state = {
    addMarketDialog: false,
    name: "",
    tags: ["Arts", "Technology", "Crafts", "Entertainment", "Web Dev"],
    selectedTags: [],
    options: [],
    displayedOptions: [
      "Arts",
      "Technology",
      "Crafts",
      "Entertainment",
      "Web Dev",
    ],
  };

  handleAddMarket = async (user) => {
    // console.log(this.state.name);
    try {
      this.setState({ addMarketDialog: false });
      const input = {
        name: this.state.name,
        owner: user.username,
        tags: this.state.selectedTags,
      };
      const result = await API.graphql(
        graphqlOperation(createMarket, { input })
      );
      console.log(result);
      console.info(`Created market: id ${result.data.createMarket.id}`);
      this.setState({ name: "", selectedTags: [] });
    } catch (error) {
      console.error("Error adding new market", error);
      Notification.error({
        title: "Error",
        message: `${error.message || "Error adding market"}`,
      });
    }
  };

  handleCancel = () => {
    this.setState({
      addMarketDialog: false,
      selectedTags: [],
      options: [],
      name: "",
    });
  };

  handleFilterTags = (query) => {
    // options = [ "Tag1", "tag2"...]
    const options = this.state.tags
      .map((tag) => ({ value: tag, label: tag }))
      .filter((tag) => tag.label.toLowerCase().includes(query.toLowerCase()));
    this.setState({ options });
  };

  render() {
    return (
      <UserContext.Consumer>
        {// 'value' coming from <UserContext.Provider value={{ user }}>
        ({ user }) => (
          <>
            <div className="market-header">
              <h1 className="market-title">
                Create your Marketplace
                <Button
                  onClick={() => this.setState({ addMarketDialog: true })}
                  type="text"
                  icon="edit"
                  className="market-title-button"
                />
              </h1>
            </div>
            <Dialog
              title="Create New Market"
              visible={this.state.addMarketDialog}
              onCancel={() => this.setState({ addMarketDialog: false })}
              size="large"
              customClass="dialog"
            >
              <Dialog.Body>
                <Form labelPosition="top">
                  <Form.Item label="Add Market Name">
                    <Input
                      placeholder="Market Name"
                      trim={true}
                      onChange={(name) => this.setState({ name })}
                      value={this.state.name}
                    />
                  </Form.Item>
                  <Form.Item
                    label={`Add Tags: ${this.state.tags.map((tag) => tag)}`}
                  >
                    <span style={{ fontStyle: "italic" }}>
                      {this.state.tags.map((tag) => `${tag}, `)}
                    </span>
                    <Select
                      multiple={true}
                      filterable={true}
                      placeholder="Market Tags"
                      onChange={(selectedTags) =>
                        this.setState({ selectedTags })
                      }
                      remoteMethod={this.handleFilterTags}
                      remote={true}
                      closeMenuOnSelect={false}
                      value={this.state.selectedTags}
                    >
                      {this.state.options.map((option) => (
                        <Select.Option
                          key={option.value}
                          label={option.value}
                          value={option.value}
                        />
                      ))}
                    </Select>
                  </Form.Item>
                </Form>
              </Dialog.Body>
              <Dialog.Footer>
                <Button onClick={() => this.handleCancel()}>Cancel</Button>
                <Button
                  type="primary"
                  disabled={!this.state.name}
                  onClick={() => this.handleAddMarket(user)}
                >
                  Add
                </Button>
              </Dialog.Footer>
            </Dialog>
          </>
        )}
      </UserContext.Consumer>
    );
  }
}

export default NewMarket;
