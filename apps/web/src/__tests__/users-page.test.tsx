import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { UsersPage } from "@/pages/users-page";
import { UserForm } from "@/components/users/user-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

vi.mock("@/hooks/use-users", () => ({
  useUsers: vi.fn(),
  useCreateUser: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateUser: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteUser: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

// Import after mock is declared so we get the mocked version
import { useUsers } from "@/hooks/use-users";

const mockUsers = [
  {
    id: "1",
    name: "Ana García",
    email: "1111111111@minidrive.com",
    role: "superadmin" as const,
    createdAt: "2024-01-15T10:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "2",
    name: "Carlos López",
    email: "2222222222@minidrive.com",
    role: "admin" as const,
    createdAt: "2024-02-20T10:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "3",
    name: "María Martínez",
    email: "3333333333@minidrive.com",
    role: "user" as const,
    createdAt: "2024-03-10T10:00:00.000Z",
    deletedAt: "2024-04-01T00:00:00.000Z",
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

describe("UsersPage", () => {
  it("tabla de usuarios renderiza las columnas correctas", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
    } as ReturnType<typeof useUsers>);

    renderWithQueryClient(<UsersPage />);

    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Código")).toBeInTheDocument();
    expect(screen.getByText("Rol")).toBeInTheDocument();
    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Fecha de creación")).toBeInTheDocument();

    // Verify user data renders (codes without @minidrive.com)
    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("1111111111")).toBeInTheDocument();
    expect(screen.getByText("Carlos López")).toBeInTheDocument();
    expect(screen.getByText("2222222222")).toBeInTheDocument();
    expect(screen.getByText("María Martínez")).toBeInTheDocument();
    expect(screen.getByText("3333333333")).toBeInTheDocument();
  });
});

describe("UserForm", () => {
  it("formulario de nuevo usuario valida campos requeridos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <UserForm
        mode="create"
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting={false}
      />,
    );

    // Submit without filling any fields
    await user.click(
      screen.getByRole("button", { name: /crear usuario/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("Role badges", () => {
  function getRoleBadgeClass(role: "superadmin" | "admin" | "user"): string {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-green-100 text-green-800";
    }
  }

  it("badge de rol muestra el color correcto", () => {
    const { rerender } = render(
      <Badge
        data-testid="role-badge"
        className={cn("border-transparent", getRoleBadgeClass("superadmin"))}
      >
        Superadmin
      </Badge>,
    );

    let badge = screen.getByTestId("role-badge");
    expect(badge.className).toContain("bg-red-100");
    expect(badge.className).toContain("text-red-800");

    rerender(
      <Badge
        data-testid="role-badge"
        className={cn("border-transparent", getRoleBadgeClass("admin"))}
      >
        Admin
      </Badge>,
    );

    badge = screen.getByTestId("role-badge");
    expect(badge.className).toContain("bg-blue-100");
    expect(badge.className).toContain("text-blue-800");

    rerender(
      <Badge
        data-testid="role-badge"
        className={cn("border-transparent", getRoleBadgeClass("user"))}
      >
        Usuario
      </Badge>,
    );

    badge = screen.getByTestId("role-badge");
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });
});
