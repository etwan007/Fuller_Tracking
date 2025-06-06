import { useState } from "react";
import { GoogleLogin } from "./GoogleLogin";
import { GitHubLogin } from "./GithubLogin";

export function LoginMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="login-menu">
        <div
          className={`menu-icon${open ? " open" : ""}`}
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <img src="/img/Menu-Bar.png" alt="Login Menu" className="icon" />
        </div>
      </div>
      <div className={`menu-dropdown${open ? " open" : ""}`}>
        <GoogleLogin />
        <GitHubLogin />
      </div>
    </>
  );
}
