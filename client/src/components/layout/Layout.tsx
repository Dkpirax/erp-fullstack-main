import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Container } from "react-bootstrap";
import { ChatWidget } from "../chat/ChatWidget";

export function Layout() {
    const [showSidebar, setShowSidebar] = useState(false);

    const toggleSidebar = () => setShowSidebar(!showSidebar);

    return (
        <div className="d-flex vh-100 overflow-hidden">
            <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                <Navbar onToggleSidebar={toggleSidebar} />
                <main className="flex-grow-1 overflow-auto bg-light">
                    <Container fluid className="py-4">
                        <Outlet />
                    </Container>
                </main>
                <ChatWidget />
            </div>
        </div>
    );
}
