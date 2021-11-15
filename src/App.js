import React from "react";
import "./App.css";
import { Authenticator, AmplifyTheme } from "aws-amplify-react";
import { Auth, API, Hub, graphqlOperation } from "aws-amplify";
import { getUser } from "./graphql/queries";
import { Router, Route } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./components/Navbar";
import { registerUser } from "./graphql/mutations";

// so we can reroute to main pageafter Order (PayButton)
export const history = createBrowserHistory();

export const UserContext = React.createContext();

class App extends React.Component {
  state = {
    user: null,
    userAttributes: null,
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
    user
      ? this.setState({ user: user }, () =>
          this.getUserAttributes(this.state.user)
        )
      : this.setState({ user: null });
  };

  // {email, email_verified, phone_number, phone_number_verified, sub}
  getUserAttributes = async (authUserData) => {
    // Attributes Array
    const attributesArray = await Auth.userAttributes(authUserData);
    const attributesObject = Auth.attributesToObject(attributesArray);
    console.log(attributesObject);
    this.setState({ userAttributes: attributesObject });
  };

  onHubCapsule = (capsule) => {
    switch (capsule.payload.event) {
      case "signIn":
        console.log("signed in");
        this.getUserData();
        this.registerNewUser(capsule.payload.data);
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
  registerNewUser = async (signInData) => {
    // Check if user exists
    const getUserInput = {
      id: signInData.signInUserSession.idToken.payload.sub,
    };
    const { data } = await API.graphql(graphqlOperation(getUser, getUserInput));
    // if we cant get a user (NEW User registration)
    if (!data.getUser) {
      try {
        const registerUserInput = {
          ...getUserInput,
          username: signInData.username,
          email: signInData.signInUserSession.idToken.payload.email,
          registered: true,
        };
        const newUser = await API.graphql(
          graphqlOperation(registerUser, { input: registerUserInput })
        );
        console.log({ newUser });
      } catch (error) {
        console.error("Error regitering New user", error);
      }
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
    const { user, userAttributes } = this.state;
    return !user ? (
      <Authenticator theme={theme} />
    ) : (
      <UserContext.Provider value={{ user, userAttributes }}>
        <Router history={history}>
          <>
            {/* Navbar */}
            <Navbar user={user} handleSignout={this.handleSignout} />
            {/* {Routes} */}
            <div className="app-container">
              <Route exact path="/" component={HomePage} />
              <Route
                exact
                path="/profile"
                component={() => (
                  <ProfilePage userAttributes={userAttributes} user={user} />
                )}
              />
              <Route
                exact
                path="/markets/:marketId"
                component={({ match }) => (
                  <MarketPage
                    user={user}
                    userAttributes={userAttributes}
                    marketId={match.params.marketId}
                  />
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
