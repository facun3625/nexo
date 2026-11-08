import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { receiveEstatePayment } from "../src/lib/estate/ledger";
const url = new URL(process.env.DATABASE_URL!);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  throw new Error("These integration tests only run on a local database.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const rollback = new Error("ROLLBACK_TEST_FIXTURE");
async function main() {
  let assertions = 0;
  try {
    await db.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {},
        });
        const other = await tx.tenant.create({
          data: {},
        });
        const contact = await tx.estateContact.create({
          data: { tenantId: tenant.id, name: "Fixture", roles: ["TENANT"] },
        });
        const property = await tx.estateProperty.create({
          data: {
            tenantId: tenant.id,
            code: "TEST",
            title: "Fixture",
            propertyType: "Casa",
            address: "Private",
            city: "Test",
          },
        });
        const contract = await tx.estateContract.create({
          data: {
            tenantId: tenant.id,
            propertyId: property.id,
            contactId: contact.id,
            reference: "TEST",
            startsAt: new Date("2026-01-01"),
            endsAt: new Date("2027-01-01"),
            amount: "100.10",
            status: "ACTIVE",
          },
        });
        const charge = await tx.estateCharge.create({
          data: {
            tenantId: tenant.id,
            contractId: contract.id,
            concept: "Alquiler",
            period: "2026-09",
            dueAt: new Date("2026-09-01"),
            amount: "100.10",
          },
        });
        const payment = {
          chargeId: charge.id,
          amount: "40.05",
          method: "TRANSFER" as const,
          reference: "test",
          idempotencyKey: randomUUID(),
          paidAt: new Date("2026-09-01"),
        };
        await assert.rejects(
          receiveEstatePayment(tx, other.id, "test", payment),
          /no disponible/,
        );
        assertions++;
        await receiveEstatePayment(tx, tenant.id, "test", payment);
        await receiveEstatePayment(tx, tenant.id, "test", payment);
        assert.equal(
          await tx.estateReceipt.count({ where: { chargeId: charge.id } }),
          1,
        );
        assertions++;
        await assert.rejects(
          receiveEstatePayment(tx, tenant.id, "test", {
            ...payment,
            amount: "41.00",
          }),
          /ya fue utilizado/,
        );
        assertions++;
        await assert.rejects(
          receiveEstatePayment(tx, tenant.id, "test", {
            ...payment,
            idempotencyKey: randomUUID(),
            amount: "60.06",
          }),
          /supera el saldo/,
        );
        assertions++;
        await receiveEstatePayment(tx, tenant.id, "test", {
          ...payment,
          idempotencyKey: randomUUID(),
          amount: "60.05",
        });
        const total = await tx.estateReceipt.aggregate({
          where: { chargeId: charge.id },
          _sum: { amount: true },
        });
        assert(new Prisma.Decimal(total._sum.amount!).equals(charge.amount));
        assertions++;
        assert.equal(
          await tx.estateAuditEvent.count({
            where: { tenantId: tenant.id, action: "CONFIRM_MANUAL_PAYMENT" },
          }),
          2,
        );
        assertions++;
        throw rollback;
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
  } catch (error) {
    if (error !== rollback) throw error;
  }
  // A failed composite FK is tested in its own rolled-back transaction.
  try {
    await db.$transaction(async (tx) => {
      const a = await tx.tenant.create({
        data: {},
      });
      const b = await tx.tenant.create({
        data: {},
      });
      const contact = await tx.estateContact.create({
        data: { tenantId: a.id, name: "Fixture" },
      });
      await tx.estateProperty.create({
        data: {
          tenantId: b.id,
          ownerId: contact.id,
          code: "FK",
          title: "Fixture",
          propertyType: "Casa",
          city: "Test",
          address: "Private",
        },
      });
      throw new Error("Cross-tenant relation incorrectly accepted");
    });
  } catch (error) {
    assert(
      error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003",
    );
    assertions++;
  }
  console.log(
    `${assertions} integration assertions passed. Fixtures rolled back.`,
  );
}
main().finally(() => db.$disconnect());
