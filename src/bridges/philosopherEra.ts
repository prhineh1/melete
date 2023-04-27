import { default as eraToId } from "../generated/eraToId.js";
import { default as philIdToEra } from "../generated/philIdToEra.js";
import createBridge from "./index.js";

createBridge(philIdToEra, eraToId, "philosopherEra.csv", "philId,eraId");
