export default function PageHero({ title, subtitle }) {
  return (
    <header className="hero hero-slim">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}
