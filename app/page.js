import CommonGroundApp from "../components/common-ground-app";
import { listHistoryCards } from "../lib/history-store";

export default async function HomePage() {
  const history = await listHistoryCards({ limit: 20 });

  return <CommonGroundApp initialHistory={history} />;
}
