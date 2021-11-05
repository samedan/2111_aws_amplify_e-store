import React from "react";
import "./App.css";
import { Authenticator, AmplifyTheme } from "aws-amplify-react";
import { Auth, Hub } from "aws-amplify";
import { BrowserRouter as Router, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./components/Navbar";

export const UserContext = React.createContext();

class App extends React.Component {
  state = {
    user: null,
  };

  componentDidMount() {
    // -- All the properties that can change in the theme -- //
    // console.dir(AmplifyTheme);
    this.getUserData();
    Hub.listen(
      // the channel where to listen to events
      "auth",
      // where we want to listen to events, inside and aout of the component
      this,
      // function that handles the event data
      "onHubCapsule"
    );
  }

  getUserData = async () => {
    const user = await Auth.currentAuthenticatedUser();
    user ? this.setState({ user: user }) : this.setState({ user: null });
  };

  onHubCapsule = (capsule) => {
    switch (capsule.payload.event) {
      case "signIn":
        console.log("signed in");
        this.getUserData();
        break;
      case "signUp":
        console.log("signed up");
        break;
      case "signOut":
        console.log("signed up");
        this.setState({ user: null });
        break;
      default:
        return;
    }
  };

  handleSignout = async () => {
    try {
      await Auth.signOut();
      console.log("signedout");
    } catch (error) {
      console.error("Error signing out user", error);
    }
  };

  render() {
    const { user } = this.state;
    return !user ? (
      <Authenticator theme={theme} />
    ) : (
      <UserContext.Provider value={{ user }}>
        <Router>
          <>
            {/* Navbar */}
            <Navbar user={user} handleSignout={this.handleSignout} />
            {/* {Routes} */}
            <div className="app-container">
              <Route exact path="/" component={HomePage} />
              <Route exact path="/profile" component={ProfilePage} />
              <Route
                exact
                path="/markets/:marketId"
                component={({ match }) => (
                  <MarketPage marketId={match.params.marketId} />
                )}
              />
            </div>
          </>
        </Router>
      </UserContext.Provider>
    );
  }
}

const theme = {
  ...AmplifyTheme,
  navBar: {
    ...AmplifyTheme.navBar,
    backgroundColor: "#ffc0cb",
  },
  button: {
    ...AmplifyTheme.button,
    backgroundColor: "var(--amazonOrange)",
  },
  sectionBody: {
    ...AmplifyTheme.sectionBody,
    padding: "5px",
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)",
  },
};

// export default withAuthenticator(
//   App,
//   // greetings
//   true,
//   // customComponnets
//   [],
//   null,
//   theme
// );

export default App;
