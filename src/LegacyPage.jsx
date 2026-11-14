export function LegacyPage({ markup }) {
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}
