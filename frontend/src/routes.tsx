import React from 'react';
import { Route, BrowserRouter } from  'react-router-dom';
import CreatePoint from './pages/CreatePoint/CreatePoint';
import Home from './pages/Home/Home';

const Routes = () => {
  return (
    <BrowserRouter>
      <Route exact path="/" component={Home} />
      <Route exact path="/create-point" component={CreatePoint} />
    </BrowserRouter>
  )
}

export default Routes;