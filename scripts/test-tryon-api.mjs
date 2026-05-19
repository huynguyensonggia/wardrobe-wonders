// Run: node scripts/test-tryon-api.mjs
import { Client } from "@gradio/client";

const SPACES = [
  "Kwai-Kolors/Kolors-Virtual-Try-On",
  "franciszzj/Leffa",
  "Zheng-Chong/CatVTON",
];

for (const space of SPACES) {
  try {
    console.log(`\nConnecting to ${space}...`);
    const client = await Client.connect(space);
    const api = await client.view_api();
    const named = Object.keys(api.named_endpoints ?? {});
    const unnamed = (api.unnamed_endpoints ?? []).length;
    if (named.length === 0 && unnamed === 0) {
      console.log(`  ❌ API closed (no endpoints exposed)`);
    } else {
      console.log(`  ✅ API open!`);
      console.log(`  Named endpoints: ${named.join(", ") || "(none)"}`);
      console.log(`  Unnamed endpoints: ${unnamed}`);
      console.log("  Full API:");
      console.log(JSON.stringify(api, null, 2));
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }
}
