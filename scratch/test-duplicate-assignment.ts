import { db } from "../../src/core/database/client";
import { AssignmentService } from "../../src/features/assignments/services/assignment.service";
import { participant as participantTable, programme as programmeTable } from "../../src/core/database/schema";
import { eq } from "drizzle-orm";

async function main() {
  const programme = await db.query.programme.findFirst({ where: eq(programmeTable.type, "GROUP") });
  const participant = await db.query.participant.findFirst();
  if (!programme || !participant) {
    console.log("No data");
    process.exit(1);
  }

  try {
    const res = await AssignmentService.bulkCreate(
      programme.festivalId,
      programme.id,
      [
        { programmeId: programme.id, groupId: participant.groupId!, teamNumber: 1, participantIds: [participant.id] },
        { programmeId: programme.id, groupId: participant.groupId!, teamNumber: 2, participantIds: [participant.id] }
      ]
    );
    console.log("Success:", res.length);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
main();
