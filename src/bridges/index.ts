import { cwd } from "node:process";
import { getFile } from "../utils.js";
import { join } from "node:path";

async function createCsv(data: string, csvPath: string, csvHeaders: string) {
  const file = await getFile(join(cwd(), csvPath), csvHeaders);
  await file.appendFile(data);
  await file.close();
}

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

export default function createBridge(
  idToEntity: Map<number, string[]>,
  entityToId: Map<string, number>,
  csvPath: string,
  csvHeaders: string
) {
  const data = createData(idToEntity, entityToId);
  createCsv(data, csvPath, csvHeaders);
}
