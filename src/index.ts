import server from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";

async function startServer() {
  await connectDatabase();
  server.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}
startServer();
