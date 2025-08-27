import React from "react";
import "./CustomModal.css"; // Style pastda

const CustomModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="del-custom-modal-backdrop">
            <div className="del-custom-modal-content">
                <h3>O‘chirishni tasdiqlang</h3>
                <p>Ushbu mahsulotni o‘chirishni xohlaysizmi?</p>
                <p style={{ color: "#d32f2f", fontWeight: "bold" }}>
                    Diqqat: Bu amalni qaytarib bo‘lmaydi!
                </p>
                <div className="del-modal-actions">
                    <button className="del-cancel-btn" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button className="del-confirm-btn" onClick={onConfirm}>
                        Ha, o‘chirish
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
