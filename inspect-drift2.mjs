import pg from "pg";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const fks = await client.query(`
  SELECT tc.constraint_name, tc.table_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'deliveryZoneId'
`);
console.log("FKs on deliveryZoneId:", fks.rows);
const count = await client.query(`SELECT count(*) FROM "DeliveryZone"`);
console.log("DeliveryZone row count:", count.rows[0]);
const countUsed = await client.query(`SELECT count(*) FROM "Order" WHERE "deliveryZoneId" IS NOT NULL`);
console.log("Orders referencing deliveryZoneId:", countUsed.rows[0]);
await client.end();
