import dashboardBackground from "../assets/fordb.png";
import frontBackground from "../assets/front.png";
import ThreeScene from "./ThreeScene.jsx";

const traces = Array.from({ length: 14 }, (_, index) => index + 1);
const nodes = Array.from({ length: 12 }, (_, index) => index + 1);
const beams = Array.from({ length: 8 }, (_, index) => index + 1);
const sparks = Array.from({ length: 28 }, (_, index) => index + 1);
const dashboardLines = Array.from({ length: 8 }, (_, index) => index + 1);
const dashboardSparks = Array.from({ length: 30 }, (_, index) => index + 1);

export default function AppBackground({ variant = "front" }) {
  const isDashboard = variant === "dashboard";

  return (
    <div className={`app-bg app-bg--${variant}`} aria-hidden="true">
      {isDashboard ? (
        <>
          <img className="app-bg__image app-bg__image--dashboard" src={dashboardBackground} alt="" />
          <ThreeScene mode="dashboard" />
          <div className="dashboard-bg-effects">
            {dashboardLines.map((line) => (
              <span key={`dashboard-line-${line}`} className={`dashboard-bg-line dashboard-bg-line--${line}`} />
            ))}
            {dashboardSparks.map((spark) => (
              <span key={`dashboard-spark-${spark}`} className={`dashboard-bg-spark dashboard-bg-spark--${spark}`} />
            ))}
          </div>
        </>
      ) : (
        <>
          <img className="app-bg__image" src={frontBackground} alt="" />
          <ThreeScene mode="front" />
          <div className="app-bg__motion">
            {traces.map((trace) => (
              <span key={`trace-${trace}`} className={`app-bg__trace app-bg__trace--${trace}`} />
            ))}
            {nodes.map((node) => (
              <span key={`node-${node}`} className={`app-bg__node app-bg__node--${node}`} />
            ))}
            {beams.map((beam) => (
              <span key={`beam-${beam}`} className={`app-bg__beam app-bg__beam--${beam}`} />
            ))}
            {sparks.map((spark) => (
              <span key={`spark-${spark}`} className={`app-bg__spark app-bg__spark--${spark}`} />
            ))}
          </div>
        </>
      )}
      <div className="app-bg__vignette" />
      <div className="app-bg__shade" />
    </div>
  );
}
