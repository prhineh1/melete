import { default as quoteIdtoEra } from "../generated/quoteIdtoEra.js";
import { default as eraToId } from "../generated/eraToId.js";
import createBridge from "./index.js";

createBridge(quoteIdtoEra, eraToId, "quoteEra.csv", "quoteId,eraId");
