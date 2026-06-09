import { useState } from 'react';

import { navigationItems, subscriptionLabels, tabLabels } from '../constants';
import type { Profile, Tab } from '../types';

type TopMenuProps = {
  activeTab: Tab;
  profile: Profile;
  subscription: string;
  onTabChange: (tab: Tab) => void;
};

export function TopMenu({ activeTab, profile, subscription, onTabChange }: TopMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <section className="top-panel">
        <div className="top-title">
          <p className="eyebrow">Fitness Pooh</p>
          <h1>{tabLabels[activeTab]}</h1>
        </div>
        <button
          className="menu-button"
          type="button"
          aria-label="Открыть меню"
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </section>

      {menuOpen && (
        <section className="nav-overlay" onClick={() => setMenuOpen(false)}>
          <aside className="nav-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="nav-profile">
              <div className="avatar">{profile.name?.slice(0, 1) || 'P'}</div>
              <div>
                <strong>{profile.name}</strong>
                <span>{subscriptionLabels[subscription]} · {profile.level}</span>
              </div>
              <button
                className="nav-close"
                type="button"
                aria-label="Закрыть меню"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <nav className="nav-list">
              {navigationItems.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  className={activeTab === item.tab ? 'active' : ''}
                  onClick={() => {
                    onTabChange(item.tab);
                    setMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.caption}</small>
                  </span>
                </button>
              ))}
            </nav>
          </aside>
        </section>
      )}
    </>
  );
}
