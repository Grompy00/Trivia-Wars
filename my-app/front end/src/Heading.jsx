import { Link } from "react-router-dom";

function Heading() {
  return (
    <div className="heading-container">
      <header>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          Trivia Wars
        </Link>
      </header>
      <hr />
    </div>
  );
}

export default Heading;