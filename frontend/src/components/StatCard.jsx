function StatCard({ title, value, description, icon: Icon, color }) {
  return (
    <div className="stat-card">

      <div className="stat-card-top">
        <div className={`stat-icon ${color}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="stat-title">{title}</p>

      <h2 className="stat-value">{value}</h2>

      <p className="stat-description">
        {description}
      </p>

    </div>
  );
}

export default StatCard;