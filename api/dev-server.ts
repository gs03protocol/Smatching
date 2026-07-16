import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { app } from "./src/app";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`[api] listening on http://localhost:${port}`));
