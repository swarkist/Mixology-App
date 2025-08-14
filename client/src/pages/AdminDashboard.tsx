import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Shield,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Crown,
  Eye,
  Calendar,
  Mail,
  X,
  Home
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ReviewBanner } from "@/components/ReviewBanner";

type Role = 'basic' | 'reviewer' | 'admin';

interface User {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminDashboard() {
  // ✅ Avoid name collision with table row user
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Admin-only access to this page
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser || authUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-neutral-400">You don't have permission to access this area.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch users with filters and pagination (only for admins)
  const { data: usersData, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', { searchQuery, roleFilter, statusFilter, page: currentPage, limit }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      });

      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      return apiRequest(`/api/admin/users?${params.toString()}`);
    },
    enabled: !!authUser && authUser.role === 'admin'
  });

  // Count active admins for "last admin" UI protection
  const activeAdminCount =
    usersData?.users.filter(u => u.role === 'admin' && u.is_active).length ?? 0;

  // Update user role mutation (include 'reviewer')
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: Role }) => {
      return apiRequest(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Role updated", description: "User role has been successfully updated." });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err?.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, is_active }: { userId: number; is_active: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { is_active }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Status updated", description: "User status has been successfully updated." });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err?.message || "Failed to update user status",
        variant: "destructive"
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isAdmin = authUser.role === 'admin';

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <ReviewBanner />
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-neutral-400">Manage users and system settings</p>
              </div>
            </div>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-black"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Site
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usersData?.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {usersData?.users.filter(u => u.role === 'admin').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {usersData?.users.filter(u => u.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search users..."
                    className="bg-neutral-800 border-neutral-700 text-white pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-700"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                Error loading users: {(error as any)?.message || 'Unknown error'}
              </div>
            ) : (
              <>
                <div className="rounded-md border border-neutral-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-neutral-800">
                        <TableHead className="text-neutral-400">User</TableHead>
                        <TableHead className="text-neutral-400">Role</TableHead>
                        <TableHead className="text-neutral-400">Status</TableHead>
                        <TableHead className="text-neutral-400">Joined</TableHead>
                        <TableHead className="text-neutral-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users.map((rowUser) => {
                        const isSelf = rowUser.id === authUser.id;
                        const disableWriteForThisRow =
                          !isAdmin ||
                          (isSelf && activeAdminCount <= 1); // optional UI safety

                        return (
                          <TableRow key={rowUser.id} className="border-neutral-800">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-neutral-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">{rowUser.email}</div>
                                  <div className="text-sm text-neutral-400">ID: {rowUser.id}</div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={rowUser.role === 'admin' ? 'default' : 'secondary'}
                                className={
                                  rowUser.role === 'admin' ? 'bg-yellow-600 text-black' :
                                  rowUser.role === 'reviewer' ? 'bg-blue-600 text-white' :
                                  'bg-neutral-700 text-neutral-300'
                                }
                              >
                                {rowUser.role === 'admin' ? (
                                  <>
                                    <Crown className="w-3 h-3 mr-1" />
                                    Admin
                                  </>
                                ) : rowUser.role === 'reviewer' ? (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Reviewer
                                  </>
                                ) : (
                                  'Basic'
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={rowUser.is_active ? 'default' : 'secondary'}
                                className={rowUser.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                              >
                                {rowUser.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-neutral-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(rowUser.created_at)}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={rowUser.role}
                                  onValueChange={(role: Role) => {
                                    updateRoleMutation.mutate({ userId: rowUser.id, role });
                                  }}
                                  disabled={disableWriteForThisRow}
                                >
                                  <SelectTrigger className="w-28 h-8 bg-neutral-800 border-neutral-700 text-white text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="reviewer">Reviewer</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  size="sm"
                                  variant={rowUser.is_active ? "destructive" : "default"}
                                  onClick={() => {
                                    updateStatusMutation.mutate({
                                      userId: rowUser.id,
                                      is_active: !rowUser.is_active
                                    });
                                  }}
                                  className="h-8"
                                  disabled={disableWriteForThisRow}
                                >
                                  {rowUser.is_active ? (
                                    <>
                                      <UserX className="w-3 h-3 mr-1" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-neutral-400">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, usersData.total)} of {usersData.total} users
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-neutral-700 text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <span className="text-sm text-neutral-400">
                        Page {currentPage} of {usersData.totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === usersData.totalPages}
                        className="border-neutral-700 text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
