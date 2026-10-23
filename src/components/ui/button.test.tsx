import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Button } from "./button";

afterEach(cleanup);

describe("Button disabled", () => {
  it("is a neutral paper treatment, not an opacity-faded sunrise", () => {
    render(<Button disabled>Susunod</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("disabled:bg-muted");
    expect(cls).toContain("disabled:text-muted-foreground");
    expect(cls).toContain("disabled:shadow-none");
    expect(cls).not.toContain("disabled:opacity");
  });
});
