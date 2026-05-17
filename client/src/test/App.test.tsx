import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

describe("App component", () => {
  it("renders the app without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    // Should show loading state initially (lazy routes)
    expect(screen.getByText("CardPlace")).toBeInTheDocument();
  });

  it("shows login page at /login", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );
    // Login page should have the submit button
    const button = await screen.findByRole("button", { name: /sign in/i });
    expect(button).toBeInTheDocument();
  });

  it("shows register page at /register", async () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>
    );
    const heading = await screen.findByRole("heading", { name: /create account/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders mobile navigation on home page", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    // Mobile nav should contain nav labels
    const navLinks = await screen.findAllByText(/domů|aukce|přidat|poptávky/i);
    expect(navLinks.length).toBeGreaterThanOrEqual(3);
  });
});
