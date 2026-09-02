import { BarChart3, Bell, CreditCard, FileText, FolderCheck, HelpCircle, Home, Package, Receipt, Send, User } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

const nav=[{label:"Overview",href:"/dashboard",icon:Home},{label:"My subscription",href:"/dashboard/subscription",icon:CreditCard},{label:"My package",href:"/dashboard/package",icon:Package},{label:"Orders",href:"/dashboard/orders",icon:Receipt},{label:"Invoices",href:"/dashboard/invoices",icon:FileText},{label:"Payments",href:"/dashboard/payments",icon:BarChart3},{label:"Content requests",href:"/dashboard/requests",icon:Send},{label:"Delivered content",href:"/dashboard/deliveries",icon:FolderCheck},{label:"Notifications",href:"/dashboard/notifications",icon:Bell},{label:"Profile",href:"/dashboard/profile",icon:User},{label:"Support",href:"/dashboard/support",icon:HelpCircle}];
export default async function CustomerLayout({children}:{children:React.ReactNode}){const user=await requireRole(["CUSTOMER"]);return <DashboardShell nav={nav} name={user.name} subtitle={user.customerProfile?.businessName??"Customer"}>{children}</DashboardShell>}
