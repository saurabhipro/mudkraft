import { describe, expect, it } from "vitest";

import { firstNameOf, fullNameOf, initialsOf } from "./display-name";

describe("display names", () => {
  it("uses the real name when there is one", () => {
    expect(firstNameOf({ name: "Aarushi Sharma", email: "a@x.com" })).toBe("Aarushi");
    expect(initialsOf({ name: "Aarushi Sharma", email: "a@x.com" })).toBe("AS");
  });

  it("tidies the email for magic-link sign-ups with no name", () => {
    expect(firstNameOf({ name: "", email: "dpk.negircks@gmail.com" })).toBe("Dpk");
    expect(firstNameOf({ name: "", email: "RAHUL_99@x.in" })).toBe("Rahul");
    expect(fullNameOf({ name: "", email: "meera@x.in" })).toBe("Meera");
    expect(initialsOf({ name: "", email: "meera@x.in" })).toBe("M");
  });

  it("never shows an email as a name", () => {
    expect(firstNameOf({ name: "x@y.com", email: "x@y.com" })).toBe("X");
    expect(firstNameOf({ name: "", email: "1234@x.in" })).toBe("there");
  });
});
