import { FilterQuery, Types } from "mongoose";
import type { Book } from "../Book";
import { isTransactionObjectIdKey, isValidTransactionKey, ITransaction } from "../models/transaction";
import { isPrototypeAttribute } from "./isPrototypeAttribute";
import { parseAccountField } from "./parseAccountField";
import { parseDateField } from "./parseDateField";

export type IParseQuery = {
  account?: string | string[];
  _journal?: Types.ObjectId | string;
  start_date?: Date | string | number;
  end_date?: Date | string | number;
} & {
  [key: string]: string[] | number | string | Date | boolean | Types.ObjectId;
};

export interface IPaginationQuery {
  perPage?: number;
  page?: number;
}

/**
 * Turn query into an object readable by MongoDB.
 */
export function parseQuery(
  query: IParseQuery & IPaginationQuery,
  book: Pick<Book, "name"> & Partial<Pick<Book, "maxAccountPath">>
): FilterQuery<ITransaction> {
  const { account, start_date, end_date, ...extra } = query;

  const filterQuery: FilterQuery<ITransaction> = {
    book: book.name,
    ...parseAccountField(account, book.maxAccountPath),
  };

  if (start_date || end_date) {
    filterQuery["datetime"] = {};

    if (start_date) {
      filterQuery.datetime.$gte = parseDateField(start_date);
    }
    if (end_date) {
      filterQuery.datetime.$lte = parseDateField(end_date);
    }
  }

  for (const [key, value] of Object.entries(extra)) {
    if (isPrototypeAttribute(key)) continue;

    let newValue = value;
    if (typeof value === "string" && isTransactionObjectIdKey(key)) {
      newValue = new Types.ObjectId(value);
    }

    if (isValidTransactionKey(key)) {
      filterQuery[key] = newValue;
    } else {
      if (!filterQuery.meta) filterQuery.meta = {};
      filterQuery.meta[key] = newValue;
    }
  }

  return filterQuery;
}
