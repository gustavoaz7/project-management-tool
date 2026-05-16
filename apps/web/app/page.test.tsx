import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the platform status heading", () => {
    render(<HomePage />);
    expect(screen.getByText("Project Management Tool")).toBeInTheDocument();
    expect(screen.getByText("Platform foundation is online.")).toBeInTheDocument();
  });
});
