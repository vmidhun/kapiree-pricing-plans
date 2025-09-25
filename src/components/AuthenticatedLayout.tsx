import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Users, Briefcase, UserCheck, CalendarCheck, BarChart2, Building2, DollarSign } from "lucide-react"; // Import new icons

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { logout, hasPermission, user } = useAuth(); // Get hasPermission and user object
  const navigate = useNavigate();

  // Debugging useEffect - remove after fixing
  useEffect(() => {
    if (user) {
      console.log("DEBUG: AuthenticatedLayout - User object:", user);
      console.log("DEBUG: AuthenticatedLayout - User Permissions array:", user.permissions);
      console.log("DEBUG: AuthenticatedLayout - Checking 'View Dashboard' directly:", user.permissions.includes('View Dashboard'));
      console.log("DEBUG: AuthenticatedLayout - Checking 'Manage Users' directly:", user.permissions.includes('Manage Users'));
      console.log("DEBUG: AuthenticatedLayout - hasPermission('View Dashboard'):", hasPermission('View Dashboard'));
      console.log("DEBUG: AuthenticatedLayout - hasPermission('Manage Users'):", hasPermission('Manage Users'));
    } else {
      console.log("DEBUG: AuthenticatedLayout - User is null.");
    }
  }, [user, hasPermission]); // Added hasPermission to dependencies

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="authenticated-layout min-h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between items-center">
        <NavigationMenu>
          <NavigationMenuList>
            {hasPermission('View Dashboard') && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/dashboard" className="px-4 py-2 hover:bg-gray-100 rounded-md">Dashboard</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('View Job Positions') && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/jobs" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" /> Job Positions
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('View Candidates') && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/candidates" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <UserCheck className="mr-2 h-4 w-4" /> Candidates
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('Schedule Interviews') && ( // Using schedule as a general interview access permission
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/interviews" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <CalendarCheck className="mr-2 h-4 w-4" /> Interviews
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('Manage Users') && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/users" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <Users className="mr-2 h-4 w-4" /> User Management
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('Manage Tenants') && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/tenants" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <Building2 className="mr-2 h-4 w-4" /> Tenant Management
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('View Dashboard') && ( // Reusing dashboard view for reports for now
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/reports" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <BarChart2 className="mr-2 h-4 w-4" /> Reports
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            {hasPermission('Manage Pricing Plans') && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/pricing-management" className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" /> Pricing Plans
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarFallback>KA</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {/* Settings link - generally accessible */}
            <DropdownMenuItem onClick={() => navigate('/settings')} className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            {/* Subscription Submenu - conditional based on view permission */}
            {hasPermission('View Subscriptions') && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                      <Link to="/subscription">View Subscription</Link>
                    </DropdownMenuItem>
                    {/* Add more subscription related items here if needed */}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
