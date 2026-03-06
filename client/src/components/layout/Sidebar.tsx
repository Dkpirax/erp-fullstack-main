import { useState } from "react";
import { LayoutDashboard, DollarSign, Package, Users, ShoppingCart, Factory, CreditCard, Target, ClipboardList, Settings, Lock, Gift, Store, Share2, TrendingUp, ChevronDown, ChevronUp, Globe, Shield, Building, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Nav, Collapse, Offcanvas } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
    show: boolean;
    onHide: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
    adminOnly?: boolean;
    resource?: string;
}

interface NavCategory {
    category: string;
    icon: any;
    items: NavItem[];
}

const navigationCategories: NavCategory[] = [
    {
        category: "Main",
        icon: LayoutDashboard,
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
        ]
    },
    {
        category: "Admin",
        icon: Shield,
        items: [
            { name: "User Management", href: "/admin/users", icon: Users, adminOnly: true, resource: 'users' },
            { name: "Organization", href: "/admin/organization", icon: Building, adminOnly: true, resource: 'organization' },
            { name: "Privileges", href: "/admin/privileges", icon: Shield, adminOnly: true, resource: 'admin' },
            { name: "Social Settings", href: "/social-media/settings", icon: Settings, adminOnly: true },
            { name: "Daraz Settings", href: "/daraz/settings", icon: Settings, adminOnly: true },
            { name: "Woo Settings", href: "/woocommerce/settings", icon: Settings, adminOnly: true },
        ]
    },
    {
        category: "Reports",
        icon: FileText,
        items: [
            { name: "Reports Center", href: "/reports", icon: FileText, resource: 'reports' },
            { name: "Payment Reports", href: "/reports/payments", icon: DollarSign, resource: 'reports' },
        ]
    },
    {
        category: "Finance",
        icon: DollarSign,
        items: [
            { name: "Overview", href: "/finance", icon: DollarSign, resource: 'finance' },
            { name: "Accounts", href: "/finance/accounts", icon: DollarSign, resource: 'finance' },
            { name: "Ledger", href: "/finance/ledger", icon: DollarSign, resource: 'finance' },
            { name: "Payable", href: "/finance/payable", icon: DollarSign, resource: 'finance' },
            { name: "Receivable", href: "/finance/receivable", icon: DollarSign, resource: 'finance' },
        ]
    },
    {
        category: "Supply Chain",
        icon: Package,
        items: [
            { name: "Overview", href: "/supply-chain", icon: Package, resource: 'inventory' },
            { name: "Inventory", href: "/supply-chain/inventory", icon: Package, resource: 'inventory' },
            { name: "Suppliers", href: "/supply-chain/suppliers", icon: Package, resource: 'suppliers' },
        ]
    },
    {
        category: "Human Resources",
        icon: Users,
        items: [
            { name: "Overview", href: "/hr", icon: Users, resource: 'hr' },
            { name: "Employees", href: "/hr/employees", icon: Users, resource: 'hr' },
            { name: "Payroll", href: "/hr/payroll", icon: Users, resource: 'hr' },
        ]
    },
    {
        category: "CRM",
        icon: ShoppingCart, // Keeping existing icon
        items: [
            { name: "Overview", href: "/crm", icon: ShoppingCart, resource: 'crm' },
            { name: "Customers", href: "/crm/customers", icon: Users, resource: 'crm' },
            { name: "Pipeline", href: "/crm/pipeline", icon: Target, resource: 'crm' },
        ]
    },
    {
        category: "Manufacturing",
        icon: Factory,
        items: [
            { name: "Overview", href: "/manufacturing", icon: Factory, resource: 'manufacturing' },
            { name: "Work Orders", href: "/manufacturing/work-orders", icon: ClipboardList, resource: 'manufacturing' },
            { name: "BOMs", href: "/manufacturing/boms", icon: Settings, resource: 'manufacturing' },
        ]
    },
    {
        category: "Point of Sale",
        icon: CreditCard,
        items: [
            { name: "POS", href: "/pos", icon: CreditCard, resource: 'pos' },
            { name: "History", href: "/pos/history", icon: ClipboardList, resource: 'sales_history' },
            { name: "Session", href: "/pos/session", icon: Lock, resource: 'pos' },
            { name: "Loyalty & Coupons", href: "/pos/loyalty-coupons", icon: Gift, resource: 'pos' },
        ]
    },
    {
        category: "Integrations",
        icon: Globe,
        items: [
            { name: "Daraz Dashboard", href: "/daraz", icon: Store, adminOnly: true },
            { name: "Daraz Products", href: "/daraz/products", icon: Package, adminOnly: true },
            { name: "Daraz Orders", href: "/daraz/orders", icon: ShoppingCart, adminOnly: true },
            { name: "Social Media", href: "/social-media", icon: Share2, adminOnly: true },
            { name: "Campaigns", href: "/social-media/campaigns", icon: TrendingUp, adminOnly: true },
            { name: "WooCommerce", href: "/woocommerce", icon: Globe, adminOnly: true },
            { name: "Woo Products", href: "/woocommerce/products", icon: Package, adminOnly: true },
            { name: "Woo Orders", href: "/woocommerce/orders", icon: ShoppingCart, adminOnly: true },
            { name: "Woo Customers", href: "/woocommerce/customers", icon: Users, adminOnly: true },
        ]
    }
];

