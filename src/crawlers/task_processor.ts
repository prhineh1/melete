import { parentPort } from "worker_threads";
import { Entity } from "./utils.js";
import { getQuoteData } from "./quote/task_processor_quote.js";
import { getPhilosopherData } from "./philosopher/task_processor_philosopher.js";
import { getEraData } from "./era/task_processor_era.js";
import { getSchoolData } from "./school/task_processor_school.js";

parentPort?.on("message", (job: { task: string; entity: Entity }) => {
  const { task, entity } = job;

  switch (entity) {
    case Entity.PHILOSOPHER:
      getPhilosopherData(task).then((name) => parentPort?.postMessage(name));
      break;
    case Entity.ERA:
      getEraData(task).then((data) => parentPort?.postMessage(data));
      break;
    case Entity.QUOTE:
      getQuoteData(task).then((data) => parentPort?.postMessage(data));
      break;
    case Entity.SCHOOL:
      getSchoolData(task).then((data) => parentPort?.postMessage(data));
    default:
      break;
  }
});
