import React, { useEffect, useState } from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { menuItems } from "../../utils/SidebarMenu";

function Sidebar() {
  const role = localStorage.getItem("role");

  const getInitialOpenMenus = () => {
    try {
      const stored = localStorage.getItem("openMenus");
      return stored ? JSON.parse(stored) : {};
    } catch (err) {
      return {};
    }
  };
  const [openMenus, setOpenMenus] = useState(getInitialOpenMenus);
  const [activeMenu, setActiveMenu] = useState(localStorage.getItem("activeMenu") || "");
  const [activeSubPath, setActiveSubPath] = useState(localStorage.getItem("activeSubPath") || "");

  useEffect(() => {
    const storedActiveMenu = localStorage.getItem("activeMenu");
    if (storedActiveMenu) setActiveMenu(storedActiveMenu);

    const storedSubPath = localStorage.getItem("activeSubPath");
    if (storedSubPath) setActiveSubPath(storedSubPath);
  }, []);
  useEffect(() => {
    localStorage.setItem("openMenus", JSON.stringify(openMenus));
  }, [openMenus]);

  useEffect(() => {
    localStorage.setItem("activeMenu", activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    localStorage.setItem("activeSubPath", activeSubPath);
  }, [activeSubPath]);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
    setActiveMenu(label);
  };

  return (
    <aside>
      {/* JSX */}
      <div className="sidebar_logo">
        <div className="LogoPol fly-logo">
          <span>P</span>
          <span>o</span>
          <span>p</span>
          <span className="gap"></span>
          <span>P</span>
          <span>o</span>
          <span>l</span>
          <span>i</span>
          <span>z</span>
          <span>o</span>
          <span>l</span>
        </div>
        <i>Avtomatlashtirish - kelajak bugun</i>
      </div>


      <div className="sidebar_links">
        {menuItems[role]?.map((item) =>
          item.children ? (
            <div key={item.label} className="sidebar_menu">
              <button
                onClick={() => toggleMenu(item.label)}
                className={`sidebar_menu_button ${activeMenu === item.label ? "active" : ""}`}
              >
                <span>{item.icon} {item.label}</span>
                {openMenus[item.label] ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
              </button>
              {openMenus[item.label] && (
                <div className="sidebar_submenu">
                  {item.children.map((subItem) => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={`sidebar_submenu_item ${activeSubPath === subItem.path ? "active" : ""}`}
                      onClick={() => {
                        setActiveMenu(item.label); // ota menu-ni ham ochiq qilib qolish
                        setActiveSubPath(subItem.path); // active sub-path ni belgilash
                      }}
                    >
                      {subItem.icon} <span>{subItem.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar_menu_item ${activeMenu === item.label ? "active" : ""}`}
              onClick={() => {
                setActiveMenu(item.label); // menyu eslab qolsin
                localStorage.setItem("activeMenu", item.label); // localStorage ga yozish
                setActiveSubPath(""); // submenu bo'lmasa
              }}
            >
              {item.icon} <span className="itemMOBlabel">{item.label}</span>
            </NavLink>

          )
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
