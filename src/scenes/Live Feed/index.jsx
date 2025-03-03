import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './scenes/dashboard';
import LiveFeed from './scenes/liveFeed';
//... other imports

function App() {
  return (
    <Router>
      <div className="App">
        {/* Add your navigation component here */}
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/live-feed" component={LiveFeed} />
          {/* Add other routes here */}
        </Switch>
      </div>
    </Router>
  );
}

export default App;