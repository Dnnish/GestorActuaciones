import { render, screen } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ActuacionesPage } from "@/pages/actuaciones-page";
import { useDebounce } from "@/hooks/use-debounce";

vi.mock("@/hooks/use-actuaciones", () => ({
  useActuaciones: vi.fn(),
  useCreateActuacion: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteActuacion: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

import { useActuaciones } from "@/hooks/use-actuaciones";
import { useAuth } from "@/hooks/use-auth";

const mockActuaciones = [
  {
    id: "act-1",
    name: "Actuacion Alpha",
    createdById: "user-1",
    createdByName: "Juan Pérez",
    coliseoStatus: true,
    createdAt: "2024-03-01T10:00:00.000Z",
    updatedAt: "2024-03-01T10:00:00.000Z",
  },
  {
    id: "act-2",
    name: "Actuacion Beta",
    createdById: "user-2",
    createdByName: "Ana García",
    coliseoStatus: false,
    createdAt: "2024-04-01T10:00:00.000Z",
    updatedAt: "2024-04-01T10:00:00.000Z",
  },
];

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("ActuacionesPage", () => {
  it("renderiza lista de actuaciones", () => {
    vi.mocked(useActuaciones).mockReturnValue({
      data: { data: mockActuaciones, total: 2, page: 1, limit: 20 },
      isLoading: false,
    } as ReturnType<typeof useActuaciones>);

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        name: "Admin User",
        email: "admin@example.com",
        role: "superadmin",
      },
      isLoading: false,
      isAuthenticated: true,
      error: null,
      userCode: "test",
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithQueryClient(<ActuacionesPage />);

    expect(screen.getByText("Actuacion Alpha")).toBeInTheDocument();
    expect(screen.getByText("Actuacion Beta")).toBeInTheDocument();
  });

  it("indicador coliseo muestra color correcto", () => {
    vi.mocked(useActuaciones).mockReturnValue({
      data: { data: mockActuaciones, total: 2, page: 1, limit: 20 },
      isLoading: false,
    } as ReturnType<typeof useActuaciones>);

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        name: "Admin User",
        email: "admin@example.com",
        role: "superadmin",
      },
      isLoading: false,
      isAuthenticated: true,
      error: null,
      userCode: "test",
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithQueryClient(<ActuacionesPage />);

    const greenIndicator = screen.getByLabelText("Subido a Coliseo");
    const redIndicator = screen.getByLabelText("Pendiente de Coliseo");

    expect(greenIndicator.className).toContain("bg-green-500");
    expect(redIndicator.className).toContain("bg-red-500");
  });

  it("boton Nueva actuacion no aparece para role user", () => {
    vi.mocked(useActuaciones).mockReturnValue({
      data: { data: mockActuaciones, total: 2, page: 1, limit: 20 },
      isLoading: false,
    } as ReturnType<typeof useActuaciones>);

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-3",
        name: "Regular User",
        email: "user@example.com",
        role: "user",
      },
      isLoading: false,
      isAuthenticated: true,
      error: null,
      userCode: "test",
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderWithQueryClient(<ActuacionesPage />);

    expect(
      screen.queryByRole("button", { name: /nueva actuación/i }),
    ).not.toBeInTheDocument();
  });
});

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("use-debounce actualiza valor despues del delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: "inicial", delay: 300 } },
    );

    expect(result.current).toBe("inicial");

    rerender({ value: "nuevo valor", delay: 300 });

    // Value should not update immediately
    expect(result.current).toBe("inicial");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now it should have updated
    expect(result.current).toBe("nuevo valor");
  });
});
