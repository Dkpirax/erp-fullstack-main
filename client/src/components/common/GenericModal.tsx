import { Modal, Button } from "react-bootstrap";
import type { ReactNode } from "react";

interface GenericModalProps {
    show: boolean;
    onHide: () => void;
    title: string;
    children: ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function GenericModal({
    show,
    onHide,
    title,
    children,
    onConfirm,
    confirmText = "Save Changes",
    cancelText = "Cancel",
}: GenericModalProps) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {cancelText}
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
