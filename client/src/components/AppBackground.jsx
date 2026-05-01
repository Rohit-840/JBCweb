import frontBackground from "../assets/front.png";
import dashboardBackground from "../assets/fordb.png";

const traces = Array.from({ length: 14 }, (_, index) => index + 1);
const nodes = Array.from({ length: 12 }, (_, index) => index + 1);
const sparks = Array.from({ length: 28 }, (_, index) => index + 1);
const beams = Array.from({ length: 8 }, (_, index) => index + 1);

export default function AppBackground({ variant = "front" }) {
  const background = variant === "dashboard" ? dashboardBackground : frontBackground;

  return (
    <div className={`app-bg app-bg--${variant}`} aria-hidden="true">
      <img className="app-bg__image" src={background} alt="" />
      <div className="app-bg__motion">
        {traces.map((trace) => (
          <span key={trace} className={`app-bg__trace app-bg__trace--${trace}`} />
        ))}
        {nodes.map((node) => (
          <span key={node} className={`app-bg__node app-bg__node--${node}`} />
        ))}
        {beams.map((beam) => (
          <span key={beam} className={`app-bg__beam app-bg__beam--${beam}`} />
        ))}
        {sparks.map((spark) => (
          <span key={spark} className={`app-bg__spark app-bg__spark--${spark}`} />
        ))}
      </div>
      <div className="app-bg__shade" />
    </div>
  );
}
