import React from 'react';

import logo from './assets/logo.svg';

const Header: React.FC = () => {
  return (
    <header>
      <img src={logo} alt="Ecoleta"/>
    </header>
  );
}

export default Header;