function MenuContent() {
    const location = useLocation();
    const { user, checkPermission } = useAuth();
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Main', 'Finance', 'Integrations']);

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryName)
                ? prev.filter(c => c !== categoryName)
                : [...prev, categoryName]
        );
    };

    const isCategoryExpanded = (categoryName: string) => {
        return expandedCategories.includes(categoryName);
    };

    // Filter categories based on permissions
    const filteredCategories = navigationCategories.map(category => ({
        ...category,
        items: category.items.filter(item => {
            if (item.adminOnly && user?.role !== 'admin' && !user?.is_superuser) return false;
            // If item has a resource defined, check for 'read' permission
            if (item.resource && !checkPermission(item.resource, 'read')) return false;
            return true;
        })
    })).filter(category => category.items.length > 0);

    return (
        <Nav className="flex-column p-3">
            <div className="mb-4 px-2">
                <span className="fs-4 fw-bold text-white">ERP System</span>
                <hr className="text-white-50" />
            </div>

            {filteredCategories.map((category) => {
                const isExpanded = isCategoryExpanded(category.category);
                const CategoryIcon = category.icon;
                const hasActiveItem = category.items.some(item => location.pathname === item.href);

                return (
                    <div key={category.category} className="mb-1">
                        <div
                            className={`d-flex align-items-center justify-content-between text-white p-2 rounded cursor-pointer ${hasActiveItem ? 'bg-primary bg-opacity-25' : ''}`}
                            style={{
                                cursor: "pointer",
                                transition: "background-color 0.2s"
                            }}
                            onClick={() => toggleCategory(category.category)}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <CategoryIcon size={18} />
                                <span className="fw-semibold">{category.category}</span>
                            </div>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        <Collapse in={isExpanded}>
                            <div className="ps-3 mt-1">
                                {category.items.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Nav.Item key={item.name}>
                                            <Link
                                                to={item.href}
                                                className={`nav-link d-flex align-items-center gap-2 py-2 ${isActive ? "text-primary bg-white rounded shadow-sm" : "text-white-50 hover-text-white"}`}
                                                style={{ fontSize: "0.9rem", transition: "all 0.2s" }}
                                            >
                                                <item.icon size={14} />
                                                <span>{item.name}</span>
                                            </Link>
                                        </Nav.Item>
                                    );
                                })}
                            </div>
                        </Collapse>
                    </div>
                );
            })}
        </Nav>
    );
}

export function Sidebar({ show, onHide }: SidebarProps) {
    return (
        <>
            {/* Desktop Sidebar - Static */}
            <div
                className="d-none d-lg-block bg-dark text-white overflow-auto sticky-top vh-100"
                style={{ width: "280px", flexShrink: 0 }}
            >
                <MenuContent />
            </div>

            {/* Mobile Sidebar - Offcanvas Drawer */}
            <Offcanvas show={show} onHide={onHide} className="d-lg-none bg-dark" style={{ width: "280px" }}>
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-white">Menu</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <MenuContent />
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}
