import starterRoute from "../data/systems/starter-route.json";
import { validateSystemContent } from "./index";

const route = validateSystemContent(starterRoute);

console.log(`Validated content system: ${route.id} (${route.contracts.length} contract)`);

