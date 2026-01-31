
import React from 'react';
import { NavLink } from 'react-router-dom';

const MenuItem: React.FC<{ url: string; title: string; children?: React.ReactNode }> = ({ url, title, children }) => (
  <li>
    <NavLink
      to={url}
      className={({ isActive }) => (isActive ? 'active' : undefined)}
      aria-label={title}
    >
      {children}
    </NavLink>
  </li>
);

const Menu: React.FC<{ name?: string }> = () => (
  <nav className="navbar navbar-default" role="navigation">
    <div className="container">
      <div className="navbar-header">
        <a className="navbar-brand" href="/"><span></span></a>
        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#main-navbar">
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      </div>

      <div className="navbar-collapse collapse" id="main-navbar">
        <ul className="nav navbar-nav navbar-right">
          <MenuItem url="/" title="home page">
            <span className="glyphicon glyphicon-home" aria-hidden="true"></span>&nbsp;<span>Home</span>
          </MenuItem>

          <MenuItem url="/owners/list" title="find owners">
            <span className="glyphicon glyphicon-search" aria-hidden="true"></span>&nbsp;<span>Find owners</span>
          </MenuItem>

          <MenuItem url="/vets" title="veterinarians">
            <span className="glyphicon glyphicon-th-list" aria-hidden="true"></span>&nbsp;<span>Veterinarians</span>
          </MenuItem>

          <MenuItem url="/error" title="trigger a RuntimeException to see how it is handled">
            <span className="glyphicon glyphicon-warning-sign" aria-hidden="true"></span>&nbsp;<span>Error</span>
          </MenuItem>
        </ul>
      </div>
    </div>
  </nav>
);

export default Menu;
