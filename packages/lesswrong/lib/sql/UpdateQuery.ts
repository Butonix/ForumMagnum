import Query, { Atom } from "./Query";
import Table from "./Table";
import SelectQuery from "./SelectQuery";

export type UpdateOptions = Partial<{
  limit: number,
  returnUpdated: boolean,
}>

class UpdateQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table,
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options?: MongoUpdateOptions<T>, // TODO: What can options be?
    updateOptions?: UpdateOptions,
  ) {
    if (options?.upsert) {
      throw new Error("To create an upserting update use an InsertQuery with conflictStrategy 'upsert'");
    }

    super(table, ["UPDATE", table, "SET"]);
    this.nameSubqueries = false;

    const set: Partial<Record<keyof T, any>> = modifier.$set ?? {};
    for (const operation of Object.keys(modifier)) {
      switch (operation) {
        case "$set":
          break;
        case "$unset":
          for (const field of Object.keys(modifier.$unset)) {
            set[field] = null;
          }
          break;
        case "$inc":
          for (const field of Object.keys(modifier.$inc)) {
            set[field] = {$add: [`$${field}`, 1]};
          }
          break;
        default:
          throw new Error(`Unimplemented update operation: ${operation}`);
      }
    }

    this.atoms = this.atoms.concat(this.compileSetFields(set));

    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    const {limit, returnUpdated} = updateOptions ?? {};

    if (selector && Object.keys(selector).length > 0) {
      this.atoms.push("WHERE");

      if (limit) {
        this.atoms = this.atoms.concat([
          "_id IN",
          new SelectQuery(table, selector, {limit, projection: {_id: 1}}, {forUpdate: true}),
        ]);
      } else {
        this.appendSelector(selector);
      }
    } else if (limit) {
      this.atoms = this.atoms.concat([
        "WHERE _id IN ( SELECT \"_id\" FROM",
        table,
        "LIMIT",
        this.createArg(limit),
        "FOR UPDATE)",
      ]);
    }

    if (returnUpdated) {
      this.atoms.push("RETURNING *");
    }
  }

  private compileSetFields(updates: Partial<Record<keyof T, any>>): Atom<T>[] {
    return Object.keys(updates).flatMap((field) => [
      ",",
      this.resolveFieldName(field),
      "=",
      ...this.compileExpression(updates[field]),
    ]).slice(1);
  }
}

export default UpdateQuery;
