import { createSeedFile } from "../utils.js";

//@ts-ignore
const { quoteIdToEra } = await import("../generated/quoteID_to_era.js");
//@ts-ignore
const { eraToId } = await import("../generated/era_to_id.js");
//@ts-ignore
const { philIdToEra } = await import("../generated/philId_to_era.js");

function createData(
  idToEntity: Map<number, string[]>,
  entityToId: Map<string, number>
): string {
  let csvData = "";

  for (const [entityKey, entityValues] of idToEntity.entries()) {
    for (const value of entityValues) {
      const valueId = entityToId.get(value);
      if (valueId) {
        csvData += `${entityKey},${valueId}\n`;
      }
    }
  }

  return csvData;
}

function createBridge(
  idToEntity: Map<number, string[]>,
  entityToId: Map<string, number>,
  csvPath: string,
  csvHeaders: string
) {
  const data = createData(idToEntity, entityToId);
  createSeedFile(data, csvPath, csvHeaders);
}

export default function createBridges() {
  createBridge(
    philIdToEra,
    eraToId,
    "prisma/seeds/philosopherEra.js",
    "philosopherEra"
  );
  createBridge(quoteIdToEra, eraToId, "prisma/seeds/quoteEra.js", "quoteEra");
}
