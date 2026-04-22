import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AppLayout } from "@/components/layout/app-layout";
import type { AuthUser } from "@/hooks/use-auth";

// Mock react-router-dom Outlet and NavLink so we don't need real routes
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet" />,
    useNavigate: () => vi.fn(),
  };
});

const mockUseAuth = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

function makeUser(role: AuthUser["role"]): AuthUser {
  return { id: "1", name: "Test User", email: "1234567890@minidrive.com", role };
}

function renderLayout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/actuaciones"]}>
        <AppLayout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AppLayout", () => {
  it("shows Actuaciones nav link for all roles", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser("user"),
      isLoading: false,
      userCode: "1234567890",
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderLayout();

    // Sidebar is rendered twice (desktop + mobile), so multiple links exist
    const links = screen.getAllByRole("link", { name: /actuaciones/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it("shows Usuarios link when user is superadmin", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser("superadmin"),
      isLoading: false,
      userCode: "1234567890",
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderLayout();

    const links = screen.getAllByRole("link", { name: /usuarios/i });
    expect(links.length).toBeGreaterThan(0);
  });

  it("hides Usuarios link when user role is user", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser("user"),
      isLoading: false,
      userCode: "1234567890",
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderLayout();

    expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
  });

  it("hides Usuarios link when user role is admin", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser("admin"),
      isLoading: false,
      userCode: "1234567890",
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderLayout();

    expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
  });

  it("displays the user name in the sidebar", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser("admin"),
      isLoading: false,
      userCode: "1234567890",
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderLayout();

    // Two instances appear (desktop + mobile sidebar share same render)
    const nameElements = screen.getAllByText("Test User");
    expect(nameElements.length).toBeGreaterThan(0);
  });
});
