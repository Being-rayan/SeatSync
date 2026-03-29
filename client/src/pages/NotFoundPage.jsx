import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="stack-page">
      <div className="empty-state">
        <h3>That page does not exist.</h3>
        <p>Return to the landing page or reopen your dashboard.</p>
        <Link className="button button--brand" to="/">
          Go home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
