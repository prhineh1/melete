import { default as quoteIdtoEra } from "../generated/quoteId_to_era.js";
import { default as eraToId } from "../generated/era_to_id.js";
import createBridge from "./index.js";

createBridge(quoteIdtoEra, eraToId, "quoteEra.csv", "quoteId,eraId");
