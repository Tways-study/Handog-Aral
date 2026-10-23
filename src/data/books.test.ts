import { describe, expect, it } from "vitest";
import { allBooks, booksFor, filipinoBooks, findBook, sampleBooks } from "./books";

describe("books by language", () => {
  it("Filipino readers get English stories, English readers get Filipino stories", () => {
    expect(booksFor("tagalog")).toBe(sampleBooks);
    expect(booksFor("english")).toBe(filipinoBooks);
    expect(sampleBooks).toHaveLength(6);
    expect(filipinoBooks).toHaveLength(4);
  });

  it("ids are unique across every bundled book, and findBook finds any of them", () => {
    const ids = allBooks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of allBooks) expect(findBook(b.id)).toBe(b);
    expect(findBook("nope")).toBeUndefined();
  });
});
