import React from 'react';
import { Factory } from 'lucide-react';
import './login.css';

const Loading = () => {
    return (
        <div className="bpf-loading-interface-wrapper">
            {/* Animatsion fon */}
            <div className="bpf-loading-background-particles">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={`bpf-floating-particle-element bpf-animate-float-${(i % 4) + 1}`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Asosiy yuklash tarkibi */}
            <div className="bpf-loading-content-center">
                {/* Animatsion qog‘oz rulosu */}
                <div className="bpf-paper-roll-animation-container">
                    <div className="bpf-rotating-paper-roll-wrapper">
                        {/* Tashqi qatlam */}
                        <div className="bpf-paper-roll-outer-layer">
                            <div className="bpf-paper-roll-inner-layer">
                                <div className="bpf-paper-roll-center-core">
                                    <div className="bpf-paper-roll-inner-core">
                                        <Factory className="w-8 h-8 text-gray-800" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Qog‘oz yechilish animatsiyasi */}
                        <div className="bpf-unwinding-paper-strip"></div>
                    </div>
                </div>

                {/* Yuklash matni */}
                <div className="bpf-loading-status-text-container">
                    <h2 className="bpf-loading-primary-title">
                        CRM Tizimini Yuklash
                    </h2>
                    <p className="bpf-loading-secondary-description">
                        Qora Qog‘oz Zavodi Boshqaruvini Ishga Tushirish
                    </p>
                </div>

                {/* Jarayon ko‘rsatkichi */}
                <div className="bpf-progress-indicator-container">
                    <div className="bpf-progress-bar-track">
                        <div className="bpf-progress-bar-fill"></div>
                    </div>
                    <div className="bpf-progress-status-text">
                        Iltimos, kuting...
                    </div>
                </div>

                {/* Yuklash nuqtalari */}
                <div className="bpf-loading-dots-indicator">
                    <div className="bpf-loading-dot-element"></div>
                    <div className="bpf-loading-dot-element"></div>
                    <div className="bpf-loading-dot-element"></div>
                </div>
            </div>
        </div>
    );
};

export default Loading;