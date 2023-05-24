import { cwd } from "process";
import { join } from "path";
import { createSeedFile } from "../crawlers/utils.js";

function createData(
  idToEntity: Map<number, string[]>,
  entityToId: Map<string, number>,
  objProps: [string, string]
): string {
  let csvData = [];
  const [left, right] = objProps;

  for (const [entityKey, entityValues] of idToEntity.entries()) {
    for (const value of entityValues) {
      const valueId = entityToId.get(value);
      if (valueId) {
        csvData.push({ [left]: entityKey, [right]: valueId });
      }
    }
  }

  return JSON.stringify(csvData);
}

function createBridge(
  idToEntity: Map<number, string[]>,
  entityToId: Map<string, number>,
  csvPath: string,
  csvHeaders: string,
  objProps: [string, string]
) {
  const data = createData(idToEntity, entityToId, objProps);
  createSeedFile(data, csvPath, csvHeaders);
}

export default async function createBridges() {
  //@ts-ignore
  const { quoteIdToEra } = await import(
    join(cwd(), "src/generated/quoteID_to_era.js")
  );
  //@ts-ignore
  const { eraToId } = await import(join(cwd(), "src/generated/era_to_id.js"));
  //@ts-ignore
  const { philIdToEra } = await import(
    join(cwd(), "src/generated/philId_to_era.js")
  );
  //@ts-ignore
  const { schoolToId } = await import(
    join(cwd(), "src/generated/school_to_id.js")
  );
  //@ts-ignore
  const { philIdToSchool } = await import(
    join(cwd(), "src/generated/philId_to_school.js")
  );

  createBridge(
    philIdToEra,
    eraToId,
    "prisma/seeds/philosopherEra.js",
    "philosopherEra",
    ["philosopherId", "eraId"]
  );
  createBridge(quoteIdToEra, eraToId, "prisma/seeds/quoteEra.js", "quoteEra", [
    "quoteId",
    "eraId",
  ]);

  createBridge(
    philIdToSchool,
    schoolToId,
    "prisma/seeds/philosopherSchool.js",
    "philosopherSchool",
    ["philosopherId", "schoolId"]
  );
}
