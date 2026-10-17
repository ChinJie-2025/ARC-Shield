import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'report', label: 'Report a hazard', short: 'Report', icon: '+' },
    { id: 'dashboard', label: 'Safety dashboard', short: 'Queue', icon: 'Q' },
    { id: 'evacuation', label: 'Evacuation routes', short: 'Routes', icon: 'Q' },
    { id: 'flood', label: 'Flood resilience', short: 'Flood', icon: 'Q' },
  ];
  return <header className="site-header"><div className="nav-inner"><a className="brand" href="#top" onClick={(event) => event.preventDefault()}><span className="brand-mark">A</span><span className="brand-name">ARC<span>SHIELD</span><small>SIME DARBY PROPERTY</small></span></a><nav className="desktop-nav" aria-label="Main navigation">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}><span>{tab.icon}</span>{tab.label}</button>)}</nav><span className="prototype-chip"><i /> DEMO ENVIRONMENT</span></div><nav className="mobile-nav" aria-label="Main navigation">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={activeTab === tab.id ? 'mobile-nav-item active' : 'mobile-nav-item'}><span>{tab.icon}</span><small>{tab.short}</small></button>)}</nav></header>;
}

