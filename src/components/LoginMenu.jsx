import { useState } from "react";
import { GoogleLogin } from "./GoogleLogin";
import { GitHubLogin } from "./GithubLogin";

const ScreenFocus = () => {
  const targetRef = useRef(null);
  const [clipPath, setClipPath] = useState(null);

  const handleFocus = () => {
    const rect = targetRef.current.getBoundingClientRect();

    // Create a circular clip-path or rectangle around the element
    const padding = 10;
    const left = rect.left - padding;
    const top = rect.top - padding;
    const width = rect.width + 2 * padding;
    const height = rect.height + 2 * padding;

    setClipPath(`polygon(
      0 0, 100% 0, 100% 100%, 0 100%, 0 0,
      ${left}px ${top}px,
      ${left}px ${top + height}px,
      ${left + width}px ${top + height}px,
      ${left + width}px ${top}px,
      ${left}px ${top}px
    )`);
  };

    const handleUnfocus = () => {
    setClipPath(null);
  };

export function LoginMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="login-menu">
              {clipPath && (
        <div
          style={{
            clipPath: clipPath,
          }}
        />
      )}
        <div
          className={`menu-icon${open ? " open" : ""}`}
          tabIndex={0}
          onClick={() => setOpen((v) => !v), handleFocus}
          onBlur={() => setOpen(false), handleUnfocus}
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
