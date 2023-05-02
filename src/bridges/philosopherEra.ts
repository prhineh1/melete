import { default as eraToId } from "../generated/era_to_id.js";
import { default as philIdToEra } from "../generated/philId_to_era.js";
import createBridge from "./index.js";

createBridge(philIdToEra, eraToId, "philosopherEra.csv", "philId,eraId");
