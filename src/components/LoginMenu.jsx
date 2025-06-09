import { useRef, useState, useEffect } from "react";
import { GoogleLogin } from "./GoogleLogin";
import { GitHubLogin } from "./GithubLogin";

export function LoginMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const toggleMenu = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {open && <div className="blur-overlay" />}

      <div ref={wrapperRef}>
        <div className="login-menu">
          <div
            className={`menu-icon${open ? " open" : ""}`}
            tabIndex={0}
            onClick={toggleMenu}
          >
            <img src="/img/Menu-Bar.png" alt="Login Menu" className="icon" />
          </div>
        </div>

        <div className={`menu-dropdown${open ? " open" : ""}`}>
          <GoogleLogin />
          <GitHubLogin />
        </div>
      </div>
    </>
  );
}
