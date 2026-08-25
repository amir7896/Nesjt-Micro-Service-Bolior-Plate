type Props = {
  title?: string;
  value: unknown;
};

export function JsonPanel({ title = 'API response', value }: Props) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <pre className="json">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
