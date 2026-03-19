import { Link } from "react-router-dom";

const ThingCard = ({ href, external = false, children }) => {
  const containerClasses = "relative min-w-[14em] max-w-[20em] min-h-[4em] group";
  const textClasses =
    "text-3xl md:text-4xl p-8 transition-transform duration-[140ms] group-hover:translate-y-[0.85em] group-hover:scale-[1.5]";

  const content = (
    <div className={containerClasses}>
      <p className={textClasses}>{children}</p>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link to={href}>{content}</Link>;
};

export default ThingCard;